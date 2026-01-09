import { AvatarBadge } from "./AvatarBadge"
import { cn } from "@/lib/utils"

interface NameBadgeProps {
  name: string
  role: string
  className?: string
}

export function NameBadge({ name, role, className }: NameBadgeProps) {
  return (
    <div
      className={cn(
        "absolute top-4 left-4 z-10",
        "bg-background/80 backdrop-blur-sm",
        "border border-border/50",
        "rounded-lg shadow-lg",
        "px-4 py-3",
        "flex items-center gap-3",
        className
      )}
    >
      <AvatarBadge name={name} role="assistant" size="sm" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <span className="text-xs text-muted-foreground">{role}</span>
      </div>
    </div>
  )
}
