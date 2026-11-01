import ActivityKit
import SwiftUI
import WidgetKit

/// Секундомер работы: экран блокировки и Dynamic Island.
/// Text(timerInterval:) считает время сам, приложению не нужно его обновлять.
struct ShiftLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ShiftAttributes.self) { context in
            LockScreenView(context: context)
                .activityBackgroundTint(Color(hex: "#0B1C3D"))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            let tint = Color(hex: context.attributes.colorHex)
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 8) {
                        CardIcon(attributes: context.attributes, size: 36)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Работа")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            Text(context.attributes.name)
                                .font(.headline)
                                .lineLimit(1)
                        }
                    }
                    .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    ElapsedText(startedAt: context.state.startedAt)
                        .font(.system(size: 28, weight: .semibold, design: .rounded))
                        .foregroundStyle(tint)
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: 130, alignment: .trailing)
                        .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Image(systemName: "clock")
                        Text("Начало в ") + Text(context.state.startedAt, style: .time)
                        Spacer()
                        Text("Капитал")
                            .foregroundStyle(.secondary)
                    }
                    .font(.caption)
                    .padding(.horizontal, 4)
                }
            } compactLeading: {
                Image(systemName: context.attributes.symbol)
                    .foregroundStyle(tint)
            } compactTrailing: {
                ElapsedText(startedAt: context.state.startedAt)
                    .font(.system(.footnote, design: .rounded).weight(.semibold))
                    .foregroundStyle(tint)
                    .frame(width: 56, alignment: .trailing)
            } minimal: {
                Image(systemName: "timer")
                    .foregroundStyle(tint)
            }
            .keylineTint(tint)
        }
    }
}

private struct LockScreenView: View {
    let context: ActivityViewContext<ShiftAttributes>

    var body: some View {
        HStack(spacing: 14) {
            CardIcon(attributes: context.attributes, size: 48)
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Circle().fill(Color.red).frame(width: 8, height: 8)
                    Text("Идёт работа")
                        .font(.caption)
                        .foregroundStyle(Color.white.opacity(0.7))
                }
                Text(context.attributes.name)
                    .font(.headline)
                    .foregroundStyle(.white)
                    .lineLimit(1)
            }
            Spacer(minLength: 8)
            ElapsedText(startedAt: context.state.startedAt)
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: 150, alignment: .trailing)
        }
        .padding(16)
    }
}

private struct CardIcon: View {
    let attributes: ShiftAttributes
    let size: CGFloat

    var body: some View {
        RoundedRectangle(cornerRadius: size * 0.3, style: .continuous)
            .fill(Color(hex: attributes.colorHex))
            .frame(width: size, height: size)
            .overlay(
                Image(systemName: attributes.symbol)
                    .font(.system(size: size * 0.45, weight: .semibold))
                    .foregroundStyle(Color(hex: attributes.inkHex))
            )
    }
}

/// Растущий счётчик «чч:мм:сс» от начала работы.
private struct ElapsedText: View {
    let startedAt: Date

    var body: some View {
        Text(timerInterval: startedAt...startedAt.addingTimeInterval(60 * 60 * 24), countsDown: false)
            .monospacedDigit()
    }
}

extension Color {
    init(hex: String) {
        let s = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var v: UInt64 = 0
        Scanner(string: s).scanHexInt64(&v)
        self.init(
            red: Double((v >> 16) & 0xFF) / 255,
            green: Double((v >> 8) & 0xFF) / 255,
            blue: Double(v & 0xFF) / 255
        )
    }
}
