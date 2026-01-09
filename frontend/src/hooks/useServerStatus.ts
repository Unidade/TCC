import { useState, useEffect, useCallback } from "react"
import { checkServerHealth } from "../lib/api"

export function useServerStatus() {
  const [isConnected, setIsConnected] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = useCallback(async () => {
    const healthy = await checkServerHealth()
    setIsConnected(healthy)
    return healthy
  }, [])

  const checkNow = useCallback(async () => {
    setIsChecking(true)
    try {
      await checkConnection()
    } finally {
      setIsChecking(false)
    }
  }, [checkConnection])

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [checkConnection])

  return { isConnected, isChecking, checkNow }
}
