import { Injectable } from '@nestjs/common';
import neo4j from 'neo4j-driver';
import { Neo4jService } from '../../database/neo4j.service';
import {
  extractNumber,
  extractString,
  extractNodeProperties,
  getRecordField,
  Neo4jNode,
  Neo4jNumeric,
  Neo4jValue,
} from '../../database/neo4j.types';
import {
  DashboardStats,
  NetworkData,
  NetworkNode,
  NetworkEdge,
} from './analytics.types';

// Type definitions for Neo4j node properties
interface UserProperties {
  screen_name: string;
  name?: string;
  followers: Neo4jNumeric;
  following?: Neo4jNumeric;
}

interface TweetProperties {
  id_str?: string;
  id?: Neo4jValue;
  text?: string;
  created_at?: string;
  favorites?: Neo4jNumeric;
  import_method?: string;
}

interface HashtagProperties {
  name: string;
}

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

    if (!record) {
      return {
        totalUsers: 0,
        totalTweets: 0,
        totalHashtags: 0,
        totalRelationships: 0,
      };
    }

    return {
      totalUsers: extractNumber(getRecordField(record, 'userCount')),
      totalTweets: extractNumber(getRecordField(record, 'tweetCount')),
      totalHashtags: extractNumber(getRecordField(record, 'hashtagCount')),
      totalRelationships: extractNumber(getRecordField(record, 'relCount')),
    };
  }

  async getNetworkData(
    limit: number = 100,
    minFollowers: number = 0,
    minHashtagUsage: number = 5,
    minTweets: number = 0,
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
      WITH u1, u2, u3, COLLECT(DISTINCT t)[0..2] AS tweets, 
           SIZE([(u1)-[:POSTS]->(:Tweet) | 1]) AS u1TweetCount,
           SIZE([(u2)-[:POSTS]->(:Tweet) | 1]) AS u2TweetCount
      WHERE u1TweetCount >= $minTweets AND u2TweetCount >= $minTweets
      
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
      minTweets: neo4j.int(minTweets),
    });

    const nodes: Map<string, NetworkNode> = new Map();
    const edges: NetworkEdge[] = [];
    const edgeSet = new Set<string>();

    result.records.forEach((record) => {
      const u1 = getRecordField<Neo4jNode<UserProperties>>(record, 'u1');
      const u2 = getRecordField<Neo4jNode<UserProperties>>(record, 'u2');
      const u3 = getRecordField<Neo4jNode<UserProperties>>(record, 'u3');
      const tweet = getRecordField<Neo4jNode<TweetProperties>>(record, 'tweet');
      const h = getRecordField<Neo4jNode<HashtagProperties>>(record, 'h');

      // Helper to add user
      const addUser = (
        user: Neo4jNode<UserProperties> | null,
      ): string | null => {
        if (!user) return null;
        const props = extractNodeProperties<UserProperties>(user);
        if (!props) return null;

        const id = extractString(props.screen_name);
        if (!id) return null;

        if (!nodes.has(id)) {
          nodes.set(id, {
            id,
            label:
              extractString(props.name) || extractString(props.screen_name),
            type: 'user',
            size: Math.round(
              Math.min(
                40,
                Math.max(25, Math.log(extractNumber(props.followers) + 1) * 3),
              ),
            ),
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
        const tProps = extractNodeProperties<TweetProperties>(tweet);
        if (!tProps) return;

        const tId = extractString(tProps.id_str || tProps.id);
        if (!tId) return;

        if (!nodes.has(tId)) {
          const text = extractString(tProps.text) || 'Tweet';
          const label = text.substring(0, 20);
          nodes.set(tId, {
            id: tId,
            label,
            type: 'tweet',
            size: 15,
          });

          const key = `${u1Id}->${tId}`;
          if (!edgeSet.has(key)) {
            edges.push({ source: u1Id, target: tId, type: 'POSTS' });
            edgeSet.add(key);
          }

          // Add hashtag
          if (h && nodes.size < limit * 2) {
            const hProps = extractNodeProperties<HashtagProperties>(h);
            if (!hProps) return;

            const hashtagName = extractString(hProps.name);
            if (!hashtagName) return;

            const hId = `#${hashtagName}`;

            if (!nodes.has(hId)) {
              nodes.set(hId, {
                id: hId,
                label: `#${hashtagName}`,
                type: 'hashtag',
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
}
