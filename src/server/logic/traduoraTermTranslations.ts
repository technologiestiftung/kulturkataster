import { fetchLabels, fetchTraduoraToken } from "@/server/traduora/cached";

const getConfig = () => {
	const apiUrl = process.env.TRADUORA_API_URL;
	const projectId = process.env.TRADUORA_PROJECT_ID;
	if (!apiUrl || !projectId) return null;
	return { apiUrl, projectId };
};

const fetchTerms = async (token: string, labelId?: string) => {
	const config = getConfig();
	if (!config) return [];
	let url = `${config.apiUrl}/projects/${config.projectId}/terms`;
	if (labelId) {
		url = `${config.apiUrl}/projects/${config.projectId}/terms/filter-by-label?labelId=${labelId}`;
	}
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});
	if (!response.ok) return [];
	const data = (await response.json()) as {
		data?: Array<{ id: string; value: string }>;
	};
	return data.data ?? [];
};

const ensureLabelId = async (token: string, labelName: string) => {
	const config = getConfig();
	if (!config) return null;
	const labels = await fetchLabels(config.projectId, token);
	const existing = labels.find(
		(label) => label.value.toLowerCase() === labelName.toLowerCase(),
	);
	if (existing) return existing.id;

	const response = await fetch(
		`${config.apiUrl}/projects/${config.projectId}/labels`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ value: labelName }),
		},
	);
	if (!response.ok) return null;
	const data = (await response.json()) as { data?: { id?: string } };
	return data.data?.id ?? null;
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

const labelTerm = async (token: string, labelId: string, termId: string) => {
	const config = getConfig();
	if (!config) return;
	await fetch(
		`${config.apiUrl}/projects/${config.projectId}/labels/${labelId}/terms/${termId}`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);
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

	const labelId = await ensureLabelId(token, params.namespace);
	if (!labelId) return {} as Record<string, string>;

	const terms = await fetchTerms(token, labelId);
	const term = terms.find((item) => item.value === params.termKey);
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

	const labelId = await ensureLabelId(token, params.namespace);
	if (!labelId) return;

	const termId = await ensureTermId(token, params.termKey);
	if (!termId) return;

	await labelTerm(token, labelId, termId);

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
