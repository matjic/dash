import AppIntents

// MARK: - App Shortcuts Provider

/// Defines the Siri phrases that work immediately without user setup.
/// These phrases will work with "Hey Siri, [phrase]" out of the box.
struct DashShortcuts: AppShortcutsProvider {
    
    /// The shortcuts that are available to the user
    static var appShortcuts: [AppShortcut] {
        
        // Add Task shortcut - Siri will ask "What do you need to do?"
        AppShortcut(
            intent: AddTaskIntent(),
            phrases: [
                "Add task in \(.applicationName)",
                "Add a task in \(.applicationName)",
                "New task in \(.applicationName)",
                "Create task in \(.applicationName)",
                "Remind me in \(.applicationName)",
                "Add to \(.applicationName)"
            ],
            shortTitle: "Add Task",
            systemImageName: "plus.circle.fill"
        )
        
        // Add Event shortcut - Siri will ask "What's the event?"
        AppShortcut(
            intent: AddEventIntent(),
            phrases: [
                "Add event in \(.applicationName)",
                "Add an event in \(.applicationName)",
                "New event in \(.applicationName)",
                "Create event in \(.applicationName)",
                "Schedule in \(.applicationName)"
            ],
            shortTitle: "Add Event",
            systemImageName: "calendar.badge.plus"
        )
        
        // Show Timeline shortcut
        AppShortcut(
            intent: ShowTimelineIntent(),
            phrases: [
                "Show \(.applicationName)",
                "Open \(.applicationName)",
                "Show my \(.applicationName)",
                "What's on my \(.applicationName)",
                "What's in \(.applicationName)"
            ],
            shortTitle: "Show Dash",
            systemImageName: "list.bullet"
        )
        
        // Quick Add shortcut - opens app directly to add form
        AppShortcut(
            intent: QuickAddIntent(),
            phrases: [
                "Quick add in \(.applicationName)",
                "Capture in \(.applicationName)"
            ],
            shortTitle: "Quick Add",
            systemImageName: "bolt.fill"
        )
    }
}
