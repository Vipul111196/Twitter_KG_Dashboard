import { Injectable } from '@nestjs/common';
import neo4j from 'neo4j-driver';
import { Neo4jService } from '../../database/neo4j.service';
import { DashboardStats, NetworkData, NetworkNode, NetworkEdge } from './analytics.types';

@Injectable()
export class AnalyticsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const query = `
      MATCH (u:User)
      WITH count(u) AS userCount
      MATCH (t:Tweet)
      WITH userCount, count(t) AS tweetCount
      MATCH (h:Hashtag)
      WITH userCount, tweetCount, count(h) AS hashtagCount
      MATCH ()-[r]->()
      RETURN userCount, tweetCount, hashtagCount, count(r) AS relCount
    `;

    const result = await this.neo4jService.executeQuery(query, {});
    const record = result.records[0];

    return {
      totalUsers: this.extractNumber(record.get('userCount')),
      totalTweets: this.extractNumber(record.get('tweetCount')),
      totalHashtags: this.extractNumber(record.get('hashtagCount')),
      totalRelationships: this.extractNumber(record.get('relCount')),
    };
  }

  async getNetworkData(limit: number = 100): Promise<NetworkData> {
    const query = `
      MATCH (u1:User)-[r:FOLLOWS]->(u2:User)
      WHERE u1.followers > 1000 AND u2.followers > 1000
      RETURN u1, u2, r
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(query, { limit: neo4j.int(limit) });

    const nodes: Map<string, NetworkNode> = new Map();
    const edges: NetworkEdge[] = [];

    result.records.forEach((record) => {
      const u1 = record.get('u1');
      const u2 = record.get('u2');
      const r = record.get('r');

      const u1Props = u1.properties || u1;
      const u2Props = u2.properties || u2;

      // Add nodes
      if (!nodes.has(u1Props.screen_name)) {
        nodes.set(u1Props.screen_name, {
          id: u1Props.screen_name,
          label: u1Props.name || u1Props.screen_name,
          type: 'user',
          size: this.extractNumber(u1Props.followers),
        });
      }

      if (!nodes.has(u2Props.screen_name)) {
        nodes.set(u2Props.screen_name, {
          id: u2Props.screen_name,
          label: u2Props.name || u2Props.screen_name,
          type: 'user',
          size: this.extractNumber(u2Props.followers),
        });
      }

      // Add edge
      edges.push({
        source: u1Props.screen_name,
        target: u2Props.screen_name,
        type: 'FOLLOWS',
      });
    });

    return {
      nodes: Array.from(nodes.values()),
      edges,
    };
  }

  private extractNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
    if (typeof value === 'number') return value;
    return 0;
  }
}

