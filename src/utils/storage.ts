import { EvaluationResult } from '../types';

const API_KEY_STORAGE_KEY = 'khata_judge_gemini_api_key';
const SELECTED_MODEL_KEY = 'khata_judge_selected_model';
const HISTORY_STORAGE_KEY = 'khata_judge_eval_history';

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to save API key to localStorage', e);
  }
}

export function getStoredModel(): string {
  try {
    return localStorage.getItem(SELECTED_MODEL_KEY) || 'gemini-2.5-flash';
  } catch {
    return 'gemini-2.5-flash';
  }
}

export function setStoredModel(model: string): void {
  try {
    localStorage.setItem(SELECTED_MODEL_KEY, model);
  } catch (e) {
    console.error('Failed to save model to localStorage', e);
  }
}

export function getStoredHistory(): EvaluationResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load history from localStorage', e);
    return [];
  }
}

export function saveEvaluationToHistory(result: EvaluationResult): void {
  try {
    const existing = getStoredHistory();
    // Prepend, prevent duplicate ids, limit to 50
    const filtered = existing.filter((item) => item.id !== result.id);
    const updated = [result, ...filtered].slice(0, 50);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save result to history', e);
  }
}

export function deleteEvaluationFromHistory(id: string): EvaluationResult[] {
  try {
    const existing = getStoredHistory();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete item from history', e);
    return [];
  }
}

export function clearEvaluationHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear history', e);
  }
}
