import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

/**
 * Zod validation pipe for type-safe input validation
 * Validates incoming data against Zod schemas
 * Follows principle: fail loudly with clear validation errors
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (err: unknown) {
      // Zod provides detailed validation errors
      if (err instanceof ZodError) {
        // Extract error details from ZodError
        const validationErrors = err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        throw new BadRequestException({
          message: 'Validation failed',
          errors: validationErrors,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
