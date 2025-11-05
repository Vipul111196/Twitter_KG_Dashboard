import { Injectable } from '@nestjs/common';
import neo4j from 'neo4j-driver';
import { Neo4jService } from '../../database/neo4j.service';
import {
  extractNumber,
  extractString,
  extractNodeProperties,
  getRecordField,
  Neo4jNode,
} from '../../database/neo4j.types';
import { HashtagStats } from './hashtags.types';
import { Hashtag } from '../tweets/tweets.types';

// Define expected hashtag properties from Neo4j
interface HashtagNodeProperties {
  name: string;
}

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

    const node = getRecordField<Neo4jNode<HashtagNodeProperties>>(
      result.records[0],
      'h',
    );
    if (!node) return null;

    const props = extractNodeProperties<HashtagNodeProperties>(node);
    if (!props) return null;

    return { name: extractString(props.name) };
  }

  async getTrendingHashtags(limit: number = 10): Promise<HashtagStats[]> {
    const query = `
      MATCH (t:Tweet)-[:TAGS]->(h:Hashtag)
      WITH h, count(t) AS usageCount
      RETURN h.name AS name, usageCount
      ORDER BY usageCount DESC
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(query, {
      limit: neo4j.int(limit),
    });

    return result.records.map((record) => ({
      name: extractString(getRecordField(record, 'name')),
      usageCount: extractNumber(getRecordField(record, 'usageCount')),
    }));
  }

  async getTotalHashtagCount(): Promise<number> {
    const query = `
      MATCH (h:Hashtag)
      RETURN count(h) AS count
    `;

    const result = await this.neo4jService.executeQuery(query, {});

    if (result.records.length === 0) return 0;

    return extractNumber(getRecordField(result.records[0], 'count'));
  }
}
