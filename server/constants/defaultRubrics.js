// Default rubric criteria matching the official F2/F3/F4 forms.
// Coordinators can modify these when creating a task.
export const DEFAULT_RUBRICS = {
  F2: [
    {
      name: 'Problem identification',
      description: 'Identify problems/issues/opportunities',
      weight: 3,
      score_min: 1,
      score_max: 10,
    },
    {
      name: 'Evidences',
      description: 'Evidences to support problems/issues/opportunities identified.',
      weight: 5,
      score_min: 1,
      score_max: 10,
    },
    {
      name: 'Solutions',
      description: 'Propose solutions.',
      weight: 2,
      score_min: 1,
      score_max: 10,
    },
  ],
  F3: [
    {
      name: 'Relevance and context',
      description: 'Identify problems/issues/opportunities',
      weight: 2,
      score_min: 0,
      score_max: 10,
    },
    {
      name: 'Knowledge of the field/sources',
      description: 'Knowledge of the field/sources',
      weight: 4,
      score_min: 0,
      score_max: 10,
    },
    {
      name: 'Writing',
      description: 'Summary based on references',
      weight: 4,
      score_min: 0,
      score_max: 10,
    },
  ],
  F4: [
    {
      name: 'Design of the methodology',
      description: 'Appropriate and comprehensible design of the methodology',
      weight: 3,
      score_min: 1,
      score_max: 10,
    },
    {
      name: 'Description',
      description: 'Comprehensible and detailed description of each component in methodology',
      weight: 3,
      score_min: 1,
      score_max: 10,
    },
    {
      name: 'Model/Technique/Method',
      description: 'Model/Technique/Method employed',
      weight: 4,
      score_min: 1,
      score_max: 10,
    },
  ],
};

export const FORM_TITLES = {
  F2: 'F2 - PROJECT MOTIVATION EVALUATION FORM',
  F3: 'F3- LITERATURE REVIEW EVALUATION FORM',
  F4: 'F4 - METHODOLOGY EVALUATION FORM',
};
