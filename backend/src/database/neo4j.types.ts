import { Integer, Record as Neo4jRecord } from 'neo4j-driver';

// Type alias for Neo4j numeric types
export type Neo4jNumeric = number | Integer;

// Type alias for Neo4j string or numeric types
export type Neo4jValue = string | number | Integer;

// Type guard to check if value is a Neo4j Integer
export function isNeo4jInteger(value: unknown): value is Integer {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: unknown }).toNumber === 'function'
  );
}

// Safely extract number from Neo4j response
export function extractNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (isNeo4jInteger(value)) {
    return value.toNumber();
  }
  return 0;
}

// Safely extract string from Neo4j response
export function extractString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (isNeo4jInteger(value)) return String(value.toNumber());
  return '';
}

// Safely get a field from Neo4j record with type safety
export function getRecordField<T>(
  record: Neo4jRecord,
  fieldName: string,
): T | null {
  try {
    const value: unknown = record.get(fieldName);
    return value as T;
  } catch {
    return null;
  }
}

// Type for Neo4j node - accepts any object as properties
export interface Neo4jNode<T extends object = object> {
  properties: T;
}

// Type guard to check if value is a Neo4j Node
export function isNeo4jNode<T extends object>(
  value: unknown,
): value is Neo4jNode<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'properties' in value &&
    typeof (value as { properties: unknown }).properties === 'object'
  );
}

// Safely extract properties from a Neo4j node
// Also handles plain objects for testing purposes
export function extractNodeProperties<T extends object>(
  node: unknown,
): T | null {
  if (isNeo4jNode<T>(node)) {
    return node.properties;
  }
  // For testing: also accept plain objects that look like properties
  if (typeof node === 'object' && node !== null && !('properties' in node)) {
    return node as T;
  }
  return null;
}
