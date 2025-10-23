//
//  NaturalLanguageParser.swift
//  dash
//
//  Created by Mathew Jacob on 10/22/25.
//

import Foundation

struct ParsedItem {
    let title: String
    let dueDate: Date?
    let priority: Priority
    let isRecurring: Bool
    let recurrenceRule: String?
}

class NaturalLanguageParser {
    static let shared = NaturalLanguageParser()
    
    private init() {}
    
    func parse(_ text: String) -> ParsedItem {
        let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Extract dates using NSDataDetector
        let dates = extractDates(from: trimmedText)
        let dueDate = dates.first
        
        // Extract priority keywords
        let priority = extractPriority(from: trimmedText)
        
        // Extract recurrence
        let (isRecurring, recurrenceRule) = extractRecurrence(from: trimmedText)
        
        // Clean title by removing parsed elements
        let cleanTitle = cleanTitle(from: trimmedText, dates: dates, priority: priority, isRecurring: isRecurring)
        
        return ParsedItem(
            title: cleanTitle,
            dueDate: dueDate,
            priority: priority,
            isRecurring: isRecurring,
            recurrenceRule: recurrenceRule
        )
    }
    
    private func extractDates(from text: String) -> [Date] {
        let detector = try! NSDataDetector(types: NSTextCheckingResult.CheckingType.date.rawValue)
        let matches = detector.matches(in: text, options: [], range: NSRange(location: 0, length: text.utf16.count))
        
        return matches.compactMap { match in
            match.date
        }
    }
    
    private func extractPriority(from text: String) -> Priority {
        let lowercased = text.lowercased()
        
        if lowercased.contains("high priority") || lowercased.contains("urgent") || lowercased.contains("asap") {
            return .high
        } else if lowercased.contains("medium priority") || lowercased.contains("normal") {
            return .medium
        } else if lowercased.contains("low priority") || lowercased.contains("low") {
            return .low
        }
        
        return .none
    }
    
    private func extractRecurrence(from text: String) -> (Bool, String?) {
        let lowercased = text.lowercased()
        
        if lowercased.contains("daily") || lowercased.contains("every day") {
            return (true, "daily")
        } else if lowercased.contains("weekly") || lowercased.contains("every week") {
            return (true, "weekly")
        } else if lowercased.contains("monthly") || lowercased.contains("every month") {
            return (true, "monthly")
        }
        
        return (false, nil)
    }
    
    private func cleanTitle(from text: String, dates: [Date], priority: Priority, isRecurring: Bool) -> String {
        var cleanText = text
        
        // Remove priority keywords
        let priorityKeywords = ["high priority", "urgent", "asap", "medium priority", "normal", "low priority", "low"]
        for keyword in priorityKeywords {
            cleanText = cleanText.replacingOccurrences(of: keyword, with: "", options: .caseInsensitive)
        }
        
        // Remove recurrence keywords
        let recurrenceKeywords = ["daily", "every day", "weekly", "every week", "monthly", "every month"]
        for keyword in recurrenceKeywords {
            cleanText = cleanText.replacingOccurrences(of: keyword, with: "", options: .caseInsensitive)
        }
        
        // Remove common time-related words that might be left after date extraction
        let timeKeywords = ["tomorrow", "today", "next week", "next month", "at", "pm", "am"]
        for keyword in timeKeywords {
            cleanText = cleanText.replacingOccurrences(of: keyword, with: "", options: .caseInsensitive)
        }
        
        // Clean up extra spaces
        cleanText = cleanText.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        cleanText = cleanText.trimmingCharacters(in: .whitespacesAndNewlines)
        
        return cleanText.isEmpty ? text : cleanText
    }
}
