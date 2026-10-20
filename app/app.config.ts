import type { ConfigContext, ExpoConfig } from 'expo/config';

// Build environments (ADR-006). The EAS profile names map onto the API's APP_ENV values:
//   development -> dev, staging -> staging, production -> prod
// eas.json sets APP_VARIANT per profile. Without it (local `expo start` / `expo run`) the app keeps its
// original production identity, so existing local installs are not replaced.
type AppVariant = 'development' | 'staging' | 'production';

interface VariantConfig {
  name: string;
  identifierSuffix: string;
  icon: string;
  androidForeground: string;
}

const PRODUCTION_ICON = './assets/images/icon.png';
const PRODUCTION_FOREGROUND = './assets/images/android-icon-foreground.png';

const VARIANTS: Record<AppVariant, VariantConfig> = {
  development: {
    name: 'Suliv (Dev)',
    identifierSuffix: '.dev',
    icon: './assets/images/icon-development.png',
    androidForeground: './assets/images/android-icon-foreground-development.png',
  },
  staging: {
    name: 'Suliv (Staging)',
    identifierSuffix: '.staging',
    icon: './assets/images/icon-staging.png',
    androidForeground: './assets/images/android-icon-foreground-staging.png',
  },
  production: {
    name: 'suliv',
    identifierSuffix: '',
    icon: PRODUCTION_ICON,
    androidForeground: PRODUCTION_FOREGROUND,
  },
};

function resolveVariant(): AppVariant {
  const variant = process.env.APP_VARIANT;
  return variant === 'development' || variant === 'staging' ? variant : 'production';
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = VARIANTS[resolveVariant()];
  const isProduction = variant.identifierSuffix === '';

  return {
    ...config,
    name: variant.name,
    slug: config.slug ?? 'suliv',
    icon: variant.icon,
    ios: {
      ...config.ios,
      // Production keeps the Icon Composer bundle from app.json; the other variants use a badged PNG.
      ...(isProduction ? {} : { icon: variant.icon }),
      bundleIdentifier: `${config.ios?.bundleIdentifier}${variant.identifierSuffix}`,
    },
    android: {
      ...config.android,
      package: `${config.android?.package ?? config.ios?.bundleIdentifier}${variant.identifierSuffix}`,
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        foregroundImage: variant.androidForeground,
      },
    },
  };
};
