/**
 * API client for persona operations
 */
const API_BASE = "http://localhost:8000"

export interface Persona {
  id: number
  name: string
  description?: string
  system_prompt: string
  initial_message: string
  language: "pt-BR" | "en"
  created_at: string
  updated_at: string
}

export interface PersonaCreate {
  name: string
  description?: string
  system_prompt: string
  initial_message: string
  language: "pt-BR" | "en"
}

export interface PersonaUpdate {
  name?: string
  description?: string
  system_prompt?: string
  initial_message?: string
  language?: "pt-BR" | "en"
}

export async function getPersonas(): Promise<Persona[]> {
  const response = await fetch(`${API_BASE}/api/personas`)
  if (!response.ok) {
    throw new Error(`Failed to fetch personas: ${response.statusText}`)
  }
  return response.json()
}

export async function getPersona(id: number): Promise<Persona> {
  const response = await fetch(`${API_BASE}/api/personas/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch persona: ${response.statusText}`)
  }
  return response.json()
}

export async function createPersona(persona: PersonaCreate): Promise<Persona> {
  const response = await fetch(`${API_BASE}/api/personas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(persona),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `Failed to create persona: ${response.statusText}`)
  }
  return response.json()
}

export async function updatePersona(id: number, persona: PersonaUpdate): Promise<Persona> {
  const response = await fetch(`${API_BASE}/api/personas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(persona),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `Failed to update persona: ${response.statusText}`)
  }
  return response.json()
}

export async function deletePersona(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/personas/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `Failed to delete persona: ${response.statusText}`)
  }
}

export interface InitialMessageResponse {
  text: string
  audio: string
  duration: number
  persona_id: number
  persona_name: string
}

export async function getInitialMessage(personaId?: number): Promise<InitialMessageResponse> {
  const url = personaId
    ? `${API_BASE}/api/initial?persona_id=${personaId}`
    : `${API_BASE}/api/initial`
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `Erro ao carregar mensagem inicial: ${response.statusText}`)
  }
  return response.json()
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  persona_id?: number
}

export interface ChatResponse {
  text: string
  audio?: string
  duration?: number
  error?: string
}

export async function sendChatMessage(
  request: ChatRequest,
  sessionId: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/chat/simple`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": sessionId,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
    throw new Error(errorData.error || `Erro ao enviar mensagem: ${response.statusText}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error)
  }

  return data
}
