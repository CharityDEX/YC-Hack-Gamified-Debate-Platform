export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  public isRecording: boolean = false;
  private lastRecording: Blob | null = null;

  async setup(): Promise<void> {
    try {
      // First, check if the browser supports the required APIs
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        throw new Error('Your browser does not support audio recording');
      }

      // Request audio permissions with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 44100
        }
      });

      this.audioStream = stream;
      
      // Create MediaRecorder with specific MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

    } catch (error) {
      // Handle specific error types
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            throw new Error('Please grant microphone access permission');
          case 'NotFoundError':
            throw new Error('No microphone device found');
          case 'NotReadableError':
            // Try to clean up any existing streams before throwing
            this.cleanup();
            throw new Error('Could not access microphone. Please try reconnecting your device');
          default:
            throw new Error(`Microphone error: ${error.message}`);
        }
      }
      throw error;
    }
  }

  private cleanup(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.lastRecording = null;
  }

  start(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'inactive') {
      return;
    }

    try {
      this.audioChunks = [];
      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.cleanup();
      throw new Error('Failed to start recording. Please refresh the page and try again');
    }
  }

  async stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      const handleStop = () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder?.mimeType || 'audio/webm' 
          });
          this.lastRecording = audioBlob;
          this.blobToBase64(audioBlob)
            .then(base64Audio => {
              this.isRecording = false;
              resolve(base64Audio);
            })
            .catch(reject);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.onstop = handleStop;

      if (this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.stop();
        } catch (error) {
          this.cleanup();
          reject(new Error('Failed to stop recording'));
        }
      } else {
        handleStop();
      }
    });
  }

  getLastRecording(): Blob | null {
    return this.lastRecording;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  }

  dispose(): void {
    this.cleanup();
  }
}