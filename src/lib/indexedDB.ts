export interface FileRecord {
  id: string;
  name: string;
  content: string;
  lastModified: number;
  createdAt: number;
  isDirty: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  viewMode: 'editor' | 'preview' | 'split';
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  autoSaveInterval: number;
  recentFiles: string[];
  sidebarCollapsed: boolean;
}

class IndexedDBService {
  private dbName = 'MarkdownEditorDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create files store
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' });
          filesStore.createIndex('name', 'name', { unique: false });
          filesStore.createIndex('lastModified', 'lastModified', { unique: false });
          filesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }

        // Create backups store
        if (!db.objectStoreNames.contains('backups')) {
          const backupsStore = db.createObjectStore('backups', { keyPath: 'id' });
          backupsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  // File operations
  async saveFile(file: FileRecord): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(file);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(id: string): Promise<FileRecord | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    return new Promise<FileRecord | null>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFiles(): Promise<FileRecord[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    return new Promise<FileRecord[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(id: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllFiles(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Preferences operations
  async savePreferences(preferences: UserPreferences): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['preferences'], 'readwrite');
    const store = transaction.objectStore('preferences');
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key: 'userPreferences', ...preferences });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPreferences(): Promise<UserPreferences | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['preferences'], 'readonly');
    const store = transaction.objectStore('preferences');
    return new Promise<UserPreferences | null>((resolve, reject) => {
      const request = store.get('userPreferences');
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          delete result.key; // Remove the key field
          resolve(result as UserPreferences);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Backup operations
  async createBackup(files: FileRecord[]): Promise<string> {
    const backupId = `backup_${Date.now()}`;
    const backup = {
      id: backupId,
      timestamp: Date.now(),
      files: files,
      version: '1.0'
    };

    const db = await this.ensureDB();
    const transaction = db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(backup);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return backupId;
  }

  async getBackups(): Promise<Array<{ id: string; timestamp: number; version: string }>> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['backups'], 'readonly');
    const store = transaction.objectStore('backups');
    return new Promise<Array<{ id: string; timestamp: number; version: string }>>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const backups = request.result.map(backup => ({
          id: backup.id,
          timestamp: backup.timestamp,
          version: backup.version
        }));
        resolve(backups.sort((a, b) => b.timestamp - a.timestamp));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async restoreBackup(backupId: string): Promise<FileRecord[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['backups'], 'readonly');
    const store = transaction.objectStore('backups');
    return new Promise<FileRecord[]>((resolve, reject) => {
      const request = store.get(backupId);
      request.onsuccess = () => {
        const backup = request.result;
        if (backup && backup.files) {
          resolve(backup.files);
        } else {
          reject(new Error('Backup not found or invalid'));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBackup(backupId: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(backupId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Export/Import operations
  async exportData(): Promise<{ files: FileRecord[]; preferences: UserPreferences | null }> {
    const files = await this.getAllFiles();
    const preferences = await this.getPreferences();
    return { files, preferences };
  }

  async importData(data: { files: FileRecord[]; preferences: UserPreferences | null }): Promise<void> {
    // Clear existing data
    await this.clearAllFiles();
    
    // Import files
    for (const file of data.files) {
      await this.saveFile(file);
    }
    
    // Import preferences
    if (data.preferences) {
      await this.savePreferences(data.preferences);
    }
  }

  // Utility methods
  async getStorageSize(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0
      };
    }
    return { used: 0, available: 0 };
  }

  async clearAllData(): Promise<void> {
    await this.clearAllFiles();
    const db = await this.ensureDB();
    const transaction = db.transaction(['preferences', 'backups'], 'readwrite');
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('preferences').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('backups').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);
  }
}

export const indexedDBService = new IndexedDBService();
