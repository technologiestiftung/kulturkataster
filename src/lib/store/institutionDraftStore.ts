import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
	InstitutionDraftData,
	InstitutionDraftStoreState,
} from "@/types/submission";

const defaultDraft: InstitutionDraftData = {
	"address.lat": 52.52,
	"address.lng": 13.405,
};

export const useInstitutionDraftStore = create<InstitutionDraftStoreState>()(
	persist(
		immer((set) => ({
			draft: defaultDraft,
			stepId: "basic",
			mode: "create",
			setDraft: (partial) =>
				set((state) => {
					Object.assign(state.draft, partial);
				}),
			setStepId: (stepId) =>
				set((state) => {
					state.stepId = stepId;
				}),
			setMode: (mode) =>
				set((state) => {
					state.mode = mode;
				}),
			resetDraft: () =>
				set((state) => {
					state.draft = defaultDraft;
					state.stepId = "basic";
					state.mode = "create";
				}),
		})),
		{ name: "institution-draft" },
	),
);
