
import { useState, useEffect } from 'react';
import { Upload, X, Loader2, FileText, CheckCircle } from 'lucide-react';

interface GroupUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Group {
    id: string;
    name: string;
}

export default function GroupUploadModal({ isOpen, onClose, onSuccess }: GroupUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedGroupName, setSelectedGroupName] = useState('');
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch existing groups when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const fetchGroups = async () => {
            setIsLoadingGroups(true);
            try {
                const response = await fetch('/api/groups');
                if (response.ok) {
                    const data = await response.json();
                    // Filter to active groups only
                    const activeGroups = (data.groups || []).filter((g: any) => g.status !== 'ARCHIVED');
                    setGroups(activeGroups);
                } else {
                    console.error('Failed to fetch groups');
                }
            } catch (error) {
                console.error('Error fetching groups:', error);
            } finally {
                setIsLoadingGroups(false);
            }
        };

        fetchGroups();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedGroupId) return;

        setIsUploading(true);
        setUploadStatus('idle');
        setErrorMessage('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('groupId', selectedGroupId);
        formData.append('groupName', selectedGroupName);

        try {
            const response = await fetch('/api/groups/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }

            setUploadStatus('success');
            setTimeout(() => {
                onSuccess();
                onClose();
                // Reset state
                setFile(null);
                setSelectedGroupId('');
                setSelectedGroupName('');
                setUploadStatus('idle');
            }, 1500);

        } catch (error: any) {
            console.error('Upload error:', error);
            setUploadStatus('error');
            setErrorMessage(error.message || 'Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-xl border border-slate-200 dark:border-slate-800">

                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Upload Group Rollout Plan
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {uploadStatus === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h4 className="text-lg font-medium text-slate-900 dark:text-white">Success!</h4>
                            <p className="text-slate-500 text-sm mt-1">Group and rollout plan created.</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Upload Rollout Plan (DOCX/PDF)
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors relative">
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-12 w-12 text-slate-400" />
                                        <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                            <label className="relative cursor-pointer bg-white dark:bg-slate-900 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                                <span>Upload a file</span>
                                                <input
                                                    type="file"
                                                    className="sr-only"
                                                    accept=".docx,.pdf"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-slate-500">DOCX or PDF up to 10MB</p>
                                    </div>
                                    {file && (
                                        <div className="absolute inset-0 bg-white dark:bg-slate-900 flex items-center justify-center border-2 border-indigo-500 rounded-lg">
                                            <div className="flex items-center gap-2 text-indigo-600">
                                                <FileText className="w-5 h-5" />
                                                <span className="font-medium text-sm truncate max-w-[200px]">{file.name}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Select Group
                                </label>
                                {isLoadingGroups ? (
                                    <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-500 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading groups...
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={selectedGroupId}
                                        onChange={(e) => {
                                            setSelectedGroupId(e.target.value);
                                            const selected = groups.find(g => g.id === e.target.value);
                                            setSelectedGroupName(selected?.name || '');
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    >
                                        <option value="">-- Select a group --</option>
                                        {groups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {groups.length === 0 && !isLoadingGroups && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        No active groups found. Create a group first.
                                    </p>
                                )}
                            </div>

                            {uploadStatus === 'error' && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                    <Loader2 className="w-4 h-4" />
                                    {errorMessage}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isUploading || !file || !selectedGroupId}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload Plan
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                </form>
            </div>
        </div>
    );
}
