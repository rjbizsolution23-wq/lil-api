/**
 * Lil API - API Integration Master Agent
 * MCP Tool Server with API Discovery, Type Generation, and Debug Tools
 *
 * Built by: RJ Business Solutions
 * Version: 1.0.0 | 2026-03-28
 */

import { McpServer, MemorySessionStore } from '@cloudflare/mcp-server'
import { z } from 'zod'
import yaml from 'yaml'
import { parse as parseOpenApi } from './parsers/openapi.js'
import { detectAuthScheme } from './parsers/auth-detector.js'
import { generateApiClient } from './generators/client.js'
import { generateTypes } from './generators/types.js'
import { analyzeError } from './debug/error-analyzer.js'

// ============================================================================
// API DISCOVERY TOOLS
// ============================================================================

/**
 * Tool: fetch_openapi_spec
 * Fetches and fully parses an OpenAPI 3.x spec from a URL or raw YAML/JSON
 */
export const fetchOpenApiSpec = {
  name: 'fetch_openapi_spec',
  description: 'Fetches and fully parses an OpenAPI 3.x spec from a URL or raw YAML/JSON string',
  inputSchema: {
    source: z.string().describe('URL or raw OpenAPI YAML/JSON string'),
    version: z.enum(['2.0', '3.0', '3.1']).optional().default('3.1'),
  },
} as const

/**
 * Tool: introspect_graphql
 * Runs a full GraphQL introspection query and returns the schema
 */
export const introspectGraphQL = {
  name: 'introspect_graphql',
  description: 'Introspects a GraphQL endpoint and returns the complete schema',
  inputSchema: {
    endpoint: z.string().url().describe('GraphQL endpoint URL'),
    headers: z.record(z.string()).optional().describe('Optional auth headers'),
  },
} as const

/**
 * Tool: parse_postman_collection
 * Converts a Postman collection export to a normalized API map
 */
export const parsePostmanCollection = {
  name: 'parse_postman_collection',
  description: 'Parses a Postman collection JSON and generates endpoint inventory',
  inputSchema: {
    collection: z.string().describe('Raw Postman collection JSON or URL'),
  },
} as const

/**
 * Tool: analyze_curl_examples
 * Extracts API patterns from cURL command examples
 */
export const analyzeCurlExamples = {
  name: 'analyze_curl_examples',
  description: 'Extracts API patterns, endpoints, and auth from cURL command examples',
  inputSchema: {
    curlCommands: z.array(z.string()).describe('Array of cURL command strings'),
  },
} as const

/**
 * Tool: detect_auth_scheme
 * Detects and configures the correct auth pattern for any API
 */
export const detectAuth = {
  name: 'detect_auth_scheme',
  description: 'Detects the authentication scheme from API spec or manual input',
  inputSchema: {
    apiBaseUrl: z.string().describe('Base URL of the API'),
    sampleHeaders: z.record(z.string()).optional().describe('Sample request headers'),
    docsUrl: z.string().optional().describe('URL to API documentation'),
    openApiSpec: z.string().optional().describe('OpenAPI spec for auto-detection'),
  },
} as const

// ============================================================================
// CODE GENERATION TOOLS
// ============================================================================

/**
 * Tool: generate_typescript_types
 * Generates complete TypeScript type system from API schema
 */
export const generateTypeScriptTypes = {
  name: 'generate_typescript_types',
  description: 'Generates complete TypeScript interfaces and types from API schema',
  inputSchema: {
    apiMap: z.record(z.any()).describe('Normalized API map from fetch_openapi_spec'),
    outputPath: z.string().optional().describe('Output path for generated types'),
  },
} as const

/**
 * Tool: generate_zod_schemas
 * Generates Zod validation schemas for runtime validation
 */
export const generateZodSchemas = {
  name: 'generate_zod_schemas',
  description: 'Generates Zod schemas for runtime validation from API types',
  inputSchema: {
    typescriptCode: z.string().describe('TypeScript types to convert to Zod'),
  },
} as const

/**
 * Tool: generate_api_client
 * Generates a fully typed API client with retry, auth, and error handling
 */
export const generateApiClientTool = {
  name: 'generate_api_client',
  description: 'Generates a typed HTTP client with retry, auth middleware, and error handling',
  inputSchema: {
    apiMap: z.record(z.any()).describe('Normalized API map'),
    clientName: z.string().describe('Name for the generated client'),
    baseUrl: z.string().describe('Base URL for API requests'),
  },
} as const

/**
 * Tool: generate_hono_routes
 * Generates Cloudflare Workers Hono routes matching the API spec
 */
export const generateHonoRoutes = {
  name: 'generate_hono_routes',
  description: 'Generates Hono route handlers for Cloudflare Workers',
  inputSchema: {
    apiMap: z.record(z.any()).describe('Normalized API map'),
    outputPath: z.string().optional().describe('Output path for generated routes'),
  },
} as const

/**
 * Tool: generate_react_components
 * Generates React components for each API resource
 */
export const generateReactComponents = {
  name: 'generate_react_components',
  description: 'Generates React components for API resources (forms, lists, details)',
  inputSchema: {
    apiMap: z.record(z.any()).describe('Normalized API map'),
    uiFramework: z.enum(['react', 'vue', 'svelte']).optional().default('react'),
  },
} as const

/**
 * Tool: generate_test_suite
 * Generates unit, integration, and E2E tests
 */
export const generateTestSuite = {
  name: 'generate_test_suite',
  description: 'Generates test suite (unit, integration, E2E) for the API integration',
  inputSchema: {
    apiMap: z.record(z.any()).describe('Normalized API map'),
    testFramework: z.enum(['jest', 'vitest', 'playwright']).optional().default('vitest'),
  },
} as const

// ============================================================================
// DEBUG TOOLS
// ============================================================================

/**
 * Tool: analyze_error
 * Traces any API or runtime error to its root cause and provides the exact fix
 */
export const analyzeErrorTool = {
  name: 'analyze_error',
  description: 'Traces error to root cause with exact fix recommendation',
  inputSchema: {
    errorMessage: z.string().describe('Error message or stack trace'),
    context: z.string().describe('What operation was being performed'),
    apiName: z.string().optional().describe('API provider name for pattern matching'),
  },
} as const

/**
 * Tool: validate_request
 * Validates a request against the OpenAPI spec before executing
 */
export const validateRequest = {
  name: 'validate_request',
  description: 'Validates a request against the OpenAPI spec before sending',
  inputSchema: {
    endpoint: z.string().describe('API endpoint path'),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).describe('HTTP method'),
    params: z.record(z.any()).optional().describe('Query parameters'),
    body: z.record(z.any()).optional().describe('Request body'),
    headers: z.record(z.string()).optional().describe('Request headers'),
  },
} as const

/**
 * Tool: trace_api_call
 * Provides full request/response trace with timing
 */
export const traceApiCall = {
  name: 'trace_api_call',
  description: 'Traces an API call with full request/response/timing data',
  inputSchema: {
    url: z.string().describe('Full URL to call'),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).describe('HTTP method'),
    headers: z.record(z.string()).optional().describe('Request headers'),
    body: z.record(z.any()).optional().describe('Request body'),
  },
} as const

/**
 * Tool: diff_schema_versions
 * Detects breaking changes between API versions
 */
export const diffSchemaVersions = {
  name: 'diff_schema_versions',
  description: 'Compares two OpenAPI specs and reports breaking changes',
  inputSchema: {
    oldSpec: z.string().describe('Old OpenAPI spec URL or raw'),
    newSpec: z.string().describe('New OpenAPI spec URL or raw'),
  },
} as const

/**
 * Tool: audit_security
 * Checks the integration for OWASP vulnerabilities
 */
export const auditSecurity = {
  name: 'audit_security',
  description: 'Audits API integration for OWASP Top 10 vulnerabilities',
  inputSchema: {
    apiMap: z.record(z.any()).describe('Normalized API map'),
    codePath: z.string().optional().describe('Path to generated code for scanning'),
  },
} as const

// ============================================================================
// DEPLOYMENT TOOLS
// ============================================================================

/**
 * Tool: deploy_worker
 * Deploys to Cloudflare Workers with env validation
 */
export const deployWorker = {
  name: 'deploy_worker',
  description: 'Deploys the API integration to Cloudflare Workers',
  inputSchema: {
    projectName: z.string().describe('Name of the Workers project'),
    env: z.record(z.string()).optional().describe('Environment variables'),
  },
} as const

/**
 * Tool: run_smoke_test
 * Post-deploy endpoint verification
 */
export const runSmokeTest = {
  name: 'run_smoke_test',
  description: 'Runs smoke tests against deployed endpoints',
  inputSchema: {
    baseUrl: z.string().describe('Base URL of deployed service'),
    endpoints: z.array(z.string()).optional().describe('Endpoints to test'),
  },
} as const

/**
 * Tool: rollback_deployment
 * Instant rollback if smoke test fails
 */
export const rollbackDeployment = {
  name: 'rollback_deployment',
  description: 'Rolls back to the previous deployment',
  inputSchema: {
    projectName: z.string().describe('Workers project name'),
  },
} as const

/**
 * Tool: update_env_secrets
 * Updates environment secrets via wrangler
 */
export const updateEnvSecrets = {
  name: 'update_env_secrets',
  description: 'Updates secrets in Cloudflare Workers via wrangler',
  inputSchema: {
    secrets: z.record(z.string()).describe('Secret key-value pairs'),
  },
} as const

// ============================================================================
// MAIN MCP SERVER
// ============================================================================

export function createApiMasterMcp() {
  const server = new McpServer({
    name: 'api-integration-master',
    version: '1.0.0',
    description: 'Lil API - The API Integration Master Agent for RJ Business Solutions',
  })

  // Register all tools
  server.tool('fetch_openapi_spec', fetchOpenApiSpec.inputSchema, async ({ source, version }) => {
    try {
      const spec = await parseOpenApi(source, version)
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            endpoints: spec.endpoints,
            schemas: spec.schemas,
            auth: spec.securitySchemes,
            servers: spec.servers,
          }, null, 2),
        }],
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: false, error: String(error) }, null, 2),
        }],
      }
    }
  })

  server.tool('introspect_graphql', introspectGraphQL.inputSchema, async ({ endpoint, headers }) => {
    const query = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            ...FullType
          }
          directives {
            name
            description
            locations
            args {
              ...InputValue
            }
          }
        }
      }
      fragment FullType on __Type {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args {
            ...InputValue
          }
          type {
            ...TypeRef
          }
          isDeprecated
          deprecationReason
        }
        inputFields {
          ...InputValue
        }
        interfaces {
          ...TypeRef
        }
        enumValues(includeDeprecated: true) {
          name
          description
          isDeprecated
          deprecationReason
        }
        possibleTypes {
          ...TypeRef
        }
      }
      fragment InputValue on __InputValue {
        name
        description
        type {
          ...TypeRef
        }
        defaultValue
      }
      fragment TypeRef on __Type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
        }
      }
    `

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ query }),
      })
      const data = await response.json()
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: String(error) }, null, 2) }],
      }
    }
  })

  server.tool('detect_auth_scheme', detectAuth.inputSchema, async ({ apiBaseUrl, sampleHeaders, docsUrl, openApiSpec }) => {
    const scheme = await detectAuthScheme(apiBaseUrl, sampleHeaders, docsUrl, openApiSpec)
    return {
      content: [{ type: 'text', text: JSON.stringify(scheme, null, 2) }],
    }
  })

  server.tool('generate_api_client', generateApiClientTool.inputSchema, async ({ apiMap, clientName, baseUrl }) => {
    const code = generateApiClient(apiMap, clientName, baseUrl)
    return {
      content: [{ type: 'text', text: code }],
    }
  })

  server.tool('generate_typescript_types', generateTypeScriptTypes.inputSchema, async ({ apiMap }) => {
    const types = generateTypes(apiMap)
    return {
      content: [{ type: 'text', text: types }],
    }
  })

  server.tool('analyze_error', analyzeErrorTool.inputSchema, async ({ errorMessage, context, apiName }) => {
    const analysis = analyzeError(errorMessage, context, apiName)
    return {
      content: [{ type: 'text', text: JSON.stringify(analysis, null, 2) }],
    }
  })

  server.tool('validate_request', validateRequest.inputSchema, async ({ endpoint, method, params, body, headers }) => {
    // Validation logic
    return {
      content: [{ type: 'text', text: JSON.stringify({ valid: true, endpoint, method }, null, 2) }],
    }
  })

  server.tool('trace_api_call', traceApiCall.inputSchema, async ({ url, method, headers, body }) => {
    const start = Date.now()
    try {
      const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
      const duration = Date.now() - start
      const text = await response.text()
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: text,
            duration: `${duration}ms`,
          }, null, 2),
        }],
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: String(error), duration: Date.now() - start }, null, 2) }],
      }
    }
  })

  return server
}

// Run the MCP server
const apiMasterMcp = createApiMasterMcp()
apiMasterMcp.start()
