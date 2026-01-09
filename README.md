# TCC Interview Simulator

Uma aplicação web para treino de elicitação de requisitos. O aluno conversa por meio de texto com um avatar 3D que representa um cliente fictício (Carlos Silva). O avatar responde com voz sintetizada e lip-sync em tempo real.

## Arquitetura

Monorepo simples com:

- **Backend**: Python FastAPI com endpoints REST
- **Frontend**: React + TypeScript + Vite + AI SDK patterns

## Componentes Principais

- **LLM**: Ollama com modelo `google/gemma-3-4b-it`
- **TTS**: Kokoro TTS (Português Brasileiro/Inglês)
- **Avatar 3D**: Ready Player Me + React Three Fiber
- **Lip-Sync**: Mapeamento caractere-para-viseme (simplificado)
- **State Management**: Hooks customizados seguindo padrões AI SDK

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt

# Certifique-se que Ollama está rodando com o modelo:
# ollama pull google/gemma-3-4b-it

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Uso

1. Inicie o backend na porta 8000
2. Inicie o frontend (porta 5173 por padrão)
3. O avatar Carlos Silva iniciará a conversa automaticamente
4. Digite suas mensagens no chat
5. O avatar responderá com voz e animação labial

## Estrutura do Projeto

```
TCC/
├── backend/                # Python FastAPI
│   ├── app/
│   │   ├── main.py         # Endpoints REST + Streaming
│   │   ├── llm.py          # Integração Ollama
│   │   ├── tts.py          # Integração Kokoro TTS
│   │   └── persona.py      # Prompt do Carlos Silva
│   └── requirements.txt
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── Avatar.tsx      # Componente 3D
│   │   │   ├── ChatPanel.tsx   # Interface de chat
│   │   │   └── Experience.tsx  # Cena 3D
│   │   ├── hooks/
│   │   │   └── useAvatarChat.ts # Hook de chat (AI SDK patterns)
│   │   └── App.tsx
│   └── public/             # Assets do avatar
└── README.md
```

## API Endpoints

- `GET /api/initial` - Mensagem inicial com áudio
- `POST /api/chat/simple` - Chat simples (recomendado)
- `POST /api/chat` - Chat streaming (compatível AI SDK)

## Persona

O avatar representa **Carlos Silva**, um cliente leigo em tecnologia que quer desenvolver o aplicativo "RecipeShare". A interação segue 3 etapas:

1. **Etapa 1**: Levantamento de Requisitos
2. **Etapa 2**: Feedback do Desenvolvimento
3. **Etapa 3**: Entrega e Avaliação Final

Veja `ENGENHARIA_DE_SOFTWARE_PERSONA_V2.txt` para detalhes completos do sistema de prompt.

## Tech Stack

### Backend

- Python 3.11+
- FastAPI
- Ollama (gemma-3-4b-it)
- Kokoro TTS

### Frontend

- React 19
- TypeScript
- Vite
- React Three Fiber
- shadcn/ui
- Tailwind CSS v4
- AI SDK patterns
