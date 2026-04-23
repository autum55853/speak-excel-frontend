import { ApiError } from './apiError'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined
if (!BASE_URL) throw new Error('VITE_API_BASE_URL 未設定，請確認 .env 檔案')

// Phase 6 接入登入後改為讀取 Pinia store 或 localStorage['auth_token']
function getAuthToken(): string | undefined {
  return undefined
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10_000)

  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined ?? {}),
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    if (res.status === 204) return undefined as T

    const json = await res.json()
    if (!res.ok) {
      throw new ApiError(res.status, json?.error ?? `HTTP ${res.status}`)
    }
    return json as T
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof ApiError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, '請求逾時，請稍後再試')
    }
    throw new ApiError(0, err instanceof Error ? err.message : '網路錯誤')
  }
}
