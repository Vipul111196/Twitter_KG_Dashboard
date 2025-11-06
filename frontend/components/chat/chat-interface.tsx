/**
 * Chat Interface Component
 * Main chat container with message history and input
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { CHAT_MUTATION } from '@/lib/graphql/mutations';
import { Message, ChatMutationResponse } from '@/lib/types';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { Card } from '@/components/ui/card';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatMutation, { loading }] = useMutation<ChatMutationResponse>(CHAT_MUTATION);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (query: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Get last 50 messages for context
      const historyForAPI = messages.slice(-50).map((msg) => ({
        role: msg.role,
        content: msg.content,
        cypherQuery: msg.cypherQuery || undefined,
        timestamp: msg.timestamp.toISOString(),
      }));

      // Call chat mutation with history
      const { data } = await chatMutation({
        variables: {
          query,
          history: historyForAPI,
        },
      });

      if (data?.chat) {
        // Add assistant response
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.chat.answer,
          cypherQuery: data.chat.cypherQuery,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          error instanceof Error
            ? `Error: ${error.message}`
            : 'An unexpected error occurred. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Messages area */}
      <Card className="flex-1 overflow-y-auto p-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Welcome to Twitter Dataset Chat!</h3>
              <p className="text-sm">
                Ask me anything about users, tweets, or hashtags.
              </p>
              <div className="text-xs space-y-1 mt-4">
                <p>Try asking:</p>
                <ul className="list-disc list-inside">
                  <li>&quot;Who are the top 5 users by followers?&quot;</li>
                  <li>&quot;What are the trending hashtags?&quot;</li>
                  <li>&quot;Show me recent tweets about Neo4j&quot;</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </Card>

      {/* Input area */}
      <ChatInput onSend={handleSend} isLoading={loading} />
    </div>
  );
}

