import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AcceptTermsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  termsVersion!: string;
}
