/**
 * Query Validator - Multi-layer Database Protection
 *
 * Ensures ONLY read-only queries are executed against Neo4j
 * Blocks ALL destructive operations
 */

import { ValidationResult } from './chat.types';

// Blocked keywords that indicate destructive operations
// Order matters: check compound keywords and specific patterns first
const BLOCKED_KEYWORDS = [
  'DETACH DELETE',
  'FOREACH',
  'DETACH',
  'DELETE',
  'CREATE',
  'MERGE',
  'SET',
  'REMOVE',
  'DROP',
  'CALL',
] as const;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Validate Cypher query for safety
 *
 * Multi-layer validation:
 * 1. Block all destructive keywords
 * 2. Require MATCH clause (read operation)
 * 3. Require RETURN clause
 * 4. Enforce LIMIT (add if missing, check max)
 *
 * @param query - Cypher query to validate
 * @returns ValidationResult with isValid flag and modified query or error
 */
export function validateCypherQuery(query: string): ValidationResult {
  if (!query || typeof query !== 'string') {
    return {
      isValid: false,
      error: 'Query must be a non-empty string',
    };
  }

  const upperQuery = query.toUpperCase();
  let modifiedQuery = query;

  // Layer 1: Block ALL destructive keywords
  for (const keyword of BLOCKED_KEYWORDS) {
    if (upperQuery.includes(keyword)) {
      return {
        isValid: false,
        error: `Destructive operation '${keyword}' not allowed. Read-only queries only.`,
      };
    }
  }

  // Layer 2: Must contain MATCH clause (read operation)
  if (!upperQuery.includes('MATCH')) {
    return {
      isValid: false,
      error: 'Query must contain MATCH clause for reading data.',
    };
  }

  // Layer 3: Must contain RETURN clause
  if (!upperQuery.includes('RETURN')) {
    return {
      isValid: false,
      error: 'Query must contain RETURN clause.',
    };
  }

  // Layer 4: Enforce LIMIT
  if (!upperQuery.includes('LIMIT')) {
    // Auto-add default LIMIT
    modifiedQuery = `${query} LIMIT ${DEFAULT_LIMIT}`;
  } else {
    // Check if LIMIT exceeds maximum
    const limitMatch = upperQuery.match(/LIMIT\s+(\d+)/);
    if (limitMatch) {
      const limitValue = parseInt(limitMatch[1], 10);
      if (limitValue > MAX_LIMIT) {
        return {
          isValid: false,
          error: `LIMIT cannot exceed ${MAX_LIMIT}. Requested: ${limitValue}`,
        };
      }
    }
  }

  return {
    isValid: true,
    query: modifiedQuery,
  };
}
