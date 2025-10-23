//
//  RecurrenceService.swift
//  dash
//
//  Created by Mathew Jacob on 10/22/25.
//

import Foundation
import SwiftData

class RecurrenceService {
    static let shared = RecurrenceService()
    
    private init() {}
    
    func createRecurringTasks(from originalTask: DashItem, modelContext: ModelContext) {
        guard originalTask.isRecurring,
              let recurrenceRule = originalTask.recurrenceRule else { return }
        
        var nextDate = originalTask.dueDate ?? originalTask.createdDate
        
        // Create next 10 occurrences
        for _ in 0..<10 {
            nextDate = getNextRecurrenceDate(from: nextDate, rule: recurrenceRule)
            
            let recurringTask = DashItem(
                title: originalTask.title,
                notes: originalTask.notes,
                itemType: originalTask.itemType,
                location: originalTask.location,
                links: originalTask.links,
                photoData: originalTask.photoData,
                isCompleted: false,
                dueDate: nextDate,
                priority: originalTask.priority,
                tags: originalTask.tags,
                isRecurring: originalTask.isRecurring,
                recurrenceRule: originalTask.recurrenceRule,
                hasReminder: originalTask.hasReminder,
                reminderDate: originalTask.reminderDate,
                eventDate: nextDate,
                endDate: originalTask.endDate
            )
            
            modelContext.insert(recurringTask)
        }
    }
    
    private func getNextRecurrenceDate(from date: Date, rule: String) -> Date {
        let calendar = Calendar.current
        
        switch rule.lowercased() {
        case "daily":
            return calendar.date(byAdding: .day, value: 1, to: date) ?? date
        case "weekly":
            return calendar.date(byAdding: .weekOfYear, value: 1, to: date) ?? date
        case "monthly":
            return calendar.date(byAdding: .month, value: 1, to: date) ?? date
        default:
            return date
        }
    }
    
    func parseRecurrenceRule(from text: String) -> String? {
        let lowercased = text.lowercased()
        
        if lowercased.contains("daily") || lowercased.contains("every day") {
            return "daily"
        } else if lowercased.contains("weekly") || lowercased.contains("every week") {
            return "weekly"
        } else if lowercased.contains("monthly") || lowercased.contains("every month") {
            return "monthly"
        }
        
        return nil
    }
}
