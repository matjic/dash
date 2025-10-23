//
//  NotificationService.swift
//  dash
//
//  Created by Mathew Jacob on 10/22/25.
//

import Foundation
import UserNotifications

class NotificationService {
    static let shared = NotificationService()
    
    private init() {}
    
    func requestPermission() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(
                options: [.alert, .badge, .sound]
            )
            return granted
        } catch {
            print("Error requesting notification permission: \(error)")
            return false
        }
    }
    
    func scheduleReminder(for item: DashItem) {
        guard item.hasReminder,
              let reminderDate = item.reminderDate,
              reminderDate > Date() else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "Reminder: \(item.title)"
        content.body = item.notes ?? "Don't forget this task!"
        content.sound = .default
        
        let trigger = UNCalendarNotificationTrigger(
            dateMatching: Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: reminderDate),
            repeats: false
        )
        
        let request = UNNotificationRequest(
            identifier: item.id.uuidString,
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error scheduling notification: \(error)")
            }
        }
    }
    
    func cancelReminder(for item: DashItem) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [item.id.uuidString])
    }
    
    func updateReminder(for item: DashItem) {
        cancelReminder(for: item)
        scheduleReminder(for: item)
    }
}
