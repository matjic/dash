import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // If this is a share deep link, copy shared data from App Group to Documents
        // so the WebView/JS layer can access it via Capacitor Filesystem
        if url.scheme == "dash" && url.host == "share" {
            copySharedDataToDocuments()
        }
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    /// Copies shared content from the App Group container to the app's Documents directory.
    /// The Share Extension writes to the App Group, but Capacitor's JS Filesystem
    /// reads from Documents — this bridges the two.
    private func copySharedDataToDocuments() {
        let appGroupId = "group.io.matj.dash"
        guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId) else {
            print("Dash: Could not access App Group container")
            return
        }

        let sharedItemsSource = containerURL.appendingPathComponent("shared-items.json")
        guard FileManager.default.fileExists(atPath: sharedItemsSource.path) else {
            print("Dash: No shared-items.json found in App Group")
            return
        }

        guard let data = try? Data(contentsOf: sharedItemsSource),
              var json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            print("Dash: Could not read shared-items.json")
            return
        }

        let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let incomingDir = documentsURL.appendingPathComponent("shared-incoming")
        try? FileManager.default.createDirectory(at: incomingDir, withIntermediateDirectories: true)

        // Copy staged files from App Group to Documents and return updated paths
        func copyFiles(_ paths: [String]) -> [String] {
            return paths.compactMap { path -> String? in
                let sourceURL = URL(fileURLWithPath: path)
                let destURL = incomingDir.appendingPathComponent(sourceURL.lastPathComponent)
                try? FileManager.default.removeItem(at: destURL)
                do {
                    try FileManager.default.copyItem(at: sourceURL, to: destURL)
                    return destURL.path
                } catch {
                    print("Dash: Failed to copy \(sourceURL.lastPathComponent): \(error)")
                    return nil
                }
            }
        }

        if let imagePaths = json["imagePaths"] as? [String] {
            json["imagePaths"] = copyFiles(imagePaths)
        }
        if let filePaths = json["filePaths"] as? [String] {
            json["filePaths"] = copyFiles(filePaths)
        }

        // Write updated JSON (with new paths) to Documents
        let destJSON = incomingDir.appendingPathComponent("shared-items.json")
        if let updatedData = try? JSONSerialization.data(withJSONObject: json, options: .prettyPrinted) {
            try? updatedData.write(to: destJSON)
            print("Dash: Shared data copied to Documents successfully")
        }

        // Clean up App Group staging area
        try? FileManager.default.removeItem(at: sharedItemsSource)
        let stagingDir = containerURL.appendingPathComponent("shared-staging")
        try? FileManager.default.removeItem(at: stagingDir)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
