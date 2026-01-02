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
 * Enum środowisk aplikacji
 */
enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Klasa definiująca wymagane zmienne środowiskowe
 *
 * Ta klasa służy do walidacji zmiennych środowiskowych przy starcie aplikacji.
 * Dekoratory class-validator określają wymagania dla każdej zmiennej.
 */
class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsUrl({ require_tld: false }) // require_tld: false pozwala na localhost
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
 * Funkcja walidująca zmienne środowiskowe
 *
 * Jest wywoływana przez ConfigModule przy starcie aplikacji.
 * Jeśli walidacja się nie powiedzie, aplikacja nie wystartuje.
 *
 * @param config - Obiekt ze zmiennymi środowiskowymi
 * @returns Zwalidowany obiekt konfiguracji
 * @throws Error jeśli walidacja się nie powiedzie
 */
export function validate(config: Record<string, unknown>) {
  // plainToInstance konwertuje zwykły obiekt na instancję klasy
  // enableImplicitConversion: true - automatycznie konwertuje typy (np. string "3000" na number 3000)
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  // validateSync wykonuje synchroniczną walidację
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    // Formatujemy błędy do czytelnej postaci
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
