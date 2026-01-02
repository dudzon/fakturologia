/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * UsersService - Serwis obsługujący logikę biznesową profili użytkowników
 *
 * UWAGA: Wyłączamy niektóre reguły ESLint dla tego pliku,
 * ponieważ Supabase client zwraca typy `any` bez generowanych typów bazy danych.
 * W produkcji zalecane jest użycie typów generowanych przez Supabase CLI.
 */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ProfileNotFoundException,
  LogoNotFoundException,
  InvalidFileTypeException,
  FileTooLargeException,
} from '../../common';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

/**
 * Interfejs reprezentujący rekord z tabeli user_profiles
 * Nazwy pól odpowiadają kolumnom w bazie danych (snake_case)
 */
interface UserProfileRow {
  id: string;
  company_name: string | null;
  address: string | null;
  nip: string | null;
  bank_account: string | null;
  logo_url: string | null;
  invoice_number_format: string | null;
  invoice_number_counter: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * UsersService - Serwis obsługujący logikę biznesową profili użytkowników
 *
 * Serwisy w NestJS zawierają całą logikę biznesową.
 * Kontrolery powinny być "szczupłe" - tylko obsługują HTTP
 * i delegują pracę do serwisów.
 *
 * Ten serwis komunikuje się z Supabase:
 * - Tabela user_profiles - dane firmy użytkownika
 * - Supabase Storage (bucket: logos) - logo firm
 * - Supabase Auth - dane użytkownika (email)
 *
 * Wzorzec: Używamy service role key dla pełnego dostępu
 * (pomija Row Level Security), ponieważ autoryzacja
 * jest już obsługiwana przez JwtAuthGuard.
 */
@Injectable()
export class UsersService {
  private supabase: SupabaseClient<any, any, any>;
  private readonly logger = new Logger(UsersService.name);

  // Konfiguracja uploadu plików
  private readonly MAX_LOGO_SIZE: number;
  private readonly ALLOWED_MIME_TYPES: string[];
  private readonly STORAGE_BUCKET = 'logos';

  constructor(private readonly configService: ConfigService) {
    // Pobierz konfigurację Supabase
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const serviceRoleKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration is missing');
    }

    // Inicjalizacja klienta Supabase z service role key
    // Service role key pomija RLS i daje pełny dostęp do bazy
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Konfiguracja uploadu z pliku konfiguracyjnego
    this.MAX_LOGO_SIZE =
      this.configService.get<number>('upload.maxLogoSizeBytes') ||
      2 * 1024 * 1024;
    this.ALLOWED_MIME_TYPES = this.configService.get<string[]>(
      'upload.allowedMimeTypes',
    ) || ['image/png', 'image/jpeg'];
  }

  /**
   * Pobiera profil użytkownika
   *
   * Łączy dane z dwóch źródeł:
   * 1. auth.users - email użytkownika
   * 2. user_profiles - dane firmy
   *
   * @param userId - ID użytkownika (z JWT tokenu)
   * @returns UserProfileResponseDto - profil użytkownika
   * @throws ProfileNotFoundException - gdy profil nie istnieje
   */
  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    this.logger.debug(`Getting profile for user: ${userId}`);

    // Pobierz dane z tabeli user_profiles
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      this.logger.warn(`Profile not found for user: ${userId}`);
      throw new ProfileNotFoundException();
    }

    // Pobierz email z Supabase Auth
    const { data: userData, error: userError } =
      await this.supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      this.logger.error(`Failed to get user data: ${userError?.message}`);
      throw new ProfileNotFoundException();
    }

    // Mapuj dane z bazy na DTO (snake_case → camelCase)
    return this.mapToProfileDto(
      profile as UserProfileRow,
      userData.user.email!,
    );
  }

  /**
   * Aktualizuje profil użytkownika
   *
   * Aktualizuje tylko pola przekazane w DTO.
   * Pola undefined są pomijane.
   *
   * @param userId - ID użytkownika
   * @param dto - dane do aktualizacji
   * @returns UserProfileResponseDto - zaktualizowany profil
   */
  async updateProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    this.logger.debug(`Updating profile for user: ${userId}`);

    // Mapuj DTO na format bazy danych (camelCase → snake_case)
    // Używamy Object.entries aby pominąć pola undefined
    const updateData: Record<string, unknown> = {};

    if (dto.companyName !== undefined) {
      updateData.company_name = dto.companyName;
    }
    if (dto.address !== undefined) {
      updateData.address = dto.address;
    }
    if (dto.nip !== undefined) {
      updateData.nip = dto.nip;
    }
    if (dto.bankAccount !== undefined) {
      updateData.bank_account = dto.bankAccount;
    }
    if (dto.invoiceNumberFormat !== undefined) {
      updateData.invoice_number_format = dto.invoiceNumberFormat;
    }

    // Dodaj timestamp aktualizacji
    updateData.updated_at = new Date().toISOString();

    // Wykonaj aktualizację
    const { error: updateError } = await this.supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      this.logger.error(`Failed to update profile: ${updateError.message}`);
      throw new InternalServerErrorException('Failed to update profile');
    }

    // Zwróć zaktualizowany profil
    return this.getProfile(userId);
  }

  /**
   * Uploaduje logo firmy
   *
   * Proces:
   * 1. Walidacja typu i rozmiaru pliku
   * 2. Usunięcie starego logo (jeśli istnieje)
   * 3. Upload nowego logo do Supabase Storage
   * 4. Aktualizacja URL w bazie danych
   *
   * Nazewnictwo pliku: logos/{userId}/logo.{timestamp}.{extension}
   * Timestamp zapobiega problemom z cache'owaniem.
   *
   * @param userId - ID użytkownika
   * @param file - plik do uploadu (z multer)
   * @returns { logoUrl: string } - URL do nowego logo
   */
  async uploadLogo(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ logoUrl: string }> {
    this.logger.debug(`Uploading logo for user: ${userId}`);

    // 1. Walidacja typu pliku
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new InvalidFileTypeException();
    }

    // 2. Walidacja rozmiaru pliku
    if (file.size > this.MAX_LOGO_SIZE) {
      throw new FileTooLargeException();
    }

    // 3. Pobierz aktualny profil aby sprawdzić czy jest stare logo
    const { data: profile } = await this.supabase
      .from('user_profiles')
      .select('logo_url')
      .eq('id', userId)
      .single();

    // 4. Usuń stare logo jeśli istnieje
    if (profile?.logo_url) {
      await this.deleteLogoFile(profile.logo_url);
    }

    // 5. Przygotuj ścieżkę dla nowego pliku
    const extension = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const timestamp = Date.now();
    const filePath = `${userId}/logo.${timestamp}.${extension}`;

    // 6. Upload do Supabase Storage
    const { error: uploadError } = await this.supabase.storage
      .from(this.STORAGE_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true, // Nadpisz jeśli istnieje
      });

    if (uploadError) {
      this.logger.error(`Failed to upload logo: ${uploadError.message}`);
      throw new InternalServerErrorException('Failed to upload logo');
    }

    // 7. Pobierz publiczny URL
    const { data: urlData } = this.supabase.storage
      .from(this.STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const logoUrl = urlData.publicUrl;

    // 8. Aktualizuj URL w bazie danych
    const { error: updateError } = await this.supabase
      .from('user_profiles')
      .update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      this.logger.error(`Failed to update logo URL: ${updateError.message}`);
      // Próbuj usunąć uploadowany plik
      await this.supabase.storage.from(this.STORAGE_BUCKET).remove([filePath]);
      throw new InternalServerErrorException('Failed to update logo URL');
    }

    this.logger.log(`Logo uploaded successfully for user: ${userId}`);
    return { logoUrl };
  }

  /**
   * Usuwa logo firmy
   *
   * Proces:
   * 1. Sprawdź czy logo istnieje
   * 2. Usuń plik z Storage
   * 3. Wyczyść URL w bazie danych
   *
   * @param userId - ID użytkownika
   * @returns { message: string } - komunikat sukcesu
   * @throws LogoNotFoundException - gdy logo nie istnieje
   */
  async deleteLogo(userId: string): Promise<{ message: string }> {
    this.logger.debug(`Deleting logo for user: ${userId}`);

    // 1. Pobierz aktualny URL logo
    const { data: profile, error: selectError } = await this.supabase
      .from('user_profiles')
      .select('logo_url')
      .eq('id', userId)
      .single();

    if (selectError) {
      this.logger.error(`Failed to get profile: ${selectError.message}`);
      throw new ProfileNotFoundException();
    }

    // 2. Sprawdź czy logo istnieje
    if (!profile?.logo_url) {
      throw new LogoNotFoundException();
    }

    // 3. Usuń plik z Storage
    await this.deleteLogoFile(profile.logo_url);

    // 4. Wyczyść URL w bazie danych
    const { error: updateError } = await this.supabase
      .from('user_profiles')
      .update({
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      this.logger.error(`Failed to clear logo URL: ${updateError.message}`);
      throw new InternalServerErrorException('Failed to delete logo');
    }

    this.logger.log(`Logo deleted successfully for user: ${userId}`);
    return { message: 'Logo successfully deleted' };
  }

  /**
   * Pomocnicza metoda do usuwania pliku logo z Storage
   *
   * Wyciąga ścieżkę pliku z pełnego URL i usuwa go.
   *
   * @param logoUrl - pełny URL do logo
   */
  private async deleteLogoFile(logoUrl: string): Promise<void> {
    try {
      // URL ma format: https://xxx.supabase.co/storage/v1/object/public/logos/userId/filename
      // Musimy wyciągnąć: userId/filename
      const url = new URL(logoUrl);
      const pathParts = url.pathname.split('/');

      // Znajdź index 'logos' i weź wszystko po nim
      const bucketIndex = pathParts.indexOf(this.STORAGE_BUCKET);
      if (bucketIndex === -1) {
        this.logger.warn(`Invalid logo URL format: ${logoUrl}`);
        return;
      }

      const filePath = pathParts.slice(bucketIndex + 1).join('/');

      const { error } = await this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([filePath]);

      if (error) {
        this.logger.warn(`Failed to delete old logo: ${error.message}`);
        // Nie rzucamy błędu - stare logo może już nie istnieć
      }
    } catch {
      this.logger.warn(`Error parsing logo URL: ${logoUrl}`);
      // Nie rzucamy błędu - to tylko cleanup
    }
  }

  /**
   * Mapuje rekord z bazy danych na DTO
   *
   * Konwertuje snake_case na camelCase i dodaje email.
   *
   * @param profile - rekord z tabeli user_profiles
   * @param email - email użytkownika z auth.users
   * @returns UserProfileResponseDto
   */
  private mapToProfileDto(
    profile: UserProfileRow,
    email: string,
  ): UserProfileResponseDto {
    return {
      id: profile.id,
      email,
      companyName: profile.company_name,
      address: profile.address,
      nip: profile.nip,
      bankAccount: profile.bank_account,
      logoUrl: profile.logo_url,
      invoiceNumberFormat: profile.invoice_number_format || 'FV/{YYYY}/{NNN}',
      invoiceNumberCounter: profile.invoice_number_counter || 0,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
    };
  }
}
