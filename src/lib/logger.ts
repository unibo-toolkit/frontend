interface LogEntry {
  level: 'error' | 'warn' | 'info'
  message: string
  context?: Record<string, unknown>
  timestamp: string
  url?: string
}

export function logError(message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level: 'error',
    message,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  }
  console.error(JSON.stringify(entry))
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level: 'info',
    message,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  }
  console.info(JSON.stringify(entry))
}
