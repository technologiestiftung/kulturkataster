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

type JsonValue = string | JsonObject | JsonValue[];
type JsonObject = Record<string, JsonValue>;

const parseKey = (key: string): Array<string | number> => {
	const segments: Array<string | number> = [];
	const matcher = /([^[.\]]+)|\[(\d+)\]/g;
	let match = matcher.exec(key);

	while (match) {
		segments.push(match[1] ?? Number(match[2]));
		match = matcher.exec(key);
	}

	return segments;
};

const createChildForSegment = (
	segment: string | number,
): JsonObject | JsonValue[] => (typeof segment === "number" ? [] : {});

const getOrCreateChild = (
	current: JsonObject | JsonValue[],
	segment: string | number,
	nextSegment: string | number,
) => {
	const child = createChildForSegment(nextSegment);

	if (typeof segment === "number") {
		if (!Array.isArray(current)) return undefined;
		current[segment] ??= child;
		return current[segment] as JsonObject | JsonValue[];
	}

	const object = current as JsonObject;
	object[segment] ??= child;
	return object[segment] as JsonObject | JsonValue[];
};

const setSegmentValue = (
	current: JsonObject | JsonValue[],
	segment: string | number,
	value: string,
) => {
	if (typeof segment === "number" && Array.isArray(current)) {
		current[segment] = value;
		return;
	}

	if (typeof segment === "string") {
		(current as JsonObject)[segment] = value;
	}
};

const unflattenObject = (flat: Record<string, string>) => {
	const result: JsonObject = {};

	for (const [key, value] of Object.entries(flat)) {
		const segments = parseKey(key);
		if (segments.length === 0) continue;

		let current: JsonObject | JsonValue[] = result;
		for (let index = 0; index < segments.length - 1; index++) {
			const next = getOrCreateChild(
				current,
				segments[index],
				segments[index + 1],
			);
			if (!next) break;
			current = next;
		}

		setSegmentValue(current, segments[segments.length - 1], value);
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
		cache: "no-store",
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
			cache: "no-store",
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
