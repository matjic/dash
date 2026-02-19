import UIKit
import UniformTypeIdentifiers

/// Share Extension view controller for Dash
/// Handles incoming shared content (images, URLs, text, files) and
/// saves it to the App Group container before opening the main app
class ShareViewController: UIViewController {
    
    private let appGroupIdentifier = "group.co.matj.dash"
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Set a subtle background to indicate processing
        view.backgroundColor = UIColor.systemBackground.withAlphaComponent(0.1)
        handleSharedItems()
    }
    
    private func handleSharedItems() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            completeRequest()
            return
        }
        
        var sharedData = SharedData()
        let group = DispatchGroup()
        
        for item in extensionItems {
            guard let attachments = item.attachments else { continue }
            
            for provider in attachments {
                group.enter()
                
                // Handle images
                if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                    loadImage(from: provider) { url in
                        if let url = url {
                            sharedData.imagePaths.append(url.path)
                        }
                        group.leave()
                    }
                }
                // Handle URLs
                else if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    loadURL(from: provider) { url in
                        if let url = url {
                            sharedData.urls.append(url.absoluteString)
                        }
                        group.leave()
                    }
                }
                // Handle plain text
                else if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    loadText(from: provider) { text in
                        if let text = text {
                            if sharedData.text == nil {
                                sharedData.text = text
                            } else {
                                sharedData.text! += "\n" + text
                            }
                        }
                        group.leave()
                    }
                }
                // Handle files/documents
                else if provider.hasItemConformingToTypeIdentifier(UTType.data.identifier) {
                    loadFile(from: provider) { url in
                        if let url = url {
                            sharedData.filePaths.append(url.path)
                        }
                        group.leave()
                    }
                }
                else {
                    group.leave()
                }
            }
        }
        
        group.notify(queue: .main) {
            self.saveAndOpenApp(sharedData: sharedData)
        }
    }
    
    // MARK: - Content Loading
    
    private func loadImage(from provider: NSItemProvider, completion: @escaping (URL?) -> Void) {
        provider.loadItem(forTypeIdentifier: UTType.image.identifier, options: nil) { [weak self] item, error in
            guard error == nil else {
                print("DashShare: Error loading image: \(error!)")
                completion(nil)
                return
            }
            
            // Handle different return types
            if let url = item as? URL {
                // Copy to shared container
                let savedURL = self?.copyToSharedContainer(from: url, type: "image")
                completion(savedURL)
            } else if let data = item as? Data {
                let savedURL = self?.saveDataToSharedContainer(data, type: "image", ext: "jpg")
                completion(savedURL)
            } else if let image = item as? UIImage, let data = image.jpegData(compressionQuality: 0.8) {
                let savedURL = self?.saveDataToSharedContainer(data, type: "image", ext: "jpg")
                completion(savedURL)
            } else {
                completion(nil)
            }
        }
    }
    
    private func loadURL(from provider: NSItemProvider, completion: @escaping (URL?) -> Void) {
        provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { item, error in
            guard error == nil, let url = item as? URL else {
                print("DashShare: Error loading URL: \(error?.localizedDescription ?? "unknown")")
                completion(nil)
                return
            }
            completion(url)
        }
    }
    
    private func loadText(from provider: NSItemProvider, completion: @escaping (String?) -> Void) {
        provider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { item, error in
            guard error == nil else {
                print("DashShare: Error loading text: \(error!)")
                completion(nil)
                return
            }
            
            if let text = item as? String {
                completion(text)
            } else if let data = item as? Data, let text = String(data: data, encoding: .utf8) {
                completion(text)
            } else {
                completion(nil)
            }
        }
    }
    
    private func loadFile(from provider: NSItemProvider, completion: @escaping (URL?) -> Void) {
        provider.loadItem(forTypeIdentifier: UTType.data.identifier, options: nil) { [weak self] item, error in
            guard error == nil else {
                print("DashShare: Error loading file: \(error!)")
                completion(nil)
                return
            }
            
            if let url = item as? URL {
                let savedURL = self?.copyToSharedContainer(from: url, type: "file")
                completion(savedURL)
            } else if let data = item as? Data {
                let savedURL = self?.saveDataToSharedContainer(data, type: "file", ext: "bin")
                completion(savedURL)
            } else {
                completion(nil)
            }
        }
    }
    
    // MARK: - File Management
    
    private func getSharedContainerURL() -> URL? {
        return FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier)
    }
    
    private func copyToSharedContainer(from sourceURL: URL, type: String) -> URL? {
        guard let containerURL = getSharedContainerURL() else {
            print("DashShare: Could not get shared container URL")
            return nil
        }
        
        // Create a staging directory for shared files
        let stagingDir = containerURL.appendingPathComponent("shared-staging", isDirectory: true)
        try? FileManager.default.createDirectory(at: stagingDir, withIntermediateDirectories: true)
        
        // Generate unique filename
        let uuid = UUID().uuidString
        let ext = sourceURL.pathExtension.isEmpty ? "bin" : sourceURL.pathExtension
        let destURL = stagingDir.appendingPathComponent("\(uuid).\(ext)")
        
        do {
            // If accessing security-scoped resource
            let accessing = sourceURL.startAccessingSecurityScopedResource()
            defer {
                if accessing {
                    sourceURL.stopAccessingSecurityScopedResource()
                }
            }
            
            try FileManager.default.copyItem(at: sourceURL, to: destURL)
            return destURL
        } catch {
            print("DashShare: Error copying file: \(error)")
            return nil
        }
    }
    
    private func saveDataToSharedContainer(_ data: Data, type: String, ext: String) -> URL? {
        guard let containerURL = getSharedContainerURL() else {
            print("DashShare: Could not get shared container URL")
            return nil
        }
        
        let stagingDir = containerURL.appendingPathComponent("shared-staging", isDirectory: true)
        try? FileManager.default.createDirectory(at: stagingDir, withIntermediateDirectories: true)
        
        let uuid = UUID().uuidString
        let destURL = stagingDir.appendingPathComponent("\(uuid).\(ext)")
        
        do {
            try data.write(to: destURL)
            return destURL
        } catch {
            print("DashShare: Error saving data: \(error)")
            return nil
        }
    }
    
    // MARK: - Save and Open App
    
    private func saveAndOpenApp(sharedData: SharedData) {
        guard let containerURL = getSharedContainerURL() else {
            completeRequest()
            return
        }
        
        let sharedItemsURL = containerURL.appendingPathComponent("shared-items.json")
        
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = .prettyPrinted
            let data = try encoder.encode(sharedData)
            try data.write(to: sharedItemsURL)
            print("DashShare: Saved shared data to \(sharedItemsURL.path)")
        } catch {
            print("DashShare: Failed to save shared data: \(error)")
        }
        
        // Open main app via deep link
        if let url = URL(string: "dash://share") {
            openURL(url)
        }
        
        // Complete after a brief delay to allow URL opening
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            self.completeRequest()
        }
    }
    
    private func openURL(_ url: URL) {
        // iOS 13+ method to open URL from extension
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url, options: [:], completionHandler: nil)
                return
            }
            responder = responder?.next
        }
        
        // Fallback: use selector-based approach
        let selector = NSSelectorFromString("openURL:")
        responder = self
        while responder != nil {
            if responder!.responds(to: selector) {
                responder!.perform(selector, with: url)
                return
            }
            responder = responder?.next
        }
    }
    
    private func completeRequest() {
        extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }
}

// MARK: - Shared Data Model

struct SharedData: Codable {
    var imagePaths: [String] = []
    var urls: [String] = []
    var text: String? = nil
    var filePaths: [String] = []
    
    var isEmpty: Bool {
        return imagePaths.isEmpty && urls.isEmpty && text == nil && filePaths.isEmpty
    }
}
