import { Injectable } from '@nestjs/common';
import { Neo4jService } from './database/neo4j.service';

@Injectable()
export class AppService {
  constructor(private readonly neo4jService: Neo4jService) {}

  getHello(): string {
    return 'Twitter Analytics Dashboard API - GraphQL endpoint at /graphql';
  }

  async getHealth(): Promise<{
    status: string;
    neo4j: boolean;
    message: string;
  }> {
    const neo4jHealthy = await this.neo4jService.healthCheck();

    return {
      status: neo4jHealthy ? 'healthy' : 'degraded',
      neo4j: neo4jHealthy,
      message: neo4jHealthy
        ? 'All systems operational'
        : 'Neo4j connection issue',
    };
  }
}
