#!/usr/bin/env ts-node
/**
 * Check Neo4j database health
 * Validates connection and basic query execution
 */

import neo4j from 'neo4j-driver';

async function checkDbHealth() {
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
      const version = result.records[0]?.get('versions')[0] || 'unknown';
      console.log(`✅ Neo4j version: ${version}`);

      // Count nodes
      const countResult = await session.run('MATCH (n) RETURN count(n) as count');
      const nodeCount = countResult.records[0]?.get('count').toNumber() || 0;
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
    console.error('❌ Database health check failed:', error.message);
    await driver.close();
    process.exit(1);
  }
}

checkDbHealth();


