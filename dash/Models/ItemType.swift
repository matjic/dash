//
//  ItemType.swift
//  dash
//
//  Created by Mathew Jacob on 10/22/25.
//

import Foundation

enum ItemType: String, CaseIterable, Codable {
    case task = "task"
    case event = "event"
    
    var displayName: String {
        switch self {
        case .task:
            return "Task"
        case .event:
            return "Event"
        }
    }
    
    var iconName: String {
        switch self {
        case .task:
            return "checkmark.circle"
        case .event:
            return "calendar"
        }
    }
}
