import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session, QueryResult } from 'neo4j-driver';

/**
 * Neo4j Database Service
 *
 * Manages connection to Neo4j graph database and provides
 * a simple interface for executing Cypher queries.
 *
 * Design principles:
 * - Single Responsibility: Only handles Neo4j connection and query execution
 * - Fail Loudly: All errors are propagated with clear messages
 * - Resource Management: Properly closes sessions and driver
 * - Testability: Uses dependency injection for configuration
 */
@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: Driver;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize Neo4j driver on module startup
   */
  async onModuleInit() {
    const uri = this.configService.get<string>('neo4j.uri') || 'bolt://localhost:7687';
    const username = this.configService.get<string>('neo4j.username') || 'neo4j';
    const password = this.configService.get<string>('neo4j.password') || 'password';

    console.log('🔌 Connecting to Neo4j:', uri);

    // Create driver instance
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

    // Verify connectivity on startup
    try {
      await this.driver.verifyConnectivity();
      console.log('✅ Neo4j connection established');
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error);
      throw new Error(`Failed to connect to Neo4j: ${error.message}`);
    }
  }

  /**
   * Execute a Cypher query with parameters
   *
   * @param query - Cypher query string
   * @param params - Query parameters (prevents injection)
   * @returns Query result with records
   *
   * @example
   * const result = await neo4jService.executeQuery(
   *   'MATCH (u:User {screen_name: $screenName}) RETURN u',
   *   { screenName: 'neo4j' }
   * );
   */
  async executeQuery(
    query: string,
    params: Record<string, any> = {},
  ): Promise<QueryResult> {
    let session: Session | null = null;

    try {
      // Create a new session for this query
      session = this.driver.session();

      // Execute query with parameters
      const result = await session.run(query, params);

      return result;
    } catch (error) {
      // Fail loudly with clear error message
      console.error('Neo4j query error:', {
        query,
        params,
        error: error.message,
      });

      throw error;
    } finally {
      // Always close session to prevent resource leaks
      if (session) {
        await session.close();
      }
    }
  }

  /**
   * Check if database connection is healthy
   *
   * @returns true if connected, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.driver.verifyConnectivity();
      return true;
    } catch (error) {
      console.error('Neo4j health check failed:', error.message);
      return false;
    }
  }

  /**
   * Close driver connection on module shutdown
   */
  async onModuleDestroy() {
    try {
      await this.driver.close();
      console.log('✅ Neo4j connection closed');
    } catch (error) {
      console.error('Error closing Neo4j connection:', error.message);
    }
  }
}

