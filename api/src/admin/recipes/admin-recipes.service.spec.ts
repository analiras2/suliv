import { NotFoundException } from '@nestjs/common';
import { Recipe } from '@prisma/client';
import { AuditLogService } from '../audit-log.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AdminRecipesService } from './admin-recipes.service';

function recipeFixture(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe-1',
    slug: 'recipe-1',
    authorId: 'author-1',
    title: 'Bolo de cenoura',
    description: 'desc',
    coverImageUrl: null,
    categoryId: 'category-1',
    prepTimeMinutes: 30,
    timeBucket: 'quinze_30',
    servings: 4,
    difficulty: 'iniciante',
    dietPreference: 'flexitariano',
    status: 'em_analise',
    currentVersion: 1,
    adjustmentReason: null,
    adjustmentNote: null,
    authorMessageToModerator: null,
    termsVersionAccepted: null,
    submittedAt: new Date(),
    approvedAt: null,
    removedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    externalSourceId: null,
    externalNutritionData: null,
    ...overrides,
  };
}

describe('AdminRecipesService', () => {
  const findUniqueRecipe = jest.fn();
  const updateRecipe = jest.fn();
  const aggregateCommentRating = jest.fn();
  const prisma = {
    recipe: { findUnique: findUniqueRecipe, update: updateRecipe },
    commentRating: { aggregate: aggregateCommentRating },
  };
  const notificationsSend = jest.fn();
  const notificationsService = {
    send: notificationsSend,
  } as unknown as NotificationsService;
  const auditLog = jest.fn();
  const auditLogService = { log: auditLog } as unknown as AuditLogService;

  let service: AdminRecipesService;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationsSend.mockResolvedValue(undefined);
    aggregateCommentRating.mockResolvedValue({
      _avg: { rating: null },
      _count: { rating: 0 },
    });
    service = new AdminRecipesService(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma as any,
      notificationsService,
      auditLogService,
    );
  });

  it('UT-004 getForReview returns full RecipeDetail for an em_analise recipe', async () => {
    const recipe = {
      ...recipeFixture({ status: 'em_analise' }),
      category: { id: 'category-1', key: 'sobremesa', label: 'Sobremesa' },
      ingredients: [],
      steps: [],
    };
    findUniqueRecipe.mockResolvedValue(recipe);

    const result = await service.getForReview('recipe-1');

    expect(result.status).toBe('em_analise');
    expect(result.ingredients).toEqual([]);
    expect(result.steps).toEqual([]);
    expect(findUniqueRecipe).toHaveBeenCalledWith({
      where: { id: 'recipe-1' },
      include: { category: true, ingredients: true, steps: true },
    });
  });

  it('UT-004 getForReview throws 404 for a nonexistent recipe', async () => {
    findUniqueRecipe.mockResolvedValue(null);

    await expect(service.getForReview('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('UT-005 approve sets status/approvedAt, clears adjustment fields, triggers FCM send', async () => {
    updateRecipe.mockResolvedValue({
      id: 'recipe-1',
      authorId: 'author-1',
      title: 'Bolo de cenoura',
    });

    await service.approve('admin-1', 'recipe-1');

    expect(updateRecipe).toHaveBeenCalledTimes(1);
    const [updateCall] = updateRecipe.mock.calls[0] as [
      {
        where: { id: string };
        data: {
          status: string;
          approvedAt: Date;
          adjustmentReason: null;
          adjustmentNote: null;
        };
        select: { id: true; authorId: true; title: true };
      },
    ];
    expect(updateCall.where).toEqual({ id: 'recipe-1' });
    expect(updateCall.data.status).toBe('aprovada');
    expect(updateCall.data.approvedAt).toBeInstanceOf(Date);
    expect(updateCall.data.adjustmentReason).toBeNull();
    expect(updateCall.data.adjustmentNote).toBeNull();
    expect(updateCall.select).toEqual({
      id: true,
      authorId: true,
      title: true,
    });
    expect(auditLog).toHaveBeenCalledWith({
      adminId: 'admin-1',
      action: 'approve',
      targetId: 'recipe-1',
    });
    expect(notificationsSend).toHaveBeenCalledWith(
      'author-1',
      'recipe_approved',
      { recipeTitle: 'Bolo de cenoura' },
    );
  });

  it('UT-005 approve still commits the status transition when the FCM send rejects', async () => {
    updateRecipe.mockResolvedValue({
      id: 'recipe-1',
      authorId: 'author-1',
      title: 'Bolo de cenoura',
    });
    notificationsSend.mockRejectedValue(new Error('FCM unavailable'));

    await expect(
      service.approve('admin-1', 'recipe-1'),
    ).resolves.toBeUndefined();
    expect(updateRecipe).toHaveBeenCalled();
    expect(auditLog).toHaveBeenCalled();
  });

  it('UT-006 requestAdjustment sets status/reason/note, triggers FCM send', async () => {
    updateRecipe.mockResolvedValue({
      id: 'recipe-1',
      authorId: 'author-1',
      title: 'Bolo de cenoura',
    });

    await service.requestAdjustment(
      'admin-1',
      'recipe-1',
      'falta_foto',
      'nota opcional',
    );

    expect(updateRecipe).toHaveBeenCalledWith({
      where: { id: 'recipe-1' },
      data: {
        status: 'precisa_de_ajustes',
        adjustmentReason: 'falta_foto',
        adjustmentNote: 'nota opcional',
      },
      select: { id: true, authorId: true, title: true },
    });
    expect(auditLog).toHaveBeenCalledWith({
      adminId: 'admin-1',
      action: 'request-adjustment',
      targetId: 'recipe-1',
    });
    expect(notificationsSend).toHaveBeenCalledWith(
      'author-1',
      'recipe_needs_adjustment',
      { recipeTitle: 'Bolo de cenoura', adjustmentReason: 'falta_foto' },
    );
  });
});
