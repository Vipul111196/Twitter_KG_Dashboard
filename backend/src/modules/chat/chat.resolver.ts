/**
 * Chat Resolver - GraphQL API for RAG Chat
 */

import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { ChatResponse, ChatMessageInput } from './chat.schema';
import { ChatMessage } from './chat.types';

@Resolver()
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Chat mutation - accepts natural language query with conversation history
   *
   * @param query - User's natural language question
   * @param history - Last 50 messages of conversation (optional)
   * @returns ChatResponse with answer, cypher query, and metadata
   */
  @Mutation(() => ChatResponse, {
    description: 'Chat with the Twitter dataset using natural language',
  })
  async chat(
    @Args('query', {
      type: () => String,
      description: 'Natural language query',
    })
    query: string,
    @Args('history', {
      type: () => [ChatMessageInput],
      nullable: true,
      defaultValue: [],
      description: 'Last 50 messages of conversation history',
    })
    history: ChatMessageInput[] = [],
  ): Promise<ChatResponse> {
    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    // Limit to last 50 messages for performance
    const limitedHistory = history.slice(-50);

    // Convert GraphQL input to service type
    const chatHistory: ChatMessage[] = limitedHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      cypherQuery: msg.cypherQuery,
      timestamp: msg.timestamp,
    }));

    try {
      return await this.chatService.chat(query, chatHistory);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(errorMessage);
    }
  }
}
