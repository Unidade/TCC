"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "./scroll-area"

interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  autoScroll?: boolean
}

const Conversation = React.forwardRef<HTMLDivElement, ConversationProps>(
  ({ className, children, autoScroll = true, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [isAtBottom, setIsAtBottom] = React.useState(true)

    React.useEffect(() => {
      if (!autoScroll || !containerRef.current) return

      // Find the ScrollArea viewport element
      const scrollElement = containerRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement

      if (!scrollElement) return

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement
        setIsAtBottom(scrollHeight - scrollTop - clientHeight < 100)
      }

      scrollElement.addEventListener("scroll", handleScroll)

      return () => {
        scrollElement.removeEventListener("scroll", handleScroll)
      }
    }, [autoScroll])

    React.useEffect(() => {
      if (!autoScroll || !isAtBottom || !containerRef.current) return

      const scrollElement = containerRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement

      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }, [children, autoScroll, isAtBottom])

    return (
      <div ref={ref} className={cn("flex flex-col h-full", className)} {...props}>
        <ScrollArea ref={containerRef} className="flex-1">
          <div className="flex flex-col gap-4 p-4">{children}</div>
        </ScrollArea>
      </div>
    )
  }
)
Conversation.displayName = "Conversation"

const ConversationMessage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    role: "user" | "assistant"
  }
>(({ className, role, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex gap-3 w-full",
        role === "user" ? "flex-row-reverse" : "flex-row",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ConversationMessage.displayName = "ConversationMessage"

const ConversationContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    role: "user" | "assistant"
  }
>(({ className, role, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col max-w-[75%]",
        role === "user" ? "items-end" : "items-start",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 shadow-sm",
          role === "user"
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {children}
      </div>
    </div>
  )
})
ConversationContent.displayName = "ConversationContent"

export { Conversation, ConversationMessage, ConversationContent }
