import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Edit, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import { PersonaCreate, Persona } from "@/lib/api"
import {
  usePersonas,
  useCreatePersona,
  useUpdatePersona,
  useDeletePersona,
} from "@/lib/queries/personas"

export function PersonasPage() {
  const navigate = useNavigate()
  const { data: personas, isLoading: loading, error: queryError } = usePersonas()
  const createMutation = useCreatePersona()
  const updateMutation = useUpdatePersona()
  const deleteMutation = useDeletePersona()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [formData, setFormData] = useState<PersonaCreate>({
    name: "",
    description: "",
    system_prompt: "",
    initial_message: "",
    language: "pt-BR",
  })
  const [error, setError] = useState<string | null>(null)

  const errorMessage = queryError instanceof Error ? queryError.message : null

  const handleOpenCreate = () => {
    setEditingPersona(null)
    setFormData({
      name: "",
      description: "",
      system_prompt: "",
      initial_message: "",
      language: "pt-BR",
    })
    setError(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (persona: Persona) => {
    setEditingPersona(persona)
    setFormData({
      name: persona.name,
      description: persona.description || "",
      system_prompt: persona.system_prompt,
      initial_message: persona.initial_message,
      language: persona.language,
    })
    setError(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.system_prompt.trim() || !formData.initial_message.trim()) {
      setError("Nome, prompt do sistema e mensagem inicial são obrigatórios")
      return
    }

    try {
      setError(null)

      if (editingPersona) {
        await updateMutation.mutateAsync({ id: editingPersona.id, persona: formData })
      } else {
        await createMutation.mutateAsync(formData)
      }

      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar persona")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta persona? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      await deleteMutation.mutateAsync(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir persona")
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Chat
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Personas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie as personas de IA para o simulador
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Persona
          </Button>
        </div>

        {(error || errorMessage) && !isDialogOpen && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error || errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas?.map((persona) => (
            <Card key={persona.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">{persona.name}</h3>
                  {persona.description && (
                    <p className="text-sm text-muted-foreground mt-1">{persona.description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(persona)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(persona.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Idioma: </span>
                  <span className="font-medium">{persona.language}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Criado: </span>
                  <span className="font-medium">
                    {new Date(persona.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {personas && personas.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Ainda não há personas. Crie sua primeira persona para começar.</p>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPersona ? "Editar Persona" : "Criar Nova Persona"}
              </DialogTitle>
              <DialogDescription>
                {editingPersona
                  ? "Atualize os detalhes da persona abaixo."
                  : "Preencha os detalhes para criar uma nova persona de IA."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Carlos Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descrição da persona"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Idioma *</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value: "pt-BR" | "en") =>
                    setFormData({ ...formData, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en">Inglês</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">Prompt do Sistema *</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="Defina o comportamento, conhecimento e estilo de comunicação da persona..."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Este prompt define como a IA se comportará e responderá.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial_message">Mensagem Inicial *</Label>
                <Textarea
                  id="initial_message"
                  value={formData.initial_message}
                  onChange={(e) => setFormData({ ...formData, initial_message: e.target.value })}
                  placeholder="A primeira mensagem que a persona enviará..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Esta é a mensagem de saudação exibida ao iniciar uma conversa.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : editingPersona ? (
                  "Atualizar"
                ) : (
                  "Criar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
