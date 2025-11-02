import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { Neo4jModule } from '../../database/neo4j.module';

/**
 * Users Module
 *
 * Encapsulates all user-related functionality.
 * Follows NestJS modular architecture for separation of concerns.
 */
@Module({
  imports: [Neo4jModule],
  providers: [UsersService, UsersResolver],
  exports: [UsersService], // Export for use in other modules
})
export class UsersModule {}

