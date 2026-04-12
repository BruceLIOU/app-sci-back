export interface ParsedChargeData {
  amount: number
  date: string // format YYYY-MM-DD
}

/**
 * Patterns pour extraire le montant d'un email MATERA.
 * Formats couverts : "350,00 €", "1 200.50€", "350.00 EUR", "350 euros"
 * Ajustez ces regex selon le format réel des emails reçus.
 */
const AMOUNT_PATTERNS = [
  /(\d[\d\s]*[.,]\d{2})\s*€/,
  /(\d[\d\s]*[.,]\d{2})\s*EUR/i,
  /(\d[\d\s]*[.,]\d{2})\s*euros?/i,
  /montant[^:]*:\s*(\d[\d\s]*[.,]\d{2})/i,
  /appel de fonds[^:]*:\s*(\d[\d\s]*[.,]\d{2})/i,
  /pr[eé]l[eè]vement[^:]*:\s*(\d[\d\s]*[.,]\d{2})/i,
]

/**
 * Patterns pour extraire la date d'un email MATERA.
 * Formats couverts : "01/04/2026", "01-04-2026", "1 avril 2026", "April 1, 2026"
 */
const DATE_PATTERNS = [
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  /(\d{1,2})-(\d{1,2})-(\d{4})/,
  /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
]

const FRENCH_MONTHS: Record<string, string> = {
  janvier: '01', février: '02', mars: '03', avril: '04',
  mai: '05', juin: '06', juillet: '07', août: '08',
  septembre: '09', octobre: '10', novembre: '11', décembre: '12',
}

function parseAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      // Supprimer les espaces (séparateur milliers), normaliser la virgule en point
      const clean = match[1].replace(/\s/g, '').replace(',', '.')
      const amount = parseFloat(clean)
      if (!isNaN(amount) && amount > 0) return amount
    }
  }
  return null
}

function parseDate(text: string, fallback: Date): string {
  // Format numérique JJ/MM/AAAA ou JJ-MM-AAAA
  for (const pattern of DATE_PATTERNS.slice(0, 2)) {
    const match = text.match(pattern)
    if (match) {
      const day = match[1].padStart(2, '0')
      const month = match[2].padStart(2, '0')
      const year = match[3]
      return `${year}-${month}-${day}`
    }
  }

  // Format littéral : "1 avril 2026"
  const litMatch = text.match(DATE_PATTERNS[2])
  if (litMatch) {
    const day = litMatch[1].padStart(2, '0')
    const month = FRENCH_MONTHS[litMatch[2].toLowerCase()] || '01'
    const year = litMatch[3]
    return `${year}-${month}-${day}`
  }

  // Fallback sur la date de l'email
  const d = fallback
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${year}-${month}-${day}`
}

/**
 * Détermine si un email est un vrai appel de fonds avec montant attendu
 * (et non un message privé, invitation, ou autre notification MATERA).
 */
export function isFundCallEmail(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes('appel de fonds') &&
    (lower.includes('prélevé') || lower.includes('prélèvement') || lower.includes('montant'))
  )
}

/**
 * Parse le corps d'un email MATERA pour en extraire montant et date.
 * Retourne null si le montant est introuvable.
 */
export function parseMateraEmail(
  text: string,
  html: string,
  emailDate: Date,
): ParsedChargeData | null {
  // Préférer le texte brut, sinon extraire le texte du HTML en supprimant les balises
  const source = text || html.replace(/<[^>]+>/g, ' ')

  const amount = parseAmount(source)
  if (amount === null) return null

  const date = parseDate(source, emailDate)

  return { amount, date }
}
