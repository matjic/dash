//
//  Priority.swift
//  dash
//
//  Created by Mathew Jacob on 10/22/25.
//

import Foundation

enum Priority: String, CaseIterable, Codable {
    case none = "none"
    case low = "low"
    case medium = "medium"
    case high = "high"
    
    var displayName: String {
        switch self {
        case .none:
            return "None"
        case .low:
            return "Low"
        case .medium:
            return "Medium"
        case .high:
            return "High"
        }
    }
    
    var color: String {
        switch self {
        case .none:
            return "gray"
        case .low:
            return "green"
        case .medium:
            return "orange"
        case .high:
            return "red"
        }
    }
}
