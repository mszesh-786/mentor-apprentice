import { loadSession } from '@/auth/session'

export class ApiError extends Error {
  readonly status: number
  readonly body?: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function apiBase(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const session = loadSession()
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = undefined
    }
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      (typeof (body as { message: unknown }).message === 'string' ||
        Array.isArray((body as { message: unknown }).message))
        ? Array.isArray((body as { message: unknown }).message)
          ? ((body as { message: string[] }).message).join(', ')
          : String((body as { message: string }).message)
        : `Request failed (${response.status})`
    throw new ApiError(message, response.status, body)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
