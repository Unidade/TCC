import { useState, useEffect, useCallback, useRef } from "react"
import { useInitialMessage, useChatMutation } from "../lib/queries/chat"

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
  const [input, setInput] = useState("")
  const [currentAudio, setCurrentAudio] = useState<AudioData | null>(null)
  const [currentText, setCurrentText] = useState("")
  const sessionId = useRef(crypto.randomUUID())

  const { data: initialData, error: initialError } = useInitialMessage(personaId)
  const chatMutation = useChatMutation(sessionId.current)

  useEffect(() => {
    if (initialData) {
      setMessages([
        {
          id: "initial",
          role: "assistant",
          content: initialData.text,
        },
      ])
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
      setMessages([])
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
      setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: userMessage }])

      try {
        const data = await chatMutation.mutateAsync({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage },
          ],
          persona_id: personaId,
        })

        const assistantMsgId = crypto.randomUUID()
        setMessages((prev) => [
          ...prev,
          { id: assistantMsgId, role: "assistant", content: data.text },
        ])

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
    [input, messages, chatMutation, personaId]
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
