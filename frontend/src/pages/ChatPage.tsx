import { useEffect, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { Experience } from "../components/Experience"
import { ChatPanel } from "../components/ChatPanel"
import { NameBadge } from "../components/NameBadge"
import { PersonaSelector } from "../components/PersonaSelector"
import { useChat } from "../hooks/useChat"
import { usePersonaContext } from "../contexts/PersonaContext"
import { usePersonas, usePersona } from "../lib/queries/personas"
import { useServerStatus } from "../hooks/useServerStatus"
import { Loader2 } from "lucide-react"

// Moved outside ChatPage to prevent recreation on every render
function AvatarLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando avatar...</span>
      </div>
    </div>
  )
}

export function ChatPage() {
  const { selectedPersonaId, setSelectedPersonaId } = usePersonaContext()
  const { data: personas } = usePersonas()
  const { data: persona } = usePersona(selectedPersonaId)
  const { isConnected, isChecking, checkNow } = useServerStatus()

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

  const displayName = personaName || persona?.name || "Carlos Silva"
  const displayRole = persona?.description || "Cliente"

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Avatar View */}
        <div className="flex-1 relative min-h-[250px] sm:min-h-[300px] md:min-h-0 bg-muted/20">
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
            <PersonaSelector />
          </div>
          <NameBadge name={displayName} role={displayRole} />
          <Suspense fallback={<AvatarLoading />}>
            <Canvas
              shadows
              camera={{ position: [0, 0, 10], fov: 20 }}
              className="w-full h-full"
            >
              <color attach="background" args={["#2d2d2d"]} />
              <Experience
                text={currentText}
                audioUrl={currentAudio?.audio}
                duration={currentAudio?.duration}
                onAudioEnd={clearAudio}
              />
            </Canvas>
          </Suspense>
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

