#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type TranslationTree = Record<string, JsonValue>;

const TRANSLATIONS_DIR = path.join(process.cwd(), "src/lib/i18n/translations");
const SOURCE_DIR = path.join(process.cwd(), "src");
const TRANSLATION_FILE = "translation.json";
const TRANSLATION_ROOTS = ["common", "content", "enumMap"] as const;
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const MAX_REPORT_ITEMS = 80;

type SourceKeyUsage = {
	key: string;
	filePath: string;
	line: number;
};

type SourceKeyScan = {
	literalKeys: SourceKeyUsage[];
	dynamicPrefixes: Set<string>;
};

type ShapeMismatch = {
	key: string;
	leftLocale: string;
	leftShape: string;
	rightLocale: string;
	rightShape: string;
};

type ShapeCompareInput = {
	key: string;
	leftLocale: string;
	leftValue: JsonValue;
	rightLocale: string;
	rightValue: JsonValue;
};

type MissingKey = {
	locale: string;
	key: string;
	usages: SourceKeyUsage[];
};

const isJsonObject = (value: JsonValue): value is JsonObject =>
	Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getShape = (value: JsonValue) => {
	if (Array.isArray(value)) return "array";
	if (isJsonObject(value)) return "object";
	return "scalar";
};

const readJson = (filePath: string): TranslationTree =>
	JSON.parse(fs.readFileSync(filePath, "utf-8")) as TranslationTree;

const getLocales = () =>
	fs
		.readdirSync(TRANSLATIONS_DIR)
		.filter((item) =>
			fs.statSync(path.join(TRANSLATIONS_DIR, item)).isDirectory(),
		)
		.sort((left, right) => left.localeCompare(right));

const walkSourceFiles = (dir: string, result: string[] = []) => {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if ([".git", ".next", "node_modules"].includes(entry.name)) continue;
		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walkSourceFiles(entryPath, result);
			continue;
		}
		if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
			result.push(entryPath);
		}
	}
	return result;
};

const lineNumberAt = (source: string, index: number) =>
	source.slice(0, index).split("\n").length;

const isTranslationKey = (key: string) =>
	TRANSLATION_ROOTS.some((root) => key === root || key.startsWith(`${root}.`));

const normalizePrefix = (prefix: string) => prefix.replace(/\.$/, "");

const addDynamicPrefix = (prefixes: Set<string>, prefix: string) => {
	const normalized = normalizePrefix(prefix);
	if (
		normalized &&
		isTranslationKey(normalized) &&
		!TRANSLATION_ROOTS.some((root) => normalized === root)
	) {
		prefixes.add(normalized);
	}
};

const scanSourceKeys = (): SourceKeyScan => {
	const literalKeys: SourceKeyUsage[] = [];
	const dynamicPrefixes = new Set<string>();
	const literalPatterns = [
		/\bt(?:Common|Content|Enum)?\(\s*(["'])([^"'$]+)\1/g,
		/i18nKey=(["'])([^"'$]+)\1/g,
	];
	const templatePatterns = [
		/\bt(?:Common|Content|Enum)?\(\s*`([^`$]+)\$\{/g,
		/i18nKey=`([^`$]+)\$\{/g,
	];
	const concatPatterns = [
		/\bt(?:Common|Content|Enum)?\(\s*(["'])([^"']+\.)\1\s*\+/g,
	];

	for (const filePath of walkSourceFiles(SOURCE_DIR)) {
		const source = fs.readFileSync(filePath, "utf-8");
		const relativePath = path.relative(process.cwd(), filePath);

		for (const pattern of literalPatterns) {
			let match = pattern.exec(source);
			while (match) {
				const key = match[2];
				if (isTranslationKey(key)) {
					literalKeys.push({
						key,
						filePath: relativePath,
						line: lineNumberAt(source, match.index),
					});
				}
				match = pattern.exec(source);
			}
		}

		for (const pattern of templatePatterns) {
			let match = pattern.exec(source);
			while (match) {
				addDynamicPrefix(dynamicPrefixes, match[1]);
				match = pattern.exec(source);
			}
		}

		for (const pattern of concatPatterns) {
			let match = pattern.exec(source);
			while (match) {
				addDynamicPrefix(dynamicPrefixes, match[2]);
				match = pattern.exec(source);
			}
		}
	}

	return { literalKeys, dynamicPrefixes };
};

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

const getByKey = (
	tree: TranslationTree,
	key: string,
): JsonValue | undefined => {
	const segments = parseKey(key);
	let current: JsonValue | undefined = tree;
	for (const segment of segments) {
		if (typeof segment === "number") {
			if (!Array.isArray(current)) return undefined;
			current = current[segment];
			continue;
		}
		if (!current || typeof current !== "object") return undefined;
		current = (current as JsonObject)[segment];
	}
	return current;
};

const hasKey = (tree: TranslationTree, key: string) => {
	const value = getByKey(tree, key);
	if (typeof value !== "undefined") return true;

	const segments = parseKey(key);
	const lastSegment = segments.at(-1);
	if (typeof lastSegment !== "string") return false;
	const parentKey = segments.slice(0, -1).join(".");
	const parent = parentKey ? getByKey(tree, parentKey) : tree;
	return (
		isJsonObject(parent) &&
		(typeof parent[`${lastSegment}_one`] !== "undefined" ||
			typeof parent[`${lastSegment}_other`] !== "undefined")
	);
};

const flattenLeafKeys = (
	value: JsonValue,
	prefix = "",
	result: string[] = [],
) => {
	if (Array.isArray(value)) {
		value.forEach((item, index) =>
			flattenLeafKeys(
				item,
				prefix ? `${prefix}.${index}` : String(index),
				result,
			),
		);
		return result;
	}
	if (isJsonObject(value)) {
		Object.entries(value).forEach(([key, item]) =>
			flattenLeafKeys(item, prefix ? `${prefix}.${key}` : key, result),
		);
		return result;
	}
	if (prefix) result.push(prefix);
	return result;
};

const isCoveredByDynamicPrefix = (key: string, prefixes: Set<string>) => {
	for (const prefix of prefixes) {
		if (key === prefix || key.startsWith(`${prefix}.`)) return true;
	}
	return false;
};

const buildSourceCoveredPrefixes = (
	translationsByLocale: Map<string, TranslationTree>,
	sourceKeys: SourceKeyUsage[],
) => {
	const prefixes = new Set<string>();
	for (const usage of sourceKeys) {
		for (const tree of translationsByLocale.values()) {
			const value = getByKey(tree, usage.key);
			if (Array.isArray(value) || isJsonObject(value)) {
				prefixes.add(usage.key);
				break;
			}
		}
	}
	return prefixes;
};

const isCoveredBySource = (
	key: string,
	sourceKeySet: Set<string>,
	sourceCoveredPrefixes: Set<string>,
) => {
	if (sourceKeySet.has(key)) return true;
	for (const prefix of sourceCoveredPrefixes) {
		if (key.startsWith(`${prefix}.`)) return true;
	}
	return false;
};

const findMissingKeys = (
	translationsByLocale: Map<string, TranslationTree>,
	sourceKeys: SourceKeyUsage[],
): MissingKey[] => {
	const usagesByKey = new Map<string, SourceKeyUsage[]>();
	for (const usage of sourceKeys) {
		const usages = usagesByKey.get(usage.key) ?? [];
		usages.push(usage);
		usagesByKey.set(usage.key, usages);
	}

	const missing: MissingKey[] = [];
	for (const [locale, tree] of translationsByLocale) {
		for (const [key, usages] of usagesByKey) {
			if (!hasKey(tree, key)) {
				missing.push({ locale, key, usages });
			}
		}
	}
	return missing;
};

const findShapeMismatches = (
	translationsByLocale: Map<string, TranslationTree>,
): ShapeMismatch[] => {
	const locales = Array.from(translationsByLocale.keys());
	const mismatches: ShapeMismatch[] = [];

	const compare = ({
		key,
		leftLocale,
		leftValue,
		rightLocale,
		rightValue,
	}: ShapeCompareInput) => {
		const leftShape = getShape(leftValue);
		const rightShape = getShape(rightValue);
		if (leftShape !== rightShape) {
			mismatches.push({
				key,
				leftLocale,
				leftShape,
				rightLocale,
				rightShape,
			});
			return;
		}
		if (!isJsonObject(leftValue) || !isJsonObject(rightValue)) {
			return;
		}
		for (const childKey of Object.keys(leftValue)) {
			if (!(childKey in rightValue)) continue;
			compare({
				key: key ? `${key}.${childKey}` : childKey,
				leftLocale,
				leftValue: leftValue[childKey],
				rightLocale,
				rightValue: rightValue[childKey],
			});
		}
	};

	for (let leftIndex = 0; leftIndex < locales.length; leftIndex++) {
		for (
			let rightIndex = leftIndex + 1;
			rightIndex < locales.length;
			rightIndex++
		) {
			const leftLocale = locales[leftIndex];
			const rightLocale = locales[rightIndex];
			const leftTree = translationsByLocale.get(leftLocale);
			const rightTree = translationsByLocale.get(rightLocale);
			if (!leftTree || !rightTree) continue;
			compare({
				key: "",
				leftLocale,
				leftValue: leftTree,
				rightLocale,
				rightValue: rightTree,
			});
		}
	}

	return mismatches;
};

const findOrphanKeys = (
	translationsByLocale: Map<string, TranslationTree>,
	sourceKeys: SourceKeyUsage[],
	dynamicPrefixes: Set<string>,
) => {
	const sourceKeySet = new Set(sourceKeys.map((usage) => usage.key));
	const sourceCoveredPrefixes = buildSourceCoveredPrefixes(
		translationsByLocale,
		sourceKeys,
	);
	const leafKeysByLocale = new Map(
		Array.from(translationsByLocale, ([locale, tree]) => [
			locale,
			new Set(flattenLeafKeys(tree)),
		]),
	);
	const result = new Map<string, string[]>();

	for (const [locale, leafKeys] of leafKeysByLocale) {
		const orphanKeys = Array.from(leafKeys)
			.filter((key) => {
				const isLocaleOnly = Array.from(leafKeysByLocale).some(
					([otherLocale, otherLeafKeys]) =>
						otherLocale !== locale && !otherLeafKeys.has(key),
				);
				return (
					isLocaleOnly &&
					isTranslationKey(key) &&
					!isCoveredBySource(key, sourceKeySet, sourceCoveredPrefixes) &&
					!isCoveredByDynamicPrefix(key, dynamicPrefixes)
				);
			})
			.sort((left, right) => left.localeCompare(right));
		result.set(locale, orphanKeys);
	}

	return result;
};

const printList = (items: string[]) => {
	for (const item of items.slice(0, MAX_REPORT_ITEMS)) {
		console.log(`  - ${item}`);
	}
	if (items.length > MAX_REPORT_ITEMS) {
		console.log(`  ... ${items.length - MAX_REPORT_ITEMS} more`);
	}
};

const main = () => {
	const locales = getLocales();
	const translationsByLocale = new Map(
		locales.map((locale) => [
			locale,
			readJson(path.join(TRANSLATIONS_DIR, locale, TRANSLATION_FILE)),
		]),
	);
	const sourceScan = scanSourceKeys();
	const missingKeys = findMissingKeys(
		translationsByLocale,
		sourceScan.literalKeys,
	);
	const shapeMismatches = findShapeMismatches(translationsByLocale);
	const orphanKeysByLocale = findOrphanKeys(
		translationsByLocale,
		sourceScan.literalKeys,
		sourceScan.dynamicPrefixes,
	);

	console.log(`i18n audit: ${locales.length} locale(s)`);
	console.log(
		`literal source keys: ${new Set(sourceScan.literalKeys.map((usage) => usage.key)).size}`,
	);
	console.log(`dynamic source prefixes: ${sourceScan.dynamicPrefixes.size}`);

	if (missingKeys.length > 0) {
		console.error(`\nMissing source keys: ${missingKeys.length}`);
		for (const missing of missingKeys.slice(0, MAX_REPORT_ITEMS)) {
			const firstUsage = missing.usages[0];
			console.error(
				`  - ${missing.locale}: ${missing.key} (${firstUsage.filePath}:${firstUsage.line})`,
			);
		}
		if (missingKeys.length > MAX_REPORT_ITEMS) {
			console.error(`  ... ${missingKeys.length - MAX_REPORT_ITEMS} more`);
		}
	}

	if (shapeMismatches.length > 0) {
		console.error(`\nShape mismatches: ${shapeMismatches.length}`);
		for (const mismatch of shapeMismatches.slice(0, MAX_REPORT_ITEMS)) {
			console.error(
				`  - ${mismatch.key}: ${mismatch.leftLocale}=${mismatch.leftShape}, ${mismatch.rightLocale}=${mismatch.rightShape}`,
			);
		}
		if (shapeMismatches.length > MAX_REPORT_ITEMS) {
			console.error(`  ... ${shapeMismatches.length - MAX_REPORT_ITEMS} more`);
		}
	}

	console.log("\nOrphan key warnings:");
	for (const [locale, orphanKeys] of orphanKeysByLocale) {
		console.log(`${locale}: ${orphanKeys.length}`);
		printList(orphanKeys);
	}

	if (missingKeys.length > 0 || shapeMismatches.length > 0) {
		process.exit(1);
	}

	console.log("\nNo missing source keys or shape mismatches found.");
};

main();
