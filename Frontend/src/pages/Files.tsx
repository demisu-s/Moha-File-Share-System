import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatFileSize, categoryIcon } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import ShareDialog from "@/components/ui/ShareDialog";

interface FileItem {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  category: string;
  description: string | null;
  createdAt: string;
  uploadedBy: {
    fullName: string;
    employeeId: string;
  };
}

export default function Files() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [sharingFile, setSharingFile] = useState<FileItem | null>(null);

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

  async function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "OTHER");

    try {
      await api.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await loadFiles();
    } catch (err: any) {
      setError(
        err.response?.data?.error ??
          "Upload failed. Check the file type and size."
      );
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDownload(file: FileItem) {
    try {
      const response = await api.get(`/files/${file.id}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;
      link.download = file.originalName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download file.");
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Files
          </h1>

          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `${total} ${total === 1 ? "file" : "files"} in your scope`}
          </p>
        </div>

        <div>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white"
          >
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p
          className="mb-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="border rounded-lg divide-y">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4"
            >
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />

              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && files.length === 0 && !error && (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No files here yet.
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            Upload one to get started.
          </p>
        </div>
      )}

      {/* File List */}
      {!isLoading && files.length > 0 && (
        <div className="border rounded-lg divide-y">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">
                  {categoryIcon(file.category)}
                </span>

                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {file.originalName}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)} • Uploaded by{" "}
                    {file.uploadedBy.fullName}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setSharingFile(file)}
                >
                  Share
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleDownload(file)}
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Dialog */}
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