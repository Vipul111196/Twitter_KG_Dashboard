import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new Registry();

  // HTTP request metrics
  readonly httpRequestsTotal: Counter;
  readonly httpRequestDuration: Histogram;

  // GraphQL-specific metrics
  readonly graphqlQueriesTotal: Counter;

  // Neo4j connection health
  readonly neo4jUp: Gauge;

  constructor() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.graphqlQueriesTotal = new Counter({
      name: 'graphql_queries_total',
      help: 'Total GraphQL queries executed',
      labelNames: ['operation'],
      registers: [this.registry],
    });

    this.neo4jUp = new Gauge({
      name: 'neo4j_up',
      help: 'Neo4j connection status (1=connected, 0=disconnected)',
      registers: [this.registry],
    });
  }

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
