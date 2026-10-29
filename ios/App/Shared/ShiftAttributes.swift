import ActivityKit
import Foundation

/// Данные Live Activity идущей смены. Файл входит и в приложение, и в виджет.
struct ShiftAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var startedAt: Date
    }

    var name: String
    var colorHex: String
    var inkHex: String
    var symbol: String
}
