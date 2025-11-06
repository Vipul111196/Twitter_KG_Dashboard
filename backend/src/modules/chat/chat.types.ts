/**
 * Type definitions for Chat module
 * Following strict typing rules - NO 'any' types
 */

/**
 * Message in conversation history
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  cypherQuery?: string;
  timestamp: string;
}

/**
 * Intent classification result
 */
export enum IntentType {
  NEEDS_DATABASE = 'NEEDS_DATABASE',
  NO_DATABASE = 'NO_DATABASE',
}

export interface IntentClassification {
  intent: IntentType;
  confidence: number;
  reasoning: string;
}

/**
 * Result of query validation
 */
export interface ValidationResult {
  isValid: boolean;
  query?: string;
  error?: string;
}

/**
 * Result of Cypher query translation
 */
export interface CypherQueryResult {
  query: string;
  isValid: boolean;
  executionTime: number;
}

/**
 * Result of executing a Cypher query
 */
export interface QueryExecutionResult {
  data: Record<string, unknown>[];
  executionTime: number;
}

/**
 * Final chat response sent to client
 */
export interface ChatResponse {
  answer: string;
  cypherQuery: string;
  dataReturned: Record<string, unknown>;
  executionTime: number;
}

/**
 * OpenAI completion response
 */
export interface OpenAICompletionResponse {
  content: string;
  model: string;
  tokens: number;
}
