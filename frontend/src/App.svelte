<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { person1Store, person2Store, isLeftSide, timeRemaining, isWelcomePage, isSummaryPage, appSettings } from './lib/stores';
  import { AudioRecorder } from './lib/AudioRecorder';
  import { submitAudio } from './lib/api';
  import SidePanel from './lib/components/SidePanel.svelte';
  import Notification from './lib/components/Notification.svelte';
  import WelcomePage from './lib/components/WelcomePage.svelte';
  import SummaryPage from './lib/components/SummaryPage.svelte';
  import type { Person, AppSettings, TranscriptionResponse } from './lib/types';

  let audioRecorder: AudioRecorder | null = null;
  let currentSpeaker: Person;
  let person1: Person;
  let person2: Person;
  let isLeft: boolean;
  let isInitialized = false;
  let isProcessing = false;
  let error: string | null = null;
  let notificationState: 'recording' | 'sent' | 'received' = 'recording';
  let showNotification = false;
  let timerInterval: number;
  let timeLeft: number;
  let showWelcome: boolean;
  let showSummary: boolean;
  let settings: AppSettings;
  let currentAudioBlob: Blob | null = null;
  let sessionId = crypto.randomUUID();

  person1Store.subscribe(value => person1 = value);
  person2Store.subscribe(value => person2 = value);
  isLeftSide.subscribe(value => isLeft = value);
  timeRemaining.subscribe(value => timeLeft = value);
  isWelcomePage.subscribe(value => showWelcome = value);
  isSummaryPage.subscribe(value => {
    showSummary = value;
    if (value) {
      pauseRecording();
    }
  });
  appSettings.subscribe(value => settings = value);

  onMount(async () => {
    if (!showWelcome) {
      await initializeApp();
    }
  });

  async function initializeApp() {
    try {
      audioRecorder = new AudioRecorder();
      await audioRecorder.setup();
      currentSpeaker = person1;
      isInitialized = true;
      startRecording();
      startTimer();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize audio recorder';
      error = errorMessage;
      console.error('Failed to initialize audio recorder:', err);
      isInitialized = false;
    }
  }

  onDestroy(() => {
    clearInterval(timerInterval);
    if (audioRecorder?.isRecording) {
      audioRecorder.dispose();
    }
  });

  function startTimer() {
    clearInterval(timerInterval);
    timeRemaining.set(settings.timerMinutes * 60 + settings.timerSeconds);
    timerInterval = setInterval(() => {
      timeRemaining.update(t => {
        if (t <= 1) {
          switchSpeaker();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function pauseRecording() {
    clearInterval(timerInterval);
    if (audioRecorder?.isRecording) {
      audioRecorder.stop();
    }
    showNotification = false;
  }

  async function switchSpeaker() {
    if (!audioRecorder || !isInitialized || isProcessing) return;
    
    try {
      clearInterval(timerInterval);
      timeRemaining.set(0);
      showNotification = true;
      notificationState = 'sent';
      isProcessing = true;
      const audioBase64 = await audioRecorder.stop();
      currentAudioBlob = audioRecorder.getLastRecording();
      
      const data = await submitAudio(audioBase64, sessionId, currentSpeaker.name);
      notificationState = 'received';
      
      updateSpeakerHistory(currentSpeaker, data);
      
      if (currentSpeaker.id === 1) {
        person1Store.update(p => ({ 
          ...p, 
          score: p.score + data.score,
          role: 'listener',
          color: 'red'
        }));
        person2Store.update(p => ({ 
          ...p, 
          role: 'speaker',
          color: 'green'
        }));
      } else {
        person2Store.update(p => ({ 
          ...p, 
          score: p.score + data.score,
          role: 'listener',
          color: 'red'
        }));
        person1Store.update(p => ({ 
          ...p, 
          role: 'speaker',
          color: 'green'
        }));
      }
      
      isLeftSide.update(value => !value);
      currentSpeaker = currentSpeaker.id === 1 ? person2 : person1;
      isProcessing = false;
      
      setTimeout(() => {
        startRecording();
        startTimer();
        notificationState = 'recording';
      }, 1000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred while processing the audio.';
      console.error('Error during speaker switch:', err);
      isProcessing = false;
      startRecording();
      startTimer();
    }
  }

  function updateSpeakerHistory(speaker: Person, data: TranscriptionResponse) {
    const historyEntry = {
      timestamp: Date.now(),
      audioBlob: currentAudioBlob,
      keywords: data.keywords,
      claims: data.claims,
      logics: data.logics
    };

    if (speaker.id === 1) {
      person1Store.update(p => ({
        ...p,
        history: [...p.history, historyEntry]
      }));
    } else {
      person2Store.update(p => ({
        ...p,
        history: [...p.history, historyEntry]
      }));
    }
  }

  function startRecording() {
    if (audioRecorder && !audioRecorder.isRecording) {
      try {
        audioRecorder.start();
        showNotification = true;
      } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to start recording';
        console.error('Failed to start recording:', err);
      }
    }
  }

  function goToSummary() {
    isSummaryPage.set(true);
  }

  function restartApp() {
    sessionId = crypto.randomUUID();
    
    person1Store.update(p => ({
      ...p,
      score: 0,
      color: 'green',
      role: 'speaker',
      history: []
    }));
    
    person2Store.update(p => ({
      ...p,
      score: 0,
      color: 'red',
      role: 'listener',
      history: []
    }));
    
    isLeftSide.set(true);
    timeRemaining.set(0);
    isSummaryPage.set(false);
    isWelcomePage.set(true);
    
    isInitialized = false;
    isProcessing = false;
    error = null;
    showNotification = false;
    currentAudioBlob = null;
    
    if (audioRecorder?.isRecording) {
      audioRecorder.dispose();
      audioRecorder = null;
    }
    clearInterval(timerInterval);
  }

  $: notificationMessage = {
    recording: `Recording ${currentSpeaker?.name}...`,
    sent: 'Processing audio...',
    received: 'Score updated!'
  }[notificationState];

  $: if (!showWelcome && !isInitialized) {
    initializeApp();
  }
</script>

{#if showWelcome}
  <WelcomePage />
{:else if showSummary}
  <SummaryPage {sessionId} />
{:else}
  <main class="container">
    {#if error}
      <div class="error-message">
        {error}
        <button class="close-error" on:click={() => error = null}>×</button>
      </div>
    {/if}

    {#if showNotification && !error}
      <Notification message={notificationMessage} type={notificationState} />
    {/if}
    
    <button class="control-button restart-button" on:click={restartApp}>
      <span class="button-icon">↺</span>
      <span class="button-text">Restart</span>
    </button>
    
    <button class="control-button summary-button" on:click={goToSummary}>
      <span class="button-icon">📊</span>
      <span class="button-text">Summary</span>
    </button>
    
    <div class="split-screen">
      <SidePanel 
        person={person1} 
        isLeft={true} 
        currentSide={isLeft}
        timeLeft={person1.role === 'speaker' ? timeLeft : 0}
      />
      
      <button 
        class="switch-button {isProcessing ? 'processing' : ''}" 
        on:click={switchSpeaker}
        disabled={!isInitialized || !!error || isProcessing}
      >
        {#if isProcessing}
          <div class="spinner"></div>
        {:else}
          <div class="switch-content">
            <span class="switch-icon">⇄</span>
            <span class="switch-text">Switch</span>
          </div>
        {/if}
      </button>
      
      <SidePanel 
        person={person2} 
        isLeft={false} 
        currentSide={!isLeft}
        timeLeft={person2.role === 'speaker' ? timeLeft : 0}
      />
    </div>
  </main>
{/if}

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
  }

  .split-screen {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
  }

  .control-button {
    position: absolute;
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
    background: rgba(255, 255, 255, 0.9);
    color: #1a1a1a;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    z-index: 10;
    font-weight: 600;
    backdrop-filter: blur(10px);
    box-shadow: 
      0 4px 6px rgba(0, 0, 0, 0.1),
      0 2px 4px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    top: 1rem;
  }

  .button-icon {
    font-size: 1.1rem;
  }

  .button-text {
    font-size: 0.9rem;
    letter-spacing: 0.01em;
  }

  .restart-button {
    left: 1rem;
  }

  .summary-button {
    right: 1rem;
  }

  .control-button:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 1);
    box-shadow: 
      0 6px 8px rgba(0, 0, 0, 0.15),
      0 3px 6px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .control-button:active {
    transform: translateY(0);
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .switch-button {
    position: absolute;
    left: 50%;
    top: 20%;
    transform: translate(-50%, -50%);
    width: 140px;
    height: 140px;
    padding: 0;
    font-size: 1.1rem;
    background: rgba(255, 255, 255, 0.95);
    color: #1a1a1a;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    font-weight: 700;
    backdrop-filter: blur(10px);
    box-shadow: 
      0 8px 16px rgba(0, 0, 0, 0.1),
      0 4px 8px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .switch-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }

  .switch-icon {
    font-size: 2rem;
    line-height: 1;
  }

  .switch-text {
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .switch-button:hover:not(:disabled) {
    transform: translate(-50%, -50%) scale(1.05);
    background: rgba(255, 255, 255, 1);
    box-shadow: 
      0 12px 24px rgba(0, 0, 0, 0.15),
      0 6px 12px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .switch-button:active:not(:disabled) {
    transform: translate(-50%, -50%) scale(0.98);
    box-shadow: 
      0 4px 8px rgba(0, 0, 0, 0.1),
      0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .switch-button.processing {
    cursor: wait;
    background: rgba(245, 245, 245, 0.95);
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-left-color: #1a1a1a;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .switch-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: translate(-50%, -50%) scale(0.95);
    box-shadow: none;
  }

  .error-message {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 68, 68, 0.95);
    color: white;
    padding: 0.8rem 1.5rem;
    border-radius: 12px;
    z-index: 20;
    text-align: center;
    display: flex;
    align-items: center;
    gap: 1rem;
    backdrop-filter: blur(10px);
    box-shadow: 
      0 4px 6px rgba(255, 68, 68, 0.2),
      0 2px 4px rgba(255, 68, 68, 0.1);
    font-weight: 500;
  }

  .close-error {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0 0.5rem;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .close-error:hover {
    opacity: 1;
  }

  @media (max-width: 768px) {
    .split-screen {
      flex-direction: column;
    }

    .switch-button {
      width: 100px;
      height: 100px;
      font-size: 1rem;
    }

    .switch-icon {
      font-size: 1.5rem;
    }

    .switch-text {
      font-size: 0.8rem;
    }

    .control-button {
      padding: 0.5rem 1rem;
    }

    .button-icon {
      font-size: 1rem;
    }

    .button-text {
      font-size: 0.8rem;
    }
  }
</style>