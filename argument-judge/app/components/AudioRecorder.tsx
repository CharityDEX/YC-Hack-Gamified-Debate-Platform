'use client'

import { useState, useRef } from 'react'
import { Mic, Square, Check, Loader2 } from 'lucide-react'

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_EDGE_FUNCTION_ENDPOINT = process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_ENDPOINT
const USER_ID = 1

interface DiscussionResult {
  winner: string;
  summary: string;
}

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [currentOpponent, setCurrentOpponent] = useState(1)
  const [discussionResult, setDiscussionResult] = useState<DiscussionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = sendAudioToSupabase

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendAudioToSupabase = async () => {
    setIsUploading(true)
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('message_role', currentOpponent.toString())
    formData.append('user_id', USER_ID.toString())

    try {
      const response = await fetch(`${SUPABASE_EDGE_FUNCTION_ENDPOINT}/functions/v1/argument-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData,
      })

      if (response.ok) {
        console.log('Audio sent successfully')
        setCurrentOpponent(currentOpponent === 1 ? 2 : 1)
      } else {
        console.error('Failed to send audio')
      }
    } catch (error) {
      console.error('Error sending audio:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const callCompleteFunction = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${SUPABASE_EDGE_FUNCTION_ENDPOINT}/functions/v1/argument-finish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: USER_ID.toString() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DiscussionResult = await response.json();
      setDiscussionResult(result);
      console.log('Complete function called successfully');
    } catch (error) {
      console.error('Error calling complete function:', error);
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {discussionResult ? (
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Discussion Result</h2>
          <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
            <p className="text-2xl font-semibold text-green-700">Winner: {discussionResult.winner}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="text-xl font-semibold mb-2">Summary:</h3>
            <p className="text-lg">{discussionResult.summary}</p>
          </div>
          <button
            onClick={() => setDiscussionResult(null)}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Start New Discussion
          </button>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold mb-4">
            {isRecording ? 'Recording' : 'Ready'}: Opponent {currentOpponent}
          </div>
          <div className="flex space-x-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-4 rounded-full ${
                isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              disabled={isUploading || isLoading}
            >
              {isUploading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : isRecording ? (
                <Square size={24} />
              ) : (
                <Mic size={24} />
              )}
            </button>
            <button
              onClick={callCompleteFunction}
              className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              aria-label={isLoading ? "Processing discussion" : "Complete discussion"}
              disabled={isLoading || isRecording || isUploading}
            >
              {isLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Check size={24} />
              )}
            </button>
          </div>
          {(isUploading || isLoading) && (
            <div className="text-center text-gray-600 mt-4" aria-live="polite">
              {isUploading ? "Uploading audio..." : "Processing discussion... This may take 5-10 seconds."}
            </div>
          )}
        </>
      )}
    </div>
  )
}

