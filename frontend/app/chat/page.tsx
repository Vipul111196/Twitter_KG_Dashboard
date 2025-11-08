/**
 * Chat Page
 * RAG-powered chat interface for querying Twitter dataset
 */

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
          <p className="text-muted-foreground">
            Ask questions about the Twitter dataset in natural language
          </p>
        </div>

        {/* Chat interface */}
        <ChatInterface />
      </div>
    </DashboardLayout>
  );
}
