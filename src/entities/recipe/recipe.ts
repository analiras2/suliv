import {ICategories} from './categories';
import {IIngredient} from './ingredient';
import {ISocialRating} from './socialRating';
import {ITimeInfo} from './timeInfo';

export interface IRecipe {
  id: number;
  authorId: number;
  title: string;
  ingredients: IIngredient[];
  preparation: string;
  yield: number;
  creationDate: string;
  time: ITimeInfo;
  categories: ICategories;
  images: string[];
  social: ISocialRating;
}
