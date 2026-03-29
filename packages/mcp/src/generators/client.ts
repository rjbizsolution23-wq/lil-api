/**
 * API Client Generator - Generates typed HTTP client with retry, auth, error handling
 */

import type { ApiMap, Endpoint } from '../parsers/openapi.js'

export function generateApiClient(apiMap: ApiMap, clientName: string, baseUrl: string): string {
  const endpoints = apiMap.endpoints
  const types = generateTypes(apiMap)

  let code = `/**
 * ${clientName} - Generated API Client
 * Auto-generated from OpenAPI spec
 * Version: ${apiMap.version}
 */

import { z } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

${types}

// ============================================================================
// CONFIG
// ============================================================================

interface ClientConfig {
  baseUrl: string
  headers?: Record<string, string>
  fetch?: typeof fetch
  retries?: number
  retryDelay?: number
  onAuthRefresh?: () => Promise<string>
}

const defaultConfig: ClientConfig = {
  baseUrl: '${baseUrl}',
  fetch: globalThis.fetch,
  retries: 3,
  retryDelay: 1000,
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown,
    public endpoint?: string
  ) {
    super(\`[\${status}] \${statusText}\`)
    this.name = 'ApiError'
  }
}

export class RateLimitError extends ApiError {
  constructor(
    public retryAfter: number,
    public limit: number,
    public remaining: number
  ) {
    super(429, 'Too Many Requests')
    this.name = 'RateLimitError'
  }
}

export class AuthError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, message)
    this.name = 'AuthError'
  }
}

// ============================================================================
// REQUEST / RESPONSE HELPERS
// ============================================================================

async function request<T>(\n  config: ClientConfig,\n  endpoint: string,\n  options: RequestInit = {}\n): Promise<T> {
  const url = \`\${config.baseUrl}\${endpoint}\`
  const headers = { ...config.headers, ...options.headers }

  const response = await config.fetch!(url, {
    ...options,
    headers,
  })

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10)
    const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '60', 10)
    const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10)
    throw new RateLimitError(retryAfter, limit, remaining)
  }

  // Handle auth errors
  if (response.status === 401) {
    // Try to refresh auth
    if (config.onAuthRefresh) {
      const newToken = await config.onAuthRefresh()
      headers['Authorization'] = \`Bearer \${newToken}\`
      const retryResponse = await config.fetch!(url, { ...options, headers })
      if (retryResponse.ok) {
        return retryResponse.json()
      }
    }
    throw new AuthError()
  }

  // Handle other errors
  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = await response.text()
    }
    throw new ApiError(response.status, response.statusText, body, endpoint)
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return response.json()
  }
  return response.text() as T
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

async function withRetry<T>(
  fn: () => Promise<T>,
  config: ClientConfig
): Promise<T> {
  const maxAttempts = config.retries ?? 3
  const baseDelay = config.retryDelay ?? 1000

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts) throw error

      // Only retry on specific errors
      if (error instanceof RateLimitError) {
        await new Promise(r => setTimeout(r, error.retryAfter * 1000))
        continue
      }

      if (error instanceof ApiError && [500, 502, 503, 504].includes(error.status)) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 30000)
        await new Promise(r => setTimeout(r, delay))
        continue
      }

      // Don't retry on other errors
      throw error
    }
  }
  throw new Error('Unreachable')
}

// ============================================================================
// API CLIENT
// ============================================================================

export class ${clientName}Client {
  constructor(private config: ClientConfig) {
    this.config = { ...defaultConfig, ...config }
  }

  // Auth
  setAuthToken(token: string) {
    this.config.headers = {
      ...this.config.headers,
      Authorization: \`Bearer \${token}\`,
    }
  }

  clearAuth() {
    delete this.config.headers?.Authorization
  }

  // ========================================================================
  // ENDPOINTS
  // ========================================================================
`

  // Generate method for each endpoint
  for (const endpoint of endpoints) {
    const methodName = toCamelCase(endpoint.operationId || `${endpoint.method}_${endpoint.path}`)
    const method = endpoint.method.toLowerCase()

    code += `\n  async ${methodName}(`

    // Parameters
    const pathParams = endpoint.parameters.filter(p => p.in === 'path')
    const queryParams = endpoint.parameters.filter(p => p.in === 'query')
    const hasBody = endpoint.requestBody

    if (pathParams.length > 0) {
      code += `params: { `
      for (const p of pathParams) {
        code += `${p.name}${p.required ? '' : '?'}: string, `
      }
      code += `}, `
    }

    if (queryParams.length > 0) {
      code += `query?: { `
      for (const p of queryParams) {
        code += `${p.name}${p.required ? '' : '?'}: ${toTsType(p.schema)}, `
      }
      code += `}, `
    }

    if (hasBody) {
      code += `body?: ${toTypeName(endpoint.operationId)}Body, `
    }

    code += `options?: RequestInit) {\n`

    // Build URL with path params
    let url = endpoint.path
    if (pathParams.length > 0) {
      for (const p of pathParams) {
        url = url.replace(\`{\${p.name}}\`, \`\${encodeURIComponent(params.\${p.name})}\`)
      }
    }

    // Add query params
    if (queryParams.length > 0) {
      url += '?'
      for (let i = 0; i < queryParams.length; i++) {
        const p = queryParams[i]
        url += \`\${p.name}=\${encodeURIComponent(query?\${p.name})}`
        if (i < queryParams.length - 1) url += '&'
      }
    }

    code += `    return withRetry(() => request<${toTypeName(endpoint.operationId)}Response>(
      this.config,
      '\${url}',
      {
        method: '${endpoint.method.toUpperCase()}',
        headers: options?.headers,
        body: body ? JSON.stringify(body) : undefined,
      }
    ), this.config)\n  }\n`
  }

  code += `}

// ============================================================================
// FACTORY
// ============================================================================

export function create${clientName}Client(config: Partial<ClientConfig>) {
  return new ${clientName}Client({ ...defaultConfig, ...config })
}
`

  return code
}

// ============================================================================
// HELPERS
// ============================================================================

function toCamelCase(str: string): string {
  return str.replace(/[-_](\w)/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^[A-Z]/, c => c.toLowerCase())
}

function toTypeName(operationId: string): string {
  if (!operationId) return 'unknown'
  return operationId.split(/[-_]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

function toTsType(schema: { type: string; format?: string }): string {
  const typeMap: Record<string, string> = {
    string: 'string',
    integer: 'number',
    number: 'number',
    boolean: 'boolean',
    array: 'unknown[]',
    object: 'Record<string, unknown>',
  }
  return typeMap[schema.type] || 'unknown'
}
