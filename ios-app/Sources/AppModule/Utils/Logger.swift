import Foundation

enum Logger {
    static func log(_ message: String, category: String = "App", file: StaticString = #fileID, line: UInt = #line) {
        #if DEBUG
        print("[\(category)] \(message) @\(file):\(line)")
        #endif
    }

    static func error(_ error: Error, category: String = "App", context: String? = nil) {
        #if DEBUG
        if let context {
            print("[\(category)] ERROR in \(context): \(error.localizedDescription)")
        } else {
            print("[\(category)] ERROR: \(error.localizedDescription)")
        }
        #endif
    }
}
