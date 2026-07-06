#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
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

type TraduoraLocale = {
	id: string;
	locale: {
		code: string;
		language?: string;
		region?: string;
	};
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
	body?: string | FormData;
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
	const requestHeaders: Record<string, string> = {
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...headers,
	};

	if (!(requestOptions.body instanceof FormData)) {
		requestHeaders["Content-Type"] = "application/json";
	}

	const response = await fetch(apiUrl(pathname), {
		...requestOptions,
		headers: requestHeaders,
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

async function fetchProjectLocales(token: string) {
	const response = await request<TraduoraData<TraduoraLocale[]>>(
		projectPath("/translations"),
		{ token },
	);
	return response.data ?? [];
}

async function createProjectLocale(token: string, locale: string) {
	await request<TraduoraData<TraduoraLocale>>(projectPath("/translations"), {
		method: "POST",
		token,
		body: JSON.stringify({ code: locale }),
	});
}

async function ensureProjectLocale(
	token: string,
	localesByCode: Set<string>,
	locale: string,
) {
	if (localesByCode.has(locale)) return;

	try {
		await createProjectLocale(token, locale);
	} catch (error) {
		if (!(error instanceof Error) || !error.message.includes("409")) {
			throw error;
		}
	}

	localesByCode.add(locale);
}

async function fetchTranslations(token: string, locale: string) {
	const response = await request<TraduoraData<TraduoraTranslation[]>>(
		projectPath(`/translations/${locale}`),
		{ token },
	);
	return response.data ?? [];
}

type ImportResponse = {
	terms?: {
		added?: number;
		skipped?: number;
	};
	translations?: {
		upserted?: number;
	};
};

type LocalePushChange = {
	key: string;
	value: string;
	previousValue?: string;
	termId?: string;
	type: "term_added" | "translation_added" | "translation_updated";
};

type LocalePushPlan = {
	changes: LocalePushChange[];
	unchanged: number;
};

async function importTranslations(params: {
	token: string;
	locale: string;
	filePath: string;
}) {
	const form = new FormData();
	const fileContent = JSON.stringify(flatten(readJson(params.filePath)));
	form.append(
		"file",
		new Blob([fileContent], { type: "application/json" }),
		TRANSLATION_FILE,
	);

	const response = await request<TraduoraData<ImportResponse>>(
		`${projectPath("/imports")}?locale=${encodeURIComponent(
			params.locale,
		)}&format=jsonflat`,
		{
			method: "POST",
			token: params.token,
			body: form,
		},
	);

	return response.data ?? {};
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

async function pushLocaleWithTerms(params: {
	token: string;
	locale: string;
	termByKey: Map<string, TraduoraTerm>;
	plan: LocalePushPlan;
}) {
	let updated = 0;
	for (const change of params.plan.changes) {
		const termId =
			change.termId ??
			(await ensureRemoteTerm(params.token, params.termByKey, change.key));
		await updateTranslation({
			token: params.token,
			locale: params.locale,
			termId,
			value: change.value,
		});
		updated++;
	}

	return { updated, unchanged: params.plan.unchanged };
}

async function pushToTraduora(options: {
	overwriteAll: boolean;
	pruneMissing: boolean;
	assumeYes: boolean;
	bulk: boolean;
}) {
	console.log("Starting Traduora push");
	const token = await getToken();
	const localByLocale = loadLocalTranslations();
	const localesByCode = new Set(
		(await fetchProjectLocales(token)).map((item) => item.locale.code),
	);

	if (options.overwriteAll && options.pruneMissing) {
		const terms = await fetchTerms(token);
		for (const term of terms) {
			await deleteTerm(token, term.id);
		}
		console.log(`Deleted ${terms.length} remote terms before upload`);
	}

	const remoteIndex = await getRemoteIndex(token);
	const plansByLocale = new Map<string, LocalePushPlan>();

	for (const [locale, localTranslations] of Object.entries(localByLocale)) {
		await ensureProjectLocale(token, localesByCode, locale);
		const plan = await buildLocalePushPlan({
			token,
			locale,
			localTranslations,
			termByKey: remoteIndex.termByKey,
		});
		plansByLocale.set(locale, plan);
		logLocalePushPlan(locale, plan);
	}

	const totalChanges = Array.from(plansByLocale.values()).reduce(
		(total, plan) => total + plan.changes.length,
		0,
	);
	if (totalChanges === 0) {
		console.log("No local translation changes to push.");
		return;
	}

	await confirmPush(options.assumeYes);

	for (const [locale, localTranslations] of Object.entries(localByLocale)) {
		if (options.bulk) {
			const result = await importTranslations({
				token,
				locale,
				filePath: path.join(TRANSLATIONS_DIR, locale, TRANSLATION_FILE),
			});
			console.log(
				`${locale}: bulk imported ${Object.keys(localTranslations).length} keys, ` +
					`added ${result.terms?.added ?? 0} terms, ` +
					`skipped ${result.terms?.skipped ?? 0} terms, ` +
					`upserted ${result.translations?.upserted ?? 0} translations`,
			);
			continue;
		}

		const result = await pushLocaleWithTerms({
			token,
			locale,
			termByKey: remoteIndex.termByKey,
			plan: plansByLocale.get(locale) ?? { changes: [], unchanged: 0 },
		});
		console.log(
			`${locale}: uploaded ${result.updated}, unchanged ${result.unchanged}`,
		);
	}

	if (options.pruneMissing && !options.overwriteAll) {
		const localKeys = new Set(
			Object.values(localByLocale).flatMap(Object.keys),
		);
		const { terms } = await getRemoteIndex(token);
		let deleted = 0;
		for (const term of terms) {
			if (localKeys.has(term.value)) continue;
			await deleteTerm(token, term.id);
			deleted++;
		}
		console.log(`Deleted ${deleted} remote terms missing locally`);
	}
}

async function buildLocalePushPlan(params: {
	token: string;
	locale: string;
	localTranslations: Record<string, string>;
	termByKey: Map<string, TraduoraTerm>;
}): Promise<LocalePushPlan> {
	const remoteTranslations = await fetchTranslations(
		params.token,
		params.locale,
	);
	const existingByTermId = new Map(
		remoteTranslations.map((translation) => [
			translation.termId,
			translation.value,
		]),
	);

	const changes: LocalePushChange[] = [];
	let unchanged = 0;
	for (const [key, value] of Object.entries(params.localTranslations)) {
		const term = params.termByKey.get(key);
		if (!term) {
			changes.push({ key, value, type: "term_added" });
			continue;
		}

		const previousValue = existingByTermId.get(term.id);
		if (previousValue === undefined) {
			changes.push({
				key,
				value,
				termId: term.id,
				type: "translation_added",
			});
			continue;
		}
		if (previousValue !== value) {
			changes.push({
				key,
				value,
				previousValue,
				termId: term.id,
				type: "translation_updated",
			});
			continue;
		}
		unchanged++;
	}

	return { changes, unchanged };
}

const logLocalePushPlan = (
	locale: string,
	plan: LocalePushPlan,
) => {
	const changesByType = plan.changes.reduce<Record<LocalePushChange["type"], number>>(
		(counts, change) => {
			counts[change.type]++;
			return counts;
		},
		{ term_added: 0, translation_added: 0, translation_updated: 0 },
	);

	console.log(
		`${locale}: ${plan.changes.length} change(s), ` +
			`${changesByType.term_added} new term(s), ` +
			`${changesByType.translation_added} new translation(s), ` +
			`${changesByType.translation_updated} updated translation(s), ` +
			`${plan.unchanged} unchanged`,
	);

	for (const change of plan.changes) {
		if (change.type === "translation_updated") {
			console.log(
				`  ~ update: ${change.key}\n` +
					`    remote: ${JSON.stringify(change.previousValue ?? "")}\n` +
					`    local:  ${JSON.stringify(change.value)}`,
			);
			continue;
		}
		const marker = change.type === "term_added" ? "+" : "*";
		console.log(`  ${marker} ${change.type}: ${change.key} = ${JSON.stringify(change.value)}`);
	}
};

async function confirmPush(assumeYes: boolean) {
	if (assumeYes) {
		console.log("Confirmation skipped because --yes was provided.");
		return;
	}
	if (!process.stdin.isTTY) {
		throw new Error(
			"Translation push requires confirmation. Re-run with --yes in non-interactive environments.",
		);
	}

	const rl = createInterface({ input, output });
	try {
		const answer = await rl.question("Push these translation changes to Traduora? [y/N] ");
		if (answer.trim().toLowerCase() !== "y") {
			throw new Error("Translation push cancelled.");
		}
	} finally {
		rl.close();
	}
}

async function pullFromTraduora(overwriteAll: boolean) {
	console.log("Starting Traduora pull");
	const token = await getToken();
	const { terms } = await getRemoteIndex(token);
	const termById = new Map(terms.map((term) => [term.id, term.value]));
	const localesByCode = new Set(
		(await fetchProjectLocales(token)).map((item) => item.locale.code),
	);

	for (const locale of getLocales()) {
		await ensureProjectLocale(token, localesByCode, locale);
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
	const supportedFlags = new Set(["--all", "--prune", "--yes", "--bulk"]);
	const unknownFlags = flags.filter((flag) => !supportedFlags.has(flag));
	if (unknownFlags.length > 0) {
		console.error(`Unknown flag(s): ${unknownFlags.join(", ")}`);
		console.error(
			"Usage: npm run traduora:sync <push|pull> [--all] [--prune] [--yes] [--bulk]",
		);
		process.exit(1);
	}

	const overwriteAll = flags.includes("--all");
	const pruneMissing = flags.includes("--prune");
	const assumeYes = flags.includes("--yes");
	const bulk = flags.includes("--bulk");

	try {
		assertConfig();
		if (command === "push") {
			await pushToTraduora({ overwriteAll, pruneMissing, assumeYes, bulk });
			return;
		}
		if (command === "pull") {
			await pullFromTraduora(overwriteAll);
			return;
		}
		console.log(
			"Usage: npm run traduora:sync <push|pull> [--all] [--prune] [--yes] [--bulk]",
		);
		process.exit(1);
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

void main();
