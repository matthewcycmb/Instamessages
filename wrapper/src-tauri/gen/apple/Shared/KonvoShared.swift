import Foundation

// The one definition of every identifier Konvo's processes share. Four
// binaries (the app, the activity monitor, and the two shield extensions)
// coordinate the cage through these strings, and a copy that drifts is
// invisible until a tester's phone misbehaves - so no other file may
// declare them. Compiled into the app and monitor targets via project.yml.
enum KonvoShared {
    static let group = "group.com.matthewchan.konvo"
    static let cageStoreName = "konvoCage"

    static let keySelection = "konvoCageSelection"
    static let keyPassActive = "konvoPassActive"
    static let keyPassStart = "konvoPassStart"
    static let keyPassDay = "konvoPassDay"
    static let keyPassN = "konvoPassN"
    static let keyPassName = "konvoPassName"
    static let keyUid = "konvoUid"

    static let posthogKey = "phc_oNC3DTPBj8vt52LGeHikaZ4WeSiZS69M3tsM2PcZRDvp"
    static let posthogCapture = "https://us.i.posthog.com/capture/"

    static var groupDefaults: UserDefaults? { UserDefaults(suiteName: group) }

    // Direct capture for processes where the app is not running to report
    // for them (the monitor extension, launched with Konvo dead). Held
    // open briefly because extensions are terminated moments after
    // returning; without the wait the report never leaves the device.
    static func capture(_ event: String, _ props: [String: Any]) {
        var properties = props
        properties["platform"] = "ios"
        let payload: [String: Any] = [
            "api_key": posthogKey,
            "event": event,
            "distinct_id": groupDefaults?.string(forKey: keyUid) ?? "monitor",
            "properties": properties,
        ]
        guard let url = URL(string: posthogCapture),
              let body = try? JSONSerialization.data(withJSONObject: payload)
        else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        let done = DispatchSemaphore(value: 0)
        URLSession.shared.dataTask(with: request) { _, _, _ in
            done.signal()
        }.resume()
        _ = done.wait(timeout: .now() + 2)
    }
}
