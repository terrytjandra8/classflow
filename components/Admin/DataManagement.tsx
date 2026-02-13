
import React, { useState } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, RefreshCw, FileJson } from 'lucide-react';
import { adminService } from '../../services/adminService';

interface DataManagementProps {
    theme: 'light' | 'dark';
    onRefresh?: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ theme, onRefresh }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [fileStats, setFileStats] = useState<string>('');

    const handleBackup = async () => {
        setIsExporting(true);
        try {
            // Get all data - Isolated Heavy Fetch
            const data = await adminService.getFullBackup();
            
            // Create Blob
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Download Trigger
            const a = document.createElement('a');
            a.href = url;
            a.download = `classboard-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert("Backup failed. Check console.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportStatus('idle');
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            setFileStats(`Found: ${data.boards?.length || 0} boards, ${data.notes?.length || 0} notes, ${data.profiles?.length || 0} users.`);
            
            const confirm = window.confirm("WARNING: This will attempt to merge and update existing data. Are you sure?");
            if (confirm) {
                await adminService.restoreBackup(data);
                setImportStatus('success');
                if (onRefresh) onRefresh();
            } else {
                setImportStatus('idle');
            }
        } catch (e) {
            console.error(e);
            setImportStatus('error');
        } finally {
            setIsImporting(false);
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    return (
        <div className={`rounded-xl border overflow-hidden animate-fade-in ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1a1a] border-white/5'}`}>
            <div className="p-6 border-b border-gray-200 dark:border-white/5">
                <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Data & Backups</h3>
                <p className="text-sm text-gray-500">Create snapshots of your school's data or restore from a previous file.</p>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Export Section */}
                <div className={`p-6 rounded-2xl border border-dashed flex flex-col items-center text-center gap-4 ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/10 border-blue-500/20'}`}>
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-2">
                        <Download size={32} />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-blue-700 dark:text-blue-300">Export Backup</h4>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1 max-w-xs">
                            Download a JSON file containing all boards, notes, student profiles, classes, and grades.
                        </p>
                    </div>
                    <button 
                        onClick={handleBackup}
                        disabled={isExporting}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                    >
                        {isExporting ? <RefreshCw size={18} className="animate-spin"/> : <FileJson size={18} />}
                        {isExporting ? 'Generating...' : 'Download JSON'}
                    </button>
                </div>

                {/* Import Section */}
                <div className={`p-6 rounded-2xl border border-dashed flex flex-col items-center text-center gap-4 ${theme === 'light' ? 'bg-orange-50 border-orange-200' : 'bg-orange-900/10 border-orange-500/20'}`}>
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mb-2">
                        <Upload size={32} />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-orange-700 dark:text-orange-300">Restore Data</h4>
                        <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1 max-w-xs">
                            Upload a backup JSON file to restore missing data. Existing items will be updated.
                        </p>
                    </div>
                    
                    <div className="relative mt-2">
                        <input 
                            type="file" 
                            accept=".json"
                            onChange={handleRestore}
                            disabled={isImporting}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <button 
                            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 w-full"
                        >
                            {isImporting ? <RefreshCw size={18} className="animate-spin"/> : <Upload size={18} />}
                            {isImporting ? 'Restoring...' : 'Select File'}
                        </button>
                    </div>

                    {importStatus === 'success' && (
                        <div className="text-green-500 text-xs font-bold flex items-center gap-1 animate-in fade-in">
                            <CheckCircle size={12} /> Restoration Complete!
                        </div>
                    )}
                    {importStatus === 'error' && (
                        <div className="text-red-500 text-xs font-bold flex items-center gap-1 animate-in fade-in">
                            <AlertTriangle size={12} /> Restoration Failed.
                        </div>
                    )}
                    {fileStats && <p className="text-[10px] text-gray-500">{fileStats}</p>}
                </div>

            </div>
            
            <div className="px-8 pb-8">
                <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex gap-3">
                    <AlertTriangle size={20} className="text-yellow-500 shrink-0" />
                    <div className="space-y-1">
                        <h5 className="text-sm font-bold text-yellow-500">Restore Point Information</h5>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            This manual backup system saves a snapshot of your database. Restoring from a file will <strong>upsert</strong> (update existing or insert new) records. It will not delete new data created after the backup was taken. This is a safe way to recover deleted boards or students.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
