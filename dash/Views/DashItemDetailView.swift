//
//  DashItemDetailView.swift
//  dash
//
//  Created by Mathew Jacob on 10/22/25.
//

import SwiftUI
import SwiftData
import PhotosUI

struct DashItemDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    
    @State private var item: DashItem
    @State private var isEditing: Bool
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var showingPhotoPicker = false
    @FocusState private var focusedField: Field?
    
    enum Field {
        case title, notes, location, links, tags
    }
    
    init(item: DashItem? = nil) {
        if let item = item {
            _item = State(initialValue: item)
            _isEditing = State(initialValue: true)
        } else {
            _item = State(initialValue: DashItem(title: ""))
            _isEditing = State(initialValue: false)
        }
    }
    
    var body: some View {
        Form {
                // Type Selection
                Section {
                    Picker("Type", selection: $item.itemType) {
                        Text("Task").tag(ItemType.task)
                        Text("Event").tag(ItemType.event)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
                
                // Basic Information
                Section("Basic Information") {
                    TextField("Title", text: $item.title)
                        .focused($focusedField, equals: .title)
                        .submitLabel(.next)
                    
                    TextField("Notes", text: Binding(
                        get: { item.notes ?? "" },
                        set: { item.notes = $0.isEmpty ? nil : $0 }
                    ), axis: .vertical)
                    .focused($focusedField, equals: .notes)
                    .lineLimit(3...6)
                    .submitLabel(.done)
                }
                
                // Dates
                Section(item.itemType == .task ? "Task Dates" : "Event Dates") {
                    if item.itemType == .task {
                        DatePicker("Due Date", selection: Binding(
                            get: { item.dueDate ?? Date() },
                            set: { item.dueDate = $0 }
                        ), displayedComponents: [.date, .hourAndMinute])
                        .datePickerStyle(CompactDatePickerStyle())
                        
                        Toggle("Set Reminder", isOn: $item.hasReminder)
                        
                        if item.hasReminder {
                            DatePicker("Reminder", selection: Binding(
                                get: { item.reminderDate ?? Date() },
                                set: { item.reminderDate = $0 }
                            ), displayedComponents: [.date, .hourAndMinute])
                            .datePickerStyle(CompactDatePickerStyle())
                        }
                    } else {
                        DatePicker("Event Date", selection: $item.eventDate, displayedComponents: [.date, .hourAndMinute])
                            .datePickerStyle(CompactDatePickerStyle())
                        
                        DatePicker("End Date (Optional)", selection: Binding(
                            get: { item.endDate ?? item.eventDate },
                            set: { item.endDate = $0 }
                        ), displayedComponents: [.date, .hourAndMinute])
                        .datePickerStyle(CompactDatePickerStyle())
                    }
                }
                
                // Task-specific settings
                if item.itemType == .task {
                    Section("Task Settings") {
                        Picker("Priority", selection: $item.priority) {
                            ForEach(Priority.allCases, id: \.self) { priority in
                                HStack {
                                    Circle()
                                        .fill(Color(priority.color))
                                        .frame(width: 12, height: 12)
                                    Text(priority.displayName)
                                }
                                .tag(priority)
                            }
                        }
                        
                        Toggle("Recurring", isOn: $item.isRecurring)
                        
                        if item.isRecurring {
                            Picker("Recurrence", selection: Binding(
                                get: { item.recurrenceRule ?? "daily" },
                                set: { item.recurrenceRule = $0 }
                            )) {
                                Text("Daily").tag("daily")
                                Text("Weekly").tag("weekly")
                                Text("Monthly").tag("monthly")
                            }
                        }
                    }
                }
                
                // Context
                Section("Context") {
                    TextField("Location", text: Binding(
                        get: { item.location ?? "" },
                        set: { item.location = $0.isEmpty ? nil : $0 }
                    ))
                    .focused($focusedField, equals: .location)
                    .submitLabel(.done)
                    
                    // Tags
                    VStack(alignment: .leading) {
                        HStack {
                            Image(systemName: "tag")
                                .foregroundColor(.orange)
                            Text("Tags")
                                .font(.headline)
                        }
                        
                        TagInputView(tags: $item.tags)
                    }
                }
                
                // Attachments
                Section("Attachments") {
                    // Links
                    VStack(alignment: .leading) {
                        HStack {
                            Image(systemName: "link")
                                .foregroundColor(.blue)
                            Text("Links")
                                .font(.headline)
                        }
                        
                        ForEach(Array(item.links.enumerated()), id: \.offset) { index, link in
                            HStack {
                                TextField("URL", text: Binding(
                                    get: { item.links[index] },
                                    set: { item.links[index] = $0 }
                                ))
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .keyboardType(.URL)
                                .autocapitalization(.none)
                                .focused($focusedField, equals: .links)
                                .submitLabel(.done)
                                
                                Button("Remove") {
                                    withAnimation {
                                        item.links.remove(at: index)
                                    }
                                }
                                .foregroundColor(.red)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(Color.red.opacity(0.1))
                                .cornerRadius(6)
                            }
                        }
                        
                        Button("Add Link") {
                            withAnimation {
                                item.links.append("")
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.blue.opacity(0.1))
                        .foregroundColor(.blue)
                        .cornerRadius(6)
                    }
                    
                    // Photo
                    VStack(alignment: .leading) {
                        HStack {
                            Image(systemName: "photo")
                                .foregroundColor(.green)
                            Text("Photo")
                                .font(.headline)
                        }
                        
                        if let photoData = item.photoData,
                           let uiImage = UIImage(data: photoData) {
                            Image(uiImage: uiImage)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(maxHeight: 200)
                                .cornerRadius(8)
                            
                            Button("Remove Photo") {
                                withAnimation {
                                    item.photoData = nil
                                }
                            }
                            .foregroundColor(.red)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(6)
                        } else {
                            PhotosPicker(selection: $selectedPhoto, matching: .images) {
                                Label("Add Photo", systemImage: "photo")
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(Color.blue.opacity(0.1))
                                    .foregroundColor(.blue)
                                    .cornerRadius(6)
                            }
                        }
                    }
                }
        }
        .navigationTitle(isEditing ? "Edit Item" : "New Item")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    saveItem()
                }
                .disabled(item.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .onChange(of: selectedPhoto) { _, newValue in
            Task {
                if let newValue = newValue,
                   let data = try? await newValue.loadTransferable(type: Data.self) {
                    item.photoData = data
                }
            }
        }
    }
    
    private func saveItem() {
        if isEditing {
            // Update existing item
            NotificationService.shared.updateReminder(for: item)
        } else {
            // Insert new item
            modelContext.insert(item)
            NotificationService.shared.scheduleReminder(for: item)
            
            if item.isRecurring {
                RecurrenceService.shared.createRecurringTasks(from: item, modelContext: modelContext)
            }
        }
        
        dismiss()
    }
}

struct TagInputView: View {
    @Binding var tags: [String]
    @State private var newTag = ""
    @FocusState private var isTextFieldFocused: Bool
    
    var body: some View {
        VStack(alignment: .leading) {
            // Display existing tags
            if !tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        ForEach(Array(tags.enumerated()), id: \.offset) { index, tag in
                            HStack {
                                Text("#\(tag)")
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.blue.opacity(0.1))
                                    .foregroundColor(.blue)
                                    .cornerRadius(6)
                                
                                Button("×") {
                                    withAnimation {
                                        tags.remove(at: index)
                                    }
                                }
                                .foregroundColor(.red)
                                .font(.caption)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 4)
                                .background(Color.red.opacity(0.1))
                                .cornerRadius(4)
                            }
                        }
                    }
                    .padding(.horizontal, 1)
                }
            }
            
            // Add new tag
            HStack {
                TextField("Add tag", text: $newTag)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .focused($isTextFieldFocused)
                    .submitLabel(.done)
                    .onSubmit {
                        addTag()
                    }
                
                Button("Add") {
                    addTag()
                }
                .disabled(newTag.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.blue.opacity(0.1))
                .foregroundColor(.blue)
                .cornerRadius(6)
            }
        }
    }
    
    private func addTag() {
        let trimmedTag = newTag.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedTag.isEmpty && !tags.contains(trimmedTag) {
            tags.append(trimmedTag)
            newTag = ""
        }
    }
}

#Preview {
    DashItemDetailView()
}
