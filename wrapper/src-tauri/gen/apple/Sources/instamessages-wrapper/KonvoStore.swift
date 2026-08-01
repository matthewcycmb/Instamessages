// StoreKit 2 bridge for the paywall in CAGE_SCRIPT (lib.rs). Rust registers
// an instance of this class on the webview as the script message handler
// "konvoStore" (lib.rs, with_webview); the paywall posts {cmd, id, productId}
// and the reply arrives as window.__konvoStoreReply(id, {...}).
//
// No accounts and no backend, on purpose: the subscription is tied to the
// Apple ID through Transaction.currentEntitlements, which survives app
// deletion, reinstall, and new devices. Restore is just AppStore.sync().

import Foundation
import StoreKit
import WebKit

@objc(KonvoStore)
public class KonvoStore: NSObject, WKScriptMessageHandler {
    public func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard
            let body = message.body as? [String: Any],
            let cmd = body["cmd"] as? String,
            let id = body["id"] as? Int,
            let webView = message.webView
        else { return }
        // Only pages we host may talk to StoreKit. The webview shows
        // instagram.com and the bundled onboarding page; Meta's login chain
        // hops to other Meta domains and reCAPTCHA, and none of those get a
        // purchase sheet.
        let host = message.frameInfo.securityOrigin.host
        guard message.frameInfo.isMainFrame,
              host.hasSuffix("instagram.com") || host.hasSuffix("localhost") || host.isEmpty
        else { return }

        let productId = body["productId"] as? String ?? ""
        Task { @MainActor in
            let reply = await Self.run(cmd, productId)
            let json: String
            if let data = try? JSONSerialization.data(withJSONObject: reply),
               let text = String(data: data, encoding: .utf8) {
                json = text
            } else {
                json = "null"
            }
            webView.evaluateJavaScript(
                "window.__konvoStoreReply(\(id), \(json))", completionHandler: nil)
        }
    }

    static func run(_ cmd: String, _ productId: String) async -> [String: Any] {
        switch cmd {
        case "entitlements":
            return ["entitled": await entitled()]
        case "purchase":
            do {
                guard let product = try await Product.products(for: [productId]).first else {
                    return ["ok": false, "error": "unknown product"]
                }
                switch try await product.purchase() {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else {
                        return ["ok": false, "error": "unverified"]
                    }
                    await transaction.finish()
                    return ["ok": true, "entitled": true]
                case .userCancelled:
                    return ["ok": false, "cancelled": true]
                case .pending:
                    // Ask to Buy and the like: the entitlement lands later,
                    // and the launch check in CAGE_SCRIPT picks it up.
                    return ["ok": false, "pending": true]
                @unknown default:
                    return ["ok": false]
                }
            } catch {
                return ["ok": false, "error": "\(error)"]
            }
        case "restore":
            try? await AppStore.sync()
            return ["ok": true, "entitled": await entitled()]
        default:
            return ["ok": false]
        }
    }

    static func entitled() async -> Bool {
        for await entitlement in Transaction.currentEntitlements {
            if case .verified(let transaction) = entitlement,
               transaction.revocationDate == nil {
                return true
            }
        }
        return false
    }
}
