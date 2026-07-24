import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateAllergiesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  allergen_ids!: string[];

  @IsOptional()
  @IsString()
  new_term?: string;
}
