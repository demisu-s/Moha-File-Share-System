import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatFileSize, categoryIcon } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import ShareDialog from "@/components/ui/ShareDialog";
import FilePreviewModal from "@/components/ui/FilePreviewModal";
import { LayoutGrid, List, Search, UploadCloud, Folder, ChevronRight, History, MoreVertical, FileText } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";

interface FileItem {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  category: string;
  description: string | null;
  createdAt: string;
  version: number;
  uploadedBy: { fullName: string; employeeId: string };
}

interface FolderItem {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  createdBy: { fullName: string };
}

const CATEGORIES = ["DOCUMENT", "SPREADSHEET", "PRESENTATION", "PDF", "IMAGE", "VIDEO", "OTHER"];

export default function Files() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Root" }]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [sharingFile, setSharingFile] = useState<FileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const loadData = async (folderId: string | null) => {
    setIsLoading(true);
    setError("");
    try {
      const folderParam = folderId ? `&folderId=${folderId}` : "&folderId=null";
      const [filesRes, foldersRes] = await Promise.all([
        api.get(`/files?limit=100${folderParam}`),
        api.get(`/folders?limit=100${folderParam}`)
      ]);
      setFiles(filesRes.data.data.items);
      setFolders(foldersRes.data.data);
    } catch {
      setError("Couldn't load files and folders. Try refreshing.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentFolderId);
  }, [currentFolderId]);

  const visibleFiles = files.filter((file) => {
    const matchesSearch = file.originalName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || file.category === category;
    return matchesSearch && matchesCategory;
  });

  const visibleFolders = folders.filter((folder) => {
    return folder.name.toLowerCase().includes(search.toLowerCase());
  });

  async function uploadFile(file: File) {
    setIsUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "OTHER");
    if (currentFolderId) {
      formData.append("folderId", currentFolderId);
    }
    if (user?.plantId) formData.append("plantId", user.plantId);
    if (user?.departmentId) formData.append("departmentId", user.departmentId);
    if (user?.sectionId) formData.append("sectionId", user.sectionId);

    try {
      await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadData(currentFolderId);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Upload failed. Check the file type and size.");
    } finally {
      setIsUploading(false);
    }
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    try {
      await api.post("/folders", {
        name: newFolderName,
        parentFolderId: currentFolderId,
        plantId: user?.plantId,
        departmentId: user?.departmentId,
        sectionId: user?.sectionId
      });
      setNewFolderName("");
      setIsCreatingFolder(false);
      await loadData(currentFolderId);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to create folder.");
    }
  }

  function navigateToFolder(folderId: string | null, folderName: string) {
    setCurrentFolderId(folderId);
    
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: "Root" }]);
    } else {
      const existingIndex = breadcrumbs.findIndex(b => b.id === folderId);
      if (existingIndex !== -1) {
        setBreadcrumbs(breadcrumbs.slice(0, existingIndex + 1));
      } else {
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
      }
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
    try {
      const response = await api.get(`/files/${file.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = file.originalName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download file.");
    }
  }

  return (
    <div
      className="p-4 sm:p-8 max-w-6xl mx-auto relative h-full flex flex-col"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 z-40 bg-brand/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-card border-2 border-dashed border-brand rounded-2xl px-12 py-10 flex flex-col items-center gap-3">
            <UploadCloud className="size-10 text-brand" />
            <p className="text-foreground font-medium">Drop to upload here</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            File Manager
          </h1>
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-hide">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.id || 'root'} className="flex items-center">
                <button 
                  onClick={() => navigateToFolder(crumb.id, crumb.name)}
                  className={`hover:text-brand transition-colors ${index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}`}
                >
                  {crumb.name}
                </button>
                {index < breadcrumbs.length - 1 && <ChevronRight className="size-4 mx-1 opacity-50" />}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
          <Button
            onClick={() => setIsCreatingFolder(true)}
            variant="outline"
            className="border-border hover:bg-muted"
          >
            <Folder className="size-4 mr-2" />
            New Folder
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            <UploadCloud className="size-4 mr-2" />
            {isUploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>

      {isCreatingFolder && (
        <div className="mb-6 p-4 bg-muted/30 border border-border rounded-xl flex items-center gap-3">
          <Input
            autoFocus
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createFolder()}
            className="flex-1 bg-card"
          />
          <Button onClick={createFolder} className="h-9 bg-brand hover:bg-brand/90 text-white px-4">
            Create
          </Button>
          <Button onClick={() => setIsCreatingFolder(false)} variant="ghost" className="h-9 text-muted-foreground hover:bg-transparent hover:text-foreground">
            Cancel
          </Button>
        </div>
      )}

      {/* Search, filter, view toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files and folders…"
            className="w-full pl-9 bg-card"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 px-3 rounded-lg border border-border bg-card text-sm"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
          <button onClick={() => setView("grid")} className={`h-10 w-10 flex items-center justify-center transition-colors ${view === "grid" ? "bg-brand text-white" : "bg-card text-muted-foreground hover:bg-muted/50"}`}>
            <LayoutGrid className="size-4" />
          </button>
          <button onClick={() => setView("list")} className={`h-10 w-10 flex items-center justify-center transition-colors ${view === "list" ? "bg-brand text-white" : "bg-card text-muted-foreground hover:bg-muted/50"}`}>
            <List className="size-4" />
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive mb-4" role="alert">{error}</p>}

      {/* Grid View */}
      {view === "grid" && (
        <div className="flex-1 overflow-y-auto pb-8">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="border border-border/50 rounded-xl p-4 space-y-3">
                  <Skeleton className="h-12 w-12 mx-auto rounded-lg" />
                  <Skeleton className="h-4 w-2/3 mx-auto" />
                </div>
              ))}
            </div>
          ) : visibleFolders.length === 0 && visibleFiles.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center mt-4">
              <Folder className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-1">This folder is empty.</p>
              <p className="text-xs text-muted-foreground">Drag files here to upload.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {visibleFolders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => navigateToFolder(folder.id, folder.name)}
                  className="group text-left border border-border rounded-xl p-4 bg-card transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light/40"
                >
                  <div className="h-12 w-12 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                    <Folder className="size-6 fill-current opacity-80" />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">Folder</p>
                </button>
              ))}

              {visibleFiles.map(file => (
                <div key={file.id} className="group relative border border-border rounded-xl p-4 bg-card transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-brand/40 flex flex-col">
                  <div 
                    onClick={() => setPreviewFile(file)}
                    className="cursor-pointer flex flex-col h-full"
                  >
                    <div className="h-12 w-12 rounded-lg bg-brand/5 flex items-center justify-center text-2xl mb-3">
                      {categoryIcon(file.category)}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate" title={file.originalName}>{file.originalName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                      {file.version > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-medium text-muted-foreground" title={`${file.version} versions`}>
                          v{file.version}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-muted rounded text-muted-foreground">
                      <MoreVertical className="size-4" />
                    </button>
                  </div>
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-border/50">
                    <Button onClick={() => setSharingFile(file)} size="sm" variant="ghost" className="flex-1 h-7 text-xs hover:bg-brand/10 hover:text-brand px-0">
                      Share
                    </Button>
                    <Button onClick={() => handleDownload(file)} size="sm" variant="ghost" className="flex-1 h-7 text-xs hover:bg-brand/10 hover:text-brand px-0">
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="flex-1 overflow-y-auto pb-8">
          {isLoading ? (
            <div className="border border-border/50 rounded-lg divide-y divide-border/50">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center p-3 gap-4">
                  <Skeleton className="h-8 w-8 rounded shrink-0" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-border rounded-xl bg-card overflow-hidden divide-y divide-border/50 shadow-sm">
              <div className="grid grid-cols-12 gap-4 p-3 bg-muted/30 text-xs font-semibold text-muted-foreground">
                <div className="col-span-6 sm:col-span-5">Name</div>
                <div className="hidden sm:block col-span-3">Owner</div>
                <div className="col-span-3 sm:col-span-2">Size</div>
                <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
              </div>
              
              {visibleFolders.map(folder => (
                <div key={folder.id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-muted/40 transition-all duration-200 group border-l-2 border-transparent hover:border-brand/50">
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <Folder className="size-5 text-blue-500 fill-current opacity-80 shrink-0" />
                    <button onClick={() => navigateToFolder(folder.id, folder.name)} className="text-sm font-medium truncate hover:text-brand text-left">
                      {folder.name}
                    </button>
                  </div>
                  <div className="hidden sm:block col-span-3 text-sm text-muted-foreground truncate">{folder.createdBy.fullName}</div>
                  <div className="col-span-3 sm:col-span-2 text-sm text-muted-foreground">-</div>
                  <div className="col-span-3 sm:col-span-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">Open</Button>
                  </div>
                </div>
              ))}

              {visibleFiles.map(file => (
                <div key={file.id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-muted/40 transition-all duration-200 group border-l-2 border-transparent hover:border-brand/50">
                  <div 
                    className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 cursor-pointer"
                    onClick={() => setPreviewFile(file)}
                  >
                    <span className="text-lg shrink-0 w-5 text-center">{categoryIcon(file.category)}</span>
                    <div className="min-w-0 flex flex-col">
                      <span className="text-sm font-medium truncate hover:text-brand" title={file.originalName}>{file.originalName}</span>
                      {file.version > 1 && <span className="text-[10px] text-muted-foreground">Version {file.version}</span>}
                    </div>
                  </div>
                  <div className="hidden sm:block col-span-3 text-sm text-muted-foreground truncate">{file.uploadedBy.fullName}</div>
                  <div className="col-span-3 sm:col-span-2 text-sm text-muted-foreground">{formatFileSize(file.fileSize)}</div>
                  <div className="col-span-3 sm:col-span-2 text-right opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                    <Button onClick={() => setSharingFile(file)} size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full hover:bg-brand/10 hover:text-brand" title="Share">
                      <MoreVertical className="size-4" />
                    </Button>
                    <Button onClick={() => handleDownload(file)} size="sm" variant="ghost" className="h-7 px-2 text-xs rounded hover:bg-brand/10 hover:text-brand">
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {sharingFile && (
        <ShareDialog
          fileId={sharingFile.id}
          fileName={sharingFile.originalName}
          onClose={() => setSharingFile(null)}
          onShared={() => loadData(currentFolderId)}
        />
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}