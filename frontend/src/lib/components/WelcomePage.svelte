<script lang="ts">
  import { appSettings, person1Store, person2Store, isWelcomePage, timeRemaining } from '../stores';
  import type { AppSettings } from '../types';

  let settings: AppSettings = {
    person1Name: 'Sean',
    person2Name: 'Alex',
    timerMinutes: 5,
    timerSeconds: 0
  };

  function startApp() {
    // Update stores with user input
    appSettings.set(settings);
    person1Store.update(p => ({ ...p, name: settings.person1Name }));
    person2Store.update(p => ({ ...p, name: settings.person2Name }));
    timeRemaining.set(settings.timerMinutes * 60 + settings.timerSeconds);
    isWelcomePage.set(false);
  }
</script>

<div class="welcome-container">
  <div class="welcome-card">
    <h1>Argument Mediator</h1>
    <form on:submit|preventDefault={startApp}>
      <div class="input-group">
        <label for="person1">Person 1 Name</label>
        <input
          type="text"
          id="person1"
          bind:value={settings.person1Name}
          required
        />
      </div>

      <div class="input-group">
        <label for="person2">Person 2 Name</label>
        <input
          type="text"
          id="person2"
          bind:value={settings.person2Name}
          required
        />
      </div>

      <div class="timer-group">
        <h3>Timer Duration</h3>
        <div class="timer-inputs">
          <div class="input-group">
            <label for="minutes">Minutes</label>
            <input
              type="number"
              id="minutes"
              min="0"
              max="59"
              bind:value={settings.timerMinutes}
            />
          </div>
          <div class="input-group">
            <label for="seconds">Seconds</label>
            <input
              type="number"
              id="seconds"
              min="0"
              max="59"
              bind:value={settings.timerSeconds}
            />
          </div>
        </div>
      </div>

      <button type="submit" class="start-button">Start Session</button>
    </form>
  </div>
</div>

<style>
  .welcome-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  }

  .welcome-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    width: 90%;
    max-width: 400px;
  }

  h1 {
    color: #333;
    text-align: center;
    margin-bottom: 2rem;
    font-size: 1.8rem;
  }

  h3 {
    color: #333;
    margin: 1rem 0;
    font-size: 1.2rem;
  }

  .input-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #666;
    font-size: 0.9rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }

  .timer-group {
    margin-bottom: 1.5rem;
  }

  .timer-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .start-button {
    width: 100%;
    padding: 1rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .start-button:hover {
    background: #45a049;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }

  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>