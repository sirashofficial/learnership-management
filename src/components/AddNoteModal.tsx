"use client";

import { useState } from "react";
import { X, MessageSquare, AlertTriangle, Award, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddNoteModalProps {
  studentName: string;
  onClose: () => void;
  onSubmit: (content: string, type: "GENERAL" | "CONCERN" | "ACHIEVEMENT" | "INTERVENTION") => void;
}

export default function AddNoteModal({ studentName, onClose, onSubmit }: AddNoteModalProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<"GENERAL" | "CONCERN" | "ACHIEVEMENT" | "INTERVENTION">("GENERAL");

  const noteTypes = [
    {
      id: "GENERAL" as const,
      label: "General Note",
      description: "General observation or information",
      icon: MessageSquare,
      color: "text-gray-600",
      bgColor: "bg-gray-100 border-gray-200",
      selectedColor: "bg-gray-50 border-gray-400"
    },
    {
      id: "ACHIEVEMENT" as const,
      label: "Achievement",
      description: "Positive performance or milestone",
      icon: Award,
      color: "text-green-600",
      bgColor: "bg-green-100 border-green-200",
      selectedColor: "bg-green-50 border-green-400"
    },
    {
      id: "CONCERN" as const,
      label: "Concern",
      description: "Issue requiring attention",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100 border-red-200",
      selectedColor: "bg-red-50 border-red-400"
    },
    {
      id: "INTERVENTION" as const,
      label: "Intervention",
      description: "Action taken to address an issue",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100 border-blue-200",
      selectedColor: "bg-blue-50 border-blue-400"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim(), type);
    }
  };

  const selectedNoteType = noteTypes.find(nt => nt.id === type);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Note</h2>
                <p className="text-sm text-gray-600">Add a note for {studentName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Note Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Note Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {noteTypes.map((noteType) => {
                const Icon = noteType.icon;
                const isSelected = type === noteType.id;
                
                return (
                  <button
                    key={noteType.id}
                    type="button"
                    onClick={() => setType(noteType.id)}
                    className={cn(
                      "p-4 border-2 rounded-lg transition-all text-left hover:shadow-sm",
                      isSelected ? noteType.selectedColor : noteType.bgColor
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn("w-5 h-5 mt-0.5", noteType.color)} />
                      <div>
                        <div className="font-medium text-gray-900">{noteType.label}</div>
                        <div className="text-sm text-gray-600">{noteType.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={`Enter your ${type.toLowerCase()} note about ${studentName}...`}
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Be specific and objective in your observations.
              </p>
              <p className="text-xs text-gray-500">
                {content.length}/500
              </p>
            </div>
          </div>

          {/* Preview */}
          {content.trim() && selectedNoteType && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  selectedNoteType.bgColor
                )}>
                  <selectedNoteType.icon className={cn("w-4 h-4", selectedNoteType.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded",
                      selectedNoteType.bgColor,
                      selectedNoteType.color
                    )}>
                      {selectedNoteType.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleDateString()} - Facilitator
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{content}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!content.trim()}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Note
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}