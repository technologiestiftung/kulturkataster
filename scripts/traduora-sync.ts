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
 * Flatten nested JSON object to dot notation
 */
function flattenObject(obj: any, prefix = ""): Record<string, string> {
	const result: Record<string, string> = {};

	for (const [key, value] of Object.entries(obj)) {
		const newKey = prefix ? `${prefix}.${key}` : key;

		if (value === null || value === undefined) {
			result[newKey] = "";
		} else if (Array.isArray(value)) {
			// Handle arrays by using index as part of the key
			value.forEach((item, index) => {
				if (typeof item === "object" && item !== null) {
					Object.assign(result, flattenObject(item, `${newKey}.${index}`));
				} else {
					result[`${newKey}.${index}`] = String(item);
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

	for (const [key, value] of Object.entries(flat)) {
		const keys = key.split(".");
		let current = result;

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
async function pushToTraduora(): Promise<void> {
	console.log("🚀 Starting push to Traduora...\n");

	const token = await getTraduoraToken();
	console.log("✓ Authenticated with Traduora\n");

	// Get all locale directories
	const locales = fs.readdirSync(TRANSLATIONS_DIR).filter((item) => {
		const itemPath = path.join(TRANSLATIONS_DIR, item);
		return fs.statSync(itemPath).isDirectory();
	});

	console.log(`Found locales: ${locales.join(", ")}\n`);

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

			// Flatten the translations
			const flatTranslations = flattenObject(content);
			console.log(
				`    ℹ Found ${Object.keys(flatTranslations).length} translation keys`,
			);

			// Process each translation
			let updatedCount = 0;
			let errorCount = 0;
			for (const [termKey, termValue] of Object.entries(flatTranslations)) {
				try {
					// Create/get term
					const termId = await upsertTerm(token, termKey);

					// Label the term with the namespace
					await labelTerm(token, labelId, termId);

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

			console.log(`    ✓ Updated ${updatedCount} translations\n`);
		}
	}

	console.log("✅ Push to Traduora completed successfully!");
}

/**
 * Pull translations from Traduora to local files
 */
async function pullFromTraduora(): Promise<void> {
	console.log("🚀 Starting pull from Traduora...\n");

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

			let mergedTranslations = traduoraTranslations;
			// Check for existing file in multiple case variations
			const existingFilePath = fs.existsSync(normalizedFilePath)
				? normalizedFilePath
				: fs.existsSync(originalFilePath)
					? originalFilePath
					: fs.existsSync(allLowerPath)
						? allLowerPath
						: null;

			if (existingFilePath) {
				try {
					const localContent = JSON.parse(
						fs.readFileSync(existingFilePath, "utf-8"),
					);
					// Merge: Traduora translations overwrite local, but preserve local-only keys
					mergedTranslations = deepMerge(localContent, traduoraTranslations);
					console.log(`    ℹ Merged with existing local translations`);
				} catch {
					console.warn(`    ⚠ Could not read existing file, will overwrite`);
				}
			}

			// Write to file (normalize filename to lowercase)
			fs.writeFileSync(
				normalizedFilePath,
				JSON.stringify(mergedTranslations, null, "\t"),
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
	const command = process.argv[2];

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
			await pushToTraduora();
		} else if (command === "pull") {
			await pullFromTraduora();
		} else {
			console.log("Usage: npm run traduora:sync <push|pull>");
			console.log("  push - Upload local translation files to Traduora");
			console.log(
				"  pull - Download translations from Traduora to local files",
			);
			process.exit(1);
		}
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

main();
