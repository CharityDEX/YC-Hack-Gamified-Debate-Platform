<script lang="ts">
  import type { Person } from '../types';
  import TranscriptionHistory from './TranscriptionHistory.svelte';
  
  export let person: Person;
  export let isLeft: boolean;
  export let currentSide: boolean;
  export let timeLeft: number;

  $: backgroundColor = person.color === 'green' ? 'rgb(0,153,0)' : 'rgb(251,53,53)';
</script>

<div class="side" style="background-color: {backgroundColor}">
  <div class="content">
    <div class="header">
      <div class="info">
        <div class="role">{person.role}</div>
        <h2>{person.name}</h2>
        <p class="score">Score: {person.score}</p>
        <div class="timer-container">
          {#if person.role === 'speaker'}
            <div class="timer" class:hidden={timeLeft === 0}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          {/if}
        </div>
      </div>
    </div>
    
    <TranscriptionHistory history={person.history} />
  </div>
</div>

<style>
  .side {
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    transition: background-color 0.3s ease;
    padding-top: 2rem;
    height: 100vh;
    overflow-y: auto;
  }

  .content {
    width: 100%;
    color: white;
  }

  .header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 2rem;
  }

  .info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
  }

  .role {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    opacity: 0.9;
  }

  h2 {
    font-size: 1.8rem;
    margin: 0;
  }

  .score {
    font-size: 1.3rem;
    font-weight: bold;
    margin: 0;
  }

  .timer-container {
    height: 4rem; /* Fixed height to reserve space */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timer {
    font-size: 2.2rem;
    font-weight: bold;
    font-family: monospace;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    opacity: 1;
    transition: opacity 0.3s ease;
  }

  .hidden {
    opacity: 0;
  }

  @media (max-width: 768px) {
    .side {
      padding-top: 1rem;
      height: 50vh;
    }

    .header {
      padding: 0 1rem;
    }

    h2 {
      font-size: 1.5rem;
    }

    .score {
      font-size: 1.1rem;
    }

    .timer-container {
      height: 3.5rem;
    }

    .timer {
      font-size: 1.8rem;
    }
  }
</style>