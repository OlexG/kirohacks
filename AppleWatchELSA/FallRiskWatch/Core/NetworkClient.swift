import Foundation
import WatchKit

enum EndpointConfig {
    static let ingestURL = URL(string: "https://kirohacks.vercel.app/api/watch/alert")!
    static let profileImportURL = URL(string: "https://kirohacks.vercel.app/api/profile/import")!
    static let profileQRCodeURL = URL(string: "https://kirohacks.vercel.app/api/profile/qr")!
}

enum NetworkPostStatus: Equatable {
    case idle
    case sending
    case sent
    case failed(String)

    var label: String {
        switch self {
        case .idle: return "Idle"
        case .sending: return "Sending Data..."
        case .sent: return "Sent Data:"
        case .failed(let message): return "Failed: \(message)"
        }
    }
}

final class NetworkClient {
    private let url: URL
    private let encoder: JSONEncoder

    init(url: URL = EndpointConfig.ingestURL) {
        self.url = url
        encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
    }

    func post<Payload: Encodable>(_ envelope: Envelope<Payload>) async throws -> Int {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("fallrisk.v1", forHTTPHeaderField: "X-FallRisk-Schema")
        request.httpBody = try encoder.encode(envelope)

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            throw NSError(domain: "FallRiskNetwork", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "HTTP \(httpResponse.statusCode)"])
        }
        return httpResponse.statusCode
    }
}
