//
//  DashItem.swift
//  dash
//
//  Created by Mathew Jacob on 10/22/25.
//

import Foundation
import SwiftData

@Model
final class DashItem {
    var id: UUID
    var title: String
    var notes: String?
    var createdDate: Date
    var location: String?
    @Attribute(.transformable(by: "NSSecureUnarchiveFromData")) var links: [String]
    var photoData: Data?
    var itemType: ItemType
    
    // Task-specific properties
    var isCompleted: Bool
    var dueDate: Date?
    var priority: Priority
    @Attribute(.transformable(by: "NSSecureUnarchiveFromData")) var tags: [String]
    var isRecurring: Bool
    var recurrenceRule: String?
    var hasReminder: Bool
    var reminderDate: Date?
    
    // Event-specific properties
    var eventDate: Date
    var endDate: Date?
    
    init(
        title: String,
        notes: String? = nil,
        itemType: ItemType = .task,
        location: String? = nil,
        links: [String] = [],
        photoData: Data? = nil,
        isCompleted: Bool = false,
        dueDate: Date? = nil,
        priority: Priority = .none,
        tags: [String] = [],
        isRecurring: Bool = false,
        recurrenceRule: String? = nil,
        hasReminder: Bool = false,
        reminderDate: Date? = nil,
        eventDate: Date? = nil,
        endDate: Date? = nil
    ) {
        self.id = UUID()
        self.title = title
        self.notes = notes
        self.createdDate = Date()
        self.location = location
        self.links = links
        self.photoData = photoData
        self.itemType = itemType
        self.isCompleted = isCompleted
        self.dueDate = dueDate
        self.priority = priority
        self.tags = tags
        self.isRecurring = isRecurring
        self.recurrenceRule = recurrenceRule
        self.hasReminder = hasReminder
        self.reminderDate = reminderDate
        self.eventDate = eventDate ?? Date()
        self.endDate = endDate
    }
    
    // Computed property to get the relevant date for sorting
    var relevantDate: Date {
        switch itemType {
        case .task:
            return dueDate ?? createdDate
        case .event:
            return eventDate
        }
    }
    
    // Computed property to check if task is overdue
    var isOverdue: Bool {
        guard itemType == .task, !isCompleted, let dueDate = dueDate else { return false }
        return dueDate < Date()
    }
}
