import Capacitor
import UIKit

/// Регистрирует собственные плагины приложения.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(LiveActivityPlugin())
    }
}
