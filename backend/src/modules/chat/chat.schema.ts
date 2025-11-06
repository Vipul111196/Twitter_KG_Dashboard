/**
 * GraphQL Schema Decorators for Chat Module
 */

import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

/**
 * Input type for chat message history
 */
@InputType({ description: 'Chat message in conversation history' })
export class ChatMessageInput {
  @Field(() => String, { description: 'Role: user or assistant' })
  role: string;

  @Field(() => String, { description: 'Message content' })
  content: string;

  @Field(() => String, {
    nullable: true,
    description: 'Cypher query if assistant message',
  })
  cypherQuery?: string;

  @Field(() => String, { description: 'ISO timestamp of message' })
  timestamp: string;
}

/**
 * Chat response with answer, query, and metadata
 */
@ObjectType({ description: 'Chat response with generated answer' })
export class ChatResponse {
  @Field(() => String, { description: 'Natural language answer' })
  answer: string;

  @Field(() => String, {
    description: 'Cypher query that was executed (empty if not needed)',
  })
  cypherQuery: string;

  @Field(() => GraphQLJSON, {
    description: 'Data returned from query or intent info',
  })
  dataReturned: Record<string, unknown>;

  @Field(() => Int, { description: 'Total execution time in milliseconds' })
  executionTime: number;
}
