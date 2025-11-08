/**
 * Chat Message Component
 * Displays a single chat message (user or assistant)
 */

"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "@/lib/types";
import { Card } from "@/components/ui/card";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <Card
        className={`max-w-[80%] p-4 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        <div className="space-y-2">
          {/* Message content */}
          <div className="text-sm markdown-content">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2">{children}</ol>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-background/50 px-1 py-0.5 rounded text-xs">
                    {children}
                  </code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Show cypher query for assistant messages */}
          {!isUser && message.cypherQuery && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                View Cypher Query
              </summary>
              <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                <code>{message.cypherQuery}</code>
              </pre>
            </details>
          )}

          {/* Timestamp */}
          <div
            className={`text-xs ${
              isUser ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}
          >
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </Card>
    </div>
  );
}
