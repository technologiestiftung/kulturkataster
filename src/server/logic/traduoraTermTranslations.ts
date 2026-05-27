import { fetchTraduoraToken } from "@/server/traduora/cached";

const getConfig = () => {
	const apiUrl = process.env.TRADUORA_API_URL;
	const projectId = process.env.TRADUORA_PROJECT_ID;
	if (!apiUrl || !projectId) return null;
	return { apiUrl, projectId };
};

const fetchTerms = async (token: string) => {
	const config = getConfig();
	if (!config) return [];
	const response = await fetch(
		`${config.apiUrl}/projects/${config.projectId}/terms`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);
	if (!response.ok) return [];
	const data = (await response.json()) as {
		data?: Array<{ id: string; value: string }>;
	};
	return data.data ?? [];
};

const ensureTermId = async (token: string, termValue: string) => {
	const config = getConfig();
	if (!config) return null;
	const existingTerms = await fetchTerms(token);
	const existing = existingTerms.find((term) => term.value === termValue);
	if (existing) return existing.id;

	const response = await fetch(
		`${config.apiUrl}/projects/${config.projectId}/terms`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ value: termValue }),
		},
	);
	if (!response.ok) return null;
	const data = (await response.json()) as {
		data?: { id?: string };
		id?: string;
	};
	return data.data?.id ?? data.id ?? null;
};

const updateTranslation = async (
	token: string,
	locale: string,
	termId: string,
	value: string,
) => {
	const config = getConfig();
	if (!config) return;
	await fetch(
		`${config.apiUrl}/projects/${config.projectId}/translations/${locale}`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ termId, value }),
		},
	);
};

const getTranslationByTermId = async (
	token: string,
	locale: string,
	termId: string,
) => {
	const config = getConfig();
	if (!config) return null;
	const response = await fetch(
		`${config.apiUrl}/projects/${config.projectId}/translations/${locale}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);
	if (!response.ok) return null;
	const data = (await response.json()) as {
		data?: Array<{ termId: string; value: string }>;
	};
	return (
		data.data?.find((translation) => translation.termId === termId)?.value ??
		null
	);
};

export const getCategoryEnumMapTermKey = (params: {
	key: string;
	parentCategoryId?: number | null;
}) => {
	return `category.${params.key}`;
};

export async function getNamespaceTermTranslations(params: {
	namespace: string;
	termKey: string;
	locales: string[];
}) {
	const token = await fetchTraduoraToken();
	if (!token) return {} as Record<string, string>;

	const fullTermKey = `${params.namespace}.${params.termKey}`;
	const terms = await fetchTerms(token);
	const term = terms.find((item) => item.value === fullTermKey);
	if (!term) return {} as Record<string, string>;

	const result: Record<string, string> = {};
	await Promise.all(
		params.locales.map(async (locale) => {
			const value = await getTranslationByTermId(token, locale, term.id);
			if (value) result[locale] = value;
		}),
	);
	return result;
}

export async function upsertNamespaceTermTranslations(params: {
	namespace: string;
	termKey: string;
	translations: Record<string, string | undefined>;
}) {
	const token = await fetchTraduoraToken();
	if (!token) return;

	const termId = await ensureTermId(
		token,
		`${params.namespace}.${params.termKey}`,
	);
	if (!termId) return;

	await Promise.all(
		Object.entries(params.translations).map(async ([locale, value]) => {
			const trimmed = value?.trim();
			if (!trimmed) return;
			await updateTranslation(token, locale, termId, trimmed);
		}),
	);
}

export async function getEnumMapTermTranslations(params: {
	termKey: string;
	locales: string[];
}) {
	return getNamespaceTermTranslations({
		namespace: "enumMap",
		termKey: params.termKey,
		locales: params.locales,
	});
}

export async function upsertEnumMapTermTranslations(params: {
	termKey: string;
	translations: Record<string, string | undefined>;
}) {
	await upsertNamespaceTermTranslations({
		namespace: "enumMap",
		termKey: params.termKey,
		translations: params.translations,
	});
}
