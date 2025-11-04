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

  async getNetworkData(
    limit: number = 100,
    minFollowers: number = 0,
    minHashtagUsage: number = 5,
  ): Promise<NetworkData> {
    // Build a rich, connected network with Users, Tweets, and Hashtags
    const query = `
      // Find users with actual FOLLOWS connections
      MATCH path = (u1:User)-[:FOLLOWS]->(u2:User)-[:FOLLOWS]->(u3:User)
      WHERE u1.followers >= $minFollowers 
        AND u2.followers >= $minFollowers
      WITH DISTINCT u1, u2, u3          
      LIMIT $pathLimit
      
      // Get some tweets from these users
      OPTIONAL MATCH (u1)-[:POSTS]->(t:Tweet)
      WITH u1, u2, u3, COLLECT(DISTINCT t)[0..2] AS tweets
      
      // Get hashtags from tweets, filtered by usage frequency
      UNWIND CASE WHEN SIZE(tweets) > 0 THEN tweets ELSE [null] END AS tweet
      OPTIONAL MATCH (tweet)-[:TAGS]->(h:Hashtag)
      WITH u1, u2, u3, tweet, h, 
           CASE WHEN h IS NOT NULL 
                THEN SIZE([(h)<-[:TAGS]-() | 1]) 
                ELSE 0 
           END AS hashtagUsage
      WHERE h IS NULL OR hashtagUsage >= $minHashtagUsage
      
      RETURN u1, u2, u3, tweet, h
      LIMIT 200
    `;

    const pathLimit = Math.max(Math.ceil(limit / 4), 10);

    const result = await this.neo4jService.executeQuery(query, { 
      pathLimit: neo4j.int(pathLimit),
      minFollowers: neo4j.int(minFollowers),
      minHashtagUsage: neo4j.int(minHashtagUsage),
    });

    const nodes: Map<string, NetworkNode> = new Map();
    const edges: NetworkEdge[] = [];
    const edgeSet = new Set<string>();

    result.records.forEach((record) => {
      const u1 = record.get('u1');
      const u2 = record.get('u2');
      const u3 = record.get('u3');
      const tweet = record.get('tweet');
      const h = record.get('h');

      // Helper to add user
      const addUser = (user: any) => {
        if (!user) return null;
        const props = user.properties || user;
        const id = props.screen_name;
        
        if (!nodes.has(id)) {
          nodes.set(id, {
            id,
            label: props.screen_name,
            type: 'User',
            size: Math.round(Math.min(40, Math.max(25, Math.log(this.extractNumber(props.followers) + 1) * 3))),
          });
        }
        return id;
      };

      // Add users
      const u1Id = addUser(u1);
      const u2Id = addUser(u2);
      const u3Id = addUser(u3);

      // Add FOLLOWS edges
      if (u1Id && u2Id) {
        const key = `${u1Id}->${u2Id}`;
        if (!edgeSet.has(key)) {
          edges.push({ source: u1Id, target: u2Id, type: 'FOLLOWS' });
          edgeSet.add(key);
        }
      }
      
      if (u2Id && u3Id) {
        const key = `${u2Id}->${u3Id}`;
        if (!edgeSet.has(key)) {
          edges.push({ source: u2Id, target: u3Id, type: 'FOLLOWS' });
          edgeSet.add(key);
        }
      }

      // Add tweet (only if we haven't hit limit)
      if (tweet && u1Id && nodes.size < limit * 1.5) {
        const tProps = tweet.properties || tweet;
        const tId = String(tProps.id_str || tProps.id);
        
        if (!nodes.has(tId)) {
          nodes.set(tId, {
            id: tId,
            label: (tProps.text || 'Tweet').substring(0, 20),
            type: 'Tweet',
            size: 15,
          });

          const key = `${u1Id}->${tId}`;
          if (!edgeSet.has(key)) {
            edges.push({ source: u1Id, target: tId, type: 'POSTS' });
            edgeSet.add(key);
          }

          // Add hashtag
          if (h && nodes.size < limit * 2) {
            const hProps = h.properties || h;
            const hId = `#${hProps.name}`;
            
            if (!nodes.has(hId)) {
              nodes.set(hId, {
                id: hId,
                label: `#${hProps.name}`,
                type: 'Hashtag',
                size: 18,
              });
            }

            const key2 = `${tId}->${hId}`;
            if (!edgeSet.has(key2)) {
              edges.push({ source: tId, target: hId, type: 'TAGS' });
              edgeSet.add(key2);
            }
          }
        }
      }
    });

    return {
      nodes: Array.from(nodes.values()).slice(0, limit),
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

