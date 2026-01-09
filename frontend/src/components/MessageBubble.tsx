import { AvatarBadge } from "./AvatarBadge"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  id?: string
  role: "user" | "assistant"
  content: string
  name?: string
}

export function MessageBubble({
  role,
  content,
  name = role === "assistant" ? "Carlos Silva" : "Você",
}: MessageBubbleProps) {
  const isUser = role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <AvatarBadge name={name} role={role} size="md" />
      <div
        className={cn(
          "flex flex-col max-w-[75%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 shadow-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </div>
    </div>
  )
}
