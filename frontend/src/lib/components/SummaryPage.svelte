<script lang="ts">
  import { onMount } from 'svelte';
  import { person1Store, person2Store, summaryData, isSummaryPage } from '../stores';
  import { getSummary } from '../api';
  import type { Person, SummaryResponse } from '../types';
  
  export let sessionId: string;
  
  let person1: Person;
  let person2: Person;
  let summary: SummaryResponse | null = null;
  
  person1Store.subscribe(value => person1 = value);
  person2Store.subscribe(value => person2 = value);
  summaryData.subscribe(value => summary = value);
  
  let expandedSection: {
    understand1: boolean;
    understand2: boolean;
    penetrate1: boolean;
    penetrate2: boolean;
  } = {
    understand1: false,
    understand2: false,
    penetrate1: false,
    penetrate2: false
  };
  
  onMount(async () => {
    try {
      const data = await getSummary(sessionId, person1.name, person2.name);
      summaryData.set(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  });

  function goBack() {
    isSummaryPage.set(false);
  }
</script>

<main class="summary-container">
  <button class="back-button" on:click={goBack}>← Back to Discussion</button>
  
  <div class="split-screen">
    <div class="side" style="background-color: {person1.color === 'green' ? 'rgb(0,153,0)' : 'rgb(251,53,53)'}">
      <div class="content">
        <h2>{person1.name}'s Summary</h2>
        
        {#if summary}
          <div class="section">
            <div 
              class="dropdown-header"
              on:click={() => expandedSection.understand1 = !expandedSection.understand1}
            >
              <span>Understanding the Opponent</span>
              <span class="expand-icon">{expandedSection.understand1 ? '▼' : '▶'}</span>
            </div>
            {#if expandedSection.understand1}
              <div class="dropdown-content">
                {summary.understand1}
              </div>
            {/if}
          </div>
          
          <div class="section">
            <div 
              class="dropdown-header"
              on:click={() => expandedSection.penetrate1 = !expandedSection.penetrate1}
            >
              <span>Improve Your Argument</span>
              <span class="expand-icon">{expandedSection.penetrate1 ? '▼' : '▶'}</span>
            </div>
            {#if expandedSection.penetrate1}
              <div class="dropdown-content">
                {summary.penetrate1}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
    
    <div class="side" style="background-color: {person2.color === 'green' ? 'rgb(0,153,0)' : 'rgb(251,53,53)'}">
      <div class="content">
        <h2>{person2.name}'s Summary</h2>
        
        {#if summary}
          <div class="section">
            <div 
              class="dropdown-header"
              on:click={() => expandedSection.understand2 = !expandedSection.understand2}
            >
              <span>Understanding the Opponent</span>
              <span class="expand-icon">{expandedSection.understand2 ? '▼' : '▶'}</span>
            </div>
            {#if expandedSection.understand2}
              <div class="dropdown-content">
                {summary.understand2}
              </div>
            {/if}
          </div>
          
          <div class="section">
            <div 
              class="dropdown-header"
              on:click={() => expandedSection.penetrate2 = !expandedSection.penetrate2}
            >
              <span>Improve Your Argument</span>
              <span class="expand-icon">{expandedSection.penetrate2 ? '▼' : '▶'}</span>
            </div>
            {#if expandedSection.penetrate2}
              <div class="dropdown-content">
                {summary.penetrate2}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</main>

<style>
  .summary-container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .back-button {
    position: absolute;
    top: 1rem;
    left: 1rem;
    padding: 0.8rem 1.2rem;
    background: rgba(255, 255, 255, 0.95);
    color: #1a1a1a;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    z-index: 10;
    font-weight: 600;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 
      0 4px 6px rgba(0, 0, 0, 0.1),
      0 2px 4px rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateY(-1px);
    box-shadow: 
      0 6px 8px rgba(0, 0, 0, 0.15),
      0 3px 6px rgba(0, 0, 0, 0.1);
  }

  .back-button:active {
    transform: translateY(0);
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .split-screen {
    display: flex;
    width: 100%;
    height: 100%;
  }

  .side {
    flex: 1;
    padding: 4rem 2rem 2rem;
    overflow-y: auto;
    color: white;
  }

  .content {
    max-width: 600px;
    margin: 0 auto;
  }

  h2 {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 1.8rem;
  }

  .section {
    margin-bottom: 2rem;
  }

  .dropdown-header {
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dropdown-header:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .dropdown-content {
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    line-height: 1.6;
  }

  .expand-icon {
    font-size: 0.8rem;
  }

  @media (max-width: 768px) {
    .split-screen {
      flex-direction: column;
    }

    .side {
      padding: 3rem 1rem 1rem;
      height: 50vh;
    }

    .back-button {
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
    }
  }
</style>