#!/usr/bin/env ts-node
/**
 * Verify data integrity in Neo4j
 * Checks for expected data structure and relationships
 */

import neo4j, { Integer } from 'neo4j-driver';

interface DataStats {
  users: number;
  tweets: number;
  hashtags: number;
  followsRelations: number;
  postsRelations: number;
  tagsRelations: number;
}

function extractCount(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as Integer).toNumber();
  }
  return 0;
}

async function verifyData(): Promise<void> {
  console.log('🔍 Verifying data integrity...\n');

  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

  try {
    const session = driver.session();
    const stats: DataStats = {
      users: 0,
      tweets: 0,
      hashtags: 0,
      followsRelations: 0,
      postsRelations: 0,
      tagsRelations: 0,
    };

    try {
      // Count nodes
      const userCount = await session.run(
        'MATCH (u:User) RETURN count(u) as count',
      );
      stats.users = extractCount(userCount.records[0]?.get('count'));

      const tweetCount = await session.run(
        'MATCH (t:Tweet) RETURN count(t) as count',
      );
      stats.tweets = extractCount(tweetCount.records[0]?.get('count'));

      const hashtagCount = await session.run(
        'MATCH (h:Hashtag) RETURN count(h) as count',
      );
      stats.hashtags = extractCount(hashtagCount.records[0]?.get('count'));

      // Count relationships
      const followsCount = await session.run(
        'MATCH ()-[r:FOLLOWS]->() RETURN count(r) as count',
      );
      stats.followsRelations = extractCount(
        followsCount.records[0]?.get('count'),
      );

      const postsCount = await session.run(
        'MATCH ()-[r:POSTS]->() RETURN count(r) as count',
      );
      stats.postsRelations = extractCount(postsCount.records[0]?.get('count'));

      const tagsCount = await session.run(
        'MATCH ()-[r:TAGS]->() RETURN count(r) as count',
      );
      stats.tagsRelations = extractCount(tagsCount.records[0]?.get('count'));

      // Display results
      console.log('📊 Nodes:');
      console.log(`   Users:    ${stats.users.toLocaleString()}`);
      console.log(`   Tweets:   ${stats.tweets.toLocaleString()}`);
      console.log(`   Hashtags: ${stats.hashtags.toLocaleString()}`);
      console.log('\n🔗 Relationships:');
      console.log(`   FOLLOWS:  ${stats.followsRelations.toLocaleString()}`);
      console.log(`   POSTS:    ${stats.postsRelations.toLocaleString()}`);
      console.log(`   TAGS:     ${stats.tagsRelations.toLocaleString()}`);

      // Validation
      const issues: string[] = [];

      if (stats.users === 0) issues.push('No users found');
      if (stats.tweets === 0) issues.push('No tweets found');
      if (stats.hashtags === 0) issues.push('No hashtags found');
      if (stats.postsRelations === 0)
        issues.push('No POSTS relationships found');

      if (issues.length > 0) {
        console.log('\n⚠️  Issues:');
        issues.forEach((issue) => console.log(`   - ${issue}`));
        process.exit(1);
      }

      console.log('\n✅ Data verification passed');
    } finally {
      await session.close();
    }

    await driver.close();
    process.exit(0);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Data verification failed:', errorMessage);
    await driver.close();
    process.exit(1);
  }
}

void verifyData();
