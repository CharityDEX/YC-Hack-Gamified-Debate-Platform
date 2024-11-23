import type { TranscriptionResponse, SummaryResponse } from './types';
import { APIError } from './types';

const API_URL1 = 'https://hjsopmhbpscbbvlqwlhn.supabase.co/functions/v1/argument-update-firecrawl';
const API_KEY1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqc29wbWhicHNjYmJ2bHF3bGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwNzgyMjQsImV4cCI6MjA0NzY1NDIyNH0.RKlZUWxs9aYA08Eu7KzJqQYTEmtkWd20qhxQRitqEl8';
const API_URL2 = 'https://hjsopmhbpscbbvlqwlhn.supabase.co/functions/v1/argument-finish';
const API_KEY2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqc29wbWhicHNjYmJ2bHF3bGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwNzgyMjQsImV4cCI6MjA0NzY1NDIyNH0.RKlZUWxs9aYA08Eu7KzJqQYTEmtkWd20qhxQRitqEl8';

const MOCK_RESPONSE: TranscriptionResponse = {
  score: Math.floor(Math.random() * 5) + 1,
  keywords: ['clarity', 'structure', 'evidence'],
  claims: [[0, '1+1=3'], [1, '1+1=2'], [0, '1+2=4']],
  logics: [['i am hot', 'i am cold'], ['juan is him', 'juan is her']]
};

const MOCK_SUMMARY: SummaryResponse = {
  understand1: "Person 1 demonstrated clear understanding of the core issues but struggled with emotional regulation.",
  understand2: "Person 2 showed strong logical reasoning but occasionally deviated from the main topic.",
  penetrate1: "capitalize on person 2's deviation from topic",
  penetrate2: "stir person1's emotions",
};

export async function submitAudio(audioBase64: string, sessionId: string, speakerName: string): Promise<TranscriptionResponse> {
  try {
    const response = await fetch(API_URL1, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY1}`,
        'Origin': window.location.origin,
      },
      mode: 'cors',
      body: JSON.stringify({
        audio: audioBase64,
        user_id: sessionId,
        message_role: speakerName
      }),
    });

    if (!response.ok) {
      console.warn('API request failed, using mock data');
      return MOCK_RESPONSE;
    }

    const data: TranscriptionResponse = await response.json();
    console.log(data);
    
    if (!data || typeof data.score !== 'number' || 
        !Array.isArray(data.keywords) || 
        !Array.isArray(data.claims) || 
        !Array.isArray(data.logics)) {
      console.warn('Invalid API response format, using mock data');
      return MOCK_RESPONSE;
    }

    return data;
    
  } catch (error) {
    console.warn('API error, using mock data:', error);
    return MOCK_RESPONSE;
  }
}

export async function getSummary(sessionId: string, person1Name: string, person2Name: string): Promise<SummaryResponse> {
  try {
    const response = await fetch(API_URL2, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY2}`,
        'Origin': window.location.origin,
      },
      mode: 'cors',
      body: JSON.stringify({
        user_id: sessionId,
        role1: person1Name,
        role2: person2Name
      }),
    });

    if (!response.ok) {
      console.warn('Summary API request failed, using mock data');
      return MOCK_SUMMARY;
    }

    const data: SummaryResponse = await response.json();
    console.log(data);
    
    if (!data || typeof data.understand1 !== 'string' || 
        typeof data.understand2 !== 'string' ||
        typeof data.penetrate1 !== 'string' ||
        typeof data.penetrate2 !== 'string') {
      console.warn('Invalid summary response format, using mock data');
      return MOCK_SUMMARY;
    }

    return data;
  } catch (error) {
    console.warn('Summary API error, using mock data:', error);
    return MOCK_SUMMARY;
  }
}