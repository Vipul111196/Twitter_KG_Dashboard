/**
 * Chat Service - RAG Pipeline Implementation
 *
 * Handles:
 * 1. Intent classification using GPT-4.1-mini
 * 2. Query translation (NL → Cypher) using GPT-4.1-mini
 * 3. Query validation and safety checks
 * 4. Cypher execution against Neo4j
 * 5. Response generation using GPT-5-chat-latest
 *
 * Following strict typing rules - NO 'any' types
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Neo4jService } from '../../database/neo4j.service';
import { validateCypherQuery } from './query-validator';
import {
  ValidationResult,
  CypherQueryResult,
  QueryExecutionResult,
  ChatResponse,
  OpenAICompletionResponse,
  ChatMessage,
  IntentClassification,
  IntentType,
} from './chat.types';
import {
  CYPHER_GENERATION_SYSTEM_PROMPT,
  RESPONSE_GENERATION_SYSTEM_PROMPT,
  INTENT_CLASSIFICATION_SYSTEM_PROMPT,
  CONTEXTUAL_RESPONSE_SYSTEM_PROMPT,
} from './prompts';

const QUERY_TIMEOUT_MS = 30000; // 30 seconds

@Injectable()
export class ChatService {
  private openai: OpenAI | null;
  private isConfigured: boolean;

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.isConfigured = !!apiKey && apiKey.length > 0;

    if (!this.isConfigured) {
      console.warn(
        '⚠️  OPENAI_API_KEY is not configured - Chat features will be disabled',
      );
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Validate Cypher query for safety
   * Public method that wraps the validator for testing
   */
  validateCypherQuery(query: string): ValidationResult {
    return validateCypherQuery(query);
  }

  /**
   * Translate natural language query to Cypher using GPT-4
   */
  async translateQueryToCypher(
    userQuery: string,
    history: ChatMessage[] = [],
  ): Promise<CypherQueryResult> {
    const startTime = Date.now();

    try {
      // Format history for context (last 10 messages for relevance)
      const recentHistory = history.slice(-10);
      const historyContext =
        recentHistory.length > 0
          ? `\n\nRECENT CONVERSATION:\n${recentHistory
              .map((msg) => {
                if (msg.role === 'assistant' && msg.cypherQuery) {
                  return `${msg.role}: ${msg.content}\n  (Query: ${msg.cypherQuery})`;
                }
                return `${msg.role}: ${msg.content}`;
              })
              .join('\n')}\n\n`
          : '';

      const prompt = `${historyContext}USER QUESTION: ${userQuery}\n\nGenerate ONLY the Cypher query, no explanation.`;

      // Call OpenAI to generate Cypher
      const response = await this.callOpenAI(
        CYPHER_GENERATION_SYSTEM_PROMPT,
        prompt,
        'gpt-5-mini-2025-08-07',
      );

      const cypherQuery = response.content.trim();

      // Validate the generated query
      const validation = validateCypherQuery(cypherQuery);

      const executionTime = Date.now() - startTime;

      if (!validation.isValid) {
        return {
          query: cypherQuery,
          isValid: false,
          executionTime,
        };
      }

      return {
        query: validation.query || cypherQuery,
        isValid: true,
        executionTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Query translation failed: ${errorMessage}`);
    }
  }

  /**
   * Execute Cypher query against Neo4j with timeout
   */
  async executeCypherQuery(cypherQuery: string): Promise<QueryExecutionResult> {
    const startTime = Date.now();

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Query execution timeout after 30 seconds')),
          QUERY_TIMEOUT_MS,
        );
      });

      // Execute query with timeout
      const result = await Promise.race([
        this.neo4jService.executeQuery(cypherQuery, {}),
        timeoutPromise,
      ]);

      // Convert Neo4j records to plain objects
      const data = result.records.map((record) => record.toObject());

      const executionTime = Date.now() - startTime;

      return {
        data,
        executionTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Query execution failed: ${errorMessage}`);
    }
  }

  /**
   * Generate natural language response from query results
   */
  async generateResponse(
    userQuery: string,
    queryResult: QueryExecutionResult,
  ): Promise<string> {
    try {
      const prompt = `USER QUESTION: ${userQuery}

QUERY RESULTS: ${JSON.stringify(queryResult.data, null, 2)}

EXECUTION TIME: ${queryResult.executionTime}ms

Please provide a helpful, conversational answer based on the data above.`;

      const response = await this.callOpenAI(
        RESPONSE_GENERATION_SYSTEM_PROMPT,
        prompt,
        'gpt-5-chat-latest',
      );

      return response.content;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Response generation failed: ${errorMessage}`);
    }
  }

  /**
   * Classify user intent - does this query need database access?
   */
  async classifyIntent(
    userQuery: string,
    history: ChatMessage[],
  ): Promise<IntentClassification> {
    try {
      // Format history for context
      const historyContext =
        history.length > 0
          ? `\n\nCONVERSATION HISTORY:\n${history
              .map((msg) => `${msg.role}: ${msg.content}`)
              .join('\n')}`
          : '';

      const prompt = `${historyContext}\n\nUSER QUERY: ${userQuery}\n\nClassify this query and respond with JSON only.`;

      const response = await this.callOpenAI(
        INTENT_CLASSIFICATION_SYSTEM_PROMPT,
        prompt,
        'gpt-5-mini-2025-08-07',
      );

      // Parse JSON response with type checking
      const parsed: unknown = JSON.parse(response.content);

      // Validate parsed response structure
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'intent' in parsed &&
        'confidence' in parsed &&
        'reasoning' in parsed
      ) {
        const classification = parsed as {
          intent: string;
          confidence: number;
          reasoning: string;
        };

        return {
          intent: classification.intent as IntentType,
          confidence: classification.confidence,
          reasoning: classification.reasoning,
        };
      }

      // If parsing fails, default to NEEDS_DATABASE
      return {
        intent: IntentType.NEEDS_DATABASE,
        confidence: 0.5,
        reasoning: 'Invalid classification response format',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      // Default to NEEDS_DATABASE on error (safer)
      return {
        intent: IntentType.NEEDS_DATABASE,
        confidence: 0.5,
        reasoning: `Error in classification: ${errorMessage}. Defaulting to database query.`,
      };
    }
  }

  /**
   * Generate response from conversation history without database
   */
  async generateContextualResponse(
    userQuery: string,
    history: ChatMessage[],
  ): Promise<string> {
    try {
      // Format history
      const historyText =
        history.length > 0
          ? history.map((msg) => `${msg.role}: ${msg.content}`).join('\n\n')
          : 'No previous conversation.';

      const prompt = `CONVERSATION HISTORY:\n${historyText}\n\nUSER QUERY: ${userQuery}\n\nAnswer based on the conversation history above.`;

      const response = await this.callOpenAI(
        CONTEXTUAL_RESPONSE_SYSTEM_PROMPT,
        prompt,
        'gpt-5-chat-latest',
      );

      return response.content;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Contextual response generation failed: ${errorMessage}`);
    }
  }

  /**
   * Main chat method - complete RAG pipeline with intent routing
   */
  async chat(
    userQuery: string,
    history: ChatMessage[] = [],
  ): Promise<ChatResponse> {
    if (!this.isConfigured) {
      throw new Error(
        'Chat service is not configured. Please set OPENAI_API_KEY environment variable.',
      );
    }

    const startTime = Date.now();

    try {
      // Step 1: Classify intent (API Call 1)
      const classification = await this.classifyIntent(userQuery, history);

      // Route based on intent
      if (classification.intent === IntentType.NO_DATABASE) {
        // NO_DATABASE path: Answer from context only (API Call 2)
        const answer = await this.generateContextualResponse(
          userQuery,
          history,
        );

        const totalExecutionTime = Date.now() - startTime;

        return {
          answer,
          cypherQuery: '', // No Cypher query executed
          dataReturned: {
            intent: classification.intent,
            reasoning: classification.reasoning,
          },
          executionTime: totalExecutionTime,
        };
      }

      // NEEDS_DATABASE path: Full RAG pipeline
      // Step 2: Translate query to Cypher (API Call 2)
      const cypherResult = await this.translateQueryToCypher(
        userQuery,
        history,
      );

      if (!cypherResult.isValid) {
        throw new Error(
          `Query blocked for safety: Generated query contains destructive operations and is not allowed.`,
        );
      }

      // Step 3: Execute Cypher query
      const queryResult = await this.executeCypherQuery(cypherResult.query);

      // Step 4: Generate natural language response (API Call 3)
      const answer = await this.generateResponse(userQuery, queryResult);

      const totalExecutionTime = Date.now() - startTime;

      return {
        answer,
        cypherQuery: cypherResult.query,
        dataReturned: {
          records: queryResult.data,
          count: queryResult.data.length,
        },
        executionTime: totalExecutionTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Check if error is due to blocked query
      if (
        errorMessage.toLowerCase().includes('not allowed') ||
        errorMessage.toLowerCase().includes('blocked') ||
        errorMessage.toLowerCase().includes('destructive')
      ) {
        throw new Error(
          'Query blocked for safety: This operation would modify or delete data, which is not permitted.',
        );
      }

      throw new Error(`Chat service error: ${errorMessage}`);
    }
  }

  /**
   * Call OpenAI API with error handling
   * Private helper method
   */
  private async callOpenAI(
    systemPrompt: string,
    userMessage: string,
    model: string,
  ): Promise<OpenAICompletionResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_completion_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI returned empty response');
      }

      return {
        content,
        model: completion.model,
        tokens: completion.usage?.total_tokens || 0,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`OpenAI API error: ${errorMessage}`);
    }
  }
}
