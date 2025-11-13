// Utility functions for physician classification

export type PhysicianClassification = "general" | "specialist" | "consultant" | "senior_consultant" | "super_specialist"

/**
 * Get human-readable label for physician classification
 */
export function getClassificationLabel(classification?: PhysicianClassification | string): string {
  switch (classification) {
    case "general":
      return "General Practitioner"
    case "specialist":
      return "Specialist"
    case "consultant":
      return "Consultant"
    case "senior_consultant":
      return "Senior Consultant"
    case "super_specialist":
      return "Super Specialist"
    default:
      return "General Practitioner"
  }
}

/**
 * Get short label for physician classification (for badges)
 */
export function getClassificationShortLabel(classification?: PhysicianClassification | string): string {
  switch (classification) {
    case "general":
      return "General"
    case "specialist":
      return "Specialist"
    case "consultant":
      return "Consultant"
    case "senior_consultant":
      return "Senior Consultant"
    case "super_specialist":
      return "Super Specialist"
    default:
      return "General"
  }
}

/**
 * Get CSS classes for classification badge color
 */
export function getClassificationColor(classification?: PhysicianClassification | string): string {
  switch (classification) {
    case "general":
      return "bg-blue-100 text-blue-800"
    case "specialist":
      return "bg-green-100 text-green-800"
    case "consultant":
      return "bg-purple-100 text-purple-800"
    case "senior_consultant":
      return "bg-orange-100 text-orange-800"
    case "super_specialist":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

