/**
 * Chat Module
 *
 * Provides RAG-powered chat functionality for querying Twitter dataset
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { Neo4jModule } from '../../database/neo4j.module';

@Module({
  imports: [ConfigModule, Neo4jModule],
  providers: [ChatService, ChatResolver],
  exports: [ChatService],
})
export class ChatModule {}
