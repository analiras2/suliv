import type { IconName } from '@/components/atoms/icon';

export interface ProfileSettingItem {
  id: string;
  icon: IconName;
  label: string;
  tone?: 'default' | 'danger';
}

const SETTINGS: ProfileSettingItem[] = [
  { id: 'account', icon: 'user', label: 'Conta' },
  { id: 'search-preferences', icon: 'filter', label: 'Preferências de busca' },
  { id: 'notifications', icon: 'bell', label: 'Notificações' },
  { id: 'about', icon: 'settings', label: 'Sobre o Suliv' },
  { id: 'sign-out', icon: 'logOut', label: 'Sair', tone: 'danger' },
];

export function useProfileViewModel() {
  return { name: 'Ana', settings: SETTINGS };
}
