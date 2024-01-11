import {Namespace, TFunction} from 'i18next';
import {LANGUAGES} from 'src/hooks/AppContext';

export const menu = (
  t: TFunction<Namespace<'translation'>, undefined, Namespace<'translation'>>,
  language: string,
  setLanguage: (language: LANGUAGES) => void,
) => [
  [
    {title: t('profile.myRecipes'), onPress: () => {}},
    {
      title: t('profile.language'),
      onPress: () =>
        setLanguage(
          language === 'pt'
            ? LANGUAGES.EN
            : language === 'en'
            ? LANGUAGES.ES
            : LANGUAGES.PT,
        ),
      selectedItem: t('language'),
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
