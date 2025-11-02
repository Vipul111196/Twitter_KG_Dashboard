import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Neo4jService } from './neo4j.service';

/**
 * Neo4j Module
 *
 * Provides Neo4j database service to other modules.
 * Exports Neo4jService for dependency injection.
 */
@Module({
  imports: [ConfigModule],
  providers: [Neo4jService],
  exports: [Neo4jService],
})
export class Neo4jModule {}

