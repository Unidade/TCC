import { useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { Experience } from "../components/Experience"
import { ChatPanel } from "../components/ChatPanel"
import { NameBadge } from "../components/NameBadge"
import { PersonaSelector } from "../components/PersonaSelector"
import { useAvatarChat } from "../hooks/useAvatarChat"
import { getPersonas, Persona } from "../lib/api"

export function ChatPage() {
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | undefined>()
  const [persona, setPersona] = useState<Persona | null>(null)

  // Load personas and select first one by default
  useEffect(() => {
    getPersonas()
      .then((personas) => {
        if (personas.length > 0 && !selectedPersonaId) {
          setSelectedPersonaId(personas[0].id)
          setPersona(personas[0])
        }
      })
      .catch(console.error)
  }, [])

  // Load persona details when selected
  useEffect(() => {
    if (selectedPersonaId) {
      getPersonas()
        .then((personas) => {
          const found = personas.find((p) => p.id === selectedPersonaId)
          if (found) {
            setPersona(found)
          }
        })
        .catch(console.error)
    }
  }, [selectedPersonaId])

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    currentAudio,
    currentText,
    clearAudio,
    personaName,
  } = useAvatarChat(selectedPersonaId)

  const displayName = personaName || persona?.name || "Carlos Silva"
  const displayRole = persona?.description || "Cliente"

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Avatar View */}
        <div className="flex-1 relative min-h-[400px] md:min-h-0 bg-muted/20">
          <div className="absolute top-4 right-4 z-10">
            <PersonaSelector
              selectedPersonaId={selectedPersonaId}
              onPersonaChange={setSelectedPersonaId}
            />
          </div>
          <NameBadge name={displayName} role={displayRole} />
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
        </div>

        {/* Chat Panel */}
        <div className="w-full md:w-96 lg:w-[500px] p-4 flex flex-col border-t md:border-t-0 md:border-l bg-background">
          <ChatPanel
            messages={messages}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            personaName={displayName}
          />
          {error && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive text-center mb-2">
                {error.message}
              </p>
              <button
                onClick={() => {
                  if (selectedPersonaId) {
                    window.location.reload()
                  }
                }}
                className="text-xs text-destructive hover:underline mx-auto block"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
