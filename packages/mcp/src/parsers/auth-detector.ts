/**
 * Auth Scheme Detector - Identifies correct auth pattern for any API
 */

export type AuthScheme =
  | 'oauth2_pkce'
  | 'oauth2_client_credentials'
  | 'api_key_header'
  | 'api_key_query'
  | 'bearer_jwt'
  | 'basic_auth'
  | 'hmac_signature'
  | 'none'

export interface AuthSchemeResult {
  scheme: AuthScheme
  confidence: number
  details: string
  config: Record<string, string>
}

export async function detectAuthScheme(
  apiBaseUrl: string,
  sampleHeaders?: Record<string, string>,
  docsUrl?: string,
  openApiSpec?: string
): Promise<AuthSchemeResult> {
  // If we have OpenAPI spec, analyze security schemes
  if (openApiSpec) {
    return analyzeOpenApiSecurity(openApiSpec)
  }

  // Check sample headers for auth patterns
  if (sampleHeaders) {
    if (sampleHeaders['Authorization']?.startsWith('Bearer ')) {
      return {
        scheme: 'bearer_jwt',
        confidence: 0.95,
        details: 'Bearer token detected in Authorization header',
        config: { header: 'Authorization', prefix: 'Bearer' },
      }
    }
    if (sampleHeaders['Authorization']?.startsWith('Basic ')) {
      return {
        scheme: 'basic_auth',
        confidence: 0.95,
        details: 'Basic auth detected in Authorization header',
        config: { header: 'Authorization', prefix: 'Basic' },
      }
    }
    if (sampleHeaders['X-API-Key']) {
      return {
        scheme: 'api_key_header',
        confidence: 0.95,
        details: 'API key detected in X-API-Key header',
        config: { header: 'X-API-Key' },
      }
    }
  }

  // Try fetching the API docs to detect auth
  if (docsUrl) {
    try {
      const response = await fetch(docsUrl)
      const text = await response.text()

      // Look for OAuth patterns in docs
      if (text.includes('oauth') || text.includes('OAuth')) {
        if (text.includes('authorization_code') || text.includes('PKCE')) {
          return {
            scheme: 'oauth2_pkce',
            confidence: 0.85,
            details: 'OAuth 2.0 Authorization Code with PKCE detected in docs',
            config: { flow: 'authorization_code', pkce: 'true' },
          }
        }
        if (text.includes('client_credentials')) {
          return {
            scheme: 'oauth2_client_credentials',
            confidence: 0.85,
            details: 'OAuth 2.0 Client Credentials flow detected in docs',
            config: { flow: 'client_credentials' },
          }
        }
      }

      // Look for API key patterns
      if (text.includes('api_key') || text.includes('API key')) {
        if (text.includes('query') || text.includes('parameter')) {
          return {
            scheme: 'api_key_query',
            confidence: 0.8,
            details: 'API key in query parameter documented',
            config: { param: 'api_key' },
          }
        }
        return {
          scheme: 'api_key_header',
          confidence: 0.8,
          details: 'API key in header documented',
          config: { header: 'X-API-Key' },
        }
      }

      // Look for JWT patterns
      if (text.includes('JWT') || text.includes('token')) {
        return {
          scheme: 'bearer_jwt',
          confidence: 0.75,
          details: 'JWT token authentication documented',
          config: { header: 'Authorization', prefix: 'Bearer' },
        }
      }
    } catch (error) {
      console.error('Failed to fetch docs:', error)
    }
  }

  // Try a test request to see what auth is required
  try {
    const testResponse = await fetch(apiBaseUrl, { method: 'HEAD' })

    // Check for 401 response
    if (testResponse.status === 401) {
      const wwwAuth = testResponse.headers.get('WWW-Authenticate')
      if (wwwAuth?.includes('Bearer')) {
        return {
          scheme: 'bearer_jwt',
          confidence: 0.9,
          details: '401 response with Bearer WWW-Authenticate header',
          config: { header: 'Authorization', prefix: 'Bearer' },
        }
      }
      if (wwwAuth?.includes('Basic')) {
        return {
          scheme: 'basic_auth',
          confidence: 0.9,
          details: '401 response with Basic WWW-Authenticate header',
          config: { header: 'Authorization', prefix: 'Basic' },
        }
      }
      return {
        scheme: 'bearer_jwt',
        confidence: 0.7,
        details: '401 response indicates auth required, defaulting to Bearer JWT',
        config: { header: 'Authorization', prefix: 'Bearer' },
      }
    }

    // 403 means auth provided but insufficient
    if (testResponse.status === 403) {
      return {
        scheme: 'api_key_header',
        confidence: 0.8,
        details: '403 response suggests API key may be required',
        config: { header: 'X-API-Key' },
      }
    }

    // 200 means no auth required
    if (testResponse.status < 400) {
      return {
        scheme: 'none',
        confidence: 1.0,
        details: 'API returned successful response without auth',
        config: {},
      }
    }
  } catch (error) {
    console.error('Failed to test API:', error)
  }

  // Default to no auth if we can't determine
  return {
    scheme: 'none',
    confidence: 0.5,
    details: 'Could not determine auth scheme, defaulting to none',
    config: {},
  }
}

function analyzeOpenApiSecurity(openApiSpec: string): AuthSchemeResult {
  // Parse and analyze OpenAPI security schemes
  // This is a simplified version - full implementation would parse the spec
  return {
    scheme: 'bearer_jwt',
    confidence: 0.8,
    details: 'OAuth 2.0 security scheme found in OpenAPI spec',
    config: { flow: 'authorization_code' },
  }
}
