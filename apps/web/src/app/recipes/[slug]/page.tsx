import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRecipeDetail, NotFoundError } from "../../../lib/recipesApi";
import { getServerSession } from "../../../lib/session";
import { RecipeDetailClient } from "./RecipeDetailClient";

interface RecipeDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RecipeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { recipe } = await getRecipeDetail(slug, { cache: "no-store" });
    const totalMin = recipe.prepTimeMin + recipe.cookTimeMin;
    const description = `Receita plant-based: ${recipe.title}. ${totalMin} min · ${recipe.servings} porções.`;

    return {
      title: recipe.title,
      description,
      openGraph: {
        title: recipe.title,
        description,
        ...(recipe.imageUrl
          ? { images: [{ url: recipe.imageUrl, width: 1200, height: 630, alt: recipe.title }] }
          : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: recipe.title,
        description,
        ...(recipe.imageUrl ? { images: [recipe.imageUrl] } : {}),
      },
    };
  } catch {
    return { title: "Receita não encontrada" };
  }
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { slug } = await params;
  const session = await getServerSession();

  let recipe, isFavorite;
  try {
    ({ recipe, isFavorite } = await getRecipeDetail(slug, { cache: "no-store" }));
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  return (
    <RecipeDetailClient
      recipe={recipe}
      isFavorite={isFavorite}
      isAuthenticated={session !== null}
    />
  );
}
