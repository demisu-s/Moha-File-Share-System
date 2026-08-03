export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CATEGORY_ICONS: Record<string, string> = {
  DOCUMENT: "📄",
  SPREADSHEET: "📊",
  PRESENTATION: "📽️",
  PDF: "📕",
  IMAGE: "🖼️",
  VIDEO: "🎬",
  OTHER: "📁",
};

export function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? "📁";
}