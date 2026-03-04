import Papa from "papaparse"

export interface ParsedContact {
  nome: string
  numero: string
}

export interface CsvParseResult {
  contacts: ParsedContact[]
  errors: string[]
}

const MAX_CONTACTS = 1000

/**
 * Normalize a Brazilian phone number to the format Evolution API expects.
 * Strips non-digits, prepends 55 if needed.
 * Returns the number as digits only (e.g. "5511999998888").
 */
function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length >= 12 && digits.startsWith("55")) return digits
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`
  return digits
}

/**
 * Parse a CSV string with columns `nome` and `numero`.
 * Returns validated contacts and any row-level errors.
 */
export function parseCsv(csvText: string): CsvParseResult {
  const errors: string[] = []

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  if (result.errors.length > 0) {
    errors.push(
      ...result.errors.map(
        (e) => `Linha ${(e.row ?? 0) + 2}: ${e.message}`
      )
    )
  }

  const headers = result.meta.fields?.map((f) => f.toLowerCase()) ?? []
  if (!headers.includes("nome")) {
    errors.push('Coluna "nome" não encontrada no CSV')
    return { contacts: [], errors }
  }
  if (!headers.includes("numero")) {
    errors.push('Coluna "numero" não encontrada no CSV')
    return { contacts: [], errors }
  }

  if (result.data.length === 0) {
    errors.push("O CSV está vazio")
    return { contacts: [], errors }
  }

  if (result.data.length > MAX_CONTACTS) {
    errors.push(`Máximo de ${MAX_CONTACTS} contatos por disparo`)
    return { contacts: [], errors }
  }

  const contacts: ParsedContact[] = []

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]
    const rowNum = i + 2 // 1-indexed + header row
    const nome = row.nome?.trim()
    const numero = row.numero?.trim()

    if (!nome) {
      errors.push(`Linha ${rowNum}: nome está vazio`)
      continue
    }
    if (!numero) {
      errors.push(`Linha ${rowNum}: numero está vazio`)
      continue
    }

    const normalized = normalizePhoneNumber(numero)
    if (normalized.length < 12 || normalized.length > 13) {
      errors.push(`Linha ${rowNum}: numero inválido "${numero}"`)
      continue
    }

    contacts.push({ nome, numero: normalized })
  }

  return { contacts, errors }
}
