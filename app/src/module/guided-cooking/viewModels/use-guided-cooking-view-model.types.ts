import {
  guidedCookingAnalyticsService,
  type GuidedCookingAnalyticsService,
} from '@/module/guided-cooking/services/guided-cooking-analytics-service';
import {
  guidedCookingContentService,
  type GuidedCookingContentService,
} from '@/module/guided-cooking/services/guided-cooking-content-service';
import {
  guidedCookingTimerService,
  type ActiveTimer,
  type GuidedCookingTimerService,
} from '@/module/guided-cooking/services/guided-cooking-timer-service';
import type { GuidedCookingPhase } from '@/module/guided-cooking/store/use-guided-cooking-store';
import { commentsService, type CommentsService } from '@/module/recipes/services/comments-service';
import type { RecipeStepDto } from '@/module/recipes/types';

export interface GuidedCookingViewModel {
  phase: GuidedCookingPhase;
  steps: RecipeStepDto[];
  currentStepIndex: number;
  activeTimer: ActiveTimer | null;
  confirmingAdvance: boolean;
  isFavorited: boolean;
  startTimer: (stepIndex: number) => void;
  requestAdvance: () => void;
  confirmAdvance: () => void;
  cancelAdvanceRequest: () => void;
  rate: (stars: number) => void;
  share: () => void;
  toggleFavorite: () => void;
}

export interface GuidedCookingViewModelDeps {
  contentService: GuidedCookingContentService;
  timerService: GuidedCookingTimerService;
  analyticsService: GuidedCookingAnalyticsService;
  commentsService: CommentsService;
}

export const defaultGuidedCookingViewModelDeps: GuidedCookingViewModelDeps = {
  contentService: guidedCookingContentService,
  timerService: guidedCookingTimerService,
  analyticsService: guidedCookingAnalyticsService,
  commentsService,
};
