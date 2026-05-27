#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

config();

const TRADUORA_API_URL = process.env.TRADUORA_API_URL ?? "";
const TRADUORA_CLIENT_ID = process.env.TRADUORA_CLIENT_ID ?? "";
const TRADUORA_CLIENT_SECRET = process.env.TRADUORA_CLIENT_SECRET ?? "";
const TRADUORA_PROJECT_ID = process.env.TRADUORA_PROJECT_ID ?? "";
const TRANSLATIONS_DIR = path.join(process.cwd(), "src/lib/i18n/translations");
const TRANSLATION_FILE = "translation.json";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type TraduoraTerm = {
	id: string;
	value: string;
};

type TraduoraTranslation = {
	termId: string;
	value: string;
};

type TraduoraData<T> = {
	data?: T;
	id?: string;
	access_token?: string;
};

type RequestOptions = {
	method?: string;
	token?: string;
	headers?: Record<string, string>;
	body?: string;
};

const requiredEnvVars = {
	TRADUORA_API_URL,
	TRADUORA_CLIENT_ID,
	TRADUORA_CLIENT_SECRET,
	TRADUORA_PROJECT_ID,
};

const assertConfig = () => {
	const missing = Object.entries(requiredEnvVars)
		.filter(([, value]) => !value)
		.map(([key]) => key);

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}`,
		);
	}
};

const apiUrl = (pathname: string) =>
	`${TRADUORA_API_URL}${pathname.startsWith("/") ? "" : "/"}${pathname}`;

async function request<T>(
	pathname: string,
	options: RequestOptions = {},
): Promise<T> {
	const { token, headers, ...requestOptions } = options;
	const response = await fetch(apiUrl(pathname), {
		...requestOptions,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...headers,
		},
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`${requestOptions.method ?? "GET"} ${pathname} failed: ${response.status} ${body}`,
		);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
}

async function getToken() {
	const response = await request<TraduoraData<never>>("/auth/token", {
		method: "POST",
		body: JSON.stringify({
			grant_type: "client_credentials",
			client_id: TRADUORA_CLIENT_ID,
			client_secret: TRADUORA_CLIENT_SECRET,
		}),
	});

	if (!response.access_token) {
		throw new Error("Traduora token response did not include access_token");
	}

	return response.access_token;
}

const projectPath = (suffix: string) =>
	`/projects/${TRADUORA_PROJECT_ID}${suffix}`;

async function fetchTerms(token: string) {
	const response = await request<TraduoraData<TraduoraTerm[]>>(
		projectPath("/terms"),
		{ token },
	);
	return response.data ?? [];
}

async function fetchTranslations(token: string, locale: string) {
	const response = await request<TraduoraData<TraduoraTranslation[]>>(
		projectPath(`/translations/${locale}`),
		{ token },
	);
	return response.data ?? [];
}

async function createTerm(token: string, value: string) {
	const response = await request<TraduoraData<{ id?: string }>>(
		projectPath("/terms"),
		{
			method: "POST",
			token,
			body: JSON.stringify({ value }),
		},
	);
	const termId = response.data?.id ?? response.id;
	if (!termId) {
		throw new Error(`Traduora did not return an id for term "${value}"`);
	}
	return termId;
}

async function deleteTerm(token: string, termId: string) {
	await request(projectPath(`/terms/${termId}`), {
		method: "DELETE",
		token,
	});
}

async function updateTranslation(params: {
	token: string;
	locale: string;
	termId: string;
	value: string;
}) {
	await request(projectPath(`/translations/${params.locale}`), {
		method: "PATCH",
		token: params.token,
		body: JSON.stringify({
			termId: params.termId,
			value: params.value,
		}),
	});
}

const readJson = (filePath: string): JsonObject =>
	JSON.parse(fs.readFileSync(filePath, "utf-8")) as JsonObject;

const writeJson = (filePath: string, value: JsonObject) => {
	fs.writeFileSync(
		filePath,
		`${JSON.stringify(sortKeys(value), null, "\t")}\n`,
	);
};

const getLocales = () =>
	fs
		.readdirSync(TRANSLATIONS_DIR)
		.filter((item) =>
			fs.statSync(path.join(TRANSLATIONS_DIR, item)).isDirectory(),
		);

function sortKeys(value: JsonValue): JsonValue {
	if (Array.isArray(value)) {
		return value.map(sortKeys);
	}
	if (!value || typeof value !== "object") {
		return value;
	}

	return Object.fromEntries(
		Object.entries(value)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, item]) => [key, sortKeys(item)]),
	);
}

function flatten(value: JsonValue, prefix = ""): Record<string, string> {
	if (Array.isArray(value)) {
		return Object.fromEntries(
			value.flatMap((item, index) =>
				Object.entries(flatten(item, `${prefix}[${index}]`)),
			),
		);
	}
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).flatMap(([key, item]) =>
				Object.entries(flatten(item, prefix ? `${prefix}.${key}` : key)),
			),
		);
	}
	return { [prefix]: value === null ? "" : String(value) };
}

function parseKey(key: string): Array<string | number> {
	const segments: Array<string | number> = [];
	const matcher = /([^[.\]]+)|\[(\d+)\]/g;
	let match = matcher.exec(key);

	while (match) {
		segments.push(match[1] ?? Number(match[2]));
		match = matcher.exec(key);
	}

	return segments;
}

function unflatten(flat: Record<string, string>): JsonObject {
	const result: JsonObject = {};

	for (const [key, value] of Object.entries(flat)) {
		const segments = parseKey(key);
		if (segments.length === 0) continue;

		let current: JsonObject | JsonValue[] = result;
		for (let index = 0; index < segments.length - 1; index++) {
			const segment = segments[index];
			const nextSegment = segments[index + 1];
			const child = typeof nextSegment === "number" ? [] : {};

			if (typeof segment === "number") {
				if (!Array.isArray(current)) break;
				current[segment] ??= child;
				current = current[segment] as JsonObject | JsonValue[];
			} else {
				const object = current as JsonObject;
				object[segment] ??= child;
				current = object[segment] as JsonObject | JsonValue[];
			}
		}

		const lastSegment = segments[segments.length - 1];
		if (typeof lastSegment === "number" && Array.isArray(current)) {
			current[lastSegment] = value;
		} else if (typeof lastSegment === "string") {
			(current as JsonObject)[lastSegment] = value;
		}
	}

	return result;
}

const loadLocalTranslations = () =>
	Object.fromEntries(
		getLocales().map((locale) => [
			locale,
			flatten(readJson(path.join(TRANSLATIONS_DIR, locale, TRANSLATION_FILE))),
		]),
	);

async function getRemoteIndex(token: string) {
	const terms = await fetchTerms(token);
	return {
		terms,
		termByKey: new Map(terms.map((term) => [term.value, term])),
	};
}

async function ensureRemoteTerm(
	token: string,
	termByKey: Map<string, TraduoraTerm>,
	key: string,
) {
	const existing = termByKey.get(key);
	if (existing) return existing.id;

	try {
		const id = await createTerm(token, key);
		termByKey.set(key, { id, value: key });
		return id;
	} catch (error) {
		if (!(error instanceof Error) || !error.message.includes("409")) {
			throw error;
		}
		const refreshed = await getRemoteIndex(token);
		const term = refreshed.termByKey.get(key);
		if (!term) throw error;
		termByKey.set(key, term);
		return term.id;
	}
}

async function pushToTraduora(options: {
	overwriteAll: boolean;
	pruneMissing: boolean;
}) {
	console.log("Starting Traduora push");
	const token = await getToken();
	const localByLocale = loadLocalTranslations();
	const localKeys = new Set(Object.values(localByLocale).flatMap(Object.keys));
	const { terms, termByKey } = await getRemoteIndex(token);

	for (const [locale, localTranslations] of Object.entries(localByLocale)) {
		const remoteTranslations = await fetchTranslations(token, locale);
		const existingByTermId = new Map(
			remoteTranslations.map((translation) => [
				translation.termId,
				translation.value,
			]),
		);

		let updated = 0;
		let skipped = 0;
		for (const [key, value] of Object.entries(localTranslations)) {
			const termId = await ensureRemoteTerm(token, termByKey, key);
			if (!options.overwriteAll && existingByTermId.has(termId)) {
				skipped++;
				continue;
			}
			await updateTranslation({ token, locale, termId, value });
			updated++;
		}
		console.log(`${locale}: updated ${updated}, skipped ${skipped}`);
	}

	if (options.pruneMissing) {
		let deleted = 0;
		for (const term of terms) {
			if (localKeys.has(term.value)) continue;
			await deleteTerm(token, term.id);
			deleted++;
		}
		console.log(`Deleted ${deleted} remote terms missing locally`);
	}
}

async function pullFromTraduora(overwriteAll: boolean) {
	console.log("Starting Traduora pull");
	const token = await getToken();
	const { terms } = await getRemoteIndex(token);
	const termById = new Map(terms.map((term) => [term.id, term.value]));

	for (const locale of getLocales()) {
		const filePath = path.join(TRANSLATIONS_DIR, locale, TRANSLATION_FILE);
		const localTranslations = fs.existsSync(filePath)
			? flatten(readJson(filePath))
			: {};
		const remoteTranslations = await fetchTranslations(token, locale);
		const remoteFlat = Object.fromEntries(
			remoteTranslations.flatMap((translation) => {
				const key = termById.get(translation.termId);
				return key && translation.value ? [[key, translation.value]] : [];
			}),
		);

		const merged = overwriteAll
			? { ...localTranslations, ...remoteFlat }
			: { ...remoteFlat, ...localTranslations };
		writeJson(filePath, unflatten(merged));
		console.log(`${locale}: wrote ${Object.keys(merged).length} keys`);
	}
}

async function main() {
	const [command, ...flags] = process.argv.slice(2);
	const overwriteAll = flags.includes("--all");
	const pruneMissing = flags.includes("--prune");

	try {
		assertConfig();
		if (command === "push") {
			await pushToTraduora({ overwriteAll, pruneMissing });
			return;
		}
		if (command === "pull") {
			await pullFromTraduora(overwriteAll);
			return;
		}
		console.log("Usage: npm run traduora:sync <push|pull> [--all] [--prune]");
		process.exit(1);
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

void main();
