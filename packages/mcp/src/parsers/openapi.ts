/**
 * OpenAPI Parser - Converts OpenAPI 3.x specs to normalized API map
 */

export interface Endpoint {
  id: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  summary: string
  description: string
  operationId: string
  tags: string[]
  parameters: Parameter[]
  requestBody?: RequestBody
  responses: Record<string, Response>
  security: string[]
  deprecated: boolean
  deprecatedParams?: string[]
}

export interface Parameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  required: boolean
  schema: Schema
  description: string
  deprecated: boolean
}

export interface RequestBody {
  description: string
  required: boolean
  content: Record<string, MediaType>
}

export interface MediaType {
  schema: Schema
  example?: unknown
}

export interface Response {
  description: string
  headers?: Record<string, Schema>
  content?: Record<string, MediaType>
}

export interface Schema {
  type: string
  format?: string
  properties?: Record<string, Schema>
  items?: Schema
  required?: string[]
  enum?: unknown[]
  nullable?: boolean
  $ref?: string
  allOf?: Schema[]
  oneOf?: Schema[]
  anyOf?: Schema[]
  description?: string
  default?: unknown
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
}

export interface ApiMap {
  title: string
  version: string
  description: string
  servers: string[]
  endpoints: Endpoint[]
  schemas: Record<string, Schema>
  securitySchemes: Record<string, SecurityScheme>
  tags: string[]
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
  scheme?: string
  bearerFormat?: string
  flows?: Record<string, OAuthFlow>
  openIdConnectUrl?: string
}

export interface OAuthFlow {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
}

export async function parseOpenApi(source: string, version: string = '3.1'): Promise<ApiMap> {
  let spec: unknown

  // Check if source is URL or raw content
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const response = await fetch(source)
    const text = await response.text()
    spec = source.endsWith('.yaml') || source.endsWith('.yml')
      ? yaml.parse(text)
      : JSON.parse(text)
  } else {
    // Try JSON first, then YAML
    try {
      spec = JSON.parse(source)
    } catch {
      spec = yaml.parse(source)
    }
  }

  const openApi = spec as Record<string, unknown>
  const endpoints: Endpoint[] = []
  const schemas: Record<string, Schema> = {}
  const securitySchemes: Record<string, SecurityScheme> = {}
  const tags = new Set<string>()

  // Extract servers
  const servers = (openApi.servers as Array<{ url: string }>)?.map(s => s.url) || ['']

  // Extract schemas
  const components = openApi.components as Record<string, unknown> | undefined
  if (components?.schemas) {
    for (const [name, schema] of Object.entries(components.schemas as Record<string, Schema>)) {
      schemas[name] = schema
    }
  }

  // Extract security schemes
  if (components?.securitySchemes) {
    for (const [name, scheme] of Object.entries(components.securitySchemes as Record<string, SecurityScheme>)) {
      securitySchemes[name] = scheme
    }
  }

  // Extract endpoints from paths
  const paths = openApi.paths as Record<string, Record<string, unknown>> || {}
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue

      const op = operation as Record<string, unknown>
      const params = (op.parameters as Array<Record<string, unknown>>)?.map(p => ({
        name: p.name as string,
        in: p.in as 'query' | 'path' | 'header' | 'cookie',
        required: p.required as boolean,
        schema: p.schema as Schema,
        description: p.description as string || '',
        deprecated: p.deprecated as boolean || false,
      })) || []

      // Extract request body
      let requestBody: RequestBody | undefined
      if (op.requestBody) {
        const rb = op.requestBody as Record<string, unknown>
        requestBody = {
          description: rb.description as string || '',
          required: rb.required as boolean || false,
          content: rb.content as Record<string, MediaType> || {},
        }
      }

      // Extract responses
      const responses: Record<string, Response> = {}
      if (op.responses) {
        for (const [code, resp] of Object.entries(op.responses as Record<string, Record<string, unknown>>)) {
          responses[code] = {
            description: (resp as Record<string, unknown>).description as string || '',
            headers: (resp as Record<string, unknown>).headers as Record<string, Schema>,
            content: (resp as Record<string, unknown>).content as Record<string, MediaType>,
          }
        }
      }

      // Extract tags
      const opTags = (op.tags as string[]) || ['default']
      opTags.forEach(t => tags.add(t))

      endpoints.push({
        id: `${method}_${path}`.replace(/[^a-zA-Z0-9]/g, '_'),
        path,
        method: method.toUpperCase() as Endpoint['method'],
        summary: op.summary as string || '',
        description: op.description as string || '',
        operationId: op.operationId as string || '',
        tags: opTags,
        parameters: params,
        requestBody,
        responses,
        security: (op.security as string[]) || [],
        deprecated: op.deprecated as boolean || false,
      })
    }
  }

  return {
    title: openApi.info?.title as string || 'API',
    version: openApi.info?.version as string || '1.0.0',
    description: openApi.info?.description as string || '',
    servers,
    endpoints,
    schemas,
    securitySchemes,
    tags: Array.from(tags),
  }
}
