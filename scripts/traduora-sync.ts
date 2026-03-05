#!/usr/bin/env tsx
/* eslint-disable complexity */
/* eslint-disable no-shadow */
/* eslint-disable max-depth */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Traduora Sync Script
 *
 * This script syncs translation files between local JSON files and Traduora.
 * - Namespaces (e.g., "common", "content", "enumMap") map to Traduora labels
 * - Supports bidirectional sync (push local → Traduora, pull Traduora → local)
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

// Load environment variables from .env file
config();

// Environment variables should be set in .env or passed at runtime
const TRADUORA_API_URL = process.env.TRADUORA_API_URL || "";
const TRADUORA_CLIENT_ID = process.env.TRADUORA_CLIENT_ID || "";
const TRADUORA_CLIENT_SECRET = process.env.TRADUORA_CLIENT_SECRET || "";
const TRADUORA_PROJECT_ID = process.env.TRADUORA_PROJECT_ID || "";

const TRANSLATIONS_DIR = path.join(process.cwd(), "src/lib/i18n/translations");

interface TraduoraLabel {
	id: string;
	value: string;
}

interface TraduoraTerm {
	id: string;
	value: string;
}

interface TraduoraTranslation {
	termId: string;
	value: string;
}

/**
 * Get Traduora access token
 */
async function getTraduoraToken(): Promise<string> {
	const response = await fetch(`${TRADUORA_API_URL}/auth/token`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			grant_type: "client_credentials",
			client_id: TRADUORA_CLIENT_ID,
			client_secret: TRADUORA_CLIENT_SECRET,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Failed to get Traduora token: ${response.status} ${errorText}`,
		);
	}

	const data = await response.json();
	return data.access_token;
}

/**
 * Fetch all labels from Traduora
 */
async function fetchLabels(token: string): Promise<TraduoraLabel[]> {
	const response = await fetch(
		`${TRADUORA_API_URL}/projects/${TRADUORA_PROJECT_ID}/labels`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch labels: ${response.status}`);
	}

	const data = await response.json();
	return data.data;
}

/**
 * Create a label if it doesn't exist
 */
async function ensureLabel(token: string, labelName: string): Promise<string> {
	const labels = await fetchLabels(token);
	const existingLabel = labels.find(
		(l) => l.value.toLowerCase() === labelName.toLowerCase(),
	);

	if (existingLabel) {
		return existingLabel.id;
	}

	// Create new label
	const response = await fetch(
		`${TRADUORA_API_URL}/projects/${TRADUORA_PROJECT_ID}/labels`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ value: labelName }),
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to create label ${labelName}: ${response.status}`);
	}

	const data = await response.json();
	return data.data.id;
}

/**
 * Fetch all terms from Traduora
 */
async function fetchTerms(
	token: string,
	labelId?: string,
): Promise<TraduoraTerm[]> {
	let url = `${TRADUORA_API_URL}/projects/${TRADUORA_PROJECT_ID}/terms`;

	if (labelId) {
		url = `${TRADUORA_API_URL}/projects/${TRADUORA_PROJECT_ID}/terms/filter-by-label?labelId=${labelId}`;
	}

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch terms: ${response.status}`);
	}

	const data = await response.json();
	return data.data;
}

/**
 * Fetch translations for a specific locale
 */
async function fetchTranslations(
	token: string,
	locale: string,
): Promise<TraduoraTranslation[]> {
	const response = await fetch(
		`${TRADUORA_API_URL}/projects/${TRADUORA_PROJECT_ID}/translations/${locale}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to fetch translations for ${locale}: ${response.status}`,
		);
	}

	const data = await response.json();
	return data.data;
}

/**
 * Create or update a term in Traduora
 */
async function upsertTerm(token: string, termKey: string): Promise<string> {
	// Check if term exists
	const terms = await fetchTerms(token);
	const existingTerm = terms.find((t) => t.value === termKey);

	if (existingTerm) {
		return existingTerm.id;
	}

	// Create new term - try to get it again first (maybe it was just created)
	await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
	const recheckTerms = await fetchTerms(token);
	const recheckTerm = recheckTerms.find((t) => t.value === termKey);
	if (recheckTerm) {
		return recheckTerm.id;
	}

	// Create new term
	const response = await fetch(
		`${TRADUORA_API_URL}/projects/${TRADUORA_PROJECT_ID}/terms`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ value: termKey }),
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		// If 409, term already exists - fetch it
		if (response.status === 409) {
			const allTerms = await fetchTerms(token);
			const existingTerm = allTerms.find((t) => t.value === termKey);
			if (existingTerm) {
				return existingTerm.id;
			}
		}
		throw new Error(
			`Failed to create term ${termKey}: ${response.status} ${errorText}`,
		);
	}

	const data = await response.json();
	const termId = data.data?.id || data.id;
	if (!termId) {
		console.error("Unexpected response format:", data);
		throw new Error(`Failed to get term ID from response for: ${termKey}`);
	}
	return termId;
}

/**
 * Add a label to a term
 */
async function labelTerm(
	token: string,
	labelId: string,
	termId: string,
): Promise<void> {
	const response = await fetch(
		`${TRADUORA_API_URL}/projects/${TRADUORA_PROJECT_ID}/labels/${labelId}/terms/${termId}`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);

	// 409 means already labeled, 404 might mean term or label doesn't exist, both are acceptable
	// We'll just log a warning for 404 instead of throwing
	if (!response.ok && response.status !== 409) {
		if (response.status === 404) {
			console.warn(
				`    ⚠ Warning: Could not label term (404) - term or label may not exist`,
			);
		} else {
			throw new Error(`Failed to label term: ${response.status}`);
		}
	}
}

/**
 * Update a translation for a term
 */
async function updateTranslation(params: {
	token: string;
	locale: string;
	termId: string;
	value: string;
}): Promise<void> {
	const { token, locale, termId, value } = params;
	const response = await fetch(
		`${TRADUORA_API_URL}/projects/${TRADUORA_PROJECT_ID}/translations/${locale}`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ termId, value }),
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Failed to update translation: ${response.status} ${errorText}`,
		);
	}
}

/**
 * Delete a term from Traduora
 */
async function deleteTerm(token: string, termId: string): Promise<void> {
	const response = await fetch(
		`${TRADUORA_API_URL}/projects/${TRADUORA_PROJECT_ID}/terms/${termId}`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok && response.status !== 404) {
		const errorText = await response.text();
		throw new Error(`Failed to delete term: ${response.status} ${errorText}`);
	}
}

/**
 * Recursively sort object keys alphabetically
 */
function sortObjectKeys(obj: any): any {
	if (obj === null || obj === undefined) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => sortObjectKeys(item));
	}

	if (typeof obj !== "object") {
		return obj;
	}

	const sorted: Record<string, any> = {};
	const keys = Object.keys(obj).sort();

	for (const key of keys) {
		sorted[key] = sortObjectKeys(obj[key]);
	}

	return sorted;
}

/**
 * Deep merge two objects, with source overwriting target
 */
function deepMerge(target: any, source: any): any {
	if (!source || typeof source !== "object") return target;
	if (!target || typeof target !== "object") return source;

	const result = { ...target };

	for (const key in source) {
		if (
			source[key] &&
			typeof source[key] === "object" &&
			!Array.isArray(source[key])
		) {
			result[key] = deepMerge(target[key], source[key]);
		} else {
			result[key] = source[key];
		}
	}

	return result;
}

/**
 * Remove literal bracket notation keys that conflict with arrays
 * e.g., if an object has both `items: [...]` and `items[0]: ""`, remove the latter
 */
function removeLiteralBracketKeys(obj: any): any {
	if (obj === null || obj === undefined || typeof obj !== "object") {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => removeLiteralBracketKeys(item));
	}

	const cleaned: Record<string, any> = {};
	const keysToRemove = new Set<string>();

	// First pass: identify keys that look like array notation
	for (const key of Object.keys(obj)) {
		if (/^.+\[\d+\]$/.test(key)) {
			// This key looks like "items[0]" or "foo[123]"
			const baseKey = key.replace(/\[\d+\]$/, "");
			// If there's a corresponding array property, mark this for removal
			if (Array.isArray(obj[baseKey])) {
				keysToRemove.add(key);
			}
		}
	}

	// Second pass: copy non-removed keys and recursively clean
	for (const [key, value] of Object.entries(obj)) {
		if (!keysToRemove.has(key)) {
			cleaned[key] = removeLiteralBracketKeys(value);
		}
	}

	return cleaned;
}

/**
 * Flatten nested JSON object to dot notation
 */
function flattenObject(obj: any, prefix = ""): Record<string, string> {
	const result: Record<string, string> = {};

	for (const [key, value] of Object.entries(obj)) {
		const newKey = prefix ? `${prefix}.${key}` : key;

		if (value === null || value === undefined) {
			result[newKey] = "";
		} else if (Array.isArray(value)) {
			// Handle arrays with bracket notation for stable round-tripping.
			value.forEach((item, index) => {
				const indexedKey = `${newKey}[${index}]`;
				if (typeof item === "object" && item !== null) {
					Object.assign(result, flattenObject(item, indexedKey));
				} else {
					result[indexedKey] = String(item);
				}
			});
		} else if (typeof value === "object") {
			Object.assign(result, flattenObject(value, newKey));
		} else {
			result[newKey] = String(value);
		}
	}

	return result;
}

/**
 * Unflatten dot notation to nested object
 */
function unflattenObject(flat: Record<string, string>): any {
	const result: any = {};

	function parsePathSegments(pathKey: string): Array<string | number> {
		const normalized = pathKey.replace(/\.([0-9]+)(?=\.|$)/g, "[$1]");
		const segments: Array<string | number> = [];
		const matcher = /([^[.\]]+)|\[(\d+)\]/g;
		let match: RegExpExecArray | null = matcher.exec(normalized);

		while (match) {
			if (match[1] !== undefined) {
				segments.push(match[1]);
			} else if (match[2] !== undefined) {
				segments.push(Number(match[2]));
			}
			match = matcher.exec(normalized);
		}

		return segments;
	}

	for (const [key, value] of Object.entries(flat)) {
		const segments = parsePathSegments(key);
		if (segments.length === 0) continue;

		let current: any = result;
		let validPath = true;

		for (let i = 0; i < segments.length - 1; i++) {
			const segment = segments[i];
			const nextSegment = segments[i + 1];
			const shouldCreateArray = typeof nextSegment === "number";

			if (typeof segment === "number") {
				if (!Array.isArray(current)) {
					validPath = false;
					break;
				}
				if (
					current[segment] === undefined ||
					current[segment] === null ||
					typeof current[segment] !== "object"
				) {
					current[segment] = shouldCreateArray ? [] : {};
				}
				current = current[segment];
			} else {
				if (
					current[segment] === undefined ||
					current[segment] === null ||
					typeof current[segment] !== "object"
				) {
					current[segment] = shouldCreateArray ? [] : {};
				}
				current = current[segment];
			}
		}

		if (!validPath) continue;
		const lastSegment = segments[segments.length - 1];
		if (typeof lastSegment === "number") {
			if (Array.isArray(current)) {
				current[lastSegment] = value;
			}
		} else {
			current[lastSegment] = value;
		}
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

		const newObj: Record<string, any> = {};
		for (const [key, val] of Object.entries(obj)) {
			newObj[key] = convertToArrays(val);
		}
		return newObj;
	}

	return convertToArrays(result);
}

/**
 * Push local translation files to Traduora
 */
async function pushToTraduora(
	overwriteAll: boolean = false,
	pruneMissing: boolean = false,
	pruneOrphanNamespaces: boolean = false,
): Promise<void> {
	console.log("🚀 Starting push to Traduora...\n");
	console.log(`ℹ Mode: ${overwriteAll ? "Overwrite all" : "New keys only"}`);
	console.log(`ℹ Prune missing remote keys: ${pruneMissing ? "yes" : "no"}`);
	console.log(
		`ℹ Prune orphan namespaces: ${pruneOrphanNamespaces ? "yes" : "no"}`,
	);
	console.log(`ℹ Using Traduora API URL: ${TRADUORA_API_URL}`);
	console.log(`ℹ Project ID: ${TRADUORA_PROJECT_ID}\n`);

	const token = await getTraduoraToken();
	console.log("✓ Authenticated with Traduora\n");

	// Get all locale directories
	const locales = fs.readdirSync(TRANSLATIONS_DIR).filter((item) => {
		const itemPath = path.join(TRANSLATIONS_DIR, item);
		return fs.statSync(itemPath).isDirectory();
	});

	console.log(`Found locales: ${locales.join(", ")}\n`);

	const namespaceKeysByName = new Map<string, Set<string>>();
	for (const locale of locales) {
		const localeDir = path.join(TRANSLATIONS_DIR, locale);
		const namespaceFiles = fs
			.readdirSync(localeDir)
			.filter((file) => file.endsWith(".json"));
		for (const namespaceFile of namespaceFiles) {
			const namespace = namespaceFile.replace(".json", "");
			const namespaceKey = namespace.toLowerCase();
			const filePath = path.join(localeDir, namespaceFile);
			const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
			// Clean up literal bracket keys before flattening
			const cleanedContent = removeLiteralBracketKeys(content);
			const flatTranslations = flattenObject(cleanedContent);
			if (!namespaceKeysByName.has(namespaceKey)) {
				namespaceKeysByName.set(namespaceKey, new Set<string>());
			}
			const keys = namespaceKeysByName.get(namespaceKey);
			if (!keys) continue;
			for (const key of Object.keys(flatTranslations)) {
				keys.add(key);
			}
		}
	}

	for (const locale of locales) {
		console.log(`📁 Processing locale: ${locale}`);
		const localeDir = path.join(TRANSLATIONS_DIR, locale);

		// Get all JSON files (namespaces) in this locale
		const namespaceFiles = fs
			.readdirSync(localeDir)
			.filter((file) => file.endsWith(".json"));

		for (const namespaceFile of namespaceFiles) {
			const namespace = namespaceFile.replace(".json", "");
			console.log(`  📄 Processing namespace: ${namespace}`);

			// Ensure label exists for this namespace
			const labelId = await ensureLabel(token, namespace);
			console.log(`    ✓ Label ensured (ID: ${labelId})`);

			// Read the translation file
			const filePath = path.join(localeDir, namespaceFile);
			const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

			// Clean up any literal bracket notation keys before flattening
			const cleanedContent = removeLiteralBracketKeys(content);

			// Flatten the translations
			const flatTranslations = flattenObject(cleanedContent);
			console.log(
				`    ℹ Found ${Object.keys(flatTranslations).length} translation keys`,
			);

			// Fetch existing translations for this locale if not overwriting all
			const existingTranslationsMap = new Map<string, string>();
			if (!overwriteAll) {
				const existingTranslations = await fetchTranslations(token, locale);
				const allTerms = await fetchTerms(token);
				const termIdToKey = new Map(allTerms.map((t) => [t.id, t.value]));

				for (const trans of existingTranslations) {
					const termKey = termIdToKey.get(trans.termId);
					if (termKey && trans.value) {
						existingTranslationsMap.set(termKey, trans.value);
					}
				}
			}

			// Process each translation
			let updatedCount = 0;
			let skippedCount = 0;
			let errorCount = 0;
			for (const [termKey, termValue] of Object.entries(flatTranslations)) {
				try {
					// Create/get term
					const termId = await upsertTerm(token, termKey);

					// Label the term with the namespace
					await labelTerm(token, labelId, termId);

					// Skip if translation already exists and we're not overwriting
					if (!overwriteAll && existingTranslationsMap.has(termKey)) {
						skippedCount++;
						continue;
					}

					// Update translation
					await updateTranslation({ token, locale, termId, value: termValue });
					updatedCount++;
				} catch (error) {
					errorCount++;
					console.error(
						`    ✗ Error processing "${termKey}":`,
						error instanceof Error ? error.message : error,
					);
					if (errorCount > 5) {
						throw new Error("Too many errors, aborting push");
					}
				}
			}

			console.log(
				`    ✓ Updated ${updatedCount} translations${!overwriteAll ? `, skipped ${skippedCount} existing` : ""}\n`,
			);
		}
	}

	if (pruneMissing) {
		console.log("🧹 Pruning remote terms missing from local files...");
		const labels = await fetchLabels(token);
		let deletedCount = 0;

		for (const label of labels) {
			const namespace = label.value;
			const expectedKeys = namespaceKeysByName.get(namespace.toLowerCase());
			if (!expectedKeys && !pruneOrphanNamespaces) {
				console.log(
					`  ℹ Skipping prune for orphan namespace "${namespace}" (no matching local file)`,
				);
				continue;
			}
			const terms = await fetchTerms(token, label.id);
			for (const term of terms) {
				if (expectedKeys?.has(term.value)) {
					continue;
				}
				await deleteTerm(token, term.id);
				deletedCount++;
				console.log(`  ✓ Deleted remote key: ${namespace}.${term.value}`);
			}
		}

		console.log(`✓ Pruned ${deletedCount} remote terms\n`);
	}

	console.log("✅ Push to Traduora completed successfully!");
}

/**
 * Pull translations from Traduora to local files
 */
async function pullFromTraduora(overwriteAll: boolean = false): Promise<void> {
	console.log("🚀 Starting pull from Traduora...\n");
	console.log(`ℹ Mode: ${overwriteAll ? "Overwrite all" : "New keys only"}`);
	console.log(`ℹ Using Traduora API URL: ${TRADUORA_API_URL}`);
	console.log(`ℹ Project ID: ${TRADUORA_PROJECT_ID}\n`);

	const token = await getTraduoraToken();
	console.log("✓ Authenticated with Traduora\n");

	// Get all labels (namespaces)
	const labels = await fetchLabels(token);
	console.log(`Found ${labels.length} labels/namespaces\n`);

	// Get all locale directories
	const locales = fs.readdirSync(TRANSLATIONS_DIR).filter((item) => {
		const itemPath = path.join(TRANSLATIONS_DIR, item);
		return fs.statSync(itemPath).isDirectory();
	});

	console.log(`Found locales: ${locales.join(", ")}\n`);

	for (const locale of locales) {
		console.log(`📁 Processing locale: ${locale}`);
		const localeDir = path.join(TRANSLATIONS_DIR, locale);

		// Ensure locale directory exists
		if (!fs.existsSync(localeDir)) {
			fs.mkdirSync(localeDir, { recursive: true });
		}

		// Fetch all translations for this locale
		const allTranslations = await fetchTranslations(token, locale);
		const translationMap = new Map(
			allTranslations.map((t) => [t.termId, t.value]),
		);

		for (const label of labels) {
			console.log(`  📄 Processing namespace: ${label.value}`);

			// Fetch terms for this label
			const terms = await fetchTerms(token, label.id);

			if (terms.length === 0) {
				console.log(`    ℹ No terms found for this namespace, skipping`);
				continue;
			}

			// Build flat translations object
			const flatTranslations: Record<string, string> = {};
			for (const term of terms) {
				const translation = translationMap.get(term.id);
				if (translation) {
					flatTranslations[term.value] = translation;
				}
			}

			console.log(
				`    ℹ Found ${Object.keys(flatTranslations).length} translations`,
			);

			// Unflatten to nested structure
			const traduoraTranslations = unflattenObject(flatTranslations);

			// Clean up any literal bracket notation keys from Traduora data
			const cleanedTraduoraTranslations =
				removeLiteralBracketKeys(traduoraTranslations);

			// Read existing local file to preserve local-only keys
			// Check for both camelCase and other case variants
			// Convert first letter to lowercase to match existing convention (common, content, enumMap)
			const normalizedFileName =
				label.value.charAt(0).toLowerCase() + label.value.slice(1) + ".json";
			const normalizedFilePath = path.join(localeDir, normalizedFileName);
			const originalFilePath = path.join(localeDir, `${label.value}.json`);
			const allLowerPath = path.join(
				localeDir,
				label.value.toLowerCase() + ".json",
			);

			let mergedTranslations = cleanedTraduoraTranslations;
			// Check for existing file in multiple case variations
			let existingFilePath: string | null = null;
			if (fs.existsSync(normalizedFilePath)) {
				existingFilePath = normalizedFilePath;
			} else if (fs.existsSync(originalFilePath)) {
				existingFilePath = originalFilePath;
			} else if (fs.existsSync(allLowerPath)) {
				existingFilePath = allLowerPath;
			}

			if (existingFilePath) {
				try {
					const localContent = JSON.parse(
						fs.readFileSync(existingFilePath, "utf-8"),
					);
					// Clean up any literal bracket notation keys from local file too
					const cleanedLocalContent = removeLiteralBracketKeys(localContent);

					if (overwriteAll) {
						// Overwrite all: Traduora values replace local values completely
						mergedTranslations = deepMerge(
							cleanedLocalContent,
							cleanedTraduoraTranslations,
						);
						console.log(
							`    ℹ Merged with existing local translations (Traduora overwriting)`,
						);
					} else {
						// New keys only: Keep existing local values, only add new keys from Traduora
						mergedTranslations = deepMerge(
							cleanedTraduoraTranslations,
							cleanedLocalContent,
						);
						console.log(
							`    ℹ Merged with existing local translations (preserving local values)`,
						);
					}
				} catch {
					console.warn(`    ⚠ Could not read existing file, will overwrite`);
				}
			}

			// Sort keys alphabetically for consistent output
			const sortedTranslations = sortObjectKeys(mergedTranslations);

			// Write to file (normalize filename to lowercase) with trailing newline
			fs.writeFileSync(
				normalizedFilePath,
				JSON.stringify(sortedTranslations, null, "\t") + "\n",
			);
			console.log(
				`    ✓ Saved to ${path.relative(process.cwd(), normalizedFilePath)}\n`,
			);
		}
	}

	console.log("✅ Pull from Traduora completed successfully!");
}

/**
 * Main function
 */
async function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	const hasAllFlag = args.includes("--all");
	const hasPruneFlag = args.includes("--prune");
	const hasPruneOrphansFlag = args.includes("--prune-orphan-namespaces");

	if (
		!TRADUORA_API_URL ||
		!TRADUORA_CLIENT_ID ||
		!TRADUORA_CLIENT_SECRET ||
		!TRADUORA_PROJECT_ID
	) {
		console.error("❌ Error: Missing required environment variables");
		console.error("Please ensure the following are set in .env:");
		console.error("  - TRADUORA_API_URL");
		console.error("  - TRADUORA_CLIENT_ID");
		console.error("  - TRADUORA_CLIENT_SECRET");
		console.error("  - TRADUORA_PROJECT_ID");
		process.exit(1);
	}

	try {
		if (command === "push") {
			await pushToTraduora(hasAllFlag, hasPruneFlag, hasPruneOrphansFlag);
		} else if (command === "pull") {
			await pullFromTraduora(hasAllFlag);
		} else {
			console.log(
				"Usage: npm run traduora:sync <push|pull> [--all] [--prune] [--prune-orphan-namespaces]",
			);
			console.log("");
			console.log("Commands:");
			console.log(
				"  push       - Upload local translation files to Traduora (default: new keys only)",
			);
			console.log(
				"  push --all - Upload and overwrite all translations in Traduora",
			);
			console.log(
				"  push --all --prune - Mirror local files: overwrite translations and delete missing remote keys",
			);
			console.log(
				"  push --all --prune --prune-orphan-namespaces - Also delete namespaces that have no local file match",
			);
			console.log(
				"  pull       - Download translations from Traduora (default: new keys only)",
			);
			console.log(
				"  pull --all - Download and overwrite all local translations",
			);
			process.exit(1);
		}
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

main();
