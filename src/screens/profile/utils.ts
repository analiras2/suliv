import {Namespace, TFunction} from 'i18next';

export const menu = (
  t: TFunction<Namespace<'translation'>, undefined, Namespace<'translation'>>,
) => [
  [
    {title: t('profile.myRecipes'), onPress: () => {}},
    {
      title: t('profile.language'),
      onPress: () => {},
      selectedItem: 'Português',
    },
  ],
  [
    {title: t('profile.rateApp'), onPress: () => {}},
    {title: t('profile.shareApp'), onPress: () => {}},
    {title: t('profile.reportProblem'), onPress: () => {}},
  ],
  [
    {title: t('profile.privacyPolicy'), onPress: () => {}},
    {title: t('profile.termsOfUse'), onPress: () => {}},
  ],
];
