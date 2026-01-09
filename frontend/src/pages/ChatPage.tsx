import { useEffect, useState, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { Experience } from "../components/Experience"
import { ChatPanel } from "../components/ChatPanel"
import { NameBadge } from "../components/NameBadge"
import { PersonaSelector } from "../components/PersonaSelector"
import { useChat } from "../hooks/useChat"
import { usePersonaContext } from "../contexts/PersonaContext"
import { usePersonas, usePersona } from "../lib/queries/personas"
import { useServerStatus } from "../hooks/useServerStatus"
import { Play, Volume2 } from "lucide-react"
import { Button } from "../components/ui/button"

// Sample text for lipsync testing
const SAMPLE_TEXT = "Olá! Meu nome é Carlos Silva e estou aqui para ajudar você. Como posso ajudá-lo hoje?"

export function ChatPage() {
  const { selectedPersonaId, setSelectedPersonaId } = usePersonaContext()
  const { data: personas } = usePersonas()
  const { data: persona } = usePersona(selectedPersonaId)
  const { isConnected, isChecking, checkNow } = useServerStatus()

  // State for testing lipsync
  const [testAudio, setTestAudio] = useState<{ audio: string; duration: number } | null>(null)
  const [isPlayingTest, setIsPlayingTest] = useState(false)

  useEffect(() => {
    if (personas && personas.length > 0 && !selectedPersonaId) {
      setSelectedPersonaId(personas[0].id)
    }
  }, [personas, selectedPersonaId, setSelectedPersonaId])

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    currentAudio,
    currentText,
    clearAudio,
    personaName,
  } = useChat(selectedPersonaId)

  // Play test audio for lipsync demonstration
  const playTestLipsync = useCallback(() => {
    if (isPlayingTest) return

    setIsPlayingTest(true)

    const durationMs = 5000 // 5 seconds for the test

    try {
      const audioContext = new AudioContext()
      const sampleRate = audioContext.sampleRate
      const duration = durationMs / 1000
      const numSamples = sampleRate * duration
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate)
      const channelData = buffer.getChannelData(0)

      // Generate a simple hum sound
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        channelData[i] = 0.1 * Math.sin(2 * Math.PI * 150 * t) +
          0.05 * Math.sin(2 * Math.PI * 300 * t) +
          0.03 * Math.sin(2 * Math.PI * 450 * t)
        const envelope = Math.min(t * 10, 1) * Math.min((duration - t) * 10, 1)
        channelData[i] *= envelope
      }

      const wavBuffer = audioBufferToWav(buffer)
      const base64Audio = arrayBufferToBase64(wavBuffer)

      setTestAudio({
        audio: base64Audio,
        duration: duration
      })

      audioContext.close()
    } catch (error) {
      console.error("Error creating test audio:", error)
      setIsPlayingTest(false)
    }
  }, [isPlayingTest])

  const handleTestAudioEnd = useCallback(() => {
    setTestAudio(null)
    setIsPlayingTest(false)
  }, [])

  const displayName = personaName || persona?.name || "Carlos Silva"
  const displayRole = persona?.description || "Cliente"

  // Determine which audio/text to use - test audio takes priority
  const activeAudio = testAudio || currentAudio
  const activeText = testAudio ? SAMPLE_TEXT : currentText

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Avatar View */}
        <div className="flex-1 relative min-h-[250px] sm:min-h-[300px] md:min-h-0 bg-[#2d2d2d]">
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={playTestLipsync}
              disabled={isPlayingTest}
              className="flex items-center gap-2"
              title="Testar lipsync"
            >
              {isPlayingTest ? (
                <>
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span className="hidden sm:inline">Tocando...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Testar Lipsync</span>
                </>
              )}
            </Button>
            <PersonaSelector />
          </div>
          <NameBadge name={displayName} role={displayRole} />
          <Canvas
            shadows
            camera={{ position: [0, 0, 10], fov: 20 }}
            style={{ height: "100%", width: "100%" }}
          >
            <color attach="background" args={["#2d2d2d"]} />
            <Experience
              text={activeText}
              audioUrl={activeAudio?.audio}
              duration={activeAudio?.duration}
              onAudioEnd={testAudio ? handleTestAudioEnd : clearAudio}
            />
          </Canvas>
        </div>

        {/* Chat Panel */}
        <div className="w-full md:w-96 lg:w-[500px] p-2 sm:p-4 flex flex-col border-t md:border-t-0 md:border-l bg-background relative">
          <ChatPanel
            messages={messages}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            personaName={displayName}
            isConnected={isConnected}
            onReconnect={checkNow}
            isReconnecting={isChecking}
          />
        </div>
      </div>
    </div>
  )
}

// Helper function to convert AudioBuffer to WAV format
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataLength = buffer.length * blockAlign
  const bufferLength = 44 + dataLength
  const arrayBuffer = new ArrayBuffer(bufferLength)
  const view = new DataView(arrayBuffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, bufferLength - 8, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  const channelData = buffer.getChannelData(0)
  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
    offset += 2
  }

  return arrayBuffer
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
