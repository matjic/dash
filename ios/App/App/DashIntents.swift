import AppIntents
import UIKit

// MARK: - Add Task Intent (Siri prompts for title, saves without opening app)

struct AddTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Add Task to Dash"
    static var description = IntentDescription("Create a new task in Dash")
    
    // Don't open app - save in background for hands-free use
    static var openAppWhenRun: Bool = false
    
    @Parameter(
        title: "Task",
        description: "What do you need to do?",
        requestValueDialog: IntentDialog("What do you need to do?")
    )
    var taskTitle: String
    
    static var parameterSummary: some ParameterSummary {
        Summary("Add \(\.$taskTitle) to Dash")
    }
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Try to save directly to database
        if DashDatabase.shared.isDatabaseAvailable() {
            let success = DashDatabase.shared.createTask(title: taskTitle)
            if success {
                return .result(dialog: "Added '\(taskTitle)' to your tasks")
            }
        }
        
        // Fallback: open app if database not available (first launch)
        var urlComponents = URLComponents()
        urlComponents.scheme = "dash"
        urlComponents.host = "add-task"
        urlComponents.queryItems = [URLQueryItem(name: "title", value: taskTitle)]
        
        if let url = urlComponents.url {
            await UIApplication.shared.open(url)
        }
        
        return .result(dialog: "Adding '\(taskTitle)' to Dash")
    }
}

// MARK: - Add Event Intent (Siri prompts for title, saves without opening app)

struct AddEventIntent: AppIntent {
    static var title: LocalizedStringResource = "Add Event to Dash"
    static var description = IntentDescription("Create a new event in Dash")
    
    // Don't open app - save in background for hands-free use
    static var openAppWhenRun: Bool = false
    
    @Parameter(
        title: "Event",
        description: "What's the event?",
        requestValueDialog: IntentDialog("What's the event?")
    )
    var eventTitle: String
    
    static var parameterSummary: some ParameterSummary {
        Summary("Add \(\.$eventTitle) to Dash")
    }
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Try to save directly to database
        if DashDatabase.shared.isDatabaseAvailable() {
            let success = DashDatabase.shared.createEvent(title: eventTitle)
            if success {
                return .result(dialog: "Added '\(eventTitle)' to your events")
            }
        }
        
        // Fallback: open app if database not available (first launch)
        var urlComponents = URLComponents()
        urlComponents.scheme = "dash"
        urlComponents.host = "add-event"
        urlComponents.queryItems = [URLQueryItem(name: "title", value: eventTitle)]
        
        if let url = urlComponents.url {
            await UIApplication.shared.open(url)
        }
        
        return .result(dialog: "Adding '\(eventTitle)' to Dash")
    }
}

// MARK: - Show Timeline Intent

struct ShowTimelineIntent: AppIntent {
    static var title: LocalizedStringResource = "Show Dash"
    static var description = IntentDescription("View your Dash timeline")
    static var openAppWhenRun: Bool = true
    
    @Parameter(title: "Filter", description: "Filter to apply to the timeline")
    var filter: TimelineFilter?
    
    static var parameterSummary: some ParameterSummary {
        Summary("Show \(\.$filter) in Dash")
    }
    
    @MainActor
    func perform() async throws -> some IntentResult {
        var urlComponents = URLComponents()
        urlComponents.scheme = "dash"
        urlComponents.host = "timeline"
        
        if let filter = filter {
            urlComponents.queryItems = [URLQueryItem(name: "filter", value: filter.rawValue)]
        }
        
        if let url = urlComponents.url {
            await UIApplication.shared.open(url)
        }
        
        return .result()
    }
}

// MARK: - Timeline Filter Enum

enum TimelineFilter: String, AppEnum {
    case today
    case all
    case tasks
    case events
    
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Timeline Filter")
    
    static var caseDisplayRepresentations: [TimelineFilter: DisplayRepresentation] = [
        .today: "Today",
        .all: "All",
        .tasks: "Tasks",
        .events: "Events"
    ]
}

// MARK: - Quick Add Intent (opens app directly without prompt)

struct QuickAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Quick Add in Dash"
    static var description = IntentDescription("Open Dash to quickly add a new item")
    static var openAppWhenRun: Bool = true
    
    @MainActor
    func perform() async throws -> some IntentResult {
        var urlComponents = URLComponents()
        urlComponents.scheme = "dash"
        urlComponents.host = "add-task"
        
        if let url = urlComponents.url {
            await UIApplication.shared.open(url)
        }
        
        return .result()
    }
}
