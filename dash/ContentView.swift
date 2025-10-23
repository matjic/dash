//
//  ContentView.swift
//  dash
//
//  Created by Mathew Jacob on 10/22/25.
//

import SwiftUI
import SwiftData

enum FilterType: String, CaseIterable {
    case all = "All"
    case tasks = "Tasks"
    case events = "Events"
}

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var dashItems: [DashItem]
    @State private var searchText = ""
    @State private var selectedFilter: FilterType = .all
    @State private var selectedItem: DashItem?
    
    private var filteredItems: [DashItem] {
        let items = dashItems.sorted { item1, item2 in
            // Sort by relevant date, with incomplete tasks first
            if item1.itemType == .task && !item1.isCompleted && item2.itemType == .task && !item2.isCompleted {
                return item1.relevantDate < item2.relevantDate
            } else if item1.itemType == .task && !item1.isCompleted {
                return true
            } else if item2.itemType == .task && !item2.isCompleted {
                return false
            } else {
                return item1.relevantDate < item2.relevantDate
            }
        }
        
        // Apply search filter first
        let searchFilteredItems: [DashItem]
        if !searchText.isEmpty {
            searchFilteredItems = items.filter { item in
                item.title.localizedCaseInsensitiveContains(searchText) ||
                (item.notes?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                (item.location?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                item.tags.contains { $0.localizedCaseInsensitiveContains(searchText) }
            }
        } else {
            searchFilteredItems = items
        }
        
        // Then apply type filter
        switch selectedFilter {
        case .all:
            return searchFilteredItems
        case .tasks:
            return searchFilteredItems.filter { $0.itemType == .task }
        case .events:
            return searchFilteredItems.filter { $0.itemType == .event }
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Filter Bar
                Picker("Filter", selection: $selectedFilter) {
                    ForEach(FilterType.allCases, id: \.self) { filter in
                        Text(filter.rawValue).tag(filter)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal)
                .padding(.vertical, 8)
                
                // Timeline List
                List {
                    ForEach(filteredItems) { item in
                        NavigationLink(destination: DashItemDetailView(item: item)) {
                            DashItemRow(
                                item: item,
                                onComplete: {
                                    toggleCompletion(for: item)
                                },
                                onDelete: {
                                    deleteItem(item)
                                },
                                onConvert: {
                                    convertItemType(item)
                                }
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .listStyle(PlainListStyle())
                
                // Bottom Input Bar (Search/Add)
                QuickAddBar(
                    text: $searchText,
                    onAdd: {
                        addQuickItem()
                    },
                    onSearch: { searchQuery in
                        searchText = searchQuery
                    }
                )
            }
            .navigationTitle("Dash")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: DashItemDetailView()) {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .onAppear {
            Task {
                await NotificationService.shared.requestPermission()
            }
        }
    }
    
    private func addQuickItem() {
        let trimmedText = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedText.isEmpty else { return }
        
        let parsed = NaturalLanguageParser.shared.parse(trimmedText)
        
        let newItem = DashItem(
            title: parsed.title,
            itemType: .task, // Default to task for quick add
            dueDate: parsed.dueDate,
            priority: parsed.priority,
            isRecurring: parsed.isRecurring,
            recurrenceRule: parsed.recurrenceRule
        )
        
        modelContext.insert(newItem)
        
        // Schedule reminder if needed
        if newItem.hasReminder {
            NotificationService.shared.scheduleReminder(for: newItem)
        }
        
        // Create recurring tasks if needed
        if newItem.isRecurring {
            RecurrenceService.shared.createRecurringTasks(from: newItem, modelContext: modelContext)
        }
        
        searchText = ""
    }
    
    private func toggleCompletion(for item: DashItem) {
        withAnimation {
            item.isCompleted.toggle()
            
            // Cancel reminder if task is completed
            if item.isCompleted {
                NotificationService.shared.cancelReminder(for: item)
            } else if item.hasReminder {
                NotificationService.shared.scheduleReminder(for: item)
            }
        }
    }
    
    private func deleteItem(_ item: DashItem) {
        withAnimation {
            NotificationService.shared.cancelReminder(for: item)
            modelContext.delete(item)
        }
    }
    
    private func convertItemType(_ item: DashItem) {
        withAnimation {
            if item.itemType == .task {
                item.itemType = .event
                item.eventDate = item.dueDate ?? item.createdDate
                item.dueDate = nil
                item.isCompleted = false
            } else {
                item.itemType = .task
                item.dueDate = item.eventDate
                item.eventDate = Date()
            }
        }
    }
}

#Preview {
    ContentView()
        .modelContainer(for: DashItem.self, inMemory: true)
}
