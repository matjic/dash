import Foundation
import Capacitor
import WebKit

/// Capacitor plugin for generating PDFs from HTML content
@objc(PdfGeneratorPlugin)
public class PdfGeneratorPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PdfGeneratorPlugin"
    public let jsName = "PdfGenerator"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "generatePdf", returnType: CAPPluginReturnPromise)
    ]
    
    private var pdfWebView: WKWebView?
    private var currentCall: CAPPluginCall?
    private var currentFileName: String = "document"
    
    /// Generate a PDF from HTML content
    @objc func generatePdf(_ call: CAPPluginCall) {
        guard let html = call.getString("html") else {
            call.reject("Missing required parameter: html")
            return
        }
        
        let fileName = call.getString("fileName") ?? "document"
        self.currentFileName = fileName
        self.currentCall = call
        
        DispatchQueue.main.async {
            self.renderHtmlToPdf(html: html)
        }
    }
    
    private func renderHtmlToPdf(html: String) {
        // Create a WKWebView to render the HTML
        let configuration = WKWebViewConfiguration()
        let newWebView = WKWebView(frame: CGRect(x: 0, y: 0, width: 612, height: 792), configuration: configuration)
        newWebView.navigationDelegate = self
        self.pdfWebView = newWebView
        
        // Load the HTML content
        newWebView.loadHTMLString(html, baseURL: nil)
    }
    
    private func createPdfFromWebView() {
        guard let webViewForPdf = self.pdfWebView, let call = self.currentCall else {
            return
        }
        
        // Configure print formatter
        let printFormatter = webViewForPdf.viewPrintFormatter()
        
        // Create print page renderer
        let renderer = UIPrintPageRenderer()
        renderer.addPrintFormatter(printFormatter, startingAtPageAt: 0)
        
        // Define PDF page size (US Letter: 8.5 x 11 inches at 72 dpi)
        let pageWidth: CGFloat = 8.5 * 72.0
        let pageHeight: CGFloat = 11.0 * 72.0
        let pageRect = CGRect(x: 0, y: 0, width: pageWidth, height: pageHeight)
        
        // Define printable area with margins
        let margin: CGFloat = 36.0 // 0.5 inch margins
        let printableRect = pageRect.insetBy(dx: margin, dy: margin)
        
        renderer.setValue(pageRect, forKey: "paperRect")
        renderer.setValue(printableRect, forKey: "printableRect")
        
        // Generate PDF data
        let pdfData = NSMutableData()
        UIGraphicsBeginPDFContextToData(pdfData, pageRect, nil)
        
        for pageIndex in 0..<renderer.numberOfPages {
            UIGraphicsBeginPDFPage()
            renderer.drawPage(at: pageIndex, in: UIGraphicsGetPDFContextBounds())
        }
        
        UIGraphicsEndPDFContext()
        
        // Save PDF to temporary file
        let tempDir = FileManager.default.temporaryDirectory
        let pdfFileName = "\(currentFileName).pdf"
        let pdfUrl = tempDir.appendingPathComponent(pdfFileName)
        
        do {
            try pdfData.write(to: pdfUrl, options: .atomic)
            call.resolve(["uri": pdfUrl.absoluteString])
        } catch {
            call.reject("Failed to save PDF: \(error.localizedDescription)")
        }
        
        // Cleanup
        self.pdfWebView = nil
        self.currentCall = nil
    }
}

// MARK: - WKNavigationDelegate

extension PdfGeneratorPlugin: WKNavigationDelegate {
    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Wait a moment for any images to fully render
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.createPdfFromWebView()
        }
    }
    
    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        currentCall?.reject("Failed to load HTML: \(error.localizedDescription)")
        self.pdfWebView = nil
        self.currentCall = nil
    }
    
    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        currentCall?.reject("Failed to load HTML: \(error.localizedDescription)")
        self.pdfWebView = nil
        self.currentCall = nil
    }
}
