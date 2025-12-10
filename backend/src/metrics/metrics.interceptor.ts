import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { GqlExecutionContext } from '@nestjs/graphql';
import { MetricsService } from './metrics.service';

// Tracks HTTP request count, duration, and GraphQL operation names
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const contextType = context.getType<string>();

    // Track GraphQL operations separately
    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const info = gqlCtx.getInfo();
      const operation = info?.fieldName || 'unknown';

      return next.handle().pipe(
        tap(() => {
          this.metricsService.graphqlQueriesTotal.inc({ operation });
        }),
      );
    }

    // Track HTTP requests
    const request = context.switchToHttp().getRequest();
    if (!request) return next.handle();

    const method = request.method;
    const route = request.route?.path || request.url;

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response?.statusCode || 200;
        const duration = (Date.now() - startTime) / 1000;

        this.metricsService.httpRequestsTotal.inc({
          method,
          route,
          status_code: statusCode,
        });
        this.metricsService.httpRequestDuration.observe(
          { method, route, status_code: statusCode },
          duration,
        );
      }),
    );
  }
}
