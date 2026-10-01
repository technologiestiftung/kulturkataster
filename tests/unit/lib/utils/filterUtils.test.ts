import { createInstance, type TFunction } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import de from "@/lib/i18n/translations/de/translation.json";
import en from "@/lib/i18n/translations/en/translation.json";
import { getCategoryLabel } from "@/lib/i18n/fieldLabels";
import {
	getSortedCategories,
	getSortedSubcategories,
} from "@/lib/utils/filterUtils";
import type { Category } from "@/types";

const translators: Record<"de" | "en", TFunction> = {} as never;

beforeAll(async () => {
	for (const [locale, resources] of [
		["de", de],
		["en", en],
	] as const) {
		const i18n = createInstance();
		await i18n.init({
			lng: locale,
			resources: { [locale]: { translation: resources } },
		});
		translators[locale] = i18n.t.bind(i18n) as TFunction;
	}
});

const toCategories = (keys: string[]): Category[] =>
	keys.map((key, index) => ({ id: index + 1, key, child_categories: [] }));

const sortKeys = (keys: string[], locale: "de" | "en") =>
	getSortedCategories(
		toCategories(keys),
		new Intl.Collator(locale, { numeric: true, sensitivity: "base" }),
		translators[locale],
	).map((category) => category.key);

// Key order would be cinemas, libraries, museums, studios.
const KEYS = ["museums", "other", "studios", "cinemas", "libraries"];

describe("getSortedCategories", () => {
	it("sorts by the German label, not the key", () => {
		// Ateliers, Bibliotheken, Kinos, Museen, then "Nicht zugeordnet".
		expect(sortKeys(KEYS, "de")).toEqual([
			"studios",
			"libraries",
			"cinemas",
			"museums",
			"other",
		]);
	});

	it("sorts by the English label, not the key", () => {
		// Artist Studios, Cinemas, Libraries, Museums, then "Other".
		expect(sortKeys(KEYS, "en")).toEqual([
			"studios",
			"cinemas",
			"libraries",
			"museums",
			"other",
		]);
	});

	it("does not mutate the input", () => {
		const categories = toCategories(KEYS);
		getSortedCategories(categories, new Intl.Collator("en"), translators.en);
		expect(categories.map((category) => category.key)).toEqual(KEYS);
	});
});

describe("getSortedSubcategories", () => {
	it("sorts subcategories by their translated label", () => {
		const parent: Category = {
			id: 1,
			key: "parent",
			child_categories: toCategories(["museums", "libraries", "studios"]),
		};
		const sorted = getSortedSubcategories(
			parent,
			new Intl.Collator("de"),
			translators.de,
			() => true,
		);
		expect(sorted.map((category) => category.key)).toEqual([
			"studios",
			"libraries",
			"museums",
		]);
	});
});

describe("getCategoryLabel", () => {
	it("returns the translated label", () => {
		expect(getCategoryLabel(translators.en, "cinemas")).toBe("Cinemas");
		expect(getCategoryLabel(translators.de, "cinemas")).toBe("Kinos");
	});

	it("falls back to the key instead of the translation path", () => {
		expect(getCategoryLabel(translators.en, "not_yet_translated")).toBe(
			"not_yet_translated",
		);
	});
});
