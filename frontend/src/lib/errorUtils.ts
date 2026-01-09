/**
 * Translates common error messages to Portuguese
 */
export function translateError(error: Error | string): string {
  const errorMessage = typeof error === "string" ? error : error.message

  // Common browser fetch errors
  if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
    return "Erro de conexão. Verifique se o servidor está online."
  }

  if (errorMessage.includes("timeout") || errorMessage.includes("aborted")) {
    return "Tempo de espera esgotado. Tente novamente."
  }

  // API error messages that are already in Portuguese should be kept as is
  // Otherwise translate common English patterns
  const translations: Record<string, string> = {
    "Failed to fetch personas": "Erro ao carregar personas",
    "Failed to fetch persona": "Erro ao carregar persona",
    "Failed to create persona": "Erro ao criar persona",
    "Failed to update persona": "Erro ao atualizar persona",
    "Failed to delete persona": "Erro ao excluir persona",
    "Failed to clear session": "Erro ao limpar sessão",
  }

  for (const [english, portuguese] of Object.entries(translations)) {
    if (errorMessage.includes(english)) {
      return portuguese
    }
  }

  // If no translation found, return original message (might already be in Portuguese)
  return errorMessage
}
