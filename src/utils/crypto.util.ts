import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16  // 128 bits

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || ''
  if (!raw) throw new Error('ENCRYPTION_KEY manquant dans les variables d\'environnement')
  // Dérive une clé de 32 octets depuis la valeur brute (hex ou texte quelconque)
  return crypto.createHash('sha256').update(raw).digest()
}

/**
 * Chiffre une chaîne en clair.
 * Retourne une chaîne encodée en base64  : "<iv_hex>:<ciphertext_hex>"
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Déchiffre une chaîne produite par encrypt().
 * Retourne la valeur en clair, ou null si la valeur est nulle/vide.
 */
export function decrypt(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null
  const [ivHex, encHex] = ciphertext.split(':')
  if (!ivHex || !encHex) return null
  try {
    const iv = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}

/**
 * Indique si une valeur est déjà chiffrée (format iv:ciphertext).
 * Évite de re-chiffrer une valeur déjà chiffrée.
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false
  const parts = value.split(':')
  return parts.length === 2 && /^[0-9a-f]{32}$/i.test(parts[0])
}
