import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  uploadPreset: string;
}

@Injectable()
export class UploadsService {
  constructor(private readonly configService: ConfigService) {}

  createRecipeImageSignature(): UploadSignature {
    const cloudName = this.configService.getOrThrow<string>(
      'cloudinary.cloudName',
    );
    const apiKey = this.configService.getOrThrow<string>('cloudinary.apiKey');
    const apiSecret = this.configService.getOrThrow<string>(
      'cloudinary.apiSecret',
    );
    const uploadPreset = this.configService.getOrThrow<string>(
      'cloudinary.uploadPreset',
    );

    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, upload_preset: uploadPreset },
      apiSecret,
    );

    return { signature, timestamp, apiKey, cloudName, uploadPreset };
  }
}
