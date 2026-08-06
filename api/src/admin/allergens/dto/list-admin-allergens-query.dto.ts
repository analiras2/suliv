import { IsIn } from 'class-validator';

export class ListAdminAllergensQueryDto {
  @IsIn(['pending', 'approved'])
  status!: 'pending' | 'approved';
}
