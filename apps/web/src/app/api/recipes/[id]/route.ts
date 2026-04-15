import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@suliv/db";
import { AuthError, requireAuth } from "../../../../lib/auth-middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try {
    ({ userId } = await requireAuth(req));
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }

  const { id } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: {
        include: { ingredient: true },
        orderBy: { id: "asc" },
      },
      steps: { orderBy: { order: "asc" } },
      favorites: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Fetch user allergens to flag ingredients
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { allergens: true },
  });
  const allergens: string[] = profile?.allergens ?? [];

  const { favorites, ingredients, steps, ...recipeBase } = recipe;

  return NextResponse.json({
    recipe: {
      ...recipeBase,
      ingredients: ingredients.map(({ ingredient, ...ri }) => ({
        id: ri.id,
        name: ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
        optional: ri.optional,
        isAllergen: ingredient.allergenGroup != null && allergens.includes(ingredient.allergenGroup),
      })),
      steps: steps.map((s) => ({
        id: s.id,
        order: s.order,
        instruction: s.instruction,
        timerSeconds: s.timerSeconds,
      })),
    },
    isFavorite: favorites.length > 0,
  });
}
