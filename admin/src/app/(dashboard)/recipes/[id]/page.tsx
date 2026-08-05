import { RecipeReview } from './recipe-review';

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params;
  return (
    <main>
      <RecipeReview recipeId={id} />
    </main>
  );
}
