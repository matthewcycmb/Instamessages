import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings

// Relocks Instagram when the three-minute pass expires, with Konvo dead in
// the background: iOS runs this extension at DeviceActivity boundaries.
// The threshold event fires at three minutes of actual Instagram use; the
// interval end (16 minutes; Apple's schedule minimum is 15) is the
// backstop. Selection comes from the app group because this process has
// no other channel to the app.
//
// Every callback also reports to PostHog directly (URLSession; the app is
// not running to do it for us). Added Aug 16 after the first field test
// where the relock never came and nothing could say why: monitor_started
// proves iOS launches us, relock's `via` says which boundary fired, and
// relock_blind means we ran but could not read the selection - each a
// different bug.
class KonvoActivityMonitor: DeviceActivityMonitor {
    override func intervalDidStart(for activity: DeviceActivityName) {
        report("cage_monitor_started", ["via": "start"])
    }

    // The real three-minute arm since Aug 17: the schedule's end-minus-13
    // warning lands exactly three minutes after the pass starts. Wall
    // clock, not usage - the field test proved the usage threshold below
    // never fires (3+ minutes of real Instagram, no event), while the
    // time-based boundaries fire on the second.
    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        relock(via: "warning", activity: activity)
    }

    override func eventDidReachThreshold(
        _ event: DeviceActivityEvent.Name, activity: DeviceActivityName
    ) {
        relock(via: "threshold", activity: activity)
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        relock(via: "interval", activity: activity)
    }

    private func relock(via: String, activity: DeviceActivityName) {
        let defaults = UserDefaults(suiteName: "group.com.matthewchan.konvo")
        // A boundary from a pass that is no longer current is the ghost
        // that killed the spare minute (Aug 17): stopMonitoring fires the
        // old session's intervalDidEnd, which re-shielded one second
        // after the new pass unlocked. Reported, never acted on.
        if let current = defaults?.string(forKey: "konvoPassName"),
           current != activity.rawValue {
            report("cage_relock_stale", ["via": via])
            return
        }
        // Boundaries after the first relock (warning fires, then interval
        // end 13 minutes later) are idempotent noise. Skip only on
        // positive evidence a relock already ran; an unreadable flag must
        // still fall through so a broken app group stays visible below.
        if via != "warning",
           defaults?.object(forKey: "konvoPassActive") as? Bool == false {
            return
        }
        guard let data = defaults?.data(forKey: "konvoCageSelection"),
              let selection = try? JSONDecoder().decode(
                FamilyActivitySelection.self, from: data)
        else {
            report("cage_relock_blind", ["via": via])
            return
        }
        let store = ManagedSettingsStore(named: .init("konvoCage"))
        store.shield.applications = selection.applicationTokens.isEmpty
            ? nil : selection.applicationTokens
        store.shield.applicationCategories = selection.categoryTokens.isEmpty
            ? nil : .specific(selection.categoryTokens)
        defaults?.set(false, forKey: "konvoPassActive")
        report("cage_relock", ["via": via])
    }

    private func report(_ event: String, _ props: [String: Any]) {
        let defaults = UserDefaults(suiteName: "group.com.matthewchan.konvo")
        var properties = props
        properties["platform"] = "ios"
        let payload: [String: Any] = [
            "api_key": "phc_oNC3DTPBj8vt52LGeHikaZ4WeSiZS69M3tsM2PcZRDvp",
            "event": event,
            "distinct_id": defaults?.string(forKey: "konvoUid") ?? "monitor",
            "properties": properties,
        ]
        guard let url = URL(string: "https://us.i.posthog.com/capture/"),
              let body = try? JSONSerialization.data(withJSONObject: payload)
        else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        // The extension is terminated moments after returning; hold it
        // open briefly so the report actually leaves the device.
        let done = DispatchSemaphore(value: 0)
        URLSession.shared.dataTask(with: request) { _, _, _ in
            done.signal()
        }.resume()
        _ = done.wait(timeout: .now() + 2)
    }
}
