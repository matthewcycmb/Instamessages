// RevenueCat bridge for the paywall in CAGE_SCRIPT (lib.rs). Rust registers
// an instance of this class on the webview as the script message handler
// "konvoStore" (lib.rs, with_webview); pages post {cmd, id, ...} and the
// reply arrives as window.__konvoStoreReply(id, {...}).
//
// RevenueCat wraps StoreKit 2 underneath (entitlement "Pro" - capital P,
// it must match the dashboard identifier exactly; offering
// "default": $rc_annual / $rc_monthly / $rc_lifetime). No accounts and no
// Konvo backend, on purpose: the subscription is tied to the Apple ID
// through the receipt, which survives app deletion, reinstall, and new
// devices. Restore is restorePurchases(). The bridge protocol is unchanged
// from the pure-StoreKit era, so the paywall JS never knew about the swap.
//
// Analytics: the "track" command posts funnel events to PostHog natively
// (URLSession) because Instagram's CSP would block the page from doing it.
// Lean payloads by decision (Aug 3): event + screen ids, no quiz values.

import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings
import RevenueCat
import SafariServices
import StoreKit
import SuperwallKit
import SwiftUI
import UIKit
import UserNotifications
import WebKit

// Superwall's purchase controller, delegating all money movement to
// RevenueCat — the official integration (superwall.com/docs/ios/guides/
// using-revenuecat), same file to spare the hand-maintained pbxproj a
// source entry. Superwall renders the paywall; RevenueCat completes the
// purchase; syncSubscriptionStatus streams RC entitlements into Superwall
// so its gating always agrees with the "Pro" entitlement.
final class RCPurchaseController: PurchaseController {
    func syncSubscriptionStatus() {
        assert(Purchases.isConfigured, "Configure RevenueCat first.")
        Task {
            for await customerInfo in Purchases.shared.customerInfoStream {
                let entitlements = customerInfo.entitlements
                    .activeInCurrentEnvironment.keys.map { Entitlement(id: $0) }
                await MainActor.run { [entitlements] in
                    Superwall.shared.subscriptionStatus = .active(Set(entitlements))
                }
            }
        }
    }

    func purchase(product: SuperwallKit.StoreProduct) async -> PurchaseResult {
        do {
            guard let sk2Product = product.sk2Product else {
                return .failed(NSError(
                    domain: "Konvo", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "no SK2 product"]))
            }
            let storeProduct = RevenueCat.StoreProduct(sk2Product: sk2Product)
            let result = try await Purchases.shared.purchase(product: storeProduct)
            return result.userCancelled ? .cancelled : .purchased
        } catch let error as ErrorCode {
            return error == .paymentPendingError ? .pending : .failed(error)
        } catch {
            return .failed(error)
        }
    }

    func restorePurchases() async -> RestorationResult {
        do {
            _ = try await Purchases.shared.restorePurchases()
            return .restored
        } catch {
            return .failed(error)
        }
    }
}

@objc(KonvoStore)
public class KonvoStore: NSObject, WKScriptMessageHandler {
    private static let purchaseController = RCPurchaseController()
    // Public SDK keys (safe to embed). Lazily configured once, before any
    // use. Superwall rides RevenueCat via the purchase controller above;
    // identify with RC's anonymous id so both dashboards and PostHog join
    // on the same user without Konvo ever having accounts.
    private static let configureOnce: Void = {
        Purchases.logLevel = .warn
        Purchases.configure(withAPIKey: "appl_ghuOElWpSeJyXhbJcOKQpQoRSsQ")
        Superwall.configure(
            apiKey: "pk_qgUOhtAwezkyYCcEJ8kT_",
            purchaseController: purchaseController)
        purchaseController.syncSubscriptionStatus()
        Superwall.shared.identify(userId: Purchases.shared.appUserID)
    }()

    // iOS pins a form accessory bar (the ^ v Done strip) above every
    // keyboard in a WKWebView. No public API removes it; the accepted
    // App-Store-safe technique is a runtime subclass of the WKContent view
    // whose inputAccessoryView answers nil. Patched once, on the first
    // bridge message - the bundled onboarding tracks s1 at launch, long
    // before any keyboard (earliest: Instagram's login form) can appear.
    // Instagram's mobile web renders everything smaller than their native
    // app - text, avatars, row heights, the compose bar. Page zoom scales
    // the whole layout at once, which is what "match the native app" means;
    // bumping font-size selector by selector only makes text bigger inside
    // boxes that stayed small.
    // Sizing lives in the cage's viewport override, NOT here. pageZoom
    // scales rendered pixels without reflowing the layout, so the page
    // grew wider than the screen and could be panned around. Narrowing the
    // viewport instead makes Instagram lay out in fewer CSS pixels, which
    // the screen then scales up: same "bigger", but it always fits.
    private static func applyZoom(_ webView: WKWebView) {
        if webView.pageZoom != 1 { webView.pageZoom = 1 }
    }

    private static var accessoryKilled = false
    private static func killAccessoryBar(_ webView: WKWebView) {
        guard !accessoryKilled else { return }
        for sub in webView.scrollView.subviews
        where NSStringFromClass(type(of: sub)).hasPrefix("WKContent") {
            let base: AnyClass = type(of: sub)
            let name = "KonvoNoAccessory_\(NSStringFromClass(base))"
            let patched: AnyClass
            if let existing = NSClassFromString(name) {
                patched = existing
            } else if let fresh = objc_allocateClassPair(base, name, 0) {
                let sel = #selector(getter: UIResponder.inputAccessoryView)
                let imp = imp_implementationWithBlock(
                    { (_: Any) -> UIView? in nil } as @convention(block) (Any) -> UIView?)
                class_addMethod(fresh, sel, imp, "@@:")
                objc_registerClassPair(fresh)
                patched = fresh
            } else {
                return
            }
            object_setClass(sub, patched)
        }
        // Set regardless: retrying this walk on every single
        // bridge message bought nothing.
        accessoryKilled = true
    }

    // WKWebView re-insets the page when the keyboard appears but not when
    // it changes height (text -> emoji swap), which left the taller emoji
    // keyboard covering Instagram's compose bar. Poke the page with resize
    // events on every keyboard frame change so Instagram re-anchors it,
    // and remember where the keyboard's top edge is - the tap-to-dismiss
    // gesture below needs it.
    private static var keyboardNudgeInstalled = false
    private static var keyboardTop: CGFloat = .greatestFiniteMagnitude
    private static var resizeWork: DispatchWorkItem?
    private static func installKeyboardNudge(_ webView: WKWebView) {
        guard !keyboardNudgeInstalled else { return }
        keyboardNudgeInstalled = true
        NotificationCenter.default.addObserver(
            forName: UIResponder.keyboardDidChangeFrameNotification,
            object: nil, queue: .main
        ) { [weak webView] note in
            let was = Self.keyboardTop
            if let frame = (note.userInfo?[UIResponder.keyboardFrameEndUserInfoKey]
                as? NSValue)?.cgRectValue {
                Self.keyboardTop = frame.minY
            }
            // Coalesced: keyboardDidChangeFrame fires continuously while a
            // finger drags the keyboard away, and each dispatch relayouts
            // the whole thread.
            Self.resizeWork?.cancel()
            let work = DispatchWorkItem { [weak webView] in
                webView?.evaluateJavaScript(
                    "window.visualViewport&&window.visualViewport"
                        + ".dispatchEvent(new Event('resize'));"
                        + "window.dispatchEvent(new Event('resize'))",
                    completionHandler: nil)
            }
            Self.resizeWork = work
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.12, execute: work)
            // A KEYBOARD THAT GREW (text -> emoji) is not re-inset by
            // WebKit: the page keeps the short keyboard's offset and the
            // compose bar ends up hidden behind the tall one. Scroll by the
            // growth - exactly the flick that fixed it by hand.
            // ponytail: moves the webview's own scroll view; if Instagram
            // ever composes inside an inner scroller this needs the focused
            // element's scroll parent instead.
            // Resizing the PAGE for the keyboard is reverted, deliberately.
            // Growing the bottom safe-area inset did put the compose bar
            // above the emoji keyboard - and it re-laid out the whole thread
            // on every keyboard frame notification, which iOS fires
            // continuously through swipes and interactive dismissals. The
            // result was distortion mid-swipe, a black flash on dismiss, and
            // general lag in chats: a structural bug traded for a cosmetic
            // one. Build 41 was better, and this is build 41's behaviour.
            //
            // The emoji keyboard covering the compose bar is a known,
            // narrow, cosmetic issue. It stays until there is a fix that
            // does not touch layout on every frame.
            let grew = was - Self.keyboardTop
            guard was < UIScreen.main.bounds.height - 1, grew > 1 else { return }
            webView?.evaluateJavaScript(
                "var a=document.activeElement;"
                    + "if(a&&a.scrollIntoView)a.scrollIntoView({block:'nearest'})",
                completionHandler: nil)
        }
    }

    // Native gestures for an app-like feel. Edge-swipe drives Instagram's
    // own back navigation (thread -> inbox only; at the inbox, back would
    // walk into the login chain). Tap-anywhere dismisses the keyboard, but
    // only above the compose row so a tap into the text bar or the emoji
    // panel never kills typing.
    // ponytail: the compose row is a 96pt geometry allowance, not DOM
    // truth; grows a cage-patch selector if Instagram's layout shifts.
    fileprivate static var route = "other"
    // True while the back-swipe owns the screen, so the push animation
    // never fires on the route change the gesture itself caused.
    fileprivate static var swiping = false
    // Set when a swipe commits: the navigation it triggers reports back
    // through JS a few hundred ms later, and that report must not animate.
    fileprivate static var swipeSettleUntil: Date = .distantPast

    // Opening a thread is a push, not a cut: the inbox holds the screen
    // while Instagram renders, then the thread slides in from the right
    // over it with the inbox easing back, the way a navigation controller
    // does it. Without this the tap lands on a blank frame and snaps.
    // ponytail: 1.2s cap if the settled signal never arrives.
    // The screens behind the current one, newest last - a navigation stack
    // of pictures. The back-swipe reveals the top of this stack, which is
    // why going back from a profile lands on the chat that opened it and
    // not on the inbox.
    // ponytail: capped at 5; deeper than that nobody swipes back through.
    fileprivate static var snapStack: [UIView] = []
    // The current screen, captured while it was idle - see pushIntoThread.
    fileprivate static var settledSnap: UIView?
    // When settledSnap was refreshed by a raw tap; fresh beats live pixels.
    fileprivate static var tapSnapAt = Date.distantPast
    private static var firstNavDone = false

    // Five full-screen snapshots is 55-75MB on a modern iPhone, held for
    // the life of the process. That is memory pressure we were creating
    // ourselves - and pressure is what kills the web content process, which
    // is why the reload recovery below exists. Give it all back the moment
    // iOS asks, or when the app leaves the screen.
    private static var purgeInstalled = false
    private static func installSnapshotPurge() {
        guard !purgeInstalled else { return }
        purgeInstalled = true
        for name: NSNotification.Name in [
            UIApplication.didReceiveMemoryWarningNotification,
            UIApplication.didEnterBackgroundNotification,
        ] {
            NotificationCenter.default.addObserver(
                forName: name, object: nil, queue: .main
            ) { _ in
                snapStack.forEach { $0.removeFromSuperview() }
                snapStack.removeAll()
                settledSnap = nil
            }
        }
    }

    // Prepared once and reused: a freshly allocated generator spins the
    // Taptic Engine up synchronously, and it was being allocated on the
    // exact frame the swipe animation starts.
    fileprivate static let haptic = UIImpactFeedbackGenerator(style: .light)

    fileprivate static func pushIntoThread(
        _ webView: WKWebView, back: Bool = false
    ) {
        // Prefer the picture taken when the screen last went quiet: the
        // FIRST snapshotView of a session comes back empty (the web
        // content process has not replicated its layer tree yet), which is
        // why the first chat you opened after launch slid in over black.
        // It is also free here - no synchronous capture on the tap frame.
        // The stored idle snapshot is only right for the FIRST navigation
        // of a session, where a live capture comes back empty. After that
        // it is stale the moment the user scrolls, so take live pixels.
        // A tap snapshot under a second old is the screen being left,
        // guaranteed pre-navigation; live pixels by now can already be the
        // destination mid-render. Older than that, live pixels win - a
        // stored picture goes stale the moment the user scrolls.
        let tapFresh = Date().timeIntervalSince(tapSnapAt) < 1.0
        let live = (firstNavDone && !tapFresh)
            ? webView.snapshotView(afterScreenUpdates: false) : nil
        guard let host = webView.superview,
              let current = live ?? settledSnap
                ?? webView.snapshotView(afterScreenUpdates: false)
        else { return }
        firstNavDone = true
        settledSnap = nil
        // Forward: the screen being left goes on the stack. Back: the
        // screen being returned to comes off it.
        if back {
            _ = snapStack.popLast()
            current.frame = webView.frame
            current.isUserInteractionEnabled = false
            host.addSubview(current)
            UIView.animate(
                withDuration: 0.2, delay: 0,
                options: [.curveEaseOut, .beginFromCurrentState]
            ) {
                current.transform =
                    CGAffineTransform(translationX: webView.bounds.width, y: 0)
            } completion: { _ in
                current.transform = .identity
                current.removeFromSuperview()
            }
            return
        }
        let under: UIView
        if true {
            under = current
            snapStack.append(current)
            if snapStack.count > 5 { snapStack.removeFirst() }
        }
        under.frame = webView.frame
        under.transform = .identity
        under.alpha = 1
        under.isUserInteractionEnabled = false
        host.insertSubview(under, belowSubview: webView)
        let width = webView.bounds.width * (back ? -1 : 1)
        webView.transform = CGAffineTransform(translationX: width, y: 0)
        var started = false
        let slide = {
            if started { return }
            started = true
            UIView.animate(
                withDuration: 0.2, delay: 0,
                options: [.curveEaseOut, .beginFromCurrentState]
            ) {
                webView.transform = .identity
                under.transform = CGAffineTransform(translationX: -width * 0.3, y: 0)
            } completion: { _ in
                under.transform = .identity
                under.removeFromSuperview()
            }
        }
        // Instantly. Any wait at all - even a quarter second capped on the
        // destination painting - reads as the app hesitating after a tap.
        // An unpainted destination shows the page's own background colour
        // (set from the "bg" command), not black.
        slide()
    }

    private final class KonvoGestures: NSObject, UIGestureRecognizerDelegate {
        weak var webView: WKWebView?
        // The interactive back-swipe, double-buffered like a real
        // navigation controller: a snapshot of the thread rides the
        // finger, and what it reveals is the standing INBOX snapshot -
        // never the live page, which spends ~300ms mid-render after
        // history.back() and looks like a glitch. Everything is decided
        // synchronously from the cage's route reports, so the slide
        // engages the frame the finger moves; navigation fires exactly
        // once, at commit, so a cancelled swipe never touches the thread.
        // ponytail: 0.45s settle grace is a guess by eye; tune on device.
        private var snap: UIView?
        private var under: UIView?
        @objc func edgeBack(_ g: UIScreenEdgePanGestureRecognizer) {
            guard let wv = webView else { return }
            let x = max(0, g.translation(in: wv).x)
            switch g.state {
            case .began:
                // Any screen that is not the inbox can be swiped back -
                // threads, profiles, posts. The inbox is the floor: back
                // from there is Instagram's login chain.
                guard KonvoStore.route != "inbox", snap == nil,
                      let s = wv.snapshotView(afterScreenUpdates: false)
                else { return }
                // What the drag reveals: the screen underneath this one on
                // the stack - the chat that opened this profile, not
                // whatever the inbox happened to look like. Popped only if
                // the swipe commits.
                let u = KonvoStore.snapStack.last ?? {
                    let v = UIView()
                    v.backgroundColor = .systemBackground
                    return v
                }()
                u.frame = wv.frame
                u.alpha = 1
                u.isUserInteractionEnabled = false
                wv.superview?.addSubview(u)
                under = u
                s.frame = wv.frame
                s.layer.shadowColor = UIColor.black.cgColor
                s.layer.shadowOpacity = 0.25
                s.layer.shadowRadius = 8
                s.layer.shadowOffset = CGSize(width: -4, height: 0)
                wv.superview?.addSubview(s)
                snap = s
                KonvoStore.swiping = true
                KonvoStore.haptic.prepare()
                // Keyboard drops as the slide starts, like native; its
                // re-layout happens under the snapshot, invisible.
                wv.endEditing(true)
            case .changed:
                snap?.frame.origin.x = x
            case .ended, .cancelled, .failed:
                // swiping stays true until this gesture's own animation is
                // done: its history.back() fires a popstate, and the nav
                // handler must not animate on top of the slide in flight.
                guard let s = snap else { KonvoStore.swiping = false; return }
                let u = under
                snap = nil
                under = nil
                let commit = x > wv.bounds.width * 0.3
                    || g.velocity(in: wv).x > 600
                if commit {
                    // The small confirmation buzz a native back-swipe has.
                    KonvoStore.haptic.impactOccurred()
                    KonvoStore.swipeSettleUntil = Date().addingTimeInterval(1.2)
                    // The revealed screen is now the current one.
                    if !KonvoStore.snapStack.isEmpty { KonvoStore.snapStack.removeLast() }
                    // Navigate now, once; the thread slides off and the
                    // inbox picture holds the frame until the live inbox
                    // reports settled, then a quick fade lands on a
                    // FINISHED page - a timer here always guessed wrong.
                    // ponytail: 1.5s cap if the settle signal never comes.
                    wv.evaluateJavaScript(
                        "if(!/^\\/direct\\/(inbox|requests)?\\/?$/.test(location.pathname))"
                            + "history.back()",
                        completionHandler: nil)
                    UIView.animate(
                        withDuration: 0.18, delay: 0, options: .curveEaseOut
                    ) {
                        s.frame.origin.x = wv.bounds.width
                    } completion: { _ in
                        s.removeFromSuperview()
                        KonvoStore.swiping = false
                        // Nothing held. The inbox reorders the instant you
                        // send a message, so any picture we keep differs
                        // from the live page and the swap reads as a jump.
                        // Show the real inbox straight away, mid-render or
                        // not - a page finishing its paint looks like a
                        // page loading; a screen swapping under you looks
                        // like a bug.
                        u?.removeFromSuperview()
                    }
                } else {
                    // Nothing was navigated: pure animation, the thread
                    // underneath never moved.
                    UIView.animate(withDuration: 0.16) {
                        s.frame.origin.x = 0
                    } completion: { _ in
                        s.removeFromSuperview()
                        u?.removeFromSuperview()
                        KonvoStore.swiping = false
                    }
                }
            default: break
            }
        }
        @objc func tapDismiss(_ g: UITapGestureRecognizer) {
            guard let wv = webView else { return }
            // The screen as it stands ON the tap frame, before Instagram's
            // router paints anything. The nav report lands ~80ms after the
            // tap (device log, Aug 7), and a snapshot taken then catches
            // the destination mid-render - headerless, pre-zoom - which
            // the next back-swipe then reveals as a garbled "inbox".
            if let s = wv.snapshotView(afterScreenUpdates: false) {
                s.frame = wv.frame
                KonvoStore.settledSnap = s
                KonvoStore.tapSnapAt = Date()
            }
            guard KonvoStore.keyboardTop < UIScreen.main.bounds.height,
                  g.location(in: nil).y < KonvoStore.keyboardTop - 96
            else { return }
            wv.endEditing(true)
        }
        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer,
            shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer
        ) -> Bool { true }
    }
    private static let gestures = KonvoGestures()
    private static var gesturesInstalled = false
    private static func installGestures(_ webView: WKWebView) {
        guard !gesturesInstalled else { return }
        gesturesInstalled = true
        gestures.webView = webView
        let edge = UIScreenEdgePanGestureRecognizer(
            target: gestures, action: #selector(KonvoGestures.edgeBack(_:)))
        edge.edges = .left
        edge.delegate = gestures
        webView.addGestureRecognizer(edge)
        let tap = UITapGestureRecognizer(
            target: gestures, action: #selector(KonvoGestures.tapDismiss(_:)))
        tap.cancelsTouchesInView = false
        tap.delegate = gestures
        webView.addGestureRecognizer(tap)
    }

    // iOS reclaims the webview's content process under memory pressure and
    // WKWebView then renders a dead white page on foreground. wry's
    // navigation delegate does not implement the termination callback, so
    // add it at runtime: reload immediately and the boot overlay covers
    // the recovery - reopening the app just works. If a future wry ships
    // its own handler, the class_getInstanceMethod guard leaves it alone.
    private static var terminationRecoveryInstalled = false
    private static func installTerminationRecovery(_ webView: WKWebView) {
        guard !terminationRecoveryInstalled,
              let delegate = webView.navigationDelegate else { return }
        terminationRecoveryInstalled = true
        let cls: AnyClass = type(of: delegate)
        let sel = #selector(
            WKNavigationDelegate.webViewWebContentProcessDidTerminate(_:))
        guard class_getInstanceMethod(cls, sel) == nil else { return }
        let imp = imp_implementationWithBlock(
            { (_: Any, wv: WKWebView) in wv.reload() }
                as @convention(block) (Any, WKWebView) -> Void)
        class_addMethod(cls, sel, imp, "v@:@")
    }

    public func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        _ = Self.configureOnce
        guard
            let body = message.body as? [String: Any],
            let cmd = body["cmd"] as? String,
            let id = body["id"] as? Int,
            let webView = message.webView
        else { return }
        Self.installSnapshotPurge()
        Self.applyZoom(webView)
        Self.killAccessoryBar(webView)
        Self.installKeyboardNudge(webView)
        Self.installTerminationRecovery(webView)
        Self.installGestures(webView)
        // Only pages we host may talk to purchases or analytics. The webview
        // shows instagram.com and the bundled onboarding page; Meta's login
        // chain hops to other Meta domains and reCAPTCHA, and none of those
        // get a purchase sheet or an event stream.
        let host = message.frameInfo.securityOrigin.host
        guard message.frameInfo.isMainFrame,
              host.hasSuffix("instagram.com") || host.hasSuffix("localhost") || host.isEmpty
        else { return }

        let productId = body["productId"] as? String ?? ""

        // Fire-and-forget appearance switch: the bundled onboarding runs
        // pinned Light (set at startup in Rust); "dark" pins the S5-S7
        // impact stretch; "auto" hands the app to the phone. The value
        // rides in productId.
        if cmd == "appearance" {
            // "light" pins the funnel design, "dark" pins the S5-S7 impact
            // stretch, "blue" is the full-bleed pact screen, "auto" hands
            // the app to the phone. Blue takes the dark style so the status
            // bar draws white over it.
            let blue = productId == "blue"
            let style: UIUserInterfaceStyle =
                productId == "light" ? .light
                : (productId == "dark" || blue) ? .dark
                : .unspecified
            // Remembered across launches: lib.rs pins Light at startup only
            // while the funnel is unfinished. Only "auto" means done.
            UserDefaults.standard.set(productId == "auto", forKey: "konvoFunnelDone")
            DispatchQueue.main.async {
                let root = webView.window?.rootViewController
                root?.overrideUserInterfaceStyle = style
                // The letterbox above and below the safe-area-pinned webview
                // is the root view; CSS cannot reach it, so a screen that
                // must fill the whole phone has to say so through here.
                let bg: UIColor = blue
                    ? UIColor(red: 10 / 255, green: 92 / 255, blue: 240 / 255, alpha: 1)
                    : .systemBackground
                root?.view.backgroundColor = bg
                webView.backgroundColor = bg
                webView.scrollView.backgroundColor = bg
            }
            return
        }

        // DM links open in the in-app Safari sheet, like Instagram's own
        // browser: swipe it away and the chat is still there. http(s)
        // only - SFSafariViewController traps on anything else - and only
        // for pages past the host guard above. Fire-and-forget.
        if cmd == "open" {
            if let url = URL(string: productId),
               url.scheme == "http" || url.scheme == "https" {
                DispatchQueue.main.async {
                    let sheet = SFSafariViewController(url: url)
                    webView.window?.rootViewController?
                        .present(sheet, animated: true)
                }
            }
            return
        }

        // Route reports from the cage. "inbox-settled" means the inbox
        // finished rendering (DOM went quiet): refresh the standing
        // snapshot the back-swipe reveals, and release any swipe holding
        // its picture waiting for the crossfade moment.
        if cmd == "route" {
            DispatchQueue.main.async { [weak webView] in
                if productId.hasSuffix("-settled") {
                    // Capture the finished screen now, while nothing is
                    // animating, so the next push has a real picture ready
                    // and never has to snapshot on the tap frame.
                    if let wv = webView,
                       let s = wv.snapshotView(afterScreenUpdates: false) {
                        s.frame = wv.frame
                        Self.settledSnap = s
                    }
                } else {
                    Self.route = productId
                }
            }
            return
        }

        // Navigate from native. The page cannot do this itself: iOS treats a
        // cross-origin navigation to instagram.com as a universal link and
        // opens the installed Instagram app instead, which strands the user
        // outside Konvo having never logged in. Loads issued here are exempt.
        if cmd == "go" {
            if let url = URL(string: productId),
               url.host?.hasSuffix("instagram.com") == true {
                DispatchQueue.main.async { [weak webView] in
                    webView?.load(URLRequest(url: url))
                }
            }
            return
        }

        // The page's own background colour, painted onto the native
        // letterbox the webview cannot reach. Fire-and-forget.
        if cmd == "bg" {
            let nums = productId.components(
                separatedBy: CharacterSet(charactersIn: "rgba(), ")
            ).compactMap(Double.init)
            guard nums.count >= 3 else { return }
            let color = UIColor(
                red: nums[0] / 255, green: nums[1] / 255, blue: nums[2] / 255,
                alpha: nums.count > 3 ? nums[3] : 1)
            guard (nums.count > 3 ? nums[3] : 1) > 0.01 else { return }
            DispatchQueue.main.async { [weak webView] in
                guard let wv = webView else { return }
                wv.window?.rootViewController?.view.backgroundColor = color
                wv.backgroundColor = color
                wv.scrollView.backgroundColor = color
            }
            return
        }

        // Every SPA navigation animates the same way, wherever it goes:
        // forward slides in from the right, back from the left. The
        // back-swipe owns its own animation, so it opts out.

        if cmd == "nav" {
            DispatchQueue.main.async { [weak webView] in
                // After a swipe commits, exactly ONE report - the swipe's
                // own round-trip, whatever navFor calls it - is swallowed,
                // then the window closes. A blanket 1.2s window ate the
                // "push" of every chat tapped within a second of a
                // back-swipe, which is how an inbox is actually used
                // (device log, Aug 7). Checked before the swiping guard:
                // the round-trip usually lands mid-slide, and it must
                // consume the window even then.
                guard let wv = webView else { return }
                if Date() < Self.swipeSettleUntil {
                    Self.swipeSettleUntil = .distantPast
                    return
                }
                guard !Self.swiping else { return }
                if productId == "push-silent" {
                    // Stack it without animating: the back-swipe still
                    // needs a picture of the screen underneath.
                    if let s = wv.snapshotView(afterScreenUpdates: false) {
                        s.frame = wv.frame
                        Self.snapStack.append(s)
                        if Self.snapStack.count > 5 { Self.snapStack.removeFirst() }
                    }
                    return
                }
                Self.pushIntoThread(wv, back: productId == "pop")
            }
            return
        }

        // The native app's little tap when a message sends. Fire-and-forget.
        if cmd == "haptic" {
            DispatchQueue.main.async {
                KonvoStore.haptic.impactOccurred()
            }
            return
        }

        // Fire-and-forget funnel event. Never blocks, never replies.
        if cmd == "track" {
            if let event = body["event"] as? String {
                Self.track(event, body["props"] as? [String: Any] ?? [:])
            }
            return
        }

        // Session insurance (Aug 17): WebKit writes cookies to disk lazily,
        // and a force-quit soon after signing in can lose the Instagram
        // session before it ever reaches disk. A tester relogged on every
        // launch because of it. The page asks for a snapshot once the
        // inbox settles, and asks for it back when a launch finds the
        // session gone. These need the webView, so they answer here
        // instead of run().
        if cmd == "cookieSave" || cmd == "cookieRestore" {
            let wantsRestore = cmd == "cookieRestore"
            Task { @MainActor in
                let store = webView.configuration.websiteDataStore.httpCookieStore
                var reply: [String: Any]
                if wantsRestore {
                    if !Self.cookieRestoreSpent,
                       let saved = Self.readCookieSnapshot(), !saved.isEmpty {
                        // Once per launch: a genuine logout would restore
                        // cookies Instagram already killed server-side,
                        // land back on login, and must not loop.
                        Self.cookieRestoreSpent = true
                        for c in saved { await store.setCookie(c) }
                        reply = ["restored": true, "n": saved.count]
                    } else {
                        reply = ["restored": false]
                    }
                } else {
                    let ig = await store.allCookies()
                        .filter { $0.domain.hasSuffix("instagram.com") }
                    Self.writeCookieSnapshot(ig)
                    reply = ["ok": true, "n": ig.count]
                }
                let json: String
                if let data = try? JSONSerialization.data(withJSONObject: reply),
                   let text = String(data: data, encoding: .utf8) {
                    json = text
                } else {
                    json = "null"
                }
                webView.evaluateJavaScript(
                    "window.__konvoStoreReply(\(id), \(json))",
                    completionHandler: nil)
            }
            return
        }

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

    // The cookie snapshot lives in Application Support, never leaves the
    // device, and never touches analytics. Restored cookies lose their
    // HttpOnly flag (no public property key for it); Instagram reissues
    // proper ones on the next response.
    static var cookieRestoreSpent = false
    static let cookieFile: URL = {
        let dir = FileManager.default.urls(
            for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(
            at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("konvo-session.plist")
    }()

    static func writeCookieSnapshot(_ cookies: [HTTPCookie]) {
        let rows = cookies.map { c -> [String: Any] in
            var r: [String: Any] = ["n": c.name, "v": c.value,
                                    "d": c.domain, "p": c.path,
                                    "s": c.isSecure]
            if let e = c.expiresDate { r["e"] = e }
            return r
        }
        if let data = try? PropertyListSerialization.data(
            fromPropertyList: rows, format: .binary, options: 0) {
            try? data.write(to: cookieFile, options: [.atomic])
        }
    }

    static func readCookieSnapshot() -> [HTTPCookie]? {
        guard let data = try? Data(contentsOf: cookieFile),
              let rows = try? PropertyListSerialization.propertyList(
                from: data, options: [], format: nil) as? [[String: Any]]
        else { return nil }
        return rows.compactMap { r in
            guard let n = r["n"] as? String, let v = r["v"] as? String,
                  let d = r["d"] as? String, let p = r["p"] as? String
            else { return nil }
            var props: [HTTPCookiePropertyKey: Any] = [
                .name: n, .value: v, .domain: d, .path: p,
            ]
            if let e = r["e"] as? Date {
                if e < Date() { return nil }
                props[.expires] = e
            }
            if r["s"] as? Bool == true { props[.secure] = "TRUE" }
            return HTTPCookie(properties: props)
        }
    }

    static func run(_ cmd: String, _ productId: String) async -> [String: Any] {
        switch cmd {
        // ── The Screen Time cage (locked Aug 16) ──────────────────────
        // Shields the native Instagram app so Konvo is the only window to
        // the messages. The JS wall gates these behind Pro/beta access;
        // the bridge stays policy-free like the rest of the protocol.
        // iOS 16 floor: individual FamilyControls authorization does not
        // exist below it, so 15.x answers unsupported and the offer never
        // renders there.
        case "cageStatus":
            guard #available(iOS 16.0, *) else { return ["supported": false] }
            // Belt and braces for the pass: if a pass is marked active but
            // its window is long over (the monitor extension should have
            // relocked; maybe it did not run), relock here on the next
            // Konvo launch.
            if cageDefaults.bool(forKey: "konvoPassActive"),
               Date().timeIntervalSince1970
                   - cageDefaults.double(forKey: "konvoPassStart") > 6 * 60 {
                _ = cageApply()
                cageDefaults.set(false, forKey: "konvoPassActive")
            }
            return [
                "supported": true,
                "authorized": AuthorizationCenter.shared.authorizationStatus == .approved,
                "picked": (storedCageSelection().map(cageCount) ?? 0) > 0,
                "active": UserDefaults.standard.bool(forKey: cageActiveKey),
                "passAvailable": Self.passesUsedToday() < 2,
                "passMins": Self.passesUsedToday() == 0 ? 5 : 1,
            ]
        case "cagePass":
            guard #available(iOS 16.0, *) else { return ["granted": false] }
            return await cagePassStart()
        case "cageAuthorize":
            guard #available(iOS 16.0, *) else { return ["authorized": false] }
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                return ["authorized": true]
            } catch {
                return ["authorized": false]
            }
        case "cagePick":
            guard #available(iOS 16.0, *) else { return ["count": 0] }
            return ["count": await cagePick()]
        case "cageOn":
            guard #available(iOS 16.0, *) else { return ["active": false] }
            return ["active": cageApply()]
        case "cageOff":
            // No user-facing unlock by design; this exists for the one
            // honest reason to lift the shield without deleting Konvo -
            // a lapsed subscription must not hold Instagram hostage.
            guard #available(iOS 16.0, *) else { return ["active": false] }
            cageClear()
            return ["active": false]
        case "entitlements":
            return ["entitled": await entitled()]
        case "products":
            // Live localized values (locked decision: never hardcode money).
            // Shapes consumed by pay() in CAGE_SCRIPT. trialDays is present
            // only when this user is actually eligible for the intro trial.
            do {
                let offerings = try await Purchases.shared.offerings()
                guard let current = offerings.current else {
                    return ["ok": false, "error": "no current offering"]
                }
                var out: [String: Any] = ["ok": true]
                let yearly = current.availablePackages.first {
                    $0.storeProduct.productIdentifier == "konvo.pro.yearly" }
                let monthly = current.availablePackages.first {
                    $0.storeProduct.productIdentifier == "konvo.pro.monthly" }
                let lifetime = current.availablePackages.first {
                    $0.storeProduct.productIdentifier == "konvo.pro.lifetime" }
                if let p = yearly?.storeProduct {
                    var d: [String: Any] = ["price": p.localizedPriceString]
                    // Both framings, computed from the live price: the card
                    // shows per-month, other copy can use per-week.
                    if let f = p.priceFormatter {
                        if let s = f.string(from: NSDecimalNumber(decimal: p.price / 52)) {
                            d["perWeek"] = s
                        }
                        if let s = f.string(from: NSDecimalNumber(decimal: p.price / 12)) {
                            d["perMonth"] = s
                        }
                    }
                    // The honest discount vs twelve months of monthly.
                    if let m = monthly?.storeProduct, m.price > 0 {
                        let pct = (1 - p.price / (m.price * 12)) * 100
                        d["savePct"] = Int(
                            NSDecimalNumber(decimal: pct).doubleValue.rounded())
                    }
                    if let intro = p.introductoryDiscount,
                       intro.paymentMode == .freeTrial,
                       await Purchases.shared
                           .checkTrialOrIntroDiscountEligibility(product: p) == .eligible {
                        let v = intro.subscriptionPeriod.value
                        let days: Int
                        switch intro.subscriptionPeriod.unit {
                        case .day: days = v
                        case .week: days = v * 7
                        case .month: days = v * 30
                        case .year: days = v * 365
                        }
                        d["trialDays"] = days
                    }
                    out["yearly"] = d
                }
                if let p = monthly?.storeProduct {
                    out["monthly"] = ["price": p.localizedPriceString]
                }
                if let p = lifetime?.storeProduct {
                    out["lifetime"] = ["price": p.localizedPriceString]
                }
                return out
            } catch {
                return ["ok": false, "error": "\(error)"]
            }
        case "purchase":
            do {
                let offerings = try await Purchases.shared.offerings()
                guard let package = offerings.current?.availablePackages.first(
                    where: { $0.storeProduct.productIdentifier == productId })
                else {
                    return ["ok": false, "error": "unknown product"]
                }
                let result = try await Purchases.shared.purchase(package: package)
                if result.userCancelled {
                    return ["ok": false, "cancelled": true]
                }
                let ok = result.customerInfo.entitlements.active["Pro"] != nil
                return ["ok": ok, "entitled": ok]
            } catch {
                if let rcError = error as? RevenueCat.ErrorCode,
                   rcError == .paymentPendingError {
                    // Ask to Buy and the like: the entitlement lands later,
                    // and the launch check in CAGE_SCRIPT picks it up.
                    return ["ok": false, "pending": true]
                }
                return ["ok": false, "error": "\(error)"]
            }
        case "restore":
            let info = try? await Purchases.shared.restorePurchases()
            let ok = info?.entitlements.active["Pro"] != nil
            return ["ok": true, "entitled": ok]
        case "paywall":
            // Superwall placement, raised from CAGE_SCRIPT only when the
            // cage-patch flips {"superwall": true}. Resolves when the sheet
            // is done (bought, closed, skipped, or errored); the JS side
            // reads `entitled` and raises the injected wall as the
            // enforcement floor if the answer is still no.
            await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
                var done = false
                let finish = {
                    if !done { done = true; cont.resume() }
                }
                let handler = PaywallPresentationHandler()
                handler.onDismiss { _, _ in finish() }
                handler.onSkip { _ in finish() }
                handler.onError { _ in finish() }
                Superwall.shared.register(
                    placement: "campaign_trigger", handler: handler
                ) {
                    finish()
                }
            }
            return ["ok": true, "entitled": await entitled()]
        case "notify":
            // The day-12 trial reminder, scheduled only on grant - iOS
            // discards requests added without authorization, which is why
            // the promise's delivery lives behind the S14 button.
            let center = UNUserNotificationCenter.current()
            let granted = (try? await center.requestAuthorization(
                options: [.alert, .sound, .badge])) ?? false
            if granted {
                let content = UNMutableNotificationContent()
                content.title = "Konvo"
                content.body = "Your Konvo trial ends in 2 days. " +
                    "Keep your hours, or cancel anytime in Settings."
                let trigger = UNTimeIntervalNotificationTrigger(
                    timeInterval: 12 * 86400, repeats: false)
                try? await center.add(UNNotificationRequest(
                    identifier: "konvo.trial.reminder",
                    content: content, trigger: trigger))
            }
            return ["ok": true, "granted": granted]
        default:
            return ["ok": false]
        }
    }

    static func entitled() async -> Bool {
        _ = configureOnce
        let info = try? await Purchases.shared.customerInfo()
        return info?.entitlements.active["Pro"] != nil
    }

    // PostHog capture, fire-and-forget. distinct_id is RevenueCat's
    // anonymous app user id so funnels join revenue without any account.
    static func track(_ event: String, _ props: [String: Any]) {
        var properties = props
        properties["platform"] = "ios"
        // Every event carries the build number: funnels that mixed builds
        // faked drop-offs twice (retired screens, new screens). Filtering
        // by build kills that class; date pins never could.
        properties["build"] =
            Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? ""
        let payload: [String: Any] = [
            "api_key": "phc_oNC3DTPBj8vt52LGeHikaZ4WeSiZS69M3tsM2PcZRDvp",
            "event": event,
            "distinct_id": Purchases.shared.appUserID,
            "properties": properties,
        ]
        guard let url = URL(string: "https://us.i.posthog.com/capture/"),
              let body = try? JSONSerialization.data(withJSONObject: payload)
        else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        URLSession.shared.dataTask(with: request).resume()
    }

    // ── The Screen Time cage ──────────────────────────────────────────
    // Apple's picker is the only way to target Instagram - apps cannot
    // name other apps - so the user taps it once and the opaque selection
    // persists here. The shield itself is drawn by the two PlugIns
    // (ShieldConfig / ShieldAction); iOS keeps it up with Konvo closed.
    // Revocation always exists in Settings > Screen Time, so no copy
    // anywhere claims the block is unbreakable.

    private static let cageSelectionKey = "konvoCageSelection"
    private static let cageActiveKey = "konvoCageActive"
    // App group: the relock extension (KonvoActivityMonitor) reads the
    // selection from here with the app dead. Standard defaults remain the
    // fallback read for installs that stored the selection before the
    // group existed.
    static var cageDefaults: UserDefaults {
        UserDefaults(suiteName: "group.com.matthewchan.konvo") ?? .standard
    }

    @available(iOS 16.0, *)
    private static var cageStore: ManagedSettingsStore {
        ManagedSettingsStore(named: .init("konvoCage"))
    }

    @available(iOS 16.0, *)
    private static func storedCageSelection() -> FamilyActivitySelection? {
        guard let data = cageDefaults.data(forKey: cageSelectionKey)
            ?? UserDefaults.standard.data(forKey: cageSelectionKey)
        else { return nil }
        return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    }

    @available(iOS 16.0, *)
    private static func cageCount(_ s: FamilyActivitySelection) -> Int {
        s.applicationTokens.count + s.categoryTokens.count + s.webDomainTokens.count
    }

    @available(iOS 16.0, *)
    static func cageApply() -> Bool {
        guard let s = storedCageSelection(), cageCount(s) > 0 else { return false }
        let store = cageStore
        store.shield.applications = s.applicationTokens.isEmpty ? nil : s.applicationTokens
        store.shield.applicationCategories = s.categoryTokens.isEmpty
            ? nil : .specific(s.categoryTokens)
        UserDefaults.standard.set(true, forKey: cageActiveKey)
        return true
    }

    @available(iOS 16.0, *)
    static func cageClear() {
        cageStore.clearAllSettings()
        UserDefaults.standard.set(false, forKey: cageActiveKey)
    }

    private static func dayStamp() -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }

    // The daily passes (reshaped Aug 17 after the relock proved itself):
    // five minutes first, then one spare minute - the user cannot see a
    // countdown inside Instagram, so the spare covers "the relock caught
    // me mid-story". Both relock themselves. Pass length is WALL CLOCK
    // via the schedule warning below; the usage threshold stays
    // registered as a spare but proved unreliable in the field (Aug 17).
    @available(iOS 16.0, *)
    static func passesUsedToday() -> Int {
        let d = cageDefaults
        return d.string(forKey: "konvoPassDay") == dayStamp()
            ? d.integer(forKey: "konvoPassN") : 0
    }

    @available(iOS 16.0, *)
    @MainActor
    static func cagePassStart() -> [String: Any] {
        let d = cageDefaults
        let used = passesUsedToday()
        guard used < 2 else {
            return ["granted": false, "why": "used"]
        }
        let mins = used == 0 ? 5 : 1
        guard let s = storedCageSelection(), cageCount(s) > 0,
              UserDefaults.standard.bool(forKey: cageActiveKey)
        else { return ["granted": false, "why": "nocage"] }
        let store = cageStore
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        d.set(dayStamp(), forKey: "konvoPassDay")
        d.set(used + 1, forKey: "konvoPassN")
        d.set(true, forKey: "konvoPassActive")
        d.set(Date().timeIntervalSince1970, forKey: "konvoPassStart")
        // A name per pass: stopMonitoring below fires the OLD session's
        // intervalDidEnd, and on the spare pass that callback re-shielded
        // Instagram one second after the unlock (field test, Aug 17,
        // 9:13am). The extension discards boundaries whose activity is
        // not the current name.
        let passName = "konvoPass\(used + 1)"
        d.set(passName, forKey: "konvoPassName")
        // The monitor extension reports its lifecycle to PostHog under the
        // same person; this is how a relock that never fires becomes
        // diagnosable instead of a mystery (first field test, Aug 16).
        d.set(Purchases.shared.appUserID, forKey: "konvoUid")
        let now = Date()
        let cal = Calendar.current
        // 16 minutes: Apple rejects schedules under 15, and exactly-15
        // was in the first cut when the relock never fired on device
        // (Aug 16), so both suspects changed together: a margin over the
        // minimum, a stop before start (a leftover registration makes
        // startMonitoring throw), and the error surfaced to analytics
        // instead of swallowed.
        // warningTime is the pass length in disguise: end minus (16 - mins)
        // puts intervalWillEndWarning exactly `mins` after start. The
        // Aug 17 field test showed time boundaries fire on the second
        // while the usage threshold never fired at all.
        let schedule = DeviceActivitySchedule(
            intervalStart: cal.dateComponents(
                [.hour, .minute, .second], from: now),
            intervalEnd: cal.dateComponents(
                [.hour, .minute, .second], from: now.addingTimeInterval(16 * 60)),
            repeats: false,
            warningTime: DateComponents(minute: 16 - mins))
        let event = DeviceActivityEvent(
            applications: s.applicationTokens, categories: s.categoryTokens,
            webDomains: [], threshold: DateComponents(minute: mins))
        let center = DeviceActivityCenter()
        center.stopMonitoring([DeviceActivityName("konvoPass"),
                               DeviceActivityName("konvoPass1"),
                               DeviceActivityName("konvoPass2")])
        do {
            try center.startMonitoring(
                DeviceActivityName(passName), during: schedule,
                events: [DeviceActivityEvent.Name("passUsed"): event])
        } catch {
            track("cage_pass_monitor_error", ["err": String(describing: error)])
        }
        if let url = URL(string: "instagram://app") {
            UIApplication.shared.open(url)
        }
        return ["granted": true]
    }

    @MainActor
    private static func frontViewController() -> UIViewController? {
        let windows = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }.flatMap(\.windows)
        var vc = (windows.first { $0.isKeyWindow } ?? windows.first)?.rootViewController
        while let presented = vc?.presentedViewController { vc = presented }
        return vc
    }

    @available(iOS 16.0, *)
    @MainActor
    static func cagePick() async -> Int {
        guard let front = frontViewController() else { return 0 }
        return await withCheckedContinuation { (cont: CheckedContinuation<Int, Never>) in
            var resumed = false
            // Seeded EMPTY on purpose (Aug 17): Screen Time tokens are
            // opaque and die with their authorization, and app-group data
            // can outlive a reinstall. A stored seed let a stale token
            // pose as a selection - Cancel counted it, cage_enabled
            // fired, and nothing was actually shielded (field report,
            // build 52). A fresh pick mints live tokens every time, and
            // Cancel is zero, never the stored count.
            let host = UIHostingController(rootView: CagePickerSheet(
                selection: FamilyActivitySelection(),
                finish: { sel in
                    guard !resumed else { return }
                    resumed = true
                    if let sel, let data = try? JSONEncoder().encode(sel) {
                        cageDefaults.set(data, forKey: cageSelectionKey)
                    }
                    front.dismiss(animated: true)
                    cont.resume(returning: sel.map(cageCount) ?? 0)
                }))
            // Full screen and undismissable by swipe: the only exits are
            // Cancel and Continue, so the continuation cannot strand.
            host.modalPresentationStyle = .fullScreen
            host.isModalInPresentation = true
            front.present(host, animated: true)
        }
    }
}

// The selection screen, modeled on the pattern Opal proved: Apple's
// FamilyActivityPicker is a plain SwiftUI View, so it embeds inside a
// branded scaffold - our header, our pinned Continue - while the list
// itself stays the system's, rendered out of process and following
// light/dark automatically. SwiftUI because the picker has no UIKit form.
@available(iOS 16.0, *)
private struct CagePickerSheet: View {
    @State var selection: FamilyActivitySelection
    let finish: (FamilyActivitySelection?) -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Spacer()
                Button("Cancel") { finish(nil) }
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 20)
            .padding(.top, 14)
            VStack(alignment: .leading, spacing: 6) {
                Text("Select Instagram")
                    .font(.largeTitle.bold())
                Text("Tick it in the list. Add anything else you want blocked too.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.top, 2)
            FamilyActivityPicker(selection: $selection)
                .frame(maxHeight: .infinity)
            // Dead until something is ticked: Continue on an empty (or
            // blank-rendering) picker was one of the ways a user could
            // "finish" with nothing blocked.
            Button { finish(selection) } label: {
                Text("Continue")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color(red: 0.10, green: 0.42, blue: 0.95))
                    .clipShape(Capsule())
            }
            .disabled(selection.applicationTokens.isEmpty
                && selection.categoryTokens.isEmpty)
            .opacity(selection.applicationTokens.isEmpty
                && selection.categoryTokens.isEmpty ? 0.4 : 1)
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 6)
        }
        .background(Color(.systemBackground).ignoresSafeArea())
    }
}
