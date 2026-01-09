import { createContext, useContext, useState, ReactNode } from "react"

interface PersonaContextType {
  selectedPersonaId: number | undefined
  setSelectedPersonaId: (id: number | undefined) => void
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined)

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | undefined>()

  return (
    <PersonaContext.Provider value={{ selectedPersonaId, setSelectedPersonaId }}>
      {children}
    </PersonaContext.Provider>
  )
}

export function usePersonaContext() {
  const context = useContext(PersonaContext)
  if (context === undefined) {
    throw new Error("usePersonaContext must be used within a PersonaProvider")
  }
  return context
}
