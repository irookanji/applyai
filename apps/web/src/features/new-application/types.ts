export type GenerationInput = {
  readonly jobUrl: string;
  readonly jobDescription: string;
  readonly cvFile: File | null;
};

export type WizardContinueValues = {
  readonly jobUrl: string;
  readonly jobDescription: string;
  readonly cvFile: File | null;
  readonly useStoredCv: boolean;
};
