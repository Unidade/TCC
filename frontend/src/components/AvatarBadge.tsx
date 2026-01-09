import { cn } from "@/lib/utils"

interface AvatarBadgeProps {
  name: string
  role: "user" | "assistant"
  className?: string
  size?: "sm" | "md" | "lg"
}

export function AvatarBadge({
  name,
  role,
  className,
  size = "md",
}: AvatarBadgeProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-base",
  }

  const colorClasses =
    role === "assistant"
      ? "bg-muted text-muted-foreground"
      : "bg-primary text-primary-foreground"

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-medium flex-shrink-0",
        sizeClasses[size],
        colorClasses,
        className
      )}
    >
      {initials}
    </div>
  )
}
