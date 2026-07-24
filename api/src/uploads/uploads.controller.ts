import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { UploadSignature } from './uploads.service';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(SupabaseAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('recipe-image-signature')
  @HttpCode(HttpStatus.OK)
  createRecipeImageSignature(): UploadSignature {
    return this.uploadsService.createRecipeImageSignature();
  }
}
