import { useRouter, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StateView } from '@/components/molecules/state-view';
import { RecipeDetailContent } from '@/components/organisms/recipe-detail-content';
import { semanticColors } from '@/design-system/tokens';
import { STATE_COPY } from '@/lib/state-copy';
import { useRecipeDetailViewModel } from '@/module/recipes/viewModels/use-recipe-detail-view-model';

const FEED_ROUTE = '/(tabs)' as Href;

export type RecipeDetailScreenProps = {
  recipeId: string;
  origin?: string;
};

export function RecipeDetailScreen({ recipeId, origin }: RecipeDetailScreenProps) {
  const router = useRouter();
  const detail = useRecipeDetailViewModel(recipeId, undefined, origin);

  if (detail.notFound) {
    const copy = STATE_COPY.recipe_not_found;
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.notFound}>
          <StateView
            illustrationIcon={copy.illustrationIcon}
            title={copy.title}
            description={copy.description}
            primaryAction={{ label: copy.primaryActionLabel, onPress: () => router.replace(FEED_ROUTE) }}
            testID="state-view-recipe_not_found"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (detail.isLoading || !detail.recipe) {
    return null;
  }

  return <RecipeDetailContent detail={{ ...detail, recipe: detail.recipe }} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
