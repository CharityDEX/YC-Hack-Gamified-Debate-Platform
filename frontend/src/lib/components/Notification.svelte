<script lang="ts">
  export let message: string;
  export let type: 'recording' | 'sent' | 'received' = 'recording';
</script>

<div class="notification {type}">
  <span class="dot"></span>
  {message}
</div>

<style>
  .notification {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.75rem 1.5rem;
    border-radius: 20px;
    color: white;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 100;
    animation: slideDown 0.3s ease;
  }

  .recording {
    background-color: #ff4444;
  }

  .sent {
    background-color: #2196f3;
  }

  .received {
    background-color: #4caf50;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: white;
  }

  .recording .dot {
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.3; }
    100% { opacity: 1; }
  }

  @keyframes slideDown {
    from {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
</style>