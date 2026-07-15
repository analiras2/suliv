import { IsIn } from 'class-validator';

export class ListAllergensQueryDto {
  @IsIn(['approved'])
  status!: 'approved';
}
