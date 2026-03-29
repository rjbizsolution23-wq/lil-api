/**
 * TypeScript Types Generator - Generates complete TypeScript interfaces from API
 */

import type { ApiMap, Schema, Endpoint } from '../parsers/openapi.js'

export function generateTypes(apiMap: ApiMap): string {
  let code = `// Auto-generated TypeScript types from OpenAPI spec\n`
  code += `// Title: ${apiMap.title}\n`
  code += `// Version: ${apiMap.version}\n\n`

  // Generate schema types
  code += `// ============================================================================\n`
  code += `// SCHEMAS\n`
  code += `// ============================================================================\n\n`

  for (const [name, schema] of Object.entries(apiMap.schemas)) {
    code += generateInterface(name, schema, apiMap.schemas)
    code += '\n'
  }

  // Generate endpoint types
  code += `// ============================================================================\n`
  code += `// ENDPOINT TYPES\n`
  code += `// ============================================================================\n\n`

  for (const endpoint of apiMap.endpoints) {
    const baseName = toTypeName(endpoint.operationId || endpoint.id)

    // Request body type
    if (endpoint.requestBody?.content) {
      const contentType = Object.keys(endpoint.requestBody.content)[0]
      const schema = endpoint.requestBody.content[contentType]?.schema
      if (schema) {
        code += `export type ${baseName}RequestBody = ${toType(schema, apiMap.schemas)}\n`
      }
    }

    // Response type
    if (endpoint.responses['200']?.content) {
      const contentType = Object.keys(endpoint.responses['200'].content)[0]
      const schema = endpoint.responses['200'].content[contentType]?.schema
      if (schema) {
        code += `export type ${baseName}Response = ${toType(schema, apiMap.schemas)}\n`
      }
    }
  }

  return code
}

function generateInterface(name: string, schema: Schema, schemas: Record<string, Schema>): string {
  let code = `export interface ${name} {\n`

  if (schema.type === 'object' && schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const required = schema.required?.includes(propName) || false
      const optional = required ? '' : '?'
      code += `  ${propName}${optional}: ${toType(propSchema, schemas)}\n`
    }
  } else if (schema.type === 'object' && schema.allOf) {
    // Handle allOf (composition)
    for (const subSchema of schema.allOf) {
      const subName = subSchema.$ref?.replace('#/components/schemas/', '')
      if (subName && schemas[subName]) {
        code += `  // From ${subName}\n`
      }
    }
  }

  code += `}\n`
  return code
}

function toType(schema: Schema, schemas: Record<string, Schema>): string {
  // Handle $ref
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '')
    return refName
  }

  // Handle nullable
  if (schema.nullable) {
    return `${toBaseType(schema)} | null`
  }

  // Handle enum
  if (schema.enum) {
    return schema.enum.map(e => typeof e === 'string' ? `"${e}"` : String(e)).join(' | ')
  }

  // Handle array
  if (schema.type === 'array' && schema.items) {
    return `${toType(schema.items, schemas)}[]`
  }

  // Handle object
  if (schema.type === 'object') {
    if (schema.properties) {
      const props = Object.entries(schema.properties).map(
        ([k, v]) => `${k}: ${toType(v, schemas)}`
      ).join('; ')
      return `{ ${props} }`
    }
    return 'Record<string, unknown>'
  }

  return toBaseType(schema)
}

function toBaseType(schema: Schema): string {
  if (schema.type === 'integer' || schema.type === 'number') return 'number'
  if (schema.type === 'string') {
    if (schema.format === 'date-time') return 'string' // Date serialized as ISO string
    if (schema.format === 'date') return 'string'
    if (schema.format === 'email') return 'string'
    if (schema.format === 'uri' || schema.format === 'url') return 'string'
    if (schema.format === 'uuid') return 'string'
    return 'string'
  }
  if (schema.type === 'boolean') return 'boolean'
  if (schema.type === 'array') return 'unknown[]'
  if (schema.type === 'object') return 'Record<string, unknown>'
  return 'unknown'
}

function toTypeName(operationId: string): string {
  if (!operationId) return 'Unknown'
  return operationId.split(/[-_]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}
