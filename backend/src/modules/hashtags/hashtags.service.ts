import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../../database/neo4j.service';
import { HashtagStats } from './hashtags.types';
import { Hashtag } from '../tweets/tweets.types';

@Injectable()
export class HashtagsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async getHashtagByName(name: string): Promise<Hashtag | null> {
    const query = `
      MATCH (h:Hashtag {name: $name})
      RETURN h
    `;

    const result = await this.neo4jService.executeQuery(query, { name });

    if (result.records.length === 0) {
      return null;
    }

    const props = result.records[0].get('h').properties || result.records[0].get('h');
    return { name: props.name };
  }

  async getTrendingHashtags(limit: number = 10): Promise<HashtagStats[]> {
    const query = `
      MATCH (t:Tweet)-[:TAGS]->(h:Hashtag)
      WITH h, count(t) AS usageCount
      RETURN h.name AS name, usageCount
      ORDER BY usageCount DESC
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(query, { limit });

    return result.records.map((record) => ({
      name: record.get('name'),
      usageCount: this.extractNumber(record.get('usageCount')),
    }));
  }

  async getTotalHashtagCount(): Promise<number> {
    const query = `
      MATCH (h:Hashtag)
      RETURN count(h) AS count
    `;

    const result = await this.neo4jService.executeQuery(query, {});
    return this.extractNumber(result.records[0].get('count'));
  }

  private extractNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
    if (typeof value === 'number') return value;
    return 0;
  }
}

