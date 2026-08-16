import ManagedSettings
import ManagedSettingsUI
import UIKit

// The screen a blocked Instagram shows (refined Aug 16 on device: "Caged
// by Konvo" read as jargon and the SF-symbol icon vanished into the dark
// background, so the real logo and the user's own word "blocked" replaced
// them). Deliberately dark, Konvo blue button, no unlock affordance.
// Settings-level revocation always exists, so no copy here may ever claim
// the block is impossible to lift.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.04, green: 0.05, blue: 0.08, alpha: 1),
            icon: UIImage(named: "KonvoLogo", in: Bundle(for: Self.self), with: nil),
            title: ShieldConfiguration.Label(text: "Instagram is blocked", color: .white),
            subtitle: ShieldConfiguration.Label(
                text: "Your messages are in Konvo, one tap away.",
                color: UIColor(white: 1, alpha: 0.65)),
            primaryButtonLabel: ShieldConfiguration.Label(text: "Close", color: .white),
            primaryButtonBackgroundColor: UIColor(
                red: 0.10, green: 0.42, blue: 0.95, alpha: 1),
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Get my messages",
                color: UIColor(red: 0.45, green: 0.66, blue: 1, alpha: 1)))
    }

    override func configuration(
        shielding application: Application, in category: ActivityCategory
    ) -> ShieldConfiguration {
        configuration(shielding: application)
    }
}
