import AudioRecorder from './components/AudioRecorder'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Discussion Recorder</h1>
        <AudioRecorder />
      </div>
    </main>
  )
}


