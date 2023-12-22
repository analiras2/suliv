import {IRecipe, IUser} from 'src/entities';

export const USER_MOCK: IUser = {
  id: '1',
  name: 'Analira ',
  lastName: 'Scalabrini',
  nickname: 'analiras2',
  email: 'analira@gmail.com',
  lastAccess: '2005-12-03 00:00:00.000000',
};

export const RECIPE_MOCK: IRecipe[] = [
  {
    id: '2649',
    author: {
      id: '14784',
      name: 'Analira Scalabrini',
    },
    title: 'Torta de Abacaxi',
    ingredients: [
      {name: 'Açucar', quantity: '36 g'},
      {name: 'margarina', quantity: '2 colheres de sopa'},
      {name: 'ovo', quantity: '2'},
      {name: 'leite', quantity: '100 ml'},
    ],
    preparation: '',
    social: {
      averageScore: 4.8,
      numberVotes: 535,
      numberComment: 2,
    },
    yield: 10,
    creationDate: '2005-12-03 00:00:00.000000',
    time: {
      setup: 60,
      cooking: 0,
      waiting: 0,
      total: 60,
    },
    categories: {
      primary: ['bolos_e_tortas_doces'],
      others: ['bolos_e_tortas_doces'],
    },
    images: [
      'https://guiadacozinha.com.br/wp-content/uploads/2019/10/bolo-de-abacaxi-facil.jpg',
    ],
  },
  {
    id: '2865',
    author: {
      id: '14784',
      name: 'Analira Scalabrini',
    },
    title: 'Torta de Frango com Legumes',
    ingredients: [
      {name: 'Açucar', quantity: '36 g'},
      {name: 'margarina', quantity: '2 colheres de sopa'},
      {name: 'ovo', quantity: '2'},
      {name: 'leite', quantity: '100 ml'},
    ],
    preparation: '',
    social: {
      averageScore: 4.5,
      numberVotes: 535,
      numberComment: 2,
    },
    yield: 10,
    creationDate: '2005-12-03 00:00:00.000000',
    time: {
      setup: 60,
      cooking: 0,
      waiting: 0,
      total: 60,
    },
    categories: {
      primary: ['bolos_e_tortas_doces'],
      others: ['bolos_e_tortas_doces'],
    },
    images: [
      'https://static.itdg.com.br/images/1200-675/bd14ed0d98530fb34b6f60a295382a7a/348000-original.jpg',
    ],
  },
  {
    id: '28',
    author: {
      id: '14784',
      name: 'Analira Scalabrini',
    },
    title: 'Torta de Chocolate',
    ingredients: [
      {name: 'Açucar', quantity: '36 g'},
      {name: 'margarina', quantity: '2 colheres de sopa'},
      {name: 'ovo', quantity: '2'},
      {name: 'leite', quantity: '100 ml'},
    ],
    preparation: '',
    social: {
      averageScore: 4.5,
      numberVotes: 535,
      numberComment: 2,
    },
    yield: 10,
    creationDate: '2005-12-03 00:00:00.000000',
    time: {
      setup: 60,
      cooking: 0,
      waiting: 0,
      total: 60,
    },
    categories: {
      primary: ['bolos_e_tortas_doces'],
      others: ['bolos_e_tortas_doces'],
    },
    images: [
      'https://static.itdg.com.br/images/1200-675/bd14ed0d98530fb34b6f60a295382a7a/348000-original.jpg',
    ],
  },
  {
    id: '23',
    author: {
      id: '14784',
      name: 'Analira Scalabrini',
    },
    title: 'Torta de Frango com Vegetais',
    ingredients: [
      {name: 'Açucar', quantity: '36 g'},
      {name: 'margarina', quantity: '2 colheres de sopa'},
      {name: 'ovo', quantity: '2'},
      {name: 'leite', quantity: '100 ml'},
    ],
    preparation: '',
    social: {
      averageScore: 4.5,
      numberVotes: 535,
      numberComment: 2,
    },
    yield: 10,
    creationDate: '2005-12-03 00:00:00.000000',
    time: {
      setup: 60,
      cooking: 0,
      waiting: 0,
      total: 60,
    },
    categories: {
      primary: ['bolos_e_tortas_doces'],
      others: ['bolos_e_tortas_doces'],
    },
    images: [
      'https://static.itdg.com.br/images/1200-675/bd14ed0d98530fb34b6f60a295382a7a/348000-original.jpg',
    ],
  },
];
