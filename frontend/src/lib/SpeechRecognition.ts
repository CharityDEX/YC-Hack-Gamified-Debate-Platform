export class SpeechRecognizer {
  recognition: SpeechRecognition;
  isListening: boolean = false;
  transcript: string = '';

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      this.transcript = currentTranscript;
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  start() {
    if (this.isListening) {
      return;
    }
    
    try {
      this.isListening = true;
      this.transcript = '';
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.isListening = false;
    }
  }

  stop(): string {
    if (!this.isListening) {
      return this.transcript;
    }

    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }

    return this.transcript;
  }
}