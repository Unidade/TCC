import { createContext, useContext, useState, useMemo, type ReactNode } from "react"

interface PersonaContextType {
  selectedPersonaId: number | undefined
  setSelectedPersonaId: (id: number | undefined) => void
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined)

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | undefined>()

  // Memoize context value to prevent child re-renders when the value object is recreated
  const value = useMemo(
    () => ({ selectedPersonaId, setSelectedPersonaId }),
    [selectedPersonaId]
  )

  return (
    <PersonaContext.Provider value={value}>
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

