'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, Trash2, RotateCcw, Calendar, HardDrive } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { useFiles } from '@/contexts/FileContext';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BackupRestoreModal({ isOpen, onClose }: BackupRestoreModalProps) {
  const { createBackup, getBackups, restoreBackup, exportData, importData, clearAllData } = useFiles();
  const [backups, setBackups] = useState<Array<{ id: string; timestamp: number; version: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBackups();
    }
  }, [isOpen]);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const backupList = await getBackups();
      setBackups(backupList);
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      await createBackup();
      await loadBackups();
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    setIsLoading(true);
    try {
      await restoreBackup(selectedBackup);
      onClose();
    } catch (error) {
      console.error('Failed to restore backup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `markdown-editor-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      onClose();
    } catch (error) {
      console.error('Failed to import data:', error);
    }
    
    // Reset input
    event.target.value = '';
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await clearAllData();
        onClose();
      } catch (error) {
        console.error('Failed to clear data:', error);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Backup & Restore" className="max-w-4xl">
      <div className="space-y-6">
        {/* Create Backup Section */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <HardDrive className="mr-2 h-5 w-5" />
              Create Backup
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create a backup of all your files and settings.
            </p>
            <Button onClick={handleCreateBackup} disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Create Backup
            </Button>
          </CardContent>
        </Card>

        {/* Restore Backup Section */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <RotateCcw className="mr-2 h-5 w-5" />
              Restore Backup
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Restore from a previously created backup.
            </p>
            
            {isLoading ? (
              <div className="text-center py-4">Loading backups...</div>
            ) : backups.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No backups available
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedBackup === backup.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent'
                    }`}
                    onClick={() => setSelectedBackup(backup.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Backup {backup.id.split('_')[1]}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(backup.timestamp)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        v{backup.version}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {backups.length > 0 && (
              <div className="mt-4 flex space-x-2">
                <Button
                  onClick={handleRestoreBackup}
                  disabled={!selectedBackup || isLoading}
                  variant="outline"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore Selected
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import/Export Section */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Import/Export Data
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export all data to a file or import from a previously exported file.
            </p>
            
            <div className="flex space-x-4">
              <Button onClick={handleExportData} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export All Data
              </Button>
              
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                  id="import-data"
                />
                <Button asChild variant="outline">
                  <label htmlFor="import-data" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                  </label>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <h3 className="text-lg font-semibold text-destructive flex items-center">
              <Trash2 className="mr-2 h-5 w-5" />
              Danger Zone
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete all files and settings. This action cannot be undone.
            </p>
            <Button onClick={handleClearAllData} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </Modal>
  );
}
