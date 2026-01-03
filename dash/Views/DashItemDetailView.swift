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
        NavigationStack {
            Form {
                typeSection
                basicInfoSection
                datesSection
                
                if item.itemType == .task {
                    taskSettingsSection
                }
                
                contextSection
                attachmentsSection
            }
            .navigationTitle(isEditing ? "Edit Item" : "New Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveItem()
                    }
                    .disabled(item.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .onChange(of: selectedPhoto) { _, newValue in
                handlePhotoSelection(newValue)
            }
        }
    }
    
    // MARK: - View Sections
    
    private var typeSection: some View {
        Section {
            Picker("Type", selection: $item.itemType) {
                Text("Task").tag(ItemType.task)
                Text("Event").tag(ItemType.event)
            }
            .pickerStyle(.segmented)
        }
    }
    
    private var basicInfoSection: some View {
        Section("Basic Information") {
            TextField("Title", text: $item.title)
                .focused($focusedField, equals: .title)
                .submitLabel(.next)
            
            TextField("Notes", text: notesBinding, axis: .vertical)
                .focused($focusedField, equals: .notes)
                .lineLimit(3...6)
                .submitLabel(.done)
        }
    }
    
    private var datesSection: some View {
        Section(item.itemType == .task ? "Task Dates" : "Event Dates") {
            if item.itemType == .task {
                DatePicker("Due Date", selection: dueDateBinding, displayedComponents: [.date, .hourAndMinute])
                
                Toggle("Set Reminder", isOn: $item.hasReminder)
                
                if item.hasReminder {
                    DatePicker("Reminder", selection: reminderDateBinding, displayedComponents: [.date, .hourAndMinute])
                }
            } else {
                DatePicker("Event Date", selection: $item.eventDate, displayedComponents: [.date, .hourAndMinute])
                
                DatePicker("End Date (Optional)", selection: endDateBinding, displayedComponents: [.date, .hourAndMinute])
            }
        }
    }
    
    private var taskSettingsSection: some View {
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
                Picker("Recurrence", selection: recurrenceBinding) {
                    Text("Daily").tag("daily")
                    Text("Weekly").tag("weekly")
                    Text("Monthly").tag("monthly")
                }
            }
        }
    }
    
    private var contextSection: some View {
        Section("Context") {
            TextField("Location", text: locationBinding)
                .focused($focusedField, equals: .location)
                .submitLabel(.done)
            
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
    }
    
    private var attachmentsSection: some View {
        Section("Attachments") {
            linksView
            photoView
        }
    }
    
    @ViewBuilder
    private var linksView: some View {
        VStack(alignment: .leading, spacing: 8) {
            linksHeader
            linksListView
            addLinkButton
        }
    }
    
    private var linksHeader: some View {
        HStack {
            Image(systemName: "link")
                .foregroundColor(.blue)
            Text("Links")
                .font(.headline)
        }
    }
    
    @ViewBuilder
    private var linksListView: some View {
        ForEach(Array(item.links.enumerated()), id: \.offset) { index, _ in
            linkRowView(at: index)
        }
    }
    
    private func linkRowView(at index: Int) -> some View {
        HStack {
            TextField("URL", text: linkBinding(for: index))
                .textFieldStyle(.roundedBorder)
                .keyboardType(.URL)
                .autocapitalization(.none)
                .focused($focusedField, equals: .links)
                .submitLabel(.done)
            
            Button {
                removeLink(at: index)
            } label: {
                Text("Remove")
            }
            .foregroundColor(.red)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.red.opacity(0.1))
            .cornerRadius(6)
        }
    }
    
    private func removeLink(at index: Int) {
        withAnimation {
            var links = item.links
            links.remove(at: index)
            item.links = links
        }
    }
    
    private var addLinkButton: some View {
        Button {
            withAnimation {
                item.links.append("")
            }
        } label: {
            Text("Add Link")
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.blue.opacity(0.1))
        .foregroundColor(.blue)
        .cornerRadius(6)
    }
    
    private var photoView: some View {
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
    
    // MARK: - Bindings
    
    private var notesBinding: Binding<String> {
        Binding(
            get: { item.notes ?? "" },
            set: { item.notes = $0.isEmpty ? nil : $0 }
        )
    }
    
    private var dueDateBinding: Binding<Date> {
        Binding(
            get: { item.dueDate ?? Date() },
            set: { item.dueDate = $0 }
        )
    }
    
    private var reminderDateBinding: Binding<Date> {
        Binding(
            get: { item.reminderDate ?? Date() },
            set: { item.reminderDate = $0 }
        )
    }
    
    private var endDateBinding: Binding<Date> {
        Binding(
            get: { item.endDate ?? item.eventDate },
            set: { item.endDate = $0 }
        )
    }
    
    private var locationBinding: Binding<String> {
        Binding(
            get: { item.location ?? "" },
            set: { item.location = $0.isEmpty ? nil : $0 }
        )
    }
    
    private var recurrenceBinding: Binding<String> {
        Binding(
            get: { item.recurrenceRule ?? "daily" },
            set: { item.recurrenceRule = $0 }
        )
    }
    
    private func linkBinding(for index: Int) -> Binding<String> {
        Binding(
            get: { item.links[index] },
            set: { item.links[index] = $0 }
        )
    }
    
    // MARK: - Helper Methods
    
    private func handlePhotoSelection(_ newValue: PhotosPickerItem?) {
        guard let newValue = newValue else { return }
        
        Task {
            do {
                if let data = try await newValue.loadTransferable(type: Data.self) {
                    await MainActor.run {
                        item.photoData = data
                    }
                }
            } catch {
                print("Failed to load photo: \(error)")
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
        VStack(alignment: .leading, spacing: 8) {
            existingTagsView
            addTagInputView
        }
    }
    
    @ViewBuilder
    private var existingTagsView: some View {
        if !tags.isEmpty {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 4) {
                    ForEach(Array(tags.enumerated()), id: \.offset) { index, tag in
                        tagView(tag: tag, index: index)
                    }
                }
                .padding(.horizontal, 1)
            }
        }
    }
    
    private func tagView(tag: String, index: Int) -> some View {
        HStack(spacing: 4) {
            Text("#\(tag)")
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.blue.opacity(0.1))
                .foregroundColor(.blue)
                .cornerRadius(6)
            
            Button {
                removeTag(at: index)
            } label: {
                Text("×")
            }
            .foregroundColor(.red)
            .font(.caption)
            .padding(.horizontal, 6)
            .padding(.vertical, 4)
            .background(Color.red.opacity(0.1))
            .cornerRadius(4)
        }
    }
    
    private func removeTag(at index: Int) {
        withAnimation {
            var currentTags = tags
            currentTags.remove(at: index)
            tags = currentTags
        }
    }
    
    private var addTagInputView: some View {
        HStack(spacing: 8) {
            TextField("Add tag", text: $newTag)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .focused($isTextFieldFocused)
                .submitLabel(.done)
                .onSubmit {
                    addTag()
                }
            
            Button {
                addTag()
            } label: {
                Text("Add")
            }
            .disabled(newTag.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.blue.opacity(0.1))
            .foregroundColor(.blue)
            .cornerRadius(6)
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
