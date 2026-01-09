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

export function PersonaSelector() {
  const navigate = useNavigate()
  const { selectedPersonaId, setSelectedPersonaId } = usePersonaContext()
  const { data: personas, isLoading } = usePersonas()

  const handleChange = (value: string) => {
    const personaId = parseInt(value, 10)
    setSelectedPersonaId(personaId)
  }

  if (isLoading) {
    return <div className="h-10 w-32 bg-muted animate-pulse rounded" />
  }

  const selectedPersona = personas?.find((p) => p.id === selectedPersonaId)

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedPersonaId?.toString() || ""}
        onValueChange={handleChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione uma persona">
            {selectedPersona ? selectedPersona.name : "Selecione uma persona"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {personas.map((persona) => (
            <SelectItem key={persona.id} value={persona.id.toString()}>
              {persona.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate("/personas")}
        title="Gerenciar personas"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  )
}
