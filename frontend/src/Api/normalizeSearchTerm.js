// Emails (and any text with letters) are lowercased; phone numbers keep only their digits
export function normalizeSearchTerm(value) {
  const trimmed = String(value ?? '').trim()
  if (/[a-z@]/i.test(trimmed)) return trimmed.toLowerCase()
  return trimmed.replace(/\D/g, '')
}

export function isPhoneTerm(term) {
  return term !== '' && /^\d+$/.test(term)
}
