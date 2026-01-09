import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Loader2 } from "lucide-react"
import { AvatarBadge } from "./AvatarBadge"
import {
  Conversation,
  ConversationMessage,
  ConversationContent,
} from "@/components/ui/conversation"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatPanelProps {
  messages: Message[]
  input: string
  setInput: (value: string) => void
  handleSubmit: (e?: React.FormEvent) => void
  isLoading: boolean
  personaName?: string
}

export function ChatPanel({
  messages,
  input,
  setInput,
  handleSubmit,
  isLoading,
  personaName = "Carlos Silva",
}: ChatPanelProps) {
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(e)
  }

  return (
    <Card className="flex flex-col h-full w-full shadow-lg">
      <div className="p-5 border-b bg-muted/30">
        <h2 className="text-lg font-semibold text-foreground">Conversa com {personaName}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Cliente</p>
      </div>

      <Conversation className="flex-1" autoScroll>
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <div className="mb-4">
              <AvatarBadge name={personaName} role="assistant" size="lg" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Inicie uma conversa com {personaName}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Digite uma mensagem abaixo para começar a conversar. O assistente está pronto para
              responder.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ConversationMessage key={msg.id} role={msg.role}>
            <AvatarBadge
              name={msg.role === "assistant" ? personaName : "Você"}
              role={msg.role}
              size="md"
            />
            <ConversationContent role={msg.role}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </ConversationContent>
          </ConversationMessage>
        ))}

        {isLoading && (
          <ConversationMessage role="assistant">
            <AvatarBadge name={personaName} role="assistant" size="md" />
            <ConversationContent role="assistant">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Digitando...</span>
              </div>
            </ConversationContent>
          </ConversationMessage>
        )}
      </Conversation>

      <form onSubmit={onSubmit} className="p-4 border-t bg-muted/20 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem aqui..."
          disabled={isLoading}
          className="flex-1 bg-background"
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          size="icon"
          className="shrink-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </Card>
  )
}
