import { cache } from "react";
import { questionnaireRepo } from "@/server/data/questionnaireRepo";
import { logger } from "@/server/logging/logger";
import { parseHiddenMenuItems } from "@/lib/utils/menuVisibility";

export const QUESTIONNAIRE_MENU_ITEM = "questionnaire";

const hasOpenQuestionnaire = async () => {
	try {
		return await questionnaireRepo.hasOpen();
	} catch (error) {
		logger.error("questionnaire.has_open.failed", error, {
			subsystem: "questionnaire",
		});
		// Keep the entry; the questionnaire page reports the error itself.
		return true;
	}
};

/**
 * Menu items hidden by HIDDEN_MENU_ITEMS, plus the questionnaire while none is open.
 * Cached per request, because the layout and the menu pages both ask.
 */
export const getHiddenMenuItems = cache(async () => {
	const hiddenMenuItems = parseHiddenMenuItems(process.env.HIDDEN_MENU_ITEMS);
	if (hiddenMenuItems.includes(QUESTIONNAIRE_MENU_ITEM)) return hiddenMenuItems;
	return (await hasOpenQuestionnaire())
		? hiddenMenuItems
		: [...hiddenMenuItems, QUESTIONNAIRE_MENU_ITEM];
});

export const isQuestionnaireVisible = async () =>
	!(await getHiddenMenuItems()).includes(QUESTIONNAIRE_MENU_ITEM);
