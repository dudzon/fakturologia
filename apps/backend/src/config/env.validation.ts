import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

/**
 * Application environments enum
 */
enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Class defining required environment variables
 *
 * This class is used to validate environment variables at application startup.
 * class-validator decorators specify requirements for each variable.
 */
class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsUrl({ require_tld: false }) // require_tld: false allows localhost
  SUPABASE_URL: string;

  @IsString()
  SUPABASE_ANON_KEY: string;

  @IsString()
  SUPABASE_SERVICE_ROLE_KEY: string;

  @IsString()
  SUPABASE_JWT_SECRET: string;

  @IsString()
  @IsOptional()
  ALLOWED_ORIGINS?: string;
}

/**
 * Function validating environment variables
 *
 * Called by ConfigModule at application startup.
 * If validation fails, application will not start.
 *
 * @param config - Object with environment variables
 * @returns Validated configuration object
 * @throws Error if validation fails
 */
export function validate(config: Record<string, unknown>) {
  // plainToInstance converts plain object to class instance
  // enableImplicitConversion: true - automatically converts types (e.g., string "3000" to number 3000)
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  // validateSync performs synchronous validation
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    // Format errors to readable form
    const errorMessages = errors
      .map((error) => {
        const constraints = Object.values(error.constraints || {}).join(', ');
        return `${error.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return validatedConfig;
}
