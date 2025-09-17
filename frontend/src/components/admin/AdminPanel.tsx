import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import type { JsonFileInfo } from '../../api/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicForm } from './DynamicForm';
import { Badge } from '@/components/ui/badge';

interface AdminPanelProps {
  onLogout: () => void;
}

type ViewMode = 'overview' | 'edit-file' | 'create-entry' | 'edit-entry';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [files, setFiles] = useState<JsonFileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<JsonFileInfo | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<{ key: string; value: any } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const filesData = await adminApi.getAllFiles();
      setFiles(filesData);
    } catch (error) {
      setMessage(`Error loading files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFile = async (filename: string) => {
    try {
      const fileData = await adminApi.getFile(filename);
      setFiles(prev => prev.map(f => f.name === filename ? fileData : f));
      if (selectedFile && selectedFile.name === filename) {
        setSelectedFile(fileData);
      }
    } catch (error) {
      setMessage(`Error refreshing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const showMessage = (msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  const handleCreateEntry = async (data: any) => {
    if (!selectedFile) return;

    const key = prompt('Enter unique key for this entry:');
    if (!key || key.trim() === '') return;

    setIsLoading(true);
    try {
      await adminApi.createEntry(selectedFile.name, key.trim(), data);
      await refreshFile(selectedFile.name);
      setViewMode('edit-file');
      showMessage(`Entry '${key}' created successfully`);
    } catch (error) {
      showMessage(`Error creating entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEntry = async (data: any) => {
    if (!selectedFile || !selectedEntry) return;

    setIsLoading(true);
    try {
      await adminApi.updateEntry(selectedFile.name, selectedEntry.key, data);
      await refreshFile(selectedFile.name);
      setViewMode('edit-file');
      showMessage(`Entry '${selectedEntry.key}' updated successfully`);
    } catch (error) {
      showMessage(`Error updating entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (key: string) => {
    if (!selectedFile) return;

    if (!confirm(`Are you sure you want to delete entry '${key}'?`)) return;

    setIsLoading(true);
    try {
      await adminApi.deleteEntry(selectedFile.name, key);
      await refreshFile(selectedFile.name);
      showMessage(`Entry '${key}' deleted successfully`);
    } catch (error) {
      showMessage(`Error deleting entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getEntryType = (value: any): string => {
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getEntryPreview = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return `[${value.length} items]`;
      }
      const keys = Object.keys(value);
      return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
    }
    const str = String(value);
    return str.length > 50 ? str.substring(0, 50) + '...' : str;
  };

  const filteredEntries = selectedFile ? 
    Object.entries(selectedFile.data).filter(([key, value]) => {
      const searchLower = searchTerm.toLowerCase();
      const keyMatch = key.toLowerCase().includes(searchLower);
      const valueMatch = JSON.stringify(value).toLowerCase().includes(searchLower);
      return keyMatch || valueMatch;
    }) : [];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">JSON Data Editor</h1>
        <div className="flex gap-2">
          <Button onClick={loadFiles} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <Card key={file.name} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{file.name}.json</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Entries:</span>
                  <Badge variant="secondary">
                    {Object.keys(file.data).length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {Object.keys(file.data).slice(0, 3).map(key => (
                    <div key={key} className="text-xs text-gray-500 truncate">
                      • {key}
                    </div>
                  ))}
                  {Object.keys(file.data).length > 3 && (
                    <div className="text-xs text-gray-400">
                      +{Object.keys(file.data).length - 3} more...
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => {
                    setSelectedFile(file);
                    setViewMode('edit-file');
                  }}
                >
                  Edit File
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderFileEditor = () => {
    if (!selectedFile) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setViewMode('overview')}
              className="mb-2"
            >
              ← Back to Overview
            </Button>
            <h1 className="text-2xl font-bold">{selectedFile.name}.json</h1>
          </div>
          <Button 
            onClick={() => setViewMode('create-entry')}
            disabled={isLoading}
          >
            Add New Entry
          </Button>
        </div>

        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-2 border rounded-md"
          />
          <Badge variant="outline">
            {filteredEntries.length} of {Object.keys(selectedFile.data).length} entries
          </Badge>
        </div>

        <div className="grid gap-4">
          {filteredEntries.map(([key, value]) => (
            <Card key={key} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{key}</h3>
                    <Badge variant="outline">
                      {getEntryType(value)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-mono">
                    {getEntryPreview(value)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedEntry({ key, value });
                      setViewMode('edit-entry');
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteEntry(key)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderCreateEntry = () => {
    if (!selectedFile) return null;

    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setViewMode('edit-file')}
          className="mb-4"
        >
          ← Back to {selectedFile.name}.json
        </Button>
        
        <DynamicForm
          schema={selectedFile.schema}
          onSubmit={handleCreateEntry}
          onCancel={() => setViewMode('edit-file')}
          title={`Create New Entry in ${selectedFile.name}.json`}
        />
      </div>
    );
  };

  const renderEditEntry = () => {
    if (!selectedFile || !selectedEntry) return null;

    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setViewMode('edit-file')}
          className="mb-4"
        >
          ← Back to {selectedFile.name}.json
        </Button>
        
        <DynamicForm
          data={selectedEntry.value}
          schema={selectedFile.schema}
          onSubmit={handleUpdateEntry}
          onCancel={() => setViewMode('edit-file')}
          isEdit={true}
          title={`Edit Entry: ${selectedEntry.key}`}
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {message && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-md">
          {message}
        </div>
      )}

      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'edit-file' && renderFileEditor()}
      {viewMode === 'create-entry' && renderCreateEntry()}
      {viewMode === 'edit-entry' && renderEditEntry()}
    </div>
  );
};