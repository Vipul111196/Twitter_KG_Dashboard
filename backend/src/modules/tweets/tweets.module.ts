import { Module } from '@nestjs/common';
import { TweetsService } from './tweets.service';
import { TweetsResolver } from './tweets.resolver';
import { Neo4jModule } from '../../database/neo4j.module';

/**
 * Tweets Module
 *
 * Encapsulates all tweet-related functionality.
 */
@Module({
  imports: [Neo4jModule],
  providers: [TweetsService, TweetsResolver],
  exports: [TweetsService],
})
export class TweetsModule {}

