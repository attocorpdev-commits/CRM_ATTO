"use client"

import { useActionState, useState, useRef } from "react"
import { createListaAction } from "./actions"
import { parseCsv, type ParsedContact } from "@/lib/disparos/csv-parser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Upload, FileText, AlertCircle, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

type InputMode = "csv" | "manual"

export function CreateListaForm() {
  const [state, action, isPending] = useActionState(createListaAction, null)
  const [contacts, setContacts] = useState<ParsedContact[]>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<InputMode>("csv")
  const [manualNome, setManualNome] = useState("")
  const [manualNumero, setManualNumero] = useState("")
  const [manualError, setManualError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

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
    if (fileRef.current) fileRef.current.value = ""
  }

  function addManualContact() {
    const nome = manualNome.trim()
    const numero = manualNumero.replace(/\D/g, "")

    if (!nome) { setManualError("Informe o nome"); return }
    if (!numero) { setManualError("Informe o número"); return }

    let normalized = numero
    if (numero.length >= 10 && numero.length <= 11 && !numero.startsWith("55")) {
      normalized = `55${numero}`
    }
    if (normalized.length < 12 || normalized.length > 13) {
      setManualError("Número inválido. Use DDD + número (ex: 11999998888)")
      return
    }

    if (contacts.length >= 1000) {
      setManualError("Máximo de 1000 contatos por lista")
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

  // Redirect after successful creation
  if (state?.success && state?.listaId) {
    router.push(`/contatos/${state.listaId}`)
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="contacts" value={JSON.stringify(contacts)} />

      <div className="space-y-2">
        <Label htmlFor="nome">Nome da lista</Label>
        <Input
          id="nome"
          name="nome"
          placeholder="Ex: Clientes VIP, Leads Março..."
          required
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Contatos</Label>

        <div className="flex gap-2">
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
        </div>

        {inputMode === "csv" && (
          <>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Selecionar arquivo
              </Button>
              {fileName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{fileName}</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearFile}>
                    Remover
                  </Button>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground">
              O CSV deve conter colunas <strong>nome</strong> e <strong>numero</strong>
            </p>
          </>
        )}

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
                    if (e.key === "Enter") { e.preventDefault(); document.getElementById("manual-numero")?.focus() }
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
                    if (e.key === "Enter") { e.preventDefault(); addManualContact() }
                  }}
                />
              </div>
              <Button type="button" size="sm" onClick={addManualContact} className="shrink-0">
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

        {contacts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {contacts.length} contato{contacts.length !== 1 ? "s" : ""}
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
                  {inputMode === "csv" && contacts.length > 5 && (
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

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending || contacts.length === 0}>
        {isPending ? "Criando lista..." : "Criar Lista"}
      </Button>
    </form>
  )
}
