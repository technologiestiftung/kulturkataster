import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type QuestionnaireDraftState = {
	questionnaireId: number | null;
	consentGiven: boolean;
	isInstitutionRegistered: boolean | null;
	institutionId: number | null;
	submissionId: number | null;
	answers: Record<string, unknown>;
	stepId: string;
	setConsent: (consentGiven: boolean) => void;
	setIsInstitutionRegistered: (isInstitutionRegistered: boolean | null) => void;
	setInstitutionId: (institutionId: number | null) => void;
	setSubmissionId: (submissionId: number | null) => void;
	setAnswers: (partial: Record<string, unknown>) => void;
	setStepId: (stepId: string) => void;
	ensureQuestionnaire: (questionnaireId: number) => void;
	reset: () => void;
};

const defaultState = {
	questionnaireId: null,
	consentGiven: false,
	isInstitutionRegistered: null,
	institutionId: null,
	submissionId: null,
	answers: {},
	stepId: "consent",
} satisfies Partial<QuestionnaireDraftState>;

export const useQuestionnaireDraftStore = create<QuestionnaireDraftState>()(
	persist(
		devtools(
			immer((set) => ({
				...defaultState,
				setConsent: (consentGiven) =>
					set((state) => {
						state.consentGiven = consentGiven;
					}),
				setIsInstitutionRegistered: (isInstitutionRegistered) =>
					set((state) => {
						state.isInstitutionRegistered = isInstitutionRegistered;
						state.institutionId = null;
						state.submissionId = null;
					}),
				setInstitutionId: (institutionId) =>
					set((state) => {
						state.institutionId = institutionId;
						if (institutionId !== null) state.submissionId = null;
					}),
				setSubmissionId: (submissionId) =>
					set((state) => {
						state.submissionId = submissionId;
						if (submissionId !== null) state.institutionId = null;
					}),
				setAnswers: (partial) =>
					set((state) => {
						Object.assign(state.answers, partial);
					}),
				setStepId: (stepId) =>
					set((state) => {
						state.stepId = stepId;
					}),
				// A stale draft from a previously loaded questionnaire must not leak
				// into a different one, since localStorage persists across sessions.
				ensureQuestionnaire: (questionnaireId) =>
					set((state) => {
						if (state.questionnaireId !== questionnaireId) {
							state.questionnaireId = questionnaireId;
							state.consentGiven = false;
							state.isInstitutionRegistered = null;
							state.institutionId = null;
							state.submissionId = null;
							state.answers = {};
							state.stepId = "consent";
						}
					}),
				reset: () =>
					set((state) => {
						Object.assign(state, defaultState);
					}),
			})),
		),
		{ name: "questionnaire-draft" },
	),
);
