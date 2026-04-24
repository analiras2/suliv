export interface FeedDailyRecipe {
  id: string;
  title: string;
  category: string;
  imageUrl: string | null;
  tag: string;
  totalTimeMin: number;
  descriptor: string;
}

export interface FeedCategory {
  key: string;
  recipeCount: number;
}

export interface FeedNewsItem {
  id: string;
  slug: string;
  kicker: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  readTimeMin: number;
  publishedAt: string | null;
}

export interface FeedTopRecipe {
  id: string;
  rank: number;
  title: string;
  category: string;
  imageUrl: string | null;
  totalTimeMin: number;
  descriptor: string;
  savesCount: number;
}

export interface FeedResponse {
  dailyRecipes: FeedDailyRecipe[];
  categories: FeedCategory[];
  news: FeedNewsItem[];
  topRecipes: FeedTopRecipe[];
}
