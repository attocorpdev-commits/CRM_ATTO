"use client"

import { useActionState, useState, useRef, useEffect } from "react"
import { createDisparoAction } from "./actions"
import { parseCsv, type ParsedContact } from "@/lib/disparos/csv-parser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Upload, FileText, AlertCircle, Plus, Trash2, BookUser, Loader2 } from "lucide-react"

interface DisparoFormProps {
  hasActiveDisparo: boolean
  onCreated?: (disparoId: string) => void
}

type InputMode = "csv" | "manual" | "lista"

interface ListaSummary {
  id: string
  nome: string
  total_contatos: number
}

export function DisparoForm({ hasActiveDisparo, onCreated }: DisparoFormProps) {
  const [state, action, isPending] = useActionState(createDisparoAction, null)
  const [contacts, setContacts] = useState<ParsedContact[]>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [delay, setDelay] = useState("300")
  const [inputMode, setInputMode] = useState<InputMode>("csv")
  const [manualNome, setManualNome] = useState("")
  const [manualNumero, setManualNumero] = useState("")
  const [manualError, setManualError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Lista mode state
  const [listas, setListas] = useState<ListaSummary[]>([])
  const [listasLoading, setListasLoading] = useState(false)
  const [selectedListaId, setSelectedListaId] = useState<string | null>(null)
  const [listaContactsLoading, setListaContactsLoading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const result = parseCsv(text)
      setContacts(result.contacts)
      setCsvErrors(result.errors)
    }
    reader.readAsText(file)
  }

  function clearFile() {
    setContacts([])
    setCsvErrors([])
    setFileName(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  function switchMode(mode: InputMode) {
    setInputMode(mode)
    setContacts([])
    setCsvErrors([])
    setFileName(null)
    setManualNome("")
    setManualNumero("")
    setManualError(null)
    setSelectedListaId(null)
    if (fileRef.current) fileRef.current.value = ""

    if (mode === "lista" && listas.length === 0) {
      fetchListas()
    }
  }

  async function fetchListas() {
    setListasLoading(true)
    try {
      const res = await fetch("/api/contatos/listas")
      const data = await res.json()
      setListas(data)
    } catch {
      // ignore
    } finally {
      setListasLoading(false)
    }
  }

  async function selectLista(listaId: string) {
    setSelectedListaId(listaId)
    setListaContactsLoading(true)
    try {
      const res = await fetch(`/api/contatos/listas/${listaId}/items`)
      const data = await res.json()
      setContacts(data)
    } catch {
      setContacts([])
    } finally {
      setListaContactsLoading(false)
    }
  }

  function addManualContact() {
    const nome = manualNome.trim()
    const numero = manualNumero.replace(/\D/g, "")

    if (!nome) {
      setManualError("Informe o nome")
      return
    }
    if (!numero) {
      setManualError("Informe o número")
      return
    }

    // Normalize: prepend 55 if needed
    let normalized = numero
    if (numero.length >= 10 && numero.length <= 11 && !numero.startsWith("55")) {
      normalized = `55${numero}`
    }
    if (normalized.length < 12 || normalized.length > 13) {
      setManualError("Número inválido. Use DDD + número (ex: 11999998888)")
      return
    }

    if (contacts.length >= 1000) {
      setManualError("Máximo de 1000 contatos por disparo")
      return
    }

    setContacts((prev) => [...prev, { nome, numero: normalized }])
    setManualNome("")
    setManualNumero("")
    setManualError(null)
  }

  function removeContact(index: number) {
    setContacts((prev) => prev.filter((_, i) => i !== index))
  }

  const delaySec = Number(delay)
  const estimatedTotalSec = contacts.length > 1 ? (contacts.length - 1) * delaySec : 0
  const estimatedHours = Math.floor(estimatedTotalSec / 3600)
  const estimatedMins = Math.floor((estimatedTotalSec % 3600) / 60)
  const estimatedSecs = estimatedTotalSec % 60

  // Notify parent after successful creation (in effect, not during render)
  useEffect(() => {
    if (state?.success && state?.disparoId) {
      onCreated?.(state.disparoId)
    }
  }, [state, onCreated])

  return (
    <form action={action} className="space-y-6">
      {/* Hidden fields */}
      <input type="hidden" name="contacts" value={JSON.stringify(contacts)} />
      <input type="hidden" name="delay_segundos" value={delay} />

      {/* Step 1: Contacts */}
      <div className="space-y-3">
        <Label className="text-base font-medium">1. Contatos</Label>

        {/* Mode toggle */}
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant={inputMode === "csv" ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode("csv")}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Upload CSV
          </Button>
          <Button
            type="button"
            variant={inputMode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode("manual")}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Adicionar manualmente
          </Button>
          <Button
            type="button"
            variant={inputMode === "lista" ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode("lista")}
          >
            <BookUser className="mr-1.5 h-3.5 w-3.5" />
            Lista salva
          </Button>
        </div>

        {/* CSV mode */}
        {inputMode === "csv" && (
          <>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Selecionar arquivo
              </Button>
              {fileName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{fileName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={clearFile}
                  >
                    Remover
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              O CSV deve conter colunas <strong>nome</strong> e <strong>numero</strong>
            </p>
          </>
        )}

        {/* Manual mode */}
        {inputMode === "manual" && (
          <div className="space-y-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="manual-nome" className="text-xs">Nome</Label>
                <Input
                  id="manual-nome"
                  placeholder="João Silva"
                  value={manualNome}
                  onChange={(e) => setManualNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      document.getElementById("manual-numero")?.focus()
                    }
                  }}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="manual-numero" className="text-xs">Número</Label>
                <Input
                  id="manual-numero"
                  placeholder="11999998888"
                  value={manualNumero}
                  onChange={(e) => setManualNumero(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addManualContact()
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={addManualContact}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {manualError && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {manualError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Digite o DDD + número (ex: 11999998888). Pressione Enter para adicionar.
            </p>
          </div>
        )}

        {/* Lista mode */}
        {inputMode === "lista" && (
          <div className="space-y-3">
            {listasLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando listas...
              </div>
            ) : listas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma lista salva. Crie uma em <a href="/contatos" className="underline">Contatos</a>.
              </p>
            ) : (
              <Select
                value={selectedListaId ?? ""}
                onValueChange={(val) => selectLista(val)}
              >
                <SelectTrigger className="w-full" suppressHydrationWarning>
                  <SelectValue placeholder="Selecione uma lista" />
                </SelectTrigger>
                <SelectContent>
                  {listas.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nome} ({l.total_contatos} contatos)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {listaContactsLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando contatos da lista...
              </div>
            )}
          </div>
        )}

        {/* CSV Errors */}
        {csvErrors.length > 0 && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 space-y-1">
            {csvErrors.map((err, i) => (
              <p key={i} className="text-sm text-destructive flex items-start gap-1.5">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {err}
              </p>
            ))}
          </div>
        )}

        {/* Preview table */}
        {contacts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {contacts.length} contato{contacts.length !== 1 ? "s" : ""} carregado{contacts.length !== 1 ? "s" : ""}
            </p>
            <div className="rounded-md border max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Número</TableHead>
                    {inputMode === "manual" && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(inputMode === "manual" ? contacts : contacts.slice(0, 5)).map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>{c.nome}</TableCell>
                      <TableCell className="font-mono text-sm">{c.numero}</TableCell>
                      {inputMode === "manual" && (
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeContact(i)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {inputMode !== "manual" && contacts.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground text-sm">
                        ... e mais {contacts.length - 5} contatos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Message */}
      <div className="space-y-2">
        <Label htmlFor="mensagem" className="text-base font-medium">2. Mensagem</Label>
        <Textarea
          id="mensagem"
          name="mensagem"
          placeholder="Olá {nome}, tudo bem? ..."
          rows={4}
          required
        />
        <p className="text-xs text-muted-foreground">
          Use <code className="bg-muted px-1 rounded">{"{nome}"}</code> para personalizar com o nome do contato
        </p>
      </div>

      {/* Step 3: Delay */}
      <div className="space-y-2">
        <Label className="text-base font-medium">3. Intervalo entre mensagens</Label>
        <div className="flex items-center gap-3">
          <Select value={delay} onValueChange={setDelay}>
            <SelectTrigger className="w-[180px]" suppressHydrationWarning>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 segundos</SelectItem>
              <SelectItem value="10">10 segundos</SelectItem>
              <SelectItem value="15">15 segundos</SelectItem>
              <SelectItem value="30">30 segundos</SelectItem>
              <SelectItem value="60">1 minuto</SelectItem>
              <SelectItem value="120">2 minutos</SelectItem>
              <SelectItem value="180">3 minutos</SelectItem>
              <SelectItem value="300">5 minutos</SelectItem>
              <SelectItem value="600">10 minutos</SelectItem>
            </SelectContent>
          </Select>
          {contacts.length > 1 && (
            <span className="text-sm text-muted-foreground">
              Tempo estimado: ~{estimatedHours > 0 ? `${estimatedHours}h ` : ""}{estimatedMins > 0 ? `${estimatedMins}min ` : ""}{estimatedHours === 0 && estimatedSecs > 0 ? `${estimatedSecs}s` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={isPending || contacts.length === 0 || hasActiveDisparo}
      >
        {isPending ? "Criando disparo..." : hasActiveDisparo
          ? "Aguarde o disparo atual finalizar"
          : "Iniciar Disparo"}
      </Button>
    </form>
  )
}
