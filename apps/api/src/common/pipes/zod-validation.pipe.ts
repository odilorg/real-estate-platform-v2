import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      console.log(
        '[ZodValidationPipe] Validating value:',
        JSON.stringify(value, null, 2),
      );
      const result = this.schema.parse(value);
      console.log('[ZodValidationPipe] Validation successful');
      return result;
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[ZodValidationPipe] Validation error:', error.errors);
        const messages = error.errors.map((err) => {
          const path = err.path.join('.');
          return path ? `${path}: ${err.message}` : err.message;
        });
        throw new BadRequestException({
          message: 'Validation failed',
          errors: messages,
        });
      }
      console.error('[ZodValidationPipe] Unknown error:', error);
      throw new BadRequestException('Validation failed');
    }
  }
}
