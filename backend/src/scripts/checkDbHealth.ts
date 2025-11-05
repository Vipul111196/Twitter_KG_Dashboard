#!/usr/bin/env ts-node
/**
 * Check Neo4j database health
 * Validates connection and basic query execution
 */

import neo4j, { Integer } from 'neo4j-driver';

function extractVersion(value: unknown): string {
  if (Array.isArray(value) && value.length > 0) {
    return String(value[0]);
  }
  return 'unknown';
}

function extractCount(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as Integer).toNumber();
  }
  return 0;
}

async function checkDbHealth(): Promise<void> {
  console.log('🔍 Checking Neo4j database health...');

  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

  try {
    // Test connectivity
    await driver.verifyConnectivity();
    console.log('✅ Neo4j connectivity verified');

    const session = driver.session();

    try {
      // Get database info
      const result = await session.run('CALL dbms.components() YIELD versions');
      const versionValue: unknown = result.records[0]?.get('versions');
      const version = extractVersion(versionValue);
      console.log(`✅ Neo4j version: ${version}`);

      // Count nodes
      const countResult = await session.run(
        'MATCH (n) RETURN count(n) as count',
      );
      const countValue: unknown = countResult.records[0]?.get('count');
      const nodeCount = extractCount(countValue);
      console.log(`✅ Total nodes: ${nodeCount}`);

      if (nodeCount === 0) {
        console.warn('⚠️  Warning: Database is empty');
      }
    } finally {
      await session.close();
    }

    console.log('✅ Database health check passed');
    await driver.close();
    process.exit(0);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Database health check failed:', errorMessage);
    await driver.close();
    process.exit(1);
  }
}

void checkDbHealth();
