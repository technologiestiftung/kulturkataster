import { createInstance } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import de from "@/lib/i18n/translations/de/translation.json";
import en from "@/lib/i18n/translations/en/translation.json";
import { parseCsv } from "@/lib/utils/csvUtils";
import { generateCSV, prepareDataForExport } from "@/lib/utils/downloadUtils";
import { buildInstitutionPermissionFields } from "@/lib/utils/institutionPermissionUtils";
import {
	planInstitutionImport,
	resolveImportColumns,
	type ImportTranslateFn,
} from "@/server/logic/institutionImport";
import type { Institution } from "@/types";

const lookups = {
	categories: [
		{ id: 1, key: "theater", parent_category_id: null },
		{ id: 2, key: "dance", parent_category_id: 1 },
	],
	tags: [
		{ id: 10, name: "barrier-free" },
		{ id: 11, name: "outdoor" },
		{ id: 12, name: "music; dance" },
	],
	groups: [{ id: 20, name: "public; private" }],
};

const makeInstitution = (): Institution =>
	({
		id: 2646,
		name: "Alpha",
		status: "public",
		email: "alpha@example.de",
		phone: null,
		website: "https://example.de",
		area: 120.5,
		capacity: 80,
		notes: "Line one\nLine two",
		owner_type: "private",
		shared_use_allowed: true,
		established_since: new Date(Date.UTC(1999, 4, 1)),
		created_at: new Date(Date.UTC(2024, 0, 1)),
		updated_at: new Date(Date.UTC(2024, 0, 2)),
		address: {
			id: 5,
			street: "Musterstrasse",
			street_number: "12",
			zipcode: "10115",
			city: "Berlin",
			district: "Mitte",
			neighbourhood: null,
			cultural_area: null,
			lat: 52.52,
			lng: 13.405,
		},
		contact_person: {
			first_name: "Ada",
			last_name: "Lovelace",
			email: "ada@example.de",
			phone: null,
		},
		categories: [
			{ id: 1, key: "theater", parent_category_id: null },
			{ id: 2, key: "dance", parent_category_id: 1 },
		],
		tags: [{ id: 10, name: "barrier-free" }],
		users: [{ id: "u1", first_name: "Grace", last_name: "Hopper" }],
		groups: [],
		funding_sources: [
			{ id: 20, source_name: "state_berlin", description: "Grant" },
		],
	}) as unknown as Institution;

let translators: Record<string, ImportTranslateFn>;

beforeAll(async () => {
	const createTranslator = async (
		locale: string,
		resources: Record<string, unknown>,
	) => {
		const i18n = createInstance();
		await i18n.init({
			lng: locale,
			resources: { [locale]: { translation: resources } },
		});
		return i18n.t.bind(i18n) as unknown as ImportTranslateFn;
	};
	translators = {
		de: await createTranslator("de", de),
		en: await createTranslator("en", en),
	};
});

const exportCsv = (institutions: Institution[], locale = "de") =>
	parseCsv(
		generateCSV(
			prepareDataForExport(institutions, { translateFn: translators[locale] }),
		),
	);

const planFromCsv = (csvRows: string[][], existing: Institution[]) => {
	const [headers, ...rows] = csvRows;
	const columns = resolveImportColumns(headers, translators);
	if (!columns.ok) throw new Error(`Unexpected column error: ${columns.error}`);
	return {
		locale: columns.locale,
		plan: planInstitutionImport({
			headers,
			keys: columns.keys,
			rows,
			t: translators[columns.locale],
			lookups,
			existingById: new Map(existing.map((item) => [item.id, item])),
		}),
	};
};

const setCell = (csvRows: string[][], header: string, value: string) => {
	const index = csvRows[0].indexOf(header);
	expect(index).toBeGreaterThanOrEqual(0);
	csvRows[1][index] = value;
};

describe("resolveImportColumns", () => {
	it("detects the export locale from the translated headers", () => {
		const [headers] = exportCsv([makeInstitution()], "en");
		const result = resolveImportColumns(headers, translators);
		expect(result).toMatchObject({ ok: true, locale: "en" });
	});

	it("rejects unknown and missing columns", () => {
		expect(resolveImportColumns(["ID", "Foo"], translators)).toEqual({
			ok: false,
			error: "unknownColumns",
			columns: ["Foo"],
		});
		expect(resolveImportColumns(["ID"], translators)).toMatchObject({
			ok: false,
			error: "missingColumns",
		});
	});
});

describe("planInstitutionImport", () => {
	it("treats an unmodified export as unchanged", () => {
		const institution = makeInstitution();
		const { plan } = planFromCsv(exportCsv([institution]), [institution]);
		expect(plan).toEqual({
			creates: [],
			updates: [],
			unchangedCount: 1,
			issues: [],
		});
	});

	it("only updates the columns that changed", () => {
		const institution = makeInstitution();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, "Kapazität", "95");
		setCell(csvRows, "Straße", "Neue Strasse 7a");
		setCell(csvRows, "Tags", "barrier-free; outdoor");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.issues).toEqual([]);
		expect(plan.updates).toHaveLength(1);
		const [update] = plan.updates;
		expect(update).toMatchObject({
			id: 2646,
			name: "Alpha",
			capacity: 95,
			tagIds: [10, 11],
			address: {
				id: 5,
				street: "Neue Strasse",
				street_number: "7a",
				city: "Berlin",
				lat: 52.52,
			},
		});
		expect(update).not.toHaveProperty("notes");
		expect(update.categoryIds).toBeUndefined();
	});

	it("creates rows without an ID and maps translated values back", () => {
		const csvRows = exportCsv([makeInstitution()]);
		setCell(csvRows, "ID", "");
		setCell(csvRows, "Kultureinrichtung", "Beta");

		const { plan } = planFromCsv(csvRows, []);

		expect(plan.issues).toEqual([]);
		expect(plan.creates).toHaveLength(1);
		expect(plan.creates[0]).toMatchObject({
			name: "Beta",
			owner_type: "private",
			shared_use_allowed: true,
			status: "public",
			categoryIds: [1, 2],
			tagIds: [10],
			funding_sources: [{ source_name: "state_berlin", description: "Grant" }],
			contact_person_first_name: "Ada",
		});
		expect(plan.creates[0].established_since).toEqual(
			new Date(Date.UTC(1999, 4, 1)),
		);
	});

	it("reports empty required cells, type errors and unknown IDs", () => {
		const institution = makeInstitution();
		const csvRows = exportCsv([institution, { ...institution, id: 3000 }]);
		setCell(csvRows, "Kultureinrichtung", "");
		setCell(csvRows, "Kapazität", "viele");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.creates).toEqual([]);
		expect(plan.updates).toEqual([]);
		expect(plan.issues).toEqual([
			{ row: 2, column: "Kapazität", code: "invalidNumber" },
			{ row: 3, column: "ID", code: "unknownId" },
		]);

		setCell(csvRows, "Kapazität", "80");
		const { plan: emptyNamePlan } = planFromCsv(csvRows.slice(0, 2), [
			institution,
		]);
		expect(emptyNamePlan.issues).toEqual([
			{ row: 2, column: "Kultureinrichtung", code: "emptyRequired" },
		]);
	});

	it("rejects an empty status for updates and creates", () => {
		const institution = makeInstitution();
		const updateRows = exportCsv([institution]);
		setCell(updateRows, "Status", "");
		expect(planFromCsv(updateRows, [institution]).plan.issues).toEqual([
			{ row: 2, column: "Status", code: "emptyRequired" },
		]);

		const createRows = exportCsv([institution]);
		setCell(createRows, "ID", "");
		setCell(createRows, "Status", "");
		expect(planFromCsv(createRows, []).plan.issues).toEqual([
			{ row: 2, column: "Status", code: "emptyRequired" },
		]);
	});

	it("round-trips tag and group names containing semicolons", () => {
		const institution = {
			...makeInstitution(),
			tags: [{ id: 12, name: "music; dance" }],
			groups: [{ id: 20, name: "public; private" }],
		} as Institution;
		const csvRows = exportCsv([institution]);
		setCell(csvRows, "ID", "");

		const { plan } = planFromCsv(csvRows, []);

		expect(plan.issues).toEqual([]);
		expect(plan.creates[0]).toMatchObject({
			tagIds: [12],
			groupIds: [20],
		});
	});

	it("authorizes cleared relation fields", () => {
		expect(
			buildInstitutionPermissionFields({
				id: 2646,
				name: "Alpha",
				categoryIds: [],
				tagIds: [],
				groupIds: [],
				funding_sources: [],
			} as never),
		).toEqual([
			"name",
			"categories",
			"tags",
			"groups",
			"funding_sources",
		]);
	});

	it("keeps links to inactive categories that the export does not list", () => {
		const institution = {
			...makeInstitution(),
			categories: [
				{ id: 1, key: "theater", parent_category_id: null, status: "active" },
				{ id: 3, key: "cabaret", parent_category_id: null, status: "inactive" },
			],
		} as unknown as Institution;
		// The account export only receives active categories.
		const csvRows = exportCsv([
			{
				...institution,
				categories: institution.categories.filter((c) => c.id !== 3),
			},
		]);
		const { plan: unchangedPlan } = planFromCsv(csvRows, [institution]);
		expect(unchangedPlan.unchangedCount).toBe(1);

		setCell(csvRows, "Unterkategorien", "dance");
		const { plan } = planFromCsv(csvRows, [institution]);
		expect(plan.updates[0]?.categoryIds).toEqual([1, 2, 3]);
	});
});
