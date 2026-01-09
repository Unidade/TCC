import { useState, useEffect } from "react"
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
import { getPersonas, Persona } from "@/lib/api"

interface PersonaSelectorProps {
  selectedPersonaId?: number
  onPersonaChange?: (personaId: number) => void
}

export function PersonaSelector({ selectedPersonaId, onPersonaChange }: PersonaSelectorProps) {
  const navigate = useNavigate()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPersonas()
  }, [])

  const loadPersonas = async () => {
    try {
      const data = await getPersonas()
      setPersonas(data)
      // If no persona is selected and we have personas, select the first one
      if (!selectedPersonaId && data.length > 0 && onPersonaChange) {
        onPersonaChange(data[0].id)
      }
    } catch (err) {
      console.error("Failed to load personas:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (value: string) => {
    const personaId = parseInt(value, 10)
    if (onPersonaChange) {
      onPersonaChange(personaId)
    }
  }

  if (loading) {
    return <div className="h-10 w-32 bg-muted animate-pulse rounded" />
  }

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId)

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
