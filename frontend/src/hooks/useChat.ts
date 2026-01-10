import { useState, useEffect, useCallback, useRef } from "react"
import { useInitialMessage, useChatMutation } from "../lib/queries/chat"
import { clearSession } from "../lib/api"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AudioData {
  audio: string
  duration: number
}

interface UseChatReturn {
  messages: Message[]
  input: string
  setInput: (value: string) => void
  handleSubmit: (e?: React.FormEvent) => void
  isLoading: boolean
  error: Error | null
  currentAudio: AudioData | null
  currentText: string
  clearAudio: () => void
  personaName?: string
}

export function useChat(personaId?: number): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const messagesRef = useRef<Message[]>([])
  const [input, setInput] = useState("")
  const [currentAudio, setCurrentAudio] = useState<AudioData | null>(null)
  const [currentText, setCurrentText] = useState("")
  const sessionId = useRef(crypto.randomUUID())

  const { data: initialData, error: initialError } = useInitialMessage(personaId)
  const chatMutation = useChatMutation(sessionId.current)

  useEffect(() => {
    if (initialData) {
      const initialMessage = [
        {
          id: "initial",
          role: "assistant" as const,
          content: initialData.text,
        },
      ]
      setMessages(initialMessage)
      messagesRef.current = initialMessage
      if (initialData.audio) {
        setCurrentAudio({
          audio: initialData.audio,
          duration: initialData.duration,
        })
        setCurrentText(initialData.text)
      }
    }
  }, [initialData])

  useEffect(() => {
    if (personaId) {
      // Clear the old session on the backend before resetting
      const oldSessionId = sessionId.current
      clearSession(oldSessionId).catch((err) => {
        console.error("Failed to clear session:", err)
        // Continue anyway - session cleanup failure shouldn't block persona switch
      })

      setMessages([])
      messagesRef.current = []
      setCurrentAudio(null)
      setCurrentText("")
      sessionId.current = crypto.randomUUID()
    }
  }, [personaId])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()

      if (!input.trim() || chatMutation.isPending) return

      const userMessage = input.trim()
      setInput("")

      const userMsgId = crypto.randomUUID()
      const userMsg: Message = { id: userMsgId, role: "user", content: userMessage }

      // Update ref BEFORE setMessages to avoid race condition
      const updatedMessages = [...messagesRef.current, userMsg]
      messagesRef.current = updatedMessages
      setMessages(updatedMessages)

      try {
        // Use the already-updated messagesRef
        const data = await chatMutation.mutateAsync({
          messages: messagesRef.current.map((m) => ({ role: m.role, content: m.content })),
          persona_id: personaId,
        })

        const assistantMsgId = crypto.randomUUID()
        const assistantMsg: Message = { id: assistantMsgId, role: "assistant", content: data.text }

        // Update ref before setMessages for consistency
        const updatedWithAssistant = [...messagesRef.current, assistantMsg]
        messagesRef.current = updatedWithAssistant
        setMessages(updatedWithAssistant)

        if (data.audio) {
          setCurrentAudio({
            audio: data.audio,
            duration: data.duration || 0,
          })
          setCurrentText(data.text)
        }
      } catch (err) {
        console.error("Error sending message:", err)
      }
    },
    [input, chatMutation, personaId]
  )

  const clearAudio = useCallback(() => {
    setCurrentAudio(null)
    setCurrentText("")
  }, [])

  const error = initialError || (chatMutation.error as Error | null) || null
  const isLoading = chatMutation.isPending

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
    personaName: initialData?.persona_name,
  }
}
