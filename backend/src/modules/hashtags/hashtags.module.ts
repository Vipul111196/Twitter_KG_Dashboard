import { Module } from '@nestjs/common';
import { HashtagsService } from './hashtags.service';
import { HashtagsResolver } from './hashtags.resolver';
import { Neo4jModule } from '../../database/neo4j.module';

@Module({
  imports: [Neo4jModule],
  providers: [HashtagsService, HashtagsResolver],
  exports: [HashtagsService],
})
export class HashtagsModule {}

