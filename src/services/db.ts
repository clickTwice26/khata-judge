import { EvaluationParameter, EvaluationPreset, EvaluationResult, StrictnessLevel } from '../types';

const DB_NAME = 'KhataJudgeDB';
const DB_VERSION = 1;

export interface DraftState {
  id: string; // 'current_workbench_draft'
  updatedAt: number;
  question: string;
  totalMarks: number;
  modelAnswer: string;
  studentAnswer: string;
  parameters: EvaluationParameter[];
  strictness: StrictnessLevel;
  additionalInstructions: string;
  selectedModel: string;
  activeResultId?: string | null;
}

export interface StoredEvaluation extends EvaluationResult {
  starred?: boolean;
  notes?: string;
}

export interface StoredPreset extends EvaluationPreset {
  isCustom?: boolean;
  createdAt: number;
}

class KhataDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isAvailable: boolean = typeof window !== 'undefined' && 'indexedDB' in window;

  private async openDB(): Promise<IDBDatabase> {
    if (!this.isAvailable) {
      throw new Error('IndexedDB is not supported in this environment.');
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: Evaluations
        if (!db.objectStoreNames.contains('evaluations')) {
          const evalStore = db.createObjectStore('evaluations', { keyPath: 'id' });
          evalStore.createIndex('timestamp', 'timestamp', { unique: false });
          evalStore.createIndex('letterGrade', 'letterGrade', { unique: false });
          evalStore.createIndex('starred', 'starred', { unique: false });
        }

        // Store 2: Drafts
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' });
        }

        // Store 3: Custom Presets
        if (!db.objectStoreNames.contains('customPresets')) {
          const presetStore = db.createObjectStore('customPresets', { keyPath: 'id' });
          presetStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store 4: Settings / Meta
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- Draft State Operations ---
  async saveDraft(draft: DraftState): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('drafts', 'readwrite');
        const store = tx.objectStore('drafts');
        const req = store.put(draft);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      // Fallback to localStorage
      try {
        localStorage.setItem(`khata_draft_${draft.id}`, JSON.stringify(draft));
      } catch (lsErr) {
        console.warn('Draft save fallback failed', lsErr);
      }
    }
  }

  async loadDraft(id: string = 'current_workbench_draft'): Promise<DraftState | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('drafts', 'readonly');
        const store = tx.objectStore('drafts');
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      try {
        const raw = localStorage.getItem(`khata_draft_${id}`);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
  }

  async clearDraft(id: string = 'current_workbench_draft'): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('drafts', 'readwrite');
        const store = tx.objectStore('drafts');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      localStorage.removeItem(`khata_draft_${id}`);
    }
  }

  // --- Evaluation CRUD Operations ---
  async saveEvaluation(item: StoredEvaluation): Promise<void> {
    const record: StoredEvaluation = {
      ...item,
      starred: item.starred ?? false,
    };

    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('evaluations', 'readwrite');
        const store = tx.objectStore('evaluations');
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback
      const key = `khata_eval_${item.id}`;
      localStorage.setItem(key, JSON.stringify(record));
    }
  }

  async getAllEvaluations(): Promise<StoredEvaluation[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('evaluations', 'readonly');
        const store = tx.objectStore('evaluations');
        const index = store.index('timestamp');
        const req = index.openCursor(null, 'prev'); // sort descending
        const results: StoredEvaluation[] = [];

        req.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback: iterate localStorage keys
      const list: StoredEvaluation[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith('khata_eval_')) {
            const raw = localStorage.getItem(k);
            if (raw) list.push(JSON.parse(raw));
          }
        }
        list.sort((a, b) => b.timestamp - a.timestamp);
      } catch {
        // ignore
      }
      return list;
    }
  }

  async getEvaluationById(id: string): Promise<StoredEvaluation | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('evaluations', 'readonly');
        const store = tx.objectStore('evaluations');
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const raw = localStorage.getItem(`khata_eval_${id}`);
      return raw ? JSON.parse(raw) : null;
    }
  }

  async deleteEvaluation(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('evaluations', 'readwrite');
        const store = tx.objectStore('evaluations');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      localStorage.removeItem(`khata_eval_${id}`);
    }
  }

  async toggleStarEvaluation(id: string): Promise<boolean> {
    const item = await this.getEvaluationById(id);
    if (!item) return false;
    const newStarred = !item.starred;
    await this.saveEvaluation({ ...item, starred: newStarred });
    return newStarred;
  }

  async clearAllEvaluations(): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('evaluations', 'readwrite');
        const store = tx.objectStore('evaluations');
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('khata_eval_')) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  }

  // --- Custom Presets Operations ---
  async saveCustomPreset(preset: StoredPreset): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('customPresets', 'readwrite');
        const store = tx.objectStore('customPresets');
        const req = store.put(preset);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      localStorage.setItem(`khata_preset_${preset.id}`, JSON.stringify(preset));
    }
  }

  async getCustomPresets(): Promise<StoredPreset[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('customPresets', 'readonly');
        const store = tx.objectStore('customPresets');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const presets: StoredPreset[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith('khata_preset_')) {
            const raw = localStorage.getItem(k);
            if (raw) presets.push(JSON.parse(raw));
          }
        }
      } catch {
        // ignore
      }
      return presets;
    }
  }

  async deleteCustomPreset(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('customPresets', 'readwrite');
        const store = tx.objectStore('customPresets');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      localStorage.removeItem(`khata_preset_${id}`);
    }
  }

  // --- Backup & Restore (Full Database Dump) ---
  async exportFullDatabase(): Promise<{
    version: number;
    exportedAt: number;
    evaluations: StoredEvaluation[];
    customPresets: StoredPreset[];
    activeDraft: DraftState | null;
  }> {
    const evaluations = await this.getAllEvaluations();
    const customPresets = await this.getCustomPresets();
    const activeDraft = await this.loadDraft();

    return {
      version: DB_VERSION,
      exportedAt: Date.now(),
      evaluations,
      customPresets,
      activeDraft,
    };
  }

  async importFullDatabase(data: any): Promise<{ importedEvals: number; importedPresets: number }> {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid database backup JSON format.');
    }

    let importedEvals = 0;
    let importedPresets = 0;

    if (Array.isArray(data.evaluations)) {
      for (const ev of data.evaluations) {
        if (ev && ev.id && ev.question) {
          await this.saveEvaluation(ev);
          importedEvals++;
        }
      }
    }

    if (Array.isArray(data.customPresets)) {
      for (const pr of data.customPresets) {
        if (pr && pr.id && pr.name) {
          await this.saveCustomPreset(pr);
          importedPresets++;
        }
      }
    }

    if (data.activeDraft) {
      await this.saveDraft(data.activeDraft);
    }

    return { importedEvals, importedPresets };
  }
}

export const khataDB = new KhataDatabase();
