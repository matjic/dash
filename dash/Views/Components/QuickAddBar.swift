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
            HStack(spacing: 16) {
                // Spotlight-style pill textfield
                HStack(spacing: 12) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 20))
                        .foregroundColor(.secondary)
                    
                    TextField(
                        "Search or add task/event...",
                        text: $text
                    )
                    .textFieldStyle(.plain)
                    .font(.system(size: 18))
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
                    
                    if !text.isEmpty {
                        Button(action: {
                            text = ""
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 18))
                                .foregroundColor(.secondary)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
                .frame(height: 56)
                .background(Color(.systemGray6))
                .cornerRadius(28) // Large pill shape (height / 2)
                .overlay(
                    RoundedRectangle(cornerRadius: 28)
                        .stroke(Color(.systemGray4), lineWidth: 0.5)
                )
                .onTapGesture {
                    isTextFieldFocused = true
                }
                
                // Larger add button
                Button(action: onAdd) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 36))
                        .foregroundColor(.blue)
                        .frame(width: 56, height: 56)
                }
                .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .buttonStyle(PlainButtonStyle())
                .opacity(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.4 : 1.0)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 20)
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
