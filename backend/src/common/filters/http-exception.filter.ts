import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { Response, Request } from 'express';

/**
 * Global exception filter for handling HTTP and GraphQL errors
 * Follows the principle of robustness: fail loudly with clear error messages
 */
@Catch()
export class AllExceptionsFilter
  implements ExceptionFilter, GqlExceptionFilter
{
  catch(exception: unknown, host: ArgumentsHost) {
    // Check if this is a GraphQL context
    if (host.getType().toString() === 'graphql') {
      return this.catchGraphQLException(exception);
    }

    // Handle REST API exceptions
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }

  catchGraphQLException(exception: unknown) {
    if (exception instanceof HttpException) {
      return exception;
    }

    // For unknown errors, throw with clear message
    if (exception instanceof Error) {
      throw new Error(`GraphQL Error: ${exception.message}`);
    }

    throw new Error('An unexpected error occurred');
  }
}
