"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface OrbProps extends React.HTMLAttributes<HTMLDivElement> {
  isActive?: boolean
  size?: "sm" | "md" | "lg"
  colors?: [string, string]
}

const Orb = React.forwardRef<HTMLDivElement, OrbProps>(
  (
    {
      className,
      isActive = false,
      size = "md",
      colors = ["#3b82f6", "#8b5cf6"],
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-12 w-12",
      md: "h-16 w-16",
      lg: "h-24 w-24",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-full overflow-hidden",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-500",
            isActive
              ? "bg-gradient-to-br from-blue-500 to-purple-500 animate-pulse"
              : "bg-gradient-to-br from-gray-400 to-gray-500"
          )}
          style={
            isActive
              ? {
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                }
              : undefined
          }
        >
          <div
            className={cn(
              "absolute inset-0 rounded-full",
              isActive && "animate-ping opacity-20"
            )}
            style={
              isActive
                ? {
                    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                  }
                : undefined
            }
          />
        </div>
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          </div>
        )}
      </div>
    )
  }
)
Orb.displayName = "Orb"

export { Orb }
