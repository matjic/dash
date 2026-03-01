import UIKit
import Capacitor

/// Custom bridge view controller that registers local plugins
class DashBridgeViewController: CAPBridgeViewController {
    
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(PdfGeneratorPlugin())
    }
}
