'use cache'
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */

const TRADUORA_API_URL = process.env.TRADUORA_API_URL!;
const CLIENT_ID = process.env.TRADUORA_CLIENT_ID!;
const CLIENT_SECRET = process.env.TRADUORA_CLIENT_SECRET!;
const PROJECT_ID = process.env.TRADUORA_PROJECT_ID!;

/**
 * Fetches and caches a Traduora access token using client credentials.
 */
async function fetchTraduoraToken(): Promise<string | null> {

	const res = await fetch(`${TRADUORA_API_URL}/auth/token`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			grant_type: "client_credentials",
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
		}),
	});

	if (!res.ok) {
		const errorText = await res.text();
		console.error(`Traduora token error (${res.status}):`, errorText);
		throw new Error(`Failed to retrieve Traduora token. Status: ${res.status}`);
	}

	const data = await res.json();
	return data.access_token;
}

/**
 * Fetches project labels and returns a map of label name to label ID
 */
async function fetchLabels(
	projectId: string,
	token: string,
): Promise<Array<{ id: string; value: string }>> {

	const labelsRes = await fetch(
		`${TRADUORA_API_URL}/projects/${projectId}/labels`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!labelsRes.ok) {
		console.error(`Failed to fetch labels: ${labelsRes.status}`);
		throw new Error(`Failed to fetch labels: ${labelsRes.status}`);
	}

	const labels: Array<{ id: string; value: string }> = (await labelsRes.json())
		.data;
	return labels;
}

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
 * Fetches translations for a given locale from Traduora.
 * Optionally filters by namespace prefix and strips it.
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
