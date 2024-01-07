import {IAuthor} from './author';
import {ICategories} from './categories';
import {IIngredient} from './ingredient';
import {IPreparation} from './preparation';
import {ISocialRating} from './socialRating';
import {ITimeInfo} from './timeInfo';

export interface IRecipe {
  id: string;
  author: IAuthor;
  title: string;
  ingredients: IIngredient[];
  preparation: IPreparation[];
  yield: number;
  creationDate: string;
  time: ITimeInfo;
  categories: ICategories;
  images: string[];
  social: ISocialRating;
}
