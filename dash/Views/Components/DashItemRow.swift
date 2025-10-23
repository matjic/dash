//
//  DashItemRow.swift
//  dash
//
//  Created by Mathew Jacob on 10/22/25.
//

import SwiftUI

struct DashItemRow: View {
    let item: DashItem
    let onComplete: () -> Void
    let onDelete: () -> Void
    let onConvert: () -> Void
    
    var body: some View {
        HStack {
            // Type icon
            Image(systemName: item.itemType.iconName)
                .foregroundColor(item.itemType == .task ? (item.isCompleted ? .green : .blue) : .orange)
                .frame(width: 20)
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(item.title)
                        .font(.headline)
                        .strikethrough(item.itemType == .task && item.isCompleted)
                        .foregroundColor(item.itemType == .task && item.isCompleted ? .secondary : .primary)
                    
                    Spacer()
                    
                    // Priority indicator
                    if item.itemType == .task && item.priority != .none {
                        Circle()
                            .fill(Color(item.priority.color))
                            .frame(width: 8, height: 8)
                    }
                }
                
                // Date and location info
                HStack {
                    Text(formatDate(item.relevantDate))
                        .font(.caption)
                        .foregroundColor(item.isOverdue ? .red : .secondary)
                    
                    if let location = item.location, !location.isEmpty {
                        Text("•")
                            .foregroundColor(.secondary)
                        Text(location)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Tags
                if !item.tags.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 4) {
                            ForEach(item.tags, id: \.self) { tag in
                                Text("#\(tag)")
                                    .font(.caption2)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.blue.opacity(0.1))
                                    .foregroundColor(.blue)
                                    .cornerRadius(4)
                            }
                        }
                        .padding(.horizontal, 1)
                    }
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            if item.itemType == .task {
                Button(item.isCompleted ? "Undo" : "Complete") {
                    onComplete()
                }
                .tint(item.isCompleted ? .orange : .green)
            }
            
            Button("Delete") {
                onDelete()
            }
            .tint(.red)
        }
        .swipeActions(edge: .leading, allowsFullSwipe: false) {
            Button("Convert to \(item.itemType == .task ? "Event" : "Task")") {
                onConvert()
            }
            .tint(.blue)
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        let calendar = Calendar.current
        
        if calendar.isDateInToday(date) {
            return "Today"
        } else if calendar.isDateInTomorrow(date) {
            return "Tomorrow"
        } else if calendar.isDateInYesterday(date) {
            return "Yesterday"
        } else {
            formatter.dateStyle = .medium
            return formatter.string(from: date)
        }
    }
}

#Preview {
    let sampleTask = DashItem(
        title: "Team meeting",
        notes: "Discuss project updates",
        itemType: .task,
        location: "Conference Room A",
        dueDate: Calendar.current.date(byAdding: .day, value: 1, to: Date()),
        priority: .high,
        tags: ["work", "meeting"]
    )
    
    DashItemRow(
        item: sampleTask,
        onComplete: {},
        onDelete: {},
        onConvert: {}
    )
    .padding()
}
