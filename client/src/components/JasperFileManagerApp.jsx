import React, { useState, useEffect } from 'react';
import { HardDrive, Folder, File as FileIcon, Search, RefreshCw, Eye, Download, Server, Cpu, CheckCircle2, FileText, Image as ImageIcon, Code, Film } from 'lucide-react';
import { getServerIp } from '../utils/apiConfig';

export default function JasperFileManagerApp() {
  const [currentPath, setCurrentPath] = useState('c:\\Users\\Jwalant\\.gemini\\antigravity\\scratch\\jasper-assistant');
  const [files, setFiles] = useState([
    { name: 'client', isDir: true, size: 'DIR' },
    { name: 'server', isDir: true, size: 'DIR' },
    { name: 'scratch', isDir: true, size: 'DIR' },
    { name: 'JASPER_STANDALONE_OS.bat', isDir: false, size: '1.1 KB' },
    { name: 'JASPER_BOOT_CHOOSER.bat', isDir: false, size: '1.2 KB' },
    { name: 'package.json', isDir: false, size: '1.8 KB' },
    { name: 'README.md', isDir: false, size: '3.4 KB' }
  ]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [diskInfo, setDiskInfo] = useState({ totalGB: 512, freeGB: 342, usedGB: 170 });

  const getFileIcon = (name, isDir) => {
    if (isDir) return <Folder className="w-4 h-4 text-amber-400" />;
    if (/\.(jpg|png|webp|gif|jpeg)$/i.test(name)) return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    if (/\.(js|jsx|json|html|css|py|ps1|bat)$/i.test(name)) return <Code className="w-4 h-4 text-cyan-400" />;
    if (/\.(mp4|mkv|avi)$/i.test(name)) return <Film className="w-4 h-4 text-purple-400" />;
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
            <div className="text-xs font-mono font-bold text-cyan-200">LOCAL SYSTEM DISK (C:)</div>
            <div className="text-[10px] font-mono text-slate-400">{diskInfo.freeGB} GB Free of {diskInfo.totalGB} GB</div>
          </div>
        </div>

        <div className="w-48 bg-slate-900 h-2.5 rounded-full border border-cyan-500/30 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full w-[33%]" />
        </div>
      </div>

      {/* Path Bar & Search */}
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-1.5 bg-cyan-950/70 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300 truncate">
          📂 {currentPath}
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
            {filteredFiles.map((file, idx) => (
              <tr
                key={idx}
                onClick={() => setSelectedFile(file)}
                className={`hover:bg-cyan-500/15 cursor-pointer transition-colors ${
                  selectedFile?.name === file.name ? 'bg-cyan-500/25 border-l-2 border-cyan-400' : ''
                }`}
              >
                <td className="py-2 pl-2 flex items-center gap-2 text-slate-200">
                  {getFileIcon(file.name, file.isDir)}
                  <span className="font-semibold">{file.name}</span>
                </td>
                <td className="py-2 text-slate-400">{file.isDir ? 'Folder' : 'File'}</td>
                <td className="py-2 text-slate-400">{file.size}</td>
                <td className="py-2 text-right pr-2">
                  <button className="p-1 rounded hover:bg-cyan-500/30 text-cyan-300">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
