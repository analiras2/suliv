export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  username: string;
  usernameUpdatedAt: string | null;
  avatarUrl: string | null;
  dietPreference: 'vegano' | 'vegetariano' | 'flexitariano' | null;
  cookingLevel: 'iniciante' | 'intermediario' | 'avancado' | null;
  cookingFrequency: 'raramente' | 'algumas_vezes_semana' | 'quase_todo_dia' | null;
  onboardingCompletedAt: string | null;
  termsVersionAccepted: string | null;
  termsAcceptedAt: string | null;
  status: 'active' | 'anonymized';
  createdAt: string;
  updatedAt: string;
}
