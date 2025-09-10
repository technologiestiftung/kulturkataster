/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable complexity */
"use server";

import { fetchTraduoraToken, fetchLabels } from "@/lib/traduora/cached";

const TRADUORA_API_URL = process.env.TRADUORA_API_URL!;
const PROJECT_ID = process.env.TRADUORA_PROJECT_ID!;

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

/**
 * Server action to fetch translations for a given locale from Traduora.
 * Optionally filters by namespace.
 */
export async function fetchTranslations(
	locale: string,
	namespace?: string,
): Promise<Record<string, string>> {
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
		console.error(`Traduora terms API error (${termsRes.status}):`, errorText);
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
		console.error(
			`Traduora translations API error (${translationsRes.status}):`,
			errorText,
		);
		throw new Error(
			`Failed to fetch translations for locale: ${locale}. Status: ${translationsRes.status}`,
		);
	}

	const translations = (await translationsRes.json()).data;
	if (!Array.isArray(translations)) {
		console.error(
			"Translations response is not an array:",
			typeof translations,
			translations,
		);
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

	// Convert objects with numeric keys to arrays
	function convertToArrays(obj: any): any {
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
	}

	const result = convertToArrays(nested);
	return result;
}
