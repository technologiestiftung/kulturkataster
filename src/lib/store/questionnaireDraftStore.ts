import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type QuestionnaireDraftState = {
	questionnaireId: number | null;
	consentGiven: boolean;
	isRegistered: boolean | null;
	institutionId: number | null;
	answers: Record<string, unknown>;
	stepId: string;
	setConsent: (consentGiven: boolean) => void;
	setIsRegistered: (isRegistered: boolean | null) => void;
	setInstitutionId: (institutionId: number | null) => void;
	setAnswers: (partial: Record<string, unknown>) => void;
	setStepId: (stepId: string) => void;
	ensureQuestionnaire: (questionnaireId: number) => void;
	reset: () => void;
};

const defaultState = {
	questionnaireId: null,
	consentGiven: false,
	isRegistered: null,
	institutionId: null,
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
				setIsRegistered: (isRegistered) =>
					set((state) => {
						state.isRegistered = isRegistered;
					}),
				setInstitutionId: (institutionId) =>
					set((state) => {
						state.institutionId = institutionId;
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
							state.isRegistered = null;
							state.institutionId = null;
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
