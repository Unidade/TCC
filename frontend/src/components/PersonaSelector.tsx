import React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings } from "lucide-react"
import { usePersonas } from "@/lib/queries/personas"
import { usePersonaContext } from "@/contexts/PersonaContext"

function PersonaSelectorComponent() {
  const navigate = useNavigate()
  const { selectedPersonaId, setSelectedPersonaId } = usePersonaContext()
  const { data: personas, isLoading } = usePersonas()

  const handleChange = (value: string) => {
    const personaId = parseInt(value, 10)
    setSelectedPersonaId(personaId)
  }

  if (isLoading) {
    return (
      <div className="h-8 sm:h-10 w-24 sm:w-32 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg animate-pulse" />
    )
  }

  const selectedPersona = personas?.find((p) => p.id === selectedPersonaId)

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg p-1 sm:p-1.5">
      <Select
        value={selectedPersonaId?.toString() || ""}
        onValueChange={handleChange}
      >
        <SelectTrigger className="w-[140px] sm:w-[180px] md:w-[200px] h-7 sm:h-9 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0">
          <SelectValue placeholder="Selecione uma persona">
            <span className="text-xs sm:text-sm truncate">
              {selectedPersona ? selectedPersona.name : "Selecione"}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-sm">
          {personas?.map((persona) => (
            <SelectItem
              key={persona.id}
              value={persona.id.toString()}
              className={persona.id === selectedPersonaId ? "bg-accent" : ""}
            >
              {persona.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/personas")}
        title="Gerenciar personas"
        className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 hover:bg-accent/50"
      >
        <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>
    </div>
  )
}

// Memoize to prevent re-renders when parent updates unrelated state
export const PersonaSelector = React.memo(PersonaSelectorComponent)

