/* eslint-disable @typescript-eslint/no-explicit-any */

import { fetchTraduoraToken } from "@/server/traduora/cached";
import { logger } from "@/server/logging/logger";

type TraduoraTerm = {
	id: string;
	value: string;
};

type TraduoraTranslation = {
	termId: string;
	value: string;
};

const unflattenObject = (flat: Record<string, string>) => {
	const result: Record<string, any> = {};

	for (const [key, value] of Object.entries(flat)) {
		const parts = key.split(".");
		let current = result;
		for (let index = 0; index < parts.length - 1; index++) {
			const part = parts[index];
			current[part] ??= {};
			current = current[part];
		}
		current[parts[parts.length - 1]] = value;
	}

	return result;
};

const getNamespaceEntries = (
	terms: TraduoraTerm[],
	translations: TraduoraTranslation[],
	namespace?: string,
) => {
	const translationByTermId = new Map(
		translations.map((translation) => [translation.termId, translation.value]),
	);
	const namespacePrefix = namespace ? `${namespace}.` : "";
	const entries: Record<string, string> = {};

	for (const term of terms) {
		const translation = translationByTermId.get(term.id);
		if (!translation) continue;
		if (namespace && !term.value.startsWith(namespacePrefix)) continue;

		const key = namespace
			? term.value.slice(namespacePrefix.length)
			: term.value;
		entries[key] = translation;
	}

	return entries;
};

export async function fetchTraduoraTranslations(
	locale: string,
	namespace?: string,
): Promise<Record<string, unknown>> {
	const apiUrl = process.env.TRADUORA_API_URL!;
	const projectId = process.env.TRADUORA_PROJECT_ID!;

	const token = await fetchTraduoraToken();
	if (!token) {
		throw new Error("No Traduora token available");
	}

	const termsRes = await fetch(`${apiUrl}/projects/${projectId}/terms`, {
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});

	if (!termsRes.ok) {
		const errorText = await termsRes.text();
		throw new Error(
			`Failed to fetch terms. Status: ${termsRes.status}. ${errorText}`,
		);
	}

	const terms = (await termsRes.json()).data as TraduoraTerm[];

	const translationsRes = await fetch(
		`${apiUrl}/projects/${projectId}/translations/${locale}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!translationsRes.ok) {
		const errorText = await translationsRes.text();
		throw new Error(
			`Failed to fetch translations for locale: ${locale}. Status: ${translationsRes.status}. ${errorText}`,
		);
	}

	const translations = (await translationsRes.json()).data;
	if (!Array.isArray(translations)) {
		logger.error("traduora.translations.invalid_response", undefined, {
			subsystem: "translations",
			locale,
			namespace: namespace ?? null,
			response_type: typeof translations,
			response_value: translations,
		});
		throw new Error(
			`Invalid translations response format for locale: ${locale}`,
		);
	}

	return unflattenObject(
		getNamespaceEntries(
			terms,
			translations as TraduoraTranslation[],
			namespace,
		),
	);
}
