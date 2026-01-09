import React from "react"
import { AvatarBadge } from "./AvatarBadge"
import { cn } from "@/lib/utils"

interface NameBadgeProps {
  name: string
  role: string
  className?: string
}

function NameBadgeComponent({ name, role, className }: NameBadgeProps) {
  return (
    <div
      className={cn(
        "absolute top-2 left-2 sm:top-4 sm:left-4 z-10",
        "bg-background/80 backdrop-blur-sm",
        "border border-border/50",
        "rounded-lg shadow-lg",
        "px-2 py-1.5 sm:px-4 sm:py-3",
        "flex items-center gap-2 sm:gap-3",
        className
      )}
    >
      <AvatarBadge name={name} role="assistant" size="sm" />
      <div className="flex flex-col">
        <span className="text-xs sm:text-sm font-semibold text-foreground">{name}</span>
        <span className="text-[10px] sm:text-xs text-muted-foreground">{role}</span>
      </div>
    </div>
  )
}

// Memoize to prevent re-renders when parent updates unrelated state
export const NameBadge = React.memo(NameBadgeComponent)

