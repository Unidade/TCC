import { useQuery, useMutation } from "@tanstack/react-query"
import { getInitialMessage, sendChatMessage, type ChatRequest } from "../api"

export const chatKeys = {
  initial: (personaId?: number) => ["chat", "initial", personaId] as const,
}

export function useInitialMessage(personaId?: number) {
  return useQuery({
    queryKey: chatKeys.initial(personaId),
    queryFn: () => getInitialMessage(personaId),
    enabled: true,
    staleTime: Infinity,
  })
}

export function useChatMutation(sessionId: string) {
  return useMutation({
    mutationFn: (request: ChatRequest) => sendChatMessage(request, sessionId),
  })
}
