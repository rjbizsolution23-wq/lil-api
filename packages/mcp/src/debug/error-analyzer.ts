/**
 * Error Analyzer - Traces errors to root cause with exact fix recommendations
 */

export interface ErrorAnalysis {
  errorType: 'http' | 'auth' | 'database' | 'typescript' | 'network' | 'cloudflare' | 'unknown'
  statusCode?: number
  rootCause: string
  fix: string
  confidence: number
  references: string[]
}

const ERROR_PATTERNS: Record<string, { type: ErrorAnalysis['errorType']; rootCause: string; fix: string }> = {
  // HTTP Errors
  '400': { type: 'http', rootCause: 'Request schema validation failed', fix: 'Check Zod validation - request body does not match expected schema' },
  '401': { type: 'auth', rootCause: 'No token, expired token, or invalid token', fix: 'Trigger token refresh or force re-login. Check token expiry.' },
  '403': { type: 'auth', rootCause: 'Token valid but lacks required permissions', fix: 'Check OAuth scopes, check RLS policies, request additional permissions' },
  '404': { type: 'http', rootCause: 'Resource does not exist or URL path is wrong', fix: 'Verify path parameters, check slugification, confirm resource ID exists' },
  '409': { type: 'http', rootCause: 'Uniqueness constraint violation', fix: 'Handle with upsert pattern or return 409 to user with conflicting field' },
  '422': { type: 'http', rootCause: 'Validation passed schema but failed business rules', fix: 'Return field-level errors for specific business rule violations' },
  '429': { type: 'http', rootCause: 'Rate limit exceeded', fix: 'Read Retry-After header, implement exponential backoff, track rate limit budget' },
  '500': { type: 'http', rootCause: 'Server error - upstream API is broken', fix: 'Retry with backoff, open circuit breaker after 5 failures, alert monitoring' },
  '502': { type: 'http', rootCause: 'Bad Gateway - upstream returned invalid response', fix: 'Retry, check upstream API status' },
  '503': { type: 'http', rootCause: 'Service unavailable - upstream is overloaded', fix: 'Retry with longer backoff, circuit break' },
  '504': { type: 'http', rootCause: 'Gateway timeout - upstream took too long', fix: 'Increase timeout, check upstream API latency, implement caching' },

  // Auth Errors
  'invalid_grant': { type: 'auth', rootCause: 'Refresh token expired or already used', fix: 'Force re-login, clear session, request new authorization' },
  'invalid_client': { type: 'auth', rootCause: 'Client ID or secret is incorrect', fix: 'Check wrangler secret put for CLIENT_SECRET, verify credentials in dashboard' },
  'insufficient_scope': { type: 'auth', rootCause: 'OAuth app needs additional scopes', fix: 'Re-request authorization with additional scopes' },
  'token_expired': { type: 'auth', rootCause: 'JWT token has expired', fix: 'Implement token refresh before expiry, check clock skew' },

  // Database Errors (PostgreSQL)
  '23505': { type: 'database', rootCause: 'Unique constraint violation (duplicate key)', fix: 'Use upsert pattern: ON CONFLICT DO UPDATE, or return 409 to user' },
  '23503': { type: 'database', rootCause: 'Foreign key violation - referenced record missing', fix: 'Validate referenced record exists before insert' },
  '40001': { type: 'database', rootCause: 'Serialization failure - transaction conflict', fix: 'Retry transaction up to 3 times with exponential backoff' },
  '53300': { type: 'database', rootCause: 'Too many connections', fix: 'Check connection pool limits, use PgBouncer, implement connection pooling' },
  '57014': { type: 'database', rootCause: 'Query canceled - exceeded statement_timeout', fix: 'Optimize query, increase timeout for specific operation, add index' },

  // TypeScript Errors
  "Type 'undefined' is not assignable": { type: 'typescript', rootCause: 'Null check missing on potentially undefined value', fix: 'Add ?. optional chaining or ?? nullish coalescing' },
  "Object is possibly 'null'": { type: 'typescript', rootCause: 'TypeScript detected potential null access', fix: 'Add null guard before accessing the property' },
  "Property .* does not exist on type": { type: 'typescript', rootCause: 'Type definition is wrong or outdated', fix: 'Regenerate types from API spec, check for typo in property name' },
  'No overload matches this call': { type: 'typescript', rootCause: 'Function called with wrong argument types', fix: 'Check function signature, verify argument types match' },

  // Cloudflare Errors
  'Script startup exceeded CPU time limit': { type: 'cloudflare', rootCause: 'Worker doing too much at startup', fix: 'Move initialization to lazy loading, split into smaller chunks' },
  'Durable Object exceeded memory limit': { type: 'cloudflare', rootCause: 'In-memory state too large in Durable Object', fix: 'Move state to SQLite storage within DO' },
  'KV namespace not found': { type: 'cloudflare', rootCause: 'Binding name in wrangler.toml does not match namespace', fix: 'Run wrangler kv namespace list to verify names' },
  'unrecognized arguments: --local': { type: 'cloudflare', rootCause: 'Wrangler CLI version outdated', fix: 'Run pnpm add -g wrangler@latest' },

  // Network Errors
  'fetch failed': { type: 'network', rootCause: 'Network request failed - DNS, timeout, connection reset', fix: 'Check network connectivity, verify URL, implement retry logic' },
  'ECONNREFUSED': { type: 'network', rootCause: 'Connection refused - server not running or port blocked', fix: 'Verify server is running, check firewall rules' },
  'ETIMEDOUT': { type: 'network', rootCause: 'Connection timed out', fix: 'Increase timeout, check server latency, retry with backoff' },
  'ENOTFOUND': { type: 'network', rootCause: 'DNS lookup failed - domain does not exist', fix: 'Verify domain name, check DNS configuration' },
}

export function analyzeError(errorMessage: string, context: string, apiName?: string): ErrorAnalysis {
  const lowerMessage = errorMessage.toLowerCase()

  // Check for known error patterns
  for (const [pattern, analysis] of Object.entries(ERROR_PATTERNS)) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return {
        ...analysis,
        confidence: 0.9,
        references: getReferences(pattern, apiName),
      }
    }
  }

  // Try to extract HTTP status code
  const statusMatch = errorMessage.match(/\b([45]\d{2})\b/)
  if (statusMatch) {
    const status = parseInt(statusMatch[1], 10)
    if (status >= 400 && status < 600) {
      return {
        errorType: 'http',
        statusCode: status,
        rootCause: `HTTP ${status} error occurred`,
        fix: getFixForStatus(status),
        confidence: 0.7,
        references: getReferences(String(status), apiName),
      }
    }
  }

  // Check for network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connect')) {
    return {
      errorType: 'network',
      rootCause: 'Network connectivity issue',
      fix: 'Check internet connection, verify API endpoint is reachable, implement retry logic',
      confidence: 0.6,
      references: [],
    }
  }

  // Default to unknown
  return {
    errorType: 'unknown',
    rootCause: 'Unknown error - unable to classify',
    fix: 'Check error message for more details, search API provider documentation',
    confidence: 0.3,
    references: [],
  }
}

function getFixForStatus(status: number): string {
  const fixes: Record<number, string> = {
    400: 'Validate request body against schema - check all required fields and types',
    401: 'Refresh access token or re-authenticate - check token expiry',
    403: 'Verify user has required permissions - check scopes and RLS policies',
    404: 'Verify resource exists and URL path is correct',
    409: 'Handle conflict - likely duplicate, use upsert or inform user',
    422: 'Check business rule validation - return field-level errors',
    429: 'Implement rate limiting - use exponential backoff',
    500: 'Retry with backoff - upstream server error',
    502: 'Retry - upstream returned invalid response',
    503: 'Retry with longer backoff - service overloaded',
    504: 'Increase timeout - upstream took too long',
  }
  return fixes[status] || 'Check error details for more information'
}

function getReferences(pattern: string, apiName?: string): string[] {
  const refs: string[] = []

  // Add API-specific references if known
  if (apiName) {
    const apiDocs: Record<string, string> = {
      stripe: 'https://stripe.com/docs/error-codes',
      twilio: 'https://www.twilio.com/docs/api/errors',
      openai: 'https://platform.openai.com/docs/guides/error-codes',
      github: 'https://docs.github.com/en/rest',
      shopify: 'https://shopify.dev/docs/api/admin-rest',
      salesforce: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/errorcodes.htm',
    }
    if (apiDocs[apiName.toLowerCase()]) {
      refs.push(apiDocs[apiName.toLowerCase()])
    }
  }

  // Add general references
  refs.push('https://developer.mozilla.org/en-US/docs/Web/HTTP/Status')
  refs.push('www.postgresql.org/docs/current/errcodes.html')

  return refs
}
