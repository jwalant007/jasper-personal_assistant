import React, { useState, useEffect } from 'react';
import { HardDrive, Folder, File as FileIcon, Search, RefreshCw, Eye, ArrowUp, X, FileText, Image as ImageIcon, Code, Film, AlertCircle } from 'lucide-react';

export default function JasperFileManagerApp() {
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [diskInfo, setDiskInfo] = useState({ drive: 'C:', totalGB: 512, freeGB: 256, usedGB: 256, usedPercent: 50 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // File preview modal
  const [previewFile, setPreviewFile] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchFiles = async (dirPath = '') => {
    setLoading(true);
    setError(null);
    try {
      const url = dirPath ? `/api/fs/list?dir=${encodeURIComponent(dirPath)}` : '/api/fs/list';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCurrentPath(data.currentPath);
        setParentPath(data.parentPath);
        setFiles(data.files || []);
      } else {
        setError(data.error || 'Failed to list directory');
      }
    } catch (err) {
      setError('Connection to host file system failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisk = async () => {
    try {
      const res = await fetch('/api/fs/disk');
      const data = await res.json();
      if (data.success) {
        setDiskInfo(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchFiles();
    fetchDisk();
  }, []);

  const handleOpenItem = (item) => {
    if (item.isDir) {
      fetchFiles(item.path);
    } else {
      handlePreview(item);
    }
  };

  const handlePreview = async (file) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewContent('');
    try {
      const res = await fetch(`/api/fs/read?file=${encodeURIComponent(file.path)}`);
      const data = await res.json();
      if (data.success) {
        setPreviewContent(data.content);
      } else {
        setPreviewContent(`[Error reading file]: ${data.error}`);
      }
    } catch (err) {
      setPreviewContent(`[Connection error]: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const getFileIcon = (name, isDir) => {
    if (isDir) return <Folder className="w-4 h-4 text-amber-400" />;
    if (/\.(jpg|png|webp|gif|jpeg|svg)$/i.test(name)) return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    if (/\.(js|jsx|json|html|css|py|ps1|bat|ts|tsx)$/i.test(name)) return <Code className="w-4 h-4 text-cyan-400" />;
    if (/\.(mp4|mkv|avi|mov)$/i.test(name)) return <Film className="w-4 h-4 text-purple-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-slate-950/80 text-slate-100 font-sans p-4 rounded-xl space-y-4">
      {/* Drive Telemetry Header */}
      <div className="p-3 bg-cyan-950/50 border border-cyan-500/30 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 border border-cyan-400 rounded-xl text-cyan-300">
            <HardDrive className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-cyan-200">
              HOST SYSTEM DISK ({diskInfo.drive || 'C:'})
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {diskInfo.freeGB} GB Free of {diskInfo.totalGB} GB ({diskInfo.usedPercent || 0}% used)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-40 bg-slate-900 h-2.5 rounded-full border border-cyan-500/30 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, diskInfo.usedPercent || 0))}%` }}
            />
          </div>
          <button
            onClick={() => { fetchFiles(currentPath); fetchDisk(); }}
            title="Refresh Directory"
            className="p-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 rounded-lg text-cyan-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Path Bar & Search */}
      <div className="flex items-center gap-2">
        {parentPath && (
          <button
            onClick={() => fetchFiles(parentPath)}
            title="Go to parent directory"
            className="p-1.5 bg-cyan-950/80 hover:bg-cyan-800 border border-cyan-500/40 rounded-xl text-cyan-300 transition-colors flex items-center gap-1 text-xs font-mono"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="flex-1 px-3 py-1.5 bg-cyan-950/70 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300 truncate">
          📂 {currentPath || 'Loading...'}
        </div>
        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-cyan-400/60" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter files..."
            className="w-full pl-8 pr-2 py-1 bg-cyan-950/70 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {error && (
        <div className="p-2 bg-red-950/60 border border-red-500/40 rounded-lg flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main File Table */}
      <div className="flex-1 overflow-y-auto bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-2 custom-scrollbar">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-cyan-500/30 text-cyan-400/80">
              <th className="pb-2 pl-2">Name</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Size</th>
              <th className="pb-2 text-right pr-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-500/10">
            {filteredFiles.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-500">
                  No files found in this directory
                </td>
              </tr>
            )}
            {filteredFiles.map((file, idx) => (
              <tr
                key={idx}
                onClick={() => setSelectedFile(file)}
                onDoubleClick={() => handleOpenItem(file)}
                className={`hover:bg-cyan-500/15 cursor-pointer transition-colors ${
                  selectedFile?.path === file.path ? 'bg-cyan-500/25 border-l-2 border-cyan-400' : ''
                }`}
              >
                <td className="py-2 pl-2 flex items-center gap-2 text-slate-200">
                  {getFileIcon(file.name, file.isDir)}
                  <span className="font-semibold">{file.name}</span>
                </td>
                <td className="py-2 text-slate-400">{file.isDir ? 'Folder' : 'File'}</td>
                <td className="py-2 text-slate-400">{file.size}</td>
                <td className="py-2 text-right pr-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenItem(file);
                    }}
                    title={file.isDir ? 'Open Folder' : 'Preview File'}
                    className="p-1 rounded hover:bg-cyan-500/30 text-cyan-300"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Real File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-3 border-b border-cyan-500/30 flex items-center justify-between bg-cyan-950/60">
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs">
                {getFileIcon(previewFile.name, false)}
                <span className="font-bold">{previewFile.name}</span>
                <span className="text-slate-400">({previewFile.size})</span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 hover:bg-cyan-500/20 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 font-mono text-xs bg-slate-950 text-slate-200 whitespace-pre-wrap selection:bg-cyan-500/30">
              {previewLoading ? (
                <div className="flex items-center justify-center py-10 text-cyan-400 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading file content from host disk...</span>
                </div>
              ) : (
                previewContent
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
