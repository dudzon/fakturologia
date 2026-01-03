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
 * UsersController - Controller handling user profile endpoints
 *
 * In NestJS architecture, a controller:
 * 1. Receives HTTP requests
 * 2. Validates input data (automatically via ValidationPipe)
 * 3. Delegates logic to the service
 * 4. Returns HTTP response
 *
 * "Thin controller" principle:
 * - Controller does NOT contain business logic
 * - All logic is in UsersService
 *
 * Class-level decorators:
 * @ApiTags('Users') - groups endpoints in Swagger
 * @ApiBearerAuth('access-token') - all endpoints require JWT
 * @UseGuards(JwtAuthGuard) - global guard for entire controller
 * @Controller('users') - path prefix: /api/v1/users/*
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
   * Gets the profile of the currently logged-in user.
   * User data is retrieved from the JWT token via @CurrentUser().
   *
   * @param user - User object from JWT (injected by @CurrentUser)
   * @returns UserProfileResponseDto - full profile data
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'Returns the profile of the currently logged-in user along with company data',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async getProfile(@CurrentUser() user: User): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(user.id);
  }

  /**
   * PUT /api/v1/users/profile
   *
   * Updates the user profile.
   * All fields are optional - only selected fields can be updated.
   *
   * DTO Validation:
   * - nip: 10 digits + NIP checksum
   * - bankAccount: IBAN format + mod 97
   * - invoiceNumberFormat: must contain {NNN}
   *
   * @param user - User object from JWT
   * @param updateDto - Data to update
   * @returns UserProfileResponseDto - updated profile
   */
  @Put('profile')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates user company data. All fields are optional.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - invalid NIP, IBAN, or numbering format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
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
   * Uploads or replaces company logo.
   *
   * FileInterceptor:
   * - Parses multipart/form-data
   * - 'file' field contains the file
   *
   * ParseFilePipe:
   * - MaxFileSizeValidator: max 2MB
   * - FileTypeValidator: only PNG and JPG
   *
   * @param user - User object from JWT
   * @param file - Logo file (from multer)
   * @returns UploadLogoResponseDto - URL to new logo
   */
  @Post('profile/logo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload company logo',
    description:
      'Uploads or replaces company logo. Accepted formats: PNG, JPG. Max size: 2MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Company logo file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (PNG or JPG, max 2MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logo uploaded successfully',
    type: UploadLogoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - invalid file type or file too large',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadLogo(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // Max 2MB
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          // Only PNG and JPG
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
   * Deletes company logo.
   *
   * @HttpCode(HttpStatus.OK) - returns 200 instead of default 204 for DELETE
   * (because we return body with message)
   *
   * @param user - User object from JWT
   * @returns MessageResponseDto - success message
   */
  @Delete('profile/logo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete company logo',
    description: 'Deletes user company logo from the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Logo deleted successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Logo does not exist',
  })
  async deleteLogo(@CurrentUser() user: User): Promise<MessageResponseDto> {
    return this.usersService.deleteLogo(user.id);
  }
}
