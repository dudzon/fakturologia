import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { UsersService } from './users.service';
import { JwtAuthGuard, CurrentUser } from '../../common';
import {
  UserProfileResponseDto,
  UpdateUserProfileDto,
  UploadLogoResponseDto,
  MessageResponseDto,
} from './dto';

/**
 * UsersController - Kontroler obsługujący endpointy profilu użytkownika
 *
 * W architekturze NestJS kontroler:
 * 1. Odbiera żądania HTTP
 * 2. Waliduje dane wejściowe (automatycznie przez ValidationPipe)
 * 3. Deleguje logikę do serwisu
 * 4. Zwraca odpowiedź HTTP
 *
 * Zasada "szczupłego kontrolera":
 * - Kontroler NIE zawiera logiki biznesowej
 * - Cała logika jest w UsersService
 *
 * Dekoratory na poziomie klasy:
 * @ApiTags('Users') - grupuje endpointy w Swagger
 * @ApiBearerAuth('access-token') - wszystkie endpointy wymagają JWT
 * @UseGuards(JwtAuthGuard) - globalny guard dla całego kontrolera
 * @Controller('users') - prefix ścieżki: /api/v1/users/*
 */
@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/v1/users/profile
   *
   * Pobiera profil aktualnie zalogowanego użytkownika.
   * Dane użytkownika są pobierane z tokenu JWT przez @CurrentUser().
   *
   * @param user - Obiekt użytkownika z JWT (wstrzykiwany przez @CurrentUser)
   * @returns UserProfileResponseDto - pełne dane profilu
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Pobierz profil użytkownika',
    description:
      'Zwraca profil aktualnie zalogowanego użytkownika wraz z danymi firmy',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil użytkownika',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Brak autoryzacji - nieprawidłowy lub brakujący token',
  })
  @ApiResponse({
    status: 404,
    description: 'Profil nie znaleziony',
  })
  async getProfile(@CurrentUser() user: User): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(user.id);
  }

  /**
   * PUT /api/v1/users/profile
   *
   * Aktualizuje profil użytkownika.
   * Wszystkie pola są opcjonalne - można aktualizować wybrane.
   *
   * Walidacja DTO:
   * - nip: 10 cyfr + suma kontrolna NIP
   * - bankAccount: format IBAN + mod 97
   * - invoiceNumberFormat: musi zawierać {NNN}
   *
   * @param user - Obiekt użytkownika z JWT
   * @param updateDto - Dane do aktualizacji
   * @returns UserProfileResponseDto - zaktualizowany profil
   */
  @Put('profile')
  @ApiOperation({
    summary: 'Aktualizuj profil użytkownika',
    description:
      'Aktualizuje dane firmy użytkownika. Wszystkie pola są opcjonalne.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil zaktualizowany pomyślnie',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Błąd walidacji - nieprawidłowy NIP, IBAN lub format numeracji',
  })
  @ApiResponse({
    status: 401,
    description: 'Brak autoryzacji',
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateProfile(user.id, updateDto);
  }

  /**
   * POST /api/v1/users/profile/logo
   *
   * Uploaduje lub zastępuje logo firmy.
   *
   * FileInterceptor:
   * - Parsuje multipart/form-data
   * - Pole 'file' zawiera plik
   *
   * ParseFilePipe:
   * - MaxFileSizeValidator: max 2MB
   * - FileTypeValidator: tylko PNG i JPG
   *
   * @param user - Obiekt użytkownika z JWT
   * @param file - Plik logo (z multer)
   * @returns UploadLogoResponseDto - URL do nowego logo
   */
  @Post('profile/logo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload logo firmy',
    description:
      'Uploaduje lub zastępuje logo firmy. Akceptowane formaty: PNG, JPG. Max rozmiar: 2MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Plik logo firmy',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Plik obrazu (PNG lub JPG, max 2MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logo uploadowane pomyślnie',
    type: UploadLogoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Błąd walidacji - nieprawidłowy typ pliku lub plik za duży',
  })
  @ApiResponse({
    status: 401,
    description: 'Brak autoryzacji',
  })
  async uploadLogo(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // Max 2MB
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          // Tylko PNG i JPG
          new FileTypeValidator({ fileType: /^image\/(png|jpeg)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadLogoResponseDto> {
    return this.usersService.uploadLogo(user.id, file);
  }

  /**
   * DELETE /api/v1/users/profile/logo
   *
   * Usuwa logo firmy.
   *
   * @HttpCode(HttpStatus.OK) - zwraca 200 zamiast domyślnego 204 dla DELETE
   * (bo zwracamy body z komunikatem)
   *
   * @param user - Obiekt użytkownika z JWT
   * @returns MessageResponseDto - komunikat sukcesu
   */
  @Delete('profile/logo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Usuń logo firmy',
    description: 'Usuwa logo firmy użytkownika z systemu',
  })
  @ApiResponse({
    status: 200,
    description: 'Logo usunięte pomyślnie',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Brak autoryzacji',
  })
  @ApiResponse({
    status: 404,
    description: 'Logo nie istnieje',
  })
  async deleteLogo(@CurrentUser() user: User): Promise<MessageResponseDto> {
    return this.usersService.deleteLogo(user.id);
  }
}
