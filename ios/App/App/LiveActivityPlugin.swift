import ActivityKit
import Capacitor
import Foundation

/// Мост между приложением и Live Activity: запуск и остановка секундомера работы.
@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise),
    ]

    @objc func isAvailable(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            call.resolve(["available": ActivityAuthorizationInfo().areActivitiesEnabled])
        } else {
            call.resolve(["available": false])
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.resolve(["started": false])
            return
        }
        let attributes = ShiftAttributes(
            name: call.getString("name") ?? "Работа",
            colorHex: call.getString("color") ?? "#7CB4FF",
            inkHex: call.getString("ink") ?? "#0B1C3D",
            symbol: call.getString("symbol") ?? "timer"
        )
        let startedAt = Date(timeIntervalSince1970: (call.getDouble("startedAt") ?? Date().timeIntervalSince1970 * 1000) / 1000)

        Task {
            // Такой таймер уже показан — ничего не трогаем, чтобы не мигало.
            let existing = Activity<ShiftAttributes>.activities
            if let same = existing.first(where: {
                $0.activityState == .active && $0.attributes.name == attributes.name
                    && abs($0.content.state.startedAt.timeIntervalSince(startedAt)) < 1
            }) {
                for other in existing where other.id != same.id {
                    await other.end(nil, dismissalPolicy: .immediate)
                }
                call.resolve(["started": true])
                return
            }
            for activity in existing {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
            do {
                let content = ActivityContent(state: ShiftAttributes.ContentState(startedAt: startedAt), staleDate: nil)
                _ = try Activity.request(attributes: attributes, content: content, pushType: nil)
                call.resolve(["started": true])
            } catch {
                call.resolve(["started": false, "error": error.localizedDescription])
            }
        }
    }

    @objc func end(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.resolve()
            return
        }
        Task {
            for activity in Activity<ShiftAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
            call.resolve()
        }
    }
}
