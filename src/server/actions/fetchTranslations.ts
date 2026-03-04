"use server";

import { fetchTraduoraTranslations } from "@/server/logic/traduoraTranslations";

/**
 * Server action to fetch translations for a given locale from Traduora.
 * Optionally filters by namespace.
 */
export async function fetchTranslations(
	locale: string,
	namespace?: string,
): Promise<Record<string, string>> {
	return fetchTraduoraTranslations(locale, namespace);
}
