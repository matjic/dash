//
//  QuickAddBar.swift
//  dash
//
//  Created by Mathew Jacob on 10/22/25.
//

import SwiftUI

struct QuickAddBar: View {
    @Binding var text: String
    let onAdd: () -> Void
    let onSearch: (String) -> Void
    @FocusState private var isTextFieldFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            // Input Field
            HStack(spacing: 12) {
                TextField(
                    "Search or add task/event...",
                    text: $text
                )
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .font(.body)
                .frame(minHeight: 44) // Minimum touch target height
                .focused($isTextFieldFocused)
                .submitLabel(.done)
                .onSubmit {
                    if !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        onAdd()
                    }
                }
                .onChange(of: text) { _, newValue in
                    onSearch(newValue)
                }
                .onTapGesture {
                    isTextFieldFocused = true
                }
                
                Button(action: onAdd) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title)
                        .foregroundColor(.blue)
                        .frame(width: 44, height: 44) // Larger touch target
                }
                .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16) // Increased vertical padding
        }
        .background(Color(.systemBackground))
        .overlay(
            Rectangle()
                .frame(height: 0.5)
                .foregroundColor(Color(.separator)),
            alignment: .top
        )
    }
}

#Preview {
    @Previewable @State var text = ""
    QuickAddBar(
        text: $text,
        onAdd: { print("Add tapped") },
        onSearch: { searchText in print("Search: \(searchText)") }
    )
}
