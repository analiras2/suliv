export type AuthStackParamList = {
  Login: undefined;
  EmailLogin: undefined;
  Register: undefined;
  Onboarding: undefined;
};

export type AppStackParamList = {
  Feed: undefined;
  RecipeDetail: { id: string };
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  Onboarding: undefined;
};
