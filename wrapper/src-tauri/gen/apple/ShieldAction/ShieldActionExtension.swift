import ManagedSettings
import UserNotifications

// Shield buttons. Close closes Instagram. "Get my messages" is the legal
// approximation of a redirect: iOS will not let a shield launch another
// app, but a notification tap opens its app, so the bounce posts one and
// closes. Notification permission is requested by the main app during
// cage setup; without it the button just closes, same as primary.
class ShieldActionExtension: ShieldActionDelegate {
    private func bounce() {
        let content = UNMutableNotificationContent()
        content.title = "Konvo"
        content.body = "Your messages are ready."
        let request = UNNotificationRequest(
            identifier: "konvo-cage-bounce", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }

    private func respond(
        _ action: ShieldAction,
        _ completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        if action == .secondaryButtonPressed { bounce() }
        completionHandler(.close)
    }

    override func handle(
        action: ShieldAction, for application: ApplicationToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        respond(action, completionHandler)
    }

    override func handle(
        action: ShieldAction, for webDomain: WebDomainToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        respond(action, completionHandler)
    }

    override func handle(
        action: ShieldAction, for category: ActivityCategoryToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        respond(action, completionHandler)
    }
}
