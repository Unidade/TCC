import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Loader2, HelpCircle, RefreshCw, X } from "lucide-react"
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
  isConnected?: boolean
  onReconnect?: () => void
  isReconnecting?: boolean
}

function ChatPanelComponent({
  messages,
  input,
  setInput,
  handleSubmit,
  isLoading,
  personaName = "Carlos Silva",
  isConnected = true,
  onReconnect,
  isReconnecting = false,
}: ChatPanelProps) {
  const [showHelp, setShowHelp] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(e)
  }

  return (
    <Card className="flex flex-col h-full w-full shadow-lg">
      <div className="p-3 sm:p-5 border-b bg-muted/30">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">
              Conversa com {personaName}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Cliente</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              title={isConnected ? "Servidor conectado" : "Servidor desconectado"}
            />
            {!isConnected && (
              <div className="relative flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Desconectado</span>
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                  title="Ajuda"
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>

                {showHelp && (
                  <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-popover border border-border rounded-lg shadow-lg z-50">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-sm text-foreground">Servidor Offline</span>
                      <button
                        onClick={() => setShowHelp(false)}
                        className="p-0.5 hover:bg-muted rounded"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      O servidor está desconectado. Verifique se o backend está rodando e tente reconectar.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onReconnect?.()
                        setShowHelp(false)
                      }}
                      disabled={isReconnecting}
                      className="w-full"
                    >
                      {isReconnecting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          Reconectando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 mr-2" />
                          Tentar reconectar
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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
              Digite uma mensagem abaixo para começar a conversar. O assistente está pronto
              para responder.
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

      <form onSubmit={onSubmit} className="p-2 sm:p-4 border-t bg-muted/20 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isConnected ? "Digite sua mensagem aqui..." : "Servidor desconectado..."
          }
          disabled={isLoading || !isConnected}
          className="flex-1 bg-background"
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim() || !isConnected}
          size="icon"
          className="shrink-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </Card>
  )
}

// Memoize to prevent re-renders when parent updates unrelated state
export const ChatPanel = React.memo(ChatPanelComponent)

