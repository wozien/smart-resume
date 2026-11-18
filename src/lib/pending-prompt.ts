const STORAGE_PREFIX = 'pending-resume-prompt:'
const memoryFallback = new Map<string, string>()

export function setPendingPrompt(resumeId: string, prompt: string) {
  const trimmed = prompt.trim()
  if (!trimmed) return
  memoryFallback.set(resumeId, trimmed)
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${resumeId}`, trimmed)
  } catch {
    // private mode / storage quota
  }
}

export function takePendingPrompt(resumeId: string): string | null {
  const fromMemory = memoryFallback.get(resumeId) ?? null
  memoryFallback.delete(resumeId)

  if (typeof window === 'undefined') return fromMemory
  try {
    const key = `${STORAGE_PREFIX}${resumeId}`
    const fromStorage = window.sessionStorage.getItem(key)
    if (fromStorage !== null) {
      window.sessionStorage.removeItem(key)
      return fromStorage
    }
  } catch {
    // ignore storage errors
  }
  return fromMemory
}
