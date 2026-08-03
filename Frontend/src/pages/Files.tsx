import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatFileSize, categoryIcon } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import ShareDialog from "@/components/ui/ShareDialog";
import { LayoutGrid, List, Search, UploadCloud } from "lucide-react";

interface FileItem {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  category: string;
  description: string | null;
  createdAt: string;
  uploadedBy: { fullName: string; employeeId: string };
}

const CATEGORIES = ["DOCUMENT", "SPREADSHEET", "PRESENTATION", "PDF", "IMAGE", "VIDEO", "OTHER"];

export default function Files() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [sharingFile, setSharingFile] = useState<FileItem | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  async function loadFiles() {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await api.get("/files");
      setFiles(data.data.items);
      setTotal(data.data.total);
    } catch {
      setError("Couldn't load files. Try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  const visibleFiles = files.filter((file) => {
    const matchesSearch = file.originalName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || file.category === category;
    return matchesSearch && matchesCategory;
  });

  async function uploadFile(file: File) {
    setIsUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "OTHER");

    try {
      await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Upload failed. Check the file type and size.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  async function handleDownload(file: FileItem) {
    const response = await api.get(`/files/${file.id}/download`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = file.originalName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div
      className="p-4 sm:p-8 max-w-5xl mx-auto relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay — appears anywhere over the page while dragging a file */}
      {isDragging && (
        <div className="fixed inset-0 z-40 bg-brand/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-card border-2 border-dashed border-brand rounded-2xl px-12 py-10 flex flex-col items-center gap-3">
            <UploadCloud className="size-10 text-brand" />
            <p className="text-foreground font-medium">Drop to upload</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Files</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${visibleFiles.length} of ${total} files`}
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto bg-brand hover:bg-brand/90 text-white"
          >
            {isUploading ? "Uploading…" : "Upload file"}
          </Button>
        </div>
      </div>

      {/* Search, filter, view toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-light/40 focus-visible:border-brand-light"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 px-3 rounded-lg border border-border bg-card text-sm"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0) + c.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
          <button
            onClick={() => setView("grid")}
            className={`h-10 w-10 flex items-center justify-center transition-colors ${
              view === "grid" ? "bg-brand text-white" : "bg-card text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`h-10 w-10 flex items-center justify-center transition-colors ${
              view === "list" ? "bg-brand text-white" : "bg-card text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive mb-4" role="alert">{error}</p>
      )}

      {isLoading && (
        <div className={view === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" : "border rounded-lg divide-y"}>
          {[1, 2, 3, 4].map((i) =>
            view === "grid" ? (
              <div key={i} className="border rounded-xl p-4 space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ) : (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            )
          )}
        </div>
      )}

      {!isLoading && visibleFiles.length === 0 && !error && (
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
          <UploadCloud className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">
            {search || category ? "No files match your search." : "No files here yet."}
          </p>
          <p className="text-xs text-muted-foreground">Drag a file anywhere on this page to upload.</p>
        </div>
      )}

      {/* Grid view */}
      {!isLoading && view === "grid" && visibleFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleFiles.map((file) => (
            <div
              key={file.id}
              className="group border border-border rounded-xl p-4 bg-card transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-brand-light/50"
            >
              <div className="h-16 rounded-lg bg-brand/5 flex items-center justify-center text-3xl mb-3 transition-transform group-hover:scale-105">
                {categoryIcon(file.category)}
              </div>
              <p className="text-sm font-medium truncate" title={file.originalName}>
                {file.originalName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(file.fileSize)}</p>
              <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={() => setSharingFile(file)}
                  className="flex-1 h-7 text-xs bg-transparent hover:bg-muted text-foreground border border-border"
                >
                  Share
                </Button>
                <Button
                  onClick={() => handleDownload(file)}
                  className="flex-1 h-7 text-xs bg-transparent hover:bg-muted text-foreground border border-border"
                >
                  Get
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {!isLoading && view === "list" && visibleFiles.length > 0 && (
        <div className="border rounded-lg divide-y">
          {visibleFiles.map((file) => (
            <div
              key={file.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl shrink-0">{categoryIcon(file.category)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)} · Uploaded by {file.uploadedBy.fullName}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  onClick={() => setSharingFile(file)}
                  className="flex-1 sm:flex-none bg-transparent hover:bg-muted text-foreground border border-border"
                >
                  Share
                </Button>
                <Button
                  onClick={() => handleDownload(file)}
                  className="flex-1 sm:flex-none bg-transparent hover:bg-muted text-foreground border border-border"
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sharingFile && (
        <ShareDialog
          fileId={sharingFile.id}
          fileName={sharingFile.originalName}
          onClose={() => setSharingFile(null)}
          onShared={loadFiles}
        />
      )}
    </div>
  );
}