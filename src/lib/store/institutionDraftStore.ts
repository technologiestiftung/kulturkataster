import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
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
		devtools(
			immer((set) => ({
				draft: defaultDraft,
				stepId: "basic",
				mode: "create",
				setDraft: (partial) =>
					set((state) => {
						for (const [key, value] of Object.entries(partial)) {
							if (value === undefined) {
								delete state.draft[key];
							} else {
								state.draft[key] = value;
							}
						}
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
		),
		{ name: "institution-draft" },
	),
);
