import { IsIn } from 'class-validator';

export type ResolveReportAction = 'dismiss' | 'hide_content' | 'reopen_recipe';

export class ResolveReportDto {
  @IsIn(['dismiss', 'hide_content', 'reopen_recipe'])
  action!: ResolveReportAction;
}
