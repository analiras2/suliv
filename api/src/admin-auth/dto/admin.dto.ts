import { Admin } from '@prisma/client';

export class AdminDto {
  id!: string;
  email!: string;
  role!: Admin['role'];

  static fromAdmin(admin: Pick<Admin, 'id' | 'email' | 'role'>): AdminDto {
    return { id: admin.id, email: admin.email, role: admin.role };
  }
}
