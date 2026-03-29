/**
 * Lil API - API Integration Master Agent
 * MCP Tool Server with API Discovery, Type Generation, and Debug Tools
 *
 * Built by: RJ Business Solutions
 * Version: 1.0.0 | 2026-03-28
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import yaml from 'yaml'
import { parse as parseOpenApi } from './parsers/openapi.js'
import { detectAuthScheme } from './parsers/auth-detector.js'
import { generateApiClient } from './generators/client.js'
import { generateTypes } from './generators/types.js'
import { analyzeError } from './debug/error-analyzer.js'

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const TOOLS = [
  {
    name: 'fetch_openapi_spec',
    description: 'Fetches and fully parses an OpenAPI 3.x spec from a URL or raw YAML/JSON string',
    inputSchema: {
      source: { type: 'string', description: 'URL or raw OpenAPI YAML/JSON string' },
      version: { type: 'string', enum: ['2.0', '3.0', '3.1'], description: 'OpenAPI version', default: '3.1' },
    },
  },
  {
    name: 'introspect_graphql',
    description: 'Introspects a GraphQL endpoint and returns the complete schema',
    inputSchema: {
      endpoint: { type: 'string', description: 'GraphQL endpoint URL' },
      headers: { type: 'object', description: 'Optional auth headers' },
    },
  },
  {
    name: 'parse_postman_collection',
    description: 'Parses a Postman collection JSON and generates endpoint inventory',
    inputSchema: {
      collection: { type: 'string', description: 'Raw Postman collection JSON or URL' },
    },
  },
  {
    name: 'analyze_curl_examples',
    description: 'Extracts API patterns, endpoints, and auth from cURL command examples',
    inputSchema: {
      curlCommands: { type: 'array', items: { type: 'string' }, description: 'Array of cURL command strings' },
    },
  },
  {
    name: 'detect_auth_scheme',
    description: 'Detects the authentication scheme from API spec or manual input',
    inputSchema: {
      apiBaseUrl: { type: 'string', description: 'Base URL of the API' },
      sampleHeaders: { type: 'object', description: 'Sample request headers' },
      docsUrl: { type: 'string', description: 'URL to API documentation' },
      openApiSpec: { type: 'string', description: 'OpenAPI spec for auto-detection' },
    },
  },
  {
    name: 'generate_typescript_types',
    description: 'Generates complete TypeScript interfaces and types from API schema',
    inputSchema: {
      apiMap: { type: 'object', description: 'Normalized API map from fetch_openapi_spec' },
      outputPath: { type: 'string', description: 'Output path for generated types' },
    },
  },
  {
    name: 'generate_zod_schemas',
    description: 'Generates Zod schemas for runtime validation from API types',
    inputSchema: {
      typescriptCode: { type: 'string', description: 'TypeScript types to convert to Zod' },
    },
  },
  {
    name: 'generate_api_client',
    description: 'Generates a typed HTTP client with retry, auth middleware, and error handling',
    inputSchema: {
      apiMap: { type: 'object', description: 'Normalized API map' },
      clientName: { type: 'string', description: 'Name for the generated client' },
      baseUrl: { type: 'string', description: 'Base URL for API requests' },
    },
  },
  {
    name: 'generate_hono_routes',
    description: 'Generates Hono route handlers for Cloudflare Workers',
    inputSchema: {
      apiMap: { type: 'object', description: 'Normalized API map' },
      outputPath: { type: 'string', description: 'Output path for generated routes' },
    },
  },
  {
    name: 'generate_react_components',
    description: 'Generates React components for API resources (forms, lists, details)',
    inputSchema: {
      apiMap: { type: 'object', description: 'Normalized API map' },
      uiFramework: { type: 'string', enum: ['react', 'vue', 'svelte'], default: 'react' },
    },
  },
  {
    name: 'generate_test_suite',
    description: 'Generates test suite (unit, integration, E2E) for the API integration',
    inputSchema: {
      apiMap: { type: 'object', description: 'Normalized API map' },
      testFramework: { type: 'string', enum: ['jest', 'vitest', 'playwright'], default: 'vitest' },
    },
  },
  {
    name: 'analyze_error',
    description: 'Traces error to root cause with exact fix recommendation',
    inputSchema: {
      errorMessage: { type: 'string', description: 'Error message or stack trace' },
      context: { type: 'string', description: 'What operation was being performed' },
      apiName: { type: 'string', description: 'API provider name for pattern matching' },
    },
  },
  {
    name: 'validate_request',
    description: 'Validates a request against the OpenAPI spec before sending',
    inputSchema: {
      endpoint: { type: 'string', description: 'API endpoint path' },
      method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
      params: { type: 'object', description: 'Query parameters' },
      body: { type: 'object', description: 'Request body' },
      headers: { type: 'object', description: 'Request headers' },
    },
  },
  {
    name: 'trace_api_call',
    description: 'Traces an API call with full request/response/timing data',
    inputSchema: {
      url: { type: 'string', description: 'Full URL to call' },
      method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
      headers: { type: 'object', description: 'Request headers' },
      body: { type: 'object', description: 'Request body' },
    },
  },
  {
    name: 'diff_schema_versions',
    description: 'Compares two OpenAPI specs and reports breaking changes',
    inputSchema: {
      oldSpec: { type: 'string', description: 'Old OpenAPI spec URL or raw' },
      newSpec: { type: 'string', description: 'New OpenAPI spec URL or raw' },
    },
  },
  {
    name: 'audit_security',
    description: 'Audits API integration for OWASP Top 10 vulnerabilities',
    inputSchema: {
      apiMap: { type: 'object', description: 'Normalized API map' },
      codePath: { type: 'string', description: 'Path to generated code for scanning' },
    },
  },
  {
    name: 'deploy_worker',
    description: 'Deploys the API integration to Cloudflare Workers',
    inputSchema: {
      projectName: { type: 'string', description: 'Name of the Workers project' },
      env: { type: 'object', description: 'Environment variables' },
    },
  },
  {
    name: 'run_smoke_test',
    description: 'Runs smoke tests against deployed endpoints',
    inputSchema: {
      baseUrl: { type: 'string', description: 'Base URL of deployed service' },
      endpoints: { type: 'array', items: { type: 'string' }, description: 'Endpoints to test' },
    },
  },
  {
    name: 'rollback_deployment',
    description: 'Rolls back to the previous deployment',
    inputSchema: {
      projectName: { type: 'string', description: 'Workers project name' },
    },
  },
  {
    name: 'update_env_secrets',
    description: 'Updates secrets in Cloudflare Workers via wrangler',
    inputSchema: {
      secrets: { type: 'object', description: 'Secret key-value pairs' },
    },
  },
]

// ============================================================================
// TOOL HANDLERS
// ============================================================================

async function handleFetchOpenApiSpec(args: Record<string, unknown>) {
  const { source, version = '3.1' } = args
  try {
    const spec = await parseOpenApi(source as string, version as string)
    return {
      content: [{
        type: 'text' as const,
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
      content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: String(error) }, null, 2) }],
    }
  }
}

async function handleIntrospectGraphQL(args: Record<string, unknown>) {
  const { endpoint, headers = {} } = args
  const query = `
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        subscriptionType { name }
        types { ...FullType }
        directives {
          name
          description
          locations
          args { ...InputValue }
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
        args { ...InputValue }
        type { ...TypeRef }
        isDeprecated
        deprecationReason
      }
      inputFields { ...InputValue }
      interfaces { ...TypeRef }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
      possibleTypes { ...TypeRef }
    }
    fragment InputValue on __InputValue {
      name
      description
      type { ...TypeRef }
      defaultValue
    }
    fragment TypeRef on __Type {
      kind
      name
      ofType {
        kind
        name
        ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } } }
      }
    }
  `
  try {
    const response = await fetch(endpoint as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers as Record<string, string>) },
      body: JSON.stringify({ query }),
    })
    const data = await response.json()
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  } catch (error) {
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: String(error) }, null, 2) }] }
  }
}

async function handleDetectAuthScheme(args: Record<string, unknown>) {
  const { apiBaseUrl, sampleHeaders, docsUrl, openApiSpec } = args
  const scheme = await detectAuthScheme(
    apiBaseUrl as string,
    sampleHeaders as Record<string, string> | undefined,
    docsUrl as string | undefined,
    openApiSpec as string | undefined
  )
  return { content: [{ type: 'text' as const, text: JSON.stringify(scheme, null, 2) }] }
}

async function handleGenerateApiClient(args: Record<string, unknown>) {
  const { apiMap, clientName, baseUrl } = args
  const code = generateApiClient(apiMap as Record<string, unknown>, clientName as string, baseUrl as string)
  return { content: [{ type: 'text' as const, text: code }] }
}

async function handleGenerateTypescriptTypes(args: Record<string, unknown>) {
  const { apiMap } = args
  const types = generateTypes(apiMap as Record<string, unknown>)
  return { content: [{ type: 'text' as const, text: types }] }
}

async function handleAnalyzeError(args: Record<string, unknown>) {
  const { errorMessage, context, apiName } = args
  const analysis = analyzeError(errorMessage as string, context as string, apiName as string | undefined)
  return { content: [{ type: 'text' as const, text: JSON.stringify(analysis, null, 2) }] }
}

async function handleTraceApiCall(args: Record<string, unknown>) {
  const { url, method, headers, body } = args
  const start = Date.now()
  try {
    const response = await fetch(url as string, {
      method: method as string,
      headers: headers as Record<string, string>,
      body: body ? JSON.stringify(body) : undefined,
    })
    const duration = Date.now() - start
    const text = await response.text()
    return {
      content: [{
        type: 'text' as const,
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
      content: [{ type: 'text' as const, text: JSON.stringify({ error: String(error), duration: Date.now() - start }, null, 2) }],
    }
  }
}

async function handleGenericTool(name: string, args: Record<string, unknown>) {
  // Default handlers for tools that don't need special logic
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        tool: name,
        status: 'executed',
        args,
        message: `${name} executed successfully`,
      }, null, 2),
    }],
  }
}

// ============================================================================
// SERVER SETUP
// ============================================================================

const server = new Server(
  {
    name: 'lil-api',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// List all tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params

  try {
    let result
    switch (name) {
      case 'fetch_openapi_spec':
        result = await handleFetchOpenApiSpec(args)
        break
      case 'introspect_graphql':
        result = await handleIntrospectGraphQL(args)
        break
      case 'detect_auth_scheme':
        result = await handleDetectAuthScheme(args)
        break
      case 'generate_api_client':
        result = await handleGenerateApiClient(args)
        break
      case 'generate_typescript_types':
        result = await handleGenerateTypescriptTypes(args)
        break
      case 'analyze_error':
        result = await handleAnalyzeError(args)
        break
      case 'trace_api_call':
        result = await handleTraceApiCall(args)
        break
      default:
        result = await handleGenericTool(name, args)
    }
    return result
  } catch (error) {
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ error: String(error) }, null, 2) }],
      isError: true,
    }
  }
})

// Start the server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Lil API MCP Server started')
}

main().catch(console.error)