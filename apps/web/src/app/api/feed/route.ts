import { NextRequest, NextResponse } from "next/server";
import { NewsStatus, prisma } from "@suliv/db";
import { AuthError, requireAuth } from "../../../lib/auth-middleware";

function toDisplayLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildRecipeDescriptor(recipe: { category: string; tags: string[] }): string {
  const firstTag = recipe.tags[0];
  return firstTag ? toDisplayLabel(firstTag) : toDisplayLabel(recipe.category);
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw err;
  }

  const now = new Date();

  const [dailyRecipes, groupedCategories, topRecipes, news] = await Promise.all([
    prisma.recipe.findMany({
      take: 5,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        category: true,
        tags: true,
        imageUrl: true,
        prepTimeMin: true,
        cookTimeMin: true,
      },
    }),
    prisma.recipe.groupBy({
      by: ["category"],
      _count: { _all: true },
      orderBy: {
        _count: {
          category: "desc",
        },
      },
    }),
    prisma.recipe.findMany({
      take: 5,
      orderBy: [{ favorites: { _count: "desc" } }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        category: true,
        tags: true,
        imageUrl: true,
        prepTimeMin: true,
        cookTimeMin: true,
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    }),
    prisma.newsArticle.findMany({
      where: {
        status: NewsStatus.PUBLISHED,
        publishedAt: { lte: now },
      },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 3,
      select: {
        id: true,
        slug: true,
        kicker: true,
        title: true,
        excerpt: true,
        coverImageUrl: true,
        readTimeMin: true,
        publishedAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    dailyRecipes: dailyRecipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      category: recipe.category,
      imageUrl: recipe.imageUrl,
      tag: recipe.tags[0] ? toDisplayLabel(recipe.tags[0]) : "Receita do dia",
      totalTimeMin: recipe.prepTimeMin + recipe.cookTimeMin,
      descriptor: buildRecipeDescriptor(recipe),
    })),
    categories: groupedCategories.map((item) => ({
      key: item.category,
      recipeCount: item._count._all,
    })),
    news,
    topRecipes: topRecipes.map((recipe, index) => ({
      id: recipe.id,
      rank: index + 1,
      title: recipe.title,
      category: recipe.category,
      imageUrl: recipe.imageUrl,
      totalTimeMin: recipe.prepTimeMin + recipe.cookTimeMin,
      descriptor: buildRecipeDescriptor(recipe),
      savesCount: recipe._count.favorites,
    })),
  });
}
