import { writable } from 'svelte/store';
import type { Person, AppSettings, SummaryResponse } from './types';

export const appSettings = writable<AppSettings>({
  person1Name: 'Sean',
  person2Name: 'Alex',
  timerMinutes: 0,
  timerSeconds: 10
});

export const person1Store = writable<Person>({
  id: 1,
  name: 'Sean',
  score: 0,
  color: 'green',
  role: 'speaker',
  history: []
});

export const person2Store = writable<Person>({
  id: 2,
  name: 'Alex',
  score: 0,
  color: 'red',
  role: 'listener',
  history: []
});

export const isLeftSide = writable(true);
export const timeRemaining = writable(10);
export const isWelcomePage = writable(true);
export const isSummaryPage = writable(false);
export const summaryData = writable<SummaryResponse | null>(null);