import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
  type PersonaCreate,
  type PersonaUpdate,
} from "../api"

export const personaKeys = {
  all: ["personas"] as const,
  lists: () => [...personaKeys.all, "list"] as const,
  list: (filters: string) => [...personaKeys.lists(), { filters }] as const,
  details: () => [...personaKeys.all, "detail"] as const,
  detail: (id: number) => [...personaKeys.details(), id] as const,
}

export function usePersonas() {
  return useQuery({
    queryKey: personaKeys.lists(),
    queryFn: getPersonas,
  })
}

export function usePersona(id: number | undefined) {
  return useQuery({
    queryKey: personaKeys.detail(id!),
    queryFn: () => getPersona(id!),
    enabled: !!id,
  })
}

export function useCreatePersona() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (persona: PersonaCreate) => createPersona(persona),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personaKeys.lists() })
    },
  })
}

export function useUpdatePersona() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, persona }: { id: number; persona: PersonaUpdate }) =>
      updatePersona(id, persona),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: personaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: personaKeys.detail(data.id) })
    },
  })
}

export function useDeletePersona() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deletePersona(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personaKeys.lists() })
    },
  })
}
