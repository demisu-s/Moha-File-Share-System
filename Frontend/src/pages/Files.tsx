import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatFileSize, categoryIcon } from "@/lib/format";
import { Button } from "@/components/ui/button";

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

export default function Files() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <a href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            ← Back to dashboard
          </a>
          <h1 className="text-2xl font-semibold tracking-tight mt-2">Files</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${total} ${total === 1 ? "file" : "files"} in your scope`}
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
            className="bg-[#D98E3F] hover:bg-[#D98E3F]/90 text-white"
          >
            {isUploading ? "Uploading…" : "Upload file"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive mb-4" role="alert">{error}</p>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading files…</p>}

      {!isLoading && files.length === 0 && !error && (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-sm text-muted-foreground mb-1">No files here yet.</p>
          <p className="text-xs text-muted-foreground">Upload one to get started.</p>
        </div>
      )}

      {!isLoading && files.length > 0 && (
        <div className="border rounded-lg divide-y">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl shrink-0">{categoryIcon(file.category)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)} · Uploaded by {file.uploadedBy.fullName}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleDownload(file)}
                className="shrink-0 bg-transparent hover:bg-muted text-foreground border"
              >
                Download
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}