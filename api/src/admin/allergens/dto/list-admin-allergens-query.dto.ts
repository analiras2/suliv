import { IsIn } from 'class-validator';

export class ListAdminAllergensQueryDto {
  @IsIn(['pending'])
  status!: 'pending';
}
