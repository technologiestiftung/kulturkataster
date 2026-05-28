"use server";

import { fetchTraduoraTranslations } from "@/server/logic/traduoraTranslations";
import { logger } from "@/server/logging/logger";

/**
 * Server action to fetch translations for a given locale from Traduora.
 * Optionally filters by namespace.
 */
export async function fetchTranslations(
	locale: string,
	namespace?: string,
): Promise<Record<string, unknown>> {
	try {
		return await fetchTraduoraTranslations(locale, namespace);
	} catch (error) {
		logger.warn("translations.fetch.failed", {
			subsystem: "translations",
			locale,
			namespace: namespace ?? null,
			error: error instanceof Error ? error.message : String(error),
		});
		return {};
	}
}
