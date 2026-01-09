import { Routes, Route } from "react-router-dom"
import { PersonaProvider } from "./contexts/PersonaContext"
import { ChatPage } from "./pages/ChatPage"
import { PersonasPage } from "./pages/PersonasPage"

function App() {
  return (
    <PersonaProvider>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/personas" element={<PersonasPage />} />
      </Routes>
    </PersonaProvider>
  )
}

export default App
