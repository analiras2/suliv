import { PrismaClient, SkillLevel } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Seed data — 15 plant-based recipes for development
// ---------------------------------------------------------------------------

const ingredients = [
  { name: "arroz integral", category: "grão" },
  { name: "lentilha", category: "leguminosa" },
  { name: "feijão preto", category: "leguminosa" },
  { name: "grão-de-bico", category: "leguminosa" },
  { name: "quinoa", category: "grão" },
  { name: "batata-doce", category: "tubérculo" },
  { name: "batata", category: "tubérculo" },
  { name: "cenoura", category: "legume" },
  { name: "cebola", category: "tempero" },
  { name: "alho", category: "tempero" },
  { name: "tomate", category: "legume" },
  { name: "espinafre", category: "folha" },
  { name: "couve", category: "folha" },
  { name: "brócolis", category: "vegetal" },
  { name: "abobrinha", category: "legume" },
  { name: "cogumelo", category: "fungo" },
  { name: "amendoim", category: "oleaginosa" },
  { name: "castanha-de-caju", category: "oleaginosa" },
  { name: "amêndoa", category: "oleaginosa" },
  { name: "leite de coco", category: "líquido" },
  { name: "tofu", category: "proteína" },
  { name: "tempeh", category: "proteína" },
  { name: "aveia", category: "cereal" },
  { name: "farinha de trigo integral", category: "farinha" },
  { name: "banana", category: "fruta" },
  { name: "maçã", category: "fruta" },
  { name: "manga", category: "fruta" },
  { name: "cúrcuma", category: "tempero" },
  { name: "gengibre", category: "tempero" },
  { name: "azeite", category: "gordura" },
];

const recipes = [
  {
    title: "Arroz negro com lentilha",
    slug: "arroz-negro-com-lentilha",
    tags: ["alto-proteína", "sem-glúten"],
    prepTimeMin: 10,
    cookTimeMin: 30,
    difficulty: SkillLevel.BEGINNER,
    category: "almoco",
    servings: 4,
    nutritionPerServing: { calories: 380, proteinG: 18, carbsG: 58, fatG: 6, fiberG: 12 },
    ingredients: [
      { name: "arroz integral", quantity: 2, unit: "xícaras" },
      { name: "lentilha", quantity: 1, unit: "xícara" },
      { name: "cebola", quantity: 1, unit: "unidade" },
      { name: "alho", quantity: 3, unit: "dentes" },
      { name: "cúrcuma", quantity: 1, unit: "colher de chá" },
      { name: "azeite", quantity: 2, unit: "colheres de sopa" },
    ],
    steps: [
      { order: 1, instruction: "Refogue a cebola e o alho no azeite por 5 minutos.", timerSeconds: 300 },
      { order: 2, instruction: "Adicione a cúrcuma e misture por 1 minuto.", timerSeconds: 60 },
      { order: 3, instruction: "Acrescente o arroz e a lentilha. Cubra com 4 xícaras de água.", timerSeconds: null },
      { order: 4, instruction: "Cozinhe em fogo baixo tampado por 25 minutos.", timerSeconds: 1500 },
      { order: 5, instruction: "Desligue o fogo e deixe descansar por 5 minutos antes de servir.", timerSeconds: 300 },
    ],
  },
  {
    title: "Feijão preto temperado",
    slug: "feijao-preto-temperado",
    tags: ["clássico", "reconfortante"],
    prepTimeMin: 5,
    cookTimeMin: 20,
    difficulty: SkillLevel.BEGINNER,
    category: "almoco",
    servings: 6,
    nutritionPerServing: { calories: 210, proteinG: 12, carbsG: 36, fatG: 3, fiberG: 14 },
    ingredients: [
      { name: "feijão preto", quantity: 400, unit: "g (cozido ou enlatado)" },
      { name: "cebola", quantity: 1, unit: "unidade" },
      { name: "alho", quantity: 4, unit: "dentes" },
      { name: "tomate", quantity: 2, unit: "unidades" },
      { name: "azeite", quantity: 2, unit: "colheres de sopa" },
    ],
    steps: [
      { order: 1, instruction: "Refogue a cebola no azeite até dourar (8 min).", timerSeconds: 480 },
      { order: 2, instruction: "Adicione o alho e o tomate. Cozinhe por 5 minutos.", timerSeconds: 300 },
      { order: 3, instruction: "Junte o feijão e ajuste o sal. Cozinhe por mais 10 minutos.", timerSeconds: 600 },
    ],
  },
  {
    title: "Curry de grão-de-bico com espinafre",
    slug: "curry-grao-de-bico-espinafre",
    tags: ["indiano", "picante", "rico-em-ferro"],
    prepTimeMin: 15,
    cookTimeMin: 25,
    difficulty: SkillLevel.INTERMEDIATE,
    category: "jantar",
    servings: 4,
    nutritionPerServing: { calories: 320, proteinG: 15, carbsG: 42, fatG: 10, fiberG: 11 },
    ingredients: [
      { name: "grão-de-bico", quantity: 400, unit: "g (cozido)" },
      { name: "espinafre", quantity: 200, unit: "g" },
      { name: "leite de coco", quantity: 200, unit: "ml" },
      { name: "tomate", quantity: 2, unit: "unidades" },
      { name: "cebola", quantity: 1, unit: "unidade" },
      { name: "gengibre", quantity: 1, unit: "colher de sopa (ralado)" },
      { name: "alho", quantity: 3, unit: "dentes" },
      { name: "cúrcuma", quantity: 1, unit: "colher de chá" },
      { name: "azeite", quantity: 2, unit: "colheres de sopa" },
    ],
    steps: [
      { order: 1, instruction: "Refogue cebola, alho e gengibre no azeite por 5 minutos.", timerSeconds: 300 },
      { order: 2, instruction: "Adicione cúrcuma e tomate. Cozinhe por 5 minutos.", timerSeconds: 300 },
      { order: 3, instruction: "Junte o grão-de-bico e o leite de coco. Cozinhe em fogo médio por 15 minutos.", timerSeconds: 900 },
      { order: 4, instruction: "Acrescente o espinafre e cozinhe por mais 2 minutos até murchar.", timerSeconds: 120 },
    ],
  },
  {
    title: "Smoothie de banana com aveia",
    slug: "smoothie-banana-aveia",
    tags: ["rápido", "sem-cozimento", "café-da-manhã"],
    prepTimeMin: 5,
    cookTimeMin: 0,
    difficulty: SkillLevel.BEGINNER,
    category: "cafe",
    servings: 2,
    nutritionPerServing: { calories: 245, proteinG: 7, carbsG: 44, fatG: 5, fiberG: 6 },
    ingredients: [
      { name: "banana", quantity: 2, unit: "unidades" },
      { name: "aveia", quantity: 0.5, unit: "xícara" },
      { name: "leite de coco", quantity: 200, unit: "ml" },
    ],
    steps: [
      { order: 1, instruction: "Coloque todos os ingredientes no liquidificador.", timerSeconds: null },
      { order: 2, instruction: "Bata por 1 minuto até ficar homogêneo.", timerSeconds: 60 },
      { order: 3, instruction: "Sirva imediatamente.", timerSeconds: null },
    ],
  },
  {
    title: "Tofu grelhado com brócolis",
    slug: "tofu-grelhado-brocolis",
    tags: ["proteico", "rápido", "sem-glúten"],
    prepTimeMin: 10,
    cookTimeMin: 15,
    difficulty: SkillLevel.BEGINNER,
    category: "jantar",
    servings: 2,
    nutritionPerServing: { calories: 290, proteinG: 22, carbsG: 14, fatG: 16, fiberG: 5 },
    ingredients: [
      { name: "tofu", quantity: 300, unit: "g" },
      { name: "brócolis", quantity: 300, unit: "g" },
      { name: "alho", quantity: 2, unit: "dentes" },
      { name: "azeite", quantity: 2, unit: "colheres de sopa" },
    ],
    steps: [
      { order: 1, instruction: "Corte o tofu em cubos e seque com papel toalha.", timerSeconds: null },
      { order: 2, instruction: "Grelhe o tofu no azeite por 5 minutos de cada lado até dourar.", timerSeconds: 600 },
      { order: 3, instruction: "Junte o brócolis e o alho. Refogue por 5 minutos.", timerSeconds: 300 },
    ],
  },
  {
    title: "Quinoa com legumes assados",
    slug: "quinoa-legumes-assados",
    tags: ["sem-glúten", "colorido", "forno"],
    prepTimeMin: 15,
    cookTimeMin: 35,
    difficulty: SkillLevel.INTERMEDIATE,
    category: "almoco",
    servings: 4,
    nutritionPerServing: { calories: 310, proteinG: 11, carbsG: 50, fatG: 8, fiberG: 8 },
    ingredients: [
      { name: "quinoa", quantity: 1, unit: "xícara" },
      { name: "batata-doce", quantity: 2, unit: "unidades médias" },
      { name: "abobrinha", quantity: 2, unit: "unidades" },
      { name: "cenoura", quantity: 2, unit: "unidades" },
      { name: "cebola", quantity: 1, unit: "unidade" },
      { name: "azeite", quantity: 3, unit: "colheres de sopa" },
    ],
    steps: [
      { order: 1, instruction: "Pré-aqueça o forno a 200°C.", timerSeconds: null },
      { order: 2, instruction: "Corte os legumes em pedaços, tempere com azeite e leve ao forno por 30 minutos.", timerSeconds: 1800 },
      { order: 3, instruction: "Cozinhe a quinoa em 2 xícaras de água por 15 minutos.", timerSeconds: 900 },
      { order: 4, instruction: "Misture a quinoa cozida com os legumes assados e sirva.", timerSeconds: null },
    ],
  },
  {
    title: "Pasta de amendoim com maçã",
    slug: "pasta-amendoim-maca",
    tags: ["lanche-rápido", "sem-cozimento"],
    prepTimeMin: 5,
    cookTimeMin: 0,
    difficulty: SkillLevel.BEGINNER,
    category: "lanche",
    servings: 2,
    nutritionPerServing: { calories: 280, proteinG: 8, carbsG: 30, fatG: 16, fiberG: 5 },
    ingredients: [
      { name: "amendoim", quantity: 4, unit: "colheres de sopa (pasta)" },
      { name: "maçã", quantity: 2, unit: "unidades" },
    ],
    steps: [
      { order: 1, instruction: "Corte as maçãs em fatias.", timerSeconds: null },
      { order: 2, instruction: "Sirva com a pasta de amendoim para mergulhar.", timerSeconds: null },
    ],
  },
  {
    title: "Sopa de batata-doce com gengibre",
    slug: "sopa-batata-doce-gengibre",
    tags: ["reconfortante", "inverno", "vegano"],
    prepTimeMin: 10,
    cookTimeMin: 30,
    difficulty: SkillLevel.BEGINNER,
    category: "jantar",
    servings: 4,
    nutritionPerServing: { calories: 195, proteinG: 4, carbsG: 38, fatG: 4, fiberG: 6 },
    ingredients: [
      { name: "batata-doce", quantity: 600, unit: "g" },
      { name: "gengibre", quantity: 2, unit: "colheres de sopa (ralado)" },
      { name: "leite de coco", quantity: 200, unit: "ml" },
      { name: "cebola", quantity: 1, unit: "unidade" },
      { name: "azeite", quantity: 1, unit: "colher de sopa" },
    ],
    steps: [
      { order: 1, instruction: "Refogue a cebola no azeite por 5 minutos.", timerSeconds: 300 },
      { order: 2, instruction: "Adicione a batata-doce cortada em cubos e gengibre. Cubra com água e cozinhe por 20 minutos.", timerSeconds: 1200 },
      { order: 3, instruction: "Bata tudo no liquidificador até ficar cremoso.", timerSeconds: null },
      { order: 4, instruction: "Volte para a panela, adicione o leite de coco e aqueça por 5 minutos.", timerSeconds: 300 },
    ],
  },
  {
    title: "Bowl de quinoa com manga",
    slug: "bowl-quinoa-manga",
    tags: ["tropical", "sem-glúten", "café-da-manhã"],
    prepTimeMin: 10,
    cookTimeMin: 15,
    difficulty: SkillLevel.BEGINNER,
    category: "cafe",
    servings: 2,
    nutritionPerServing: { calories: 340, proteinG: 9, carbsG: 62, fatG: 6, fiberG: 7 },
    ingredients: [
      { name: "quinoa", quantity: 0.5, unit: "xícara" },
      { name: "manga", quantity: 1, unit: "unidade grande" },
      { name: "leite de coco", quantity: 100, unit: "ml" },
      { name: "banana", quantity: 1, unit: "unidade" },
    ],
    steps: [
      { order: 1, instruction: "Cozinhe a quinoa com o leite de coco por 15 minutos.", timerSeconds: 900 },
      { order: 2, instruction: "Corte a manga e a banana em pedaços.", timerSeconds: null },
      { order: 3, instruction: "Monte o bowl com a quinoa na base e as frutas por cima.", timerSeconds: null },
    ],
  },
  {
    title: "Cogumelos salteados com alho",
    slug: "cogumelos-salteados-alho",
    tags: ["umami", "rápido", "acompanhamento"],
    prepTimeMin: 5,
    cookTimeMin: 10,
    difficulty: SkillLevel.BEGINNER,
    category: "lanche",
    servings: 2,
    nutritionPerServing: { calories: 120, proteinG: 5, carbsG: 8, fatG: 8, fiberG: 2 },
    ingredients: [
      { name: "cogumelo", quantity: 300, unit: "g" },
      { name: "alho", quantity: 4, unit: "dentes" },
      { name: "azeite", quantity: 2, unit: "colheres de sopa" },
      { name: "espinafre", quantity: 50, unit: "g", optional: true },
    ],
    steps: [
      { order: 1, instruction: "Aqueça o azeite e doure o alho picado por 1 minuto.", timerSeconds: 60 },
      { order: 2, instruction: "Adicione os cogumelos fatiados e saltee em fogo alto por 8 minutos.", timerSeconds: 480 },
      { order: 3, instruction: "Acrescente o espinafre (opcional) e cozinhe por mais 1 minuto.", timerSeconds: 60 },
    ],
  },
  {
    title: "Bolinho de aveia com banana (sem forno)",
    slug: "bolinho-aveia-banana-sem-forno",
    tags: ["sem-cozimento", "lanche", "rápido"],
    prepTimeMin: 15,
    cookTimeMin: 0,
    difficulty: SkillLevel.BEGINNER,
    category: "sobremesa",
    servings: 12,
    nutritionPerServing: { calories: 95, proteinG: 2, carbsG: 18, fatG: 2, fiberG: 2 },
    ingredients: [
      { name: "aveia", quantity: 2, unit: "xícaras" },
      { name: "banana", quantity: 3, unit: "unidades maduras" },
      { name: "castanha-de-caju", quantity: 0.25, unit: "xícara (picada)", optional: true },
    ],
    steps: [
      { order: 1, instruction: "Amasse as bananas com um garfo até formar um purê.", timerSeconds: null },
      { order: 2, instruction: "Misture a aveia e a castanha ao purê de banana.", timerSeconds: null },
      { order: 3, instruction: "Forme bolinhas e leve à geladeira por 30 minutos antes de servir.", timerSeconds: 1800 },
    ],
  },
  {
    title: "Tempeh grelhado com couve refogada",
    slug: "tempeh-grelhado-couve",
    tags: ["fermentado", "proteico", "rico-em-ferro"],
    prepTimeMin: 10,
    cookTimeMin: 15,
    difficulty: SkillLevel.INTERMEDIATE,
    category: "almoco",
    servings: 2,
    nutritionPerServing: { calories: 310, proteinG: 24, carbsG: 18, fatG: 16, fiberG: 6 },
    ingredients: [
      { name: "tempeh", quantity: 200, unit: "g" },
      { name: "couve", quantity: 150, unit: "g" },
      { name: "alho", quantity: 3, unit: "dentes" },
      { name: "azeite", quantity: 2, unit: "colheres de sopa" },
    ],
    steps: [
      { order: 1, instruction: "Fatie o tempeh e grelhe no azeite por 4 minutos de cada lado.", timerSeconds: 480 },
      { order: 2, instruction: "Reserve o tempeh e no mesmo azeite refogue o alho picado.", timerSeconds: 60 },
      { order: 3, instruction: "Adicione a couve cortada finamente e refogue por 3 minutos.", timerSeconds: 180 },
      { order: 4, instruction: "Sirva o tempeh sobre a couve refogada.", timerSeconds: null },
    ],
  },
  {
    title: "Mousse de abacate com cacau",
    slug: "mousse-abacate-cacau",
    tags: ["sobremesa", "sem-cozimento", "cremoso"],
    prepTimeMin: 10,
    cookTimeMin: 0,
    difficulty: SkillLevel.BEGINNER,
    category: "sobremesa",
    servings: 4,
    nutritionPerServing: { calories: 220, proteinG: 3, carbsG: 18, fatG: 16, fiberG: 7 },
    ingredients: [
      { name: "banana", quantity: 2, unit: "unidades" },
      { name: "leite de coco", quantity: 100, unit: "ml" },
    ],
    steps: [
      { order: 1, instruction: "Coloque todos os ingredientes no processador.", timerSeconds: null },
      { order: 2, instruction: "Processe por 2 minutos até obter textura de mousse.", timerSeconds: 120 },
      { order: 3, instruction: "Leve à geladeira por 1 hora antes de servir.", timerSeconds: 3600 },
    ],
  },
  {
    title: "Stir-fry de tofu com legumes",
    slug: "stir-fry-tofu-legumes",
    tags: ["asiático", "rápido", "colorido"],
    prepTimeMin: 15,
    cookTimeMin: 15,
    difficulty: SkillLevel.INTERMEDIATE,
    category: "jantar",
    servings: 3,
    nutritionPerServing: { calories: 270, proteinG: 18, carbsG: 22, fatG: 12, fiberG: 5 },
    ingredients: [
      { name: "tofu", quantity: 250, unit: "g" },
      { name: "abobrinha", quantity: 1, unit: "unidade" },
      { name: "cenoura", quantity: 2, unit: "unidades" },
      { name: "brócolis", quantity: 200, unit: "g" },
      { name: "alho", quantity: 3, unit: "dentes" },
      { name: "gengibre", quantity: 1, unit: "colher de sopa (ralado)" },
      { name: "azeite", quantity: 2, unit: "colheres de sopa" },
    ],
    steps: [
      { order: 1, instruction: "Corte o tofu em cubos e pressione com papel toalha para retirar excesso de água.", timerSeconds: null },
      { order: 2, instruction: "Frite o tofu no azeite quente por 5 minutos até dourar. Reserve.", timerSeconds: 300 },
      { order: 3, instruction: "No mesmo wok, refogue alho e gengibre por 1 minuto.", timerSeconds: 60 },
      { order: 4, instruction: "Adicione cenoura e brócolis. Saltee em fogo alto por 5 minutos.", timerSeconds: 300 },
      { order: 5, instruction: "Junte a abobrinha e o tofu. Refogue por mais 3 minutos.", timerSeconds: 180 },
    ],
  },
  {
    title: "Panqueca de aveia com frutas",
    slug: "panqueca-aveia-frutas",
    tags: ["café-da-manhã", "clássico"],
    prepTimeMin: 10,
    cookTimeMin: 15,
    difficulty: SkillLevel.BEGINNER,
    category: "cafe",
    servings: 2,
    nutritionPerServing: { calories: 290, proteinG: 8, carbsG: 52, fatG: 6, fiberG: 5 },
    ingredients: [
      { name: "aveia", quantity: 1, unit: "xícara" },
      { name: "banana", quantity: 2, unit: "unidades" },
      { name: "leite de coco", quantity: 150, unit: "ml" },
      { name: "maçã", quantity: 1, unit: "unidade (para servir)", optional: true },
    ],
    steps: [
      { order: 1, instruction: "Bata a aveia, a banana e o leite de coco no liquidificador.", timerSeconds: null },
      { order: 2, instruction: "Aqueça uma frigideira antiaderente em fogo médio.", timerSeconds: null },
      { order: 3, instruction: "Despeje meia concha da massa e cozinhe por 2-3 minutos de cada lado.", timerSeconds: 180 },
      { order: 4, instruction: "Repita com o restante da massa. Sirva com maçã fatiada.", timerSeconds: null },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert ingredients
  for (const ing of ingredients) {
    await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: {},
      create: ing,
    });
  }
  console.log(`✅ ${ingredients.length} ingredients upserted`);

  // Upsert recipes
  for (const recipe of recipes) {
    const { ingredients: recipeIngredients, steps, ...recipeData } = recipe;

    const created = await prisma.recipe.upsert({
      where: { slug: recipeData.slug },
      update: {},
      create: {
        ...recipeData,
        steps: {
          create: steps,
        },
      },
    });

    // Upsert recipe ingredients
    for (const ri of recipeIngredients) {
      const { optional, ...ingData } = ri as {
        name: string;
        quantity: number;
        unit: string;
        optional?: boolean;
      };

      const ingredient = await prisma.ingredient.findUnique({
        where: { name: ingData.name },
      });

      if (!ingredient) continue;

      await prisma.recipeIngredient.upsert({
        where: {
          recipeId_ingredientId: {
            recipeId: created.id,
            ingredientId: ingredient.id,
          },
        },
        update: {},
        create: {
          recipeId: created.id,
          ingredientId: ingredient.id,
          quantity: ingData.quantity,
          unit: ingData.unit,
          optional: optional ?? false,
        },
      });
    }
  }
  console.log(`✅ ${recipes.length} recipes upserted`);
  console.log("🎉 Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
