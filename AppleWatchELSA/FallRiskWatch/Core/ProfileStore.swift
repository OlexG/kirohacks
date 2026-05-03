import Foundation

final class ProfileStore {
    private let key = "fallrisk.profile.v1"
    private let participantKey = "fallrisk.participant_id.v1"
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var participantId: String {
        if let existing = defaults.string(forKey: participantKey) {
            return existing
        }
        let created = UUID().uuidString
        defaults.set(created, forKey: participantKey)
        return created
    }

    var profile: ProfileSnapshot {
        get {
            guard let data = defaults.data(forKey: key),
                  let decoded = try? JSONDecoder().decode(ProfileSnapshot.self, from: data) else {
                return ProfileSnapshot(
                    ageYears: nil,
                    sex: .unknown,
                    heightCm: nil,
                    assistiveDevice: .none,
                    impairmentTags: [],
                    priorFalls12mo: nil,
                    injuriousFall12mo: nil,
                    unableToRiseAfterFall12mo: nil
                )
            }
            return decoded
        }
        set {
            if let data = try? JSONEncoder().encode(newValue) {
                defaults.set(data, forKey: key)
            }
        }
    }
}
