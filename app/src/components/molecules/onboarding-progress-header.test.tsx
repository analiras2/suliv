import { render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { OnboardingProgressHeader } from './onboarding-progress-header';

describe('OnboardingProgressHeader', () => {
  it('UT-003: renders the progress fill at 1/3 width and the step label for the first of 3 steps', async () => {
    const rendered = await render(
      <OnboardingProgressHeader currentStep={0} totalSteps={3} label="PASSO 1 — PREFERÊNCIA BASE" />,
    );

    expect(rendered.getByText('PASSO 1 — PREFERÊNCIA BASE')).toBeTruthy();
    expect(JSON.stringify(rendered.toJSON())).toContain('33%');
  });

  it('UT-004: renders the progress fill at full width on the last step', async () => {
    const rendered = await render(
      <OnboardingProgressHeader currentStep={2} totalSteps={3} label="PASSO 3 — RITMO NA COZINHA" />,
    );

    expect(rendered.getByText('PASSO 3 — RITMO NA COZINHA')).toBeTruthy();
    expect(JSON.stringify(rendered.toJSON())).toContain('100%');
  });
});
