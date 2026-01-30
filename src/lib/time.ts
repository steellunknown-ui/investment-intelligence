export function formatUpdatedLabel(dateIso: string | null | undefined): string {
  if (!dateIso) return 'Updated —'
  
  const date = new Date(dateIso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffHours < 24) return 'Updated Today'
  if (diffHours < 48) return 'Updated Yesterday'
  return `Updated ${diffDays} days ago`
}

export function formatDateTime(dateIso: string | null | undefined): string {
  if (!dateIso) return '—'
  
  const date = new Date(dateIso)
  
  // Indian date format: dd/mm/yyyy • hh:mm AM/PM
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  
  const time = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  
  return `${day}/${month}/${year} • ${time}`
}

export function formatDateOnly(dateIso: string | null | undefined): string {
  if (!dateIso) return '—'
  
  const date = new Date(dateIso)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  
  return `${day}/${month}/${year}`
}