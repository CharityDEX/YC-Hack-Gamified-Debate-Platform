<script lang="ts">
  import type { TranscriptionEntry } from '../types';
  
  export let history: TranscriptionEntry[];
  
  let expandedEntry: number | null = null;

  function toggleExpand(index: number) {
    expandedEntry = expandedEntry === index ? null : index;
  }

  function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  function formatKeywords(keywords: string[]): string {
    return keywords.join(', ').length > 20 
      ? keywords.join(', ').slice(0, 20) + '...'
      : keywords.join(', ');
  }

  function getValidationSymbol(isValid: number): string {
    switch (isValid) {
      case 0: return '✗';
      case 1: return '✓';
      case 2: return '?';
      default: return '?';
    }
  }

  function getValidationClass(isValid: number): string {
    switch (isValid) {
      case 0: return 'error';
      case 1: return 'success';
      case 2: return 'uncertain';
      default: return 'uncertain';
    }
  }

  async function playAudio(audioBlob?: Blob) {
    if (!audioBlob) return;
    
    const audio = new Audio(URL.createObjectURL(audioBlob));
    try {
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  $: sortedHistory = [...history].reverse();
</script>

<div class="history-container">
  {#each sortedHistory as entry, index}
    <div class="entry">
      <div class="entry-header" on:click={() => toggleExpand(index)}>
        <span class="timestamp">{formatTimestamp(entry.timestamp)}</span>
        {#if entry.audioBlob}
          <button class="play-button" on:click|stopPropagation={() => playAudio(entry.audioBlob)}>
            ▶
          </button>
        {/if}
        <span class="keywords">{formatKeywords(entry.keywords)}</span>
        <span class="expand-icon">{expandedEntry === index ? '▼' : '▶'}</span>
      </div>
      
      {#if expandedEntry === index}
        <div class="entry-content">
          <div class="claims-section">
            <h4>Claims</h4>
            {#each entry.claims as [isValid, claim]}
              <div class="claim">
                <span class="indicator {getValidationClass(isValid)}">{getValidationSymbol(isValid)}</span>
                <span class="claim-text">{claim}</span>
              </div>
            {/each}
          </div>
          
          <div class="logic-section">
            <h4>Logic Conflicts</h4>
            {#if entry.logics.length === 0}
              <div class="logic-status">
                <span class="indicator success">✓</span>
                <span>No logical conflicts found</span>
              </div>
            {:else}
              {#each entry.logics as [statement1, statement2]}
                <div class="logic-conflict">
                  <span class="indicator error">✗</span>
                  <div class="conflict-text">
                    <div>{statement1}</div>
                    <div class="vs">vs</div>
                    <div>{statement2}</div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .history-container {
    margin-top: 2rem;
    max-height: calc(100vh - 250px);
    overflow-y: auto;
    padding: 0 1rem;
  }

  .entry {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }

  .entry-header {
    padding: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .timestamp {
    font-family: monospace;
    font-size: 0.9rem;
  }

  .play-button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    border-radius: 50%;
    transition: background-color 0.2s;
  }

  .play-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .keywords {
    flex: 1;
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .expand-icon {
    font-size: 0.8rem;
  }

  .entry-content {
    padding: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .claims-section, .logic-section {
    margin-bottom: 1rem;
  }

  .claim, .logic-conflict {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .indicator {
    flex-shrink: 0;
    width: 1.2rem;
    text-align: center;
  }

  .indicator.success {
    color: #4CAF50;
  }

  .indicator.error {
    color: #f44336;
  }

  .indicator.uncertain {
    color: #FFC107;
  }

  .conflict-text {
    flex: 1;
  }

  .vs {
    margin: 0.25rem 0;
    font-style: italic;
    opacity: 0.7;
  }

  .logic-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }
</style>