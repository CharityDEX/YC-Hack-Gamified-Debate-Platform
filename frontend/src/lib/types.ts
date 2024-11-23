export interface Person {
  id: 1 | 2;
  name: string;
  score: number;
  color: string;
  role: 'speaker' | 'listener';
  history: TranscriptionEntry[];
}

export interface TranscriptionEntry {
  timestamp: number;
  audioBlob?: Blob;
  keywords: string[];
  claims: [number, string][];
  logics: [string, string][];
}

export interface TranscriptionResponse {
  score: number;
  keywords: string[];
  claims: [number, string][];
  logics: [string, string][];
}

export interface SummaryResponse {
  understand1: string;
  understand2: string;
  penetrate1: string;
  penetrate2: string;
}

export interface AppSettings {
  person1Name: string;
  person2Name: string;
  timerMinutes: number;
  timerSeconds: number;
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}