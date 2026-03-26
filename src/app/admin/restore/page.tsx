'use client';

import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertCircle, CheckCircle, Archive, Calendar, User, Users, FileText, ClipboardCheck } from 'lucide-react';

interface SoftDeletedRecord {
  id: string;
  deletedAt: string;
  [key: string]: any;
}

interface RestoreData {
  entityType: string;
  count: number;
  retentionDays: number;
  records: SoftDeletedRecord[];
}

const ENTITY_TYPES = [
  { value: 'user', label: 'Users', icon: User },
  { value: 'group', label: 'Groups', icon: Users },
  { value: 'student', label: 'Students', icon: User },
  { value: 'assessment', label: 'Assessments', icon: ClipboardCheck },
  { value: 'attendance', label: 'Attendance', icon: Calendar },
];

export default function RestoreArchivedPage() {
  const [selectedEntity, setSelectedEntity] = useState('user');
  const [data, setData] = useState<RestoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchArchivedRecords();
  }, [selectedEntity]);

  const fetchArchivedRecords = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/restore?entityType=${selectedEntity}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to fetch archived records' });
      }
    } catch (error) {
      console.error('Error fetching archived records:', error);
      setMessage({ type: 'error', text: 'Failed to fetch archived records' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm('Restore this record?')) return;

    setRestoring(id);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entityType: selectedEntity, id }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: result.message || 'Record restored successfully' });
        fetchArchivedRecords(); // Refresh list
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to restore record' });
      }
    } catch (error) {
      console.error('Error restoring record:', error);
      setMessage({ type: 'error', text: 'Failed to restore record' });
    } finally {
      setRestoring(null);
    }
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const expiryDate = new Date(deleted);
    expiryDate.setDate(expiryDate.getDate() + 30);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const renderRecordDetails = (record: SoftDeletedRecord) => {
    switch (selectedEntity) {
      case 'user':
        return (
          <div>
            <div className="font-medium text-slate-900">{record.name}</div>
            <div className="text-sm text-slate-600">{record.email}</div>
            <div className="text-xs text-slate-500">Role: {record.role}</div>
          </div>
        );
      case 'group':
        return (
          <div>
            <div className="font-medium text-slate-900">{record.name}</div>
            <div className="text-sm text-slate-600">{record.location}</div>
            <div className="text-xs text-slate-500">Status: {record.status}</div>
          </div>
        );
      case 'student':
        return (
          <div>
            <div className="font-medium text-slate-900">{record.firstName} {record.lastName}</div>
            <div className="text-sm text-slate-600">ID: {record.studentId}</div>
            <div className="text-xs text-slate-500">Status: {record.status}</div>
          </div>
        );
      case 'assessment':
        return (
          <div>
            <div className="font-medium text-slate-900">{record.type} - {record.method}</div>
            <div className="text-sm text-slate-600">Result: {record.result || 'N/A'}</div>
            <div className="text-xs text-slate-500">Score: {record.score || 'N/A'}</div>
          </div>
        );
      case 'attendance':
        return (
          <div>
            <div className="font-medium text-slate-900">
              {new Date(record.date).toLocaleDateString()}
            </div>
            <div className="text-sm text-slate-600">Status: {record.status}</div>
          </div>
        );
      default:
        return (
          <div className="text-sm text-slate-600">ID: {record.id}</div>
        );
    }
  };

  const entityConfig = ENTITY_TYPES.find(e => e.value === selectedEntity);
  const Icon = entityConfig?.icon || Archive;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Archive className="w-6 h-6 text-indigo-600" />
          Restore Archived Data
        </h1>
        <p className="text-slate-600 mt-1">
          Recover accidentally deleted records within the 30-day retention window
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Entity Type Selector */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="grid grid-cols-5 divide-x divide-slate-200">
          {ENTITY_TYPES.map((entity) => {
            const EntityIcon = entity.icon;
            return (
              <button
                key={entity.value}
                onClick={() => setSelectedEntity(entity.value)}
                className={`p-4 flex flex-col items-center gap-2 transition-colors ${
                  selectedEntity === entity.value
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <EntityIcon className="w-6 h-6" />
                <span className="text-sm font-medium">{entity.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Archived {entityConfig?.label}
            </h2>
            {data && (
              <span className="text-sm text-slate-500">
                ({data.count} record{data.count !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          <button
            onClick={fetchArchivedRecords}
            disabled={loading}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Loading...</div>
          ) : !data || data.count === 0 ? (
            <div className="p-8 text-center text-slate-600">
              <Archive className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <p>No archived {entityConfig?.label.toLowerCase()} found</p>
            </div>
          ) : (
            data.records.map((record) => {
              const daysLeft = getDaysRemaining(record.deletedAt);
              return (
                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex-1">
                    {renderRecordDetails(record)}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-xs text-slate-500">
                        Deleted: {new Date(record.deletedAt).toLocaleString()}
                      </div>
                      <div className={`text-xs font-medium ${
                        daysLeft <= 7 ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(record.id)}
                    disabled={restoring === record.id}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {restoring === record.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Restore
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">About Data Retention</p>
            <p>Archived records are kept for 30 days before being permanently deleted. After the retention period expires, the data cannot be recovered.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
