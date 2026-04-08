/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable complexity */

import { fetchLabels, fetchTraduoraToken } from "@/server/traduora/cached";
import { logger } from "@/server/logging/logger";

async function getLabelIdByName(
	projectId: string,
	token: string,
	labelName: string,
): Promise<string | null> {
	const labels = await fetchLabels(projectId, token);
	const label = labels.find(
		(l) => l.value.toLowerCase() === labelName.toLowerCase(),
	);
	return label?.id || null;
}

const convertToArrays = (obj: any): any => {
	if (typeof obj !== "object" || obj === null) {
		return obj;
	}

	const keys = Object.keys(obj);
	const isArrayLike = keys.every((key: string) => /^\d+$/.test(key));

	if (isArrayLike && keys.length > 0) {
		const maxIndex = Math.max(...keys.map(Number));
		const arr = new Array(maxIndex + 1);
		for (const [key, val] of Object.entries(obj)) {
			arr[parseInt(key)] = convertToArrays(val);
		}
		return arr;
	}

	const result: Record<string, any> = {};
	for (const [key, val] of Object.entries(obj)) {
		result[key] = convertToArrays(val);
	}
	return result;
};

export async function fetchTraduoraTranslations(
	locale: string,
	namespace?: string,
): Promise<Record<string, string>> {
	const TRADUORA_API_URL = process.env.TRADUORA_API_URL!;
	const PROJECT_ID = process.env.TRADUORA_PROJECT_ID!;

	const token = await fetchTraduoraToken();
	if (!token) {
		throw new Error("No Traduora token available");
	}

	let termsUrl = `${TRADUORA_API_URL}/projects/${PROJECT_ID}/terms`;
	if (namespace) {
		const labelId = await getLabelIdByName(PROJECT_ID, token, namespace);

		if (labelId) {
			termsUrl = `${TRADUORA_API_URL}/projects/${PROJECT_ID}/terms/filter-by-label?labelId=${labelId}`;
		} else {
			throw new Error(`Label not found for namespace: ${namespace}`);
		}
	}

	const termsRes = await fetch(termsUrl, {
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});

	if (!termsRes.ok) {
		const errorText = await termsRes.text();
		logger.error("traduora.terms.fetch_failed", undefined, {
			subsystem: "translations",
			http_status: termsRes.status,
			locale,
			namespace: namespace ?? null,
			response_body: errorText,
		});
		throw new Error(`Failed to fetch terms. Status: ${termsRes.status}`);
	}

	const terms: Array<{ id: string; value: string }> = (await termsRes.json())
		.data;

	const translationsRes = await fetch(
		`${TRADUORA_API_URL}/projects/${PROJECT_ID}/translations/${locale}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!translationsRes.ok) {
		const errorText = await translationsRes.text();
		logger.error("traduora.translations.fetch_failed", undefined, {
			subsystem: "translations",
			http_status: translationsRes.status,
			locale,
			namespace: namespace ?? null,
			response_body: errorText,
		});
		throw new Error(
			`Failed to fetch translations for locale: ${locale}. Status: ${translationsRes.status}`,
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

	const translationMap = new Map(translations.map((t) => [t.termId, t.value]));

	const data: Record<string, string> = {};
	for (const term of terms) {
		const translation = translationMap.get(term.id);
		if (translation) {
			data[term.value] = translation;
		}
	}

	const nested: Record<string, any> = {};
	for (const [key, value] of Object.entries(data)) {
		const keys = key.split(".");
		let current = nested;

		for (let i = 0; i < keys.length - 1; i++) {
			const k = keys[i];
			if (!(k in current)) {
				current[k] = {};
			}
			current = current[k];
		}

		current[keys[keys.length - 1]] = value;
	}

	return convertToArrays(nested);
}
