import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema } from 'zod';

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
    } catch (error) {
      // Zod provides detailed validation errors
      throw new BadRequestException({
        message: 'Validation failed',
        errors: error.errors || error.message,
      });
    }
  }
}

