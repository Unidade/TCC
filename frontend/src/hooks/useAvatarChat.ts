import { useState, useEffect, useCallback, useRef } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AudioData {
  audio: string
  duration: number
}

interface UseAvatarChatReturn {
  messages: Message[]
  input: string
  setInput: (value: string) => void
  handleSubmit: (e?: React.FormEvent) => void
  isLoading: boolean
  error: Error | null
  currentAudio: AudioData | null
  currentText: string
  clearAudio: () => void
  personaId?: number
  personaName?: string
}

const API_BASE = "http://localhost:8000"

export function useAvatarChat(personaId?: number): UseAvatarChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentAudio, setCurrentAudio] = useState<AudioData | null>(null)
  const [currentText, setCurrentText] = useState("")
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [personaName, setPersonaName] = useState<string>("")
  const sessionId = useRef(crypto.randomUUID())

  // Load initial greeting
  useEffect(() => {
    if (!initialLoaded && personaId) {
      setInitialLoaded(true)
      const url = personaId
        ? `${API_BASE}/api/initial?persona_id=${personaId}`
        : `${API_BASE}/api/initial`
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.text) {
            // Add initial message from assistant
            setMessages([
              {
                id: "initial",
                role: "assistant",
                content: data.text,
              },
            ])
            // Play initial audio
            if (data.audio) {
              setCurrentAudio({
                audio: data.audio,
                duration: data.duration,
              })
              setCurrentText(data.text)
            }
            // Store persona name
            if (data.persona_name) {
              setPersonaName(data.persona_name)
            }
          }
        })
        .catch((err) => {
          console.error("Error loading initial message:", err)
          setError(
            err instanceof Error
              ? new Error(`Erro ao carregar mensagem inicial: ${err.message}`)
              : new Error("Erro ao carregar mensagem inicial. Tente novamente.")
          )
        })
    }
  }, [initialLoaded, personaId])

  // Reset when persona changes
  useEffect(() => {
    if (personaId && initialLoaded) {
      setInitialLoaded(false)
      setMessages([])
      setCurrentAudio(null)
      setCurrentText("")
      sessionId.current = crypto.randomUUID()
    }
  }, [personaId, initialLoaded])

  // Handle message submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()

      if (!input.trim() || isLoading) return

      const userMessage = input.trim()
      setInput("")
      setError(null)
      setIsLoading(true)

      // Add user message immediately
      const userMsgId = crypto.randomUUID()
      setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: userMessage }])

      try {
        const response = await fetch(`${API_BASE}/api/chat/simple`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId.current,
          },
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: userMessage },
            ],
            persona_id: personaId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
          throw new Error(errorData.error || `Erro ao enviar mensagem: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        // Add assistant message
        const assistantMsgId = crypto.randomUUID()
        setMessages((prev) => [
          ...prev,
          { id: assistantMsgId, role: "assistant", content: data.text },
        ])

        // Set audio for avatar
        if (data.audio) {
          setCurrentAudio({
            audio: data.audio,
            duration: data.duration,
          })
          setCurrentText(data.text)
        }
      } catch (err) {
        console.error("Error sending message:", err)
        const errorMessage =
          err instanceof Error
            ? err.message.includes("Erro")
              ? err.message
              : `Erro ao enviar mensagem: ${err.message}`
            : "Erro ao enviar mensagem. Tente novamente."
        setError(new Error(errorMessage))
      } finally {
        setIsLoading(false)
      }
    },
    [input, messages, isLoading, personaId]
  )

  const clearAudio = useCallback(() => {
    setCurrentAudio(null)
    setCurrentText("")
  }, [])

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    currentAudio,
    currentText,
    clearAudio,
    personaId,
    personaName,
  }
}
