import { createInstance } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import de from "@/lib/i18n/translations/de/translation.json";
import en from "@/lib/i18n/translations/en/translation.json";
import { parseCsv } from "@/lib/utils/csvUtils";
import {
	generateCSV,
	generateExcelBuffer,
	prepareDataForExport,
} from "@/lib/utils/downloadUtils";
import { parseSpreadsheet } from "@/lib/utils/spreadsheetUtils";
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
		{ id: 3, key: "cinemas", parent_category_id: null },
		{ id: 4, key: "clubs_music_venues", parent_category_id: null },
		{ id: 5, key: "cinemas_other", parent_category_id: 3 },
		{ id: 6, key: "clubs_music_venues_other", parent_category_id: 4 },
	],
	tags: [
		{ id: 10, name: "barrier-free" },
		{ id: 11, name: "outdoor" },
		{ id: 12, name: "music; dance" },
		{ id: 13, name: "Urbane Praxis" },
		{ id: 14, name: "urbane Praxis" },
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
	).rows;

const exportSpreadsheet = (institutions: Institution[], format: "xlsx") =>
	parseSpreadsheet(
		generateExcelBuffer(
			prepareDataForExport(institutions, { translateFn: translators.de }),
			format,
			translators.de,
		),
	);

const planFromCsv = (
	csvRows: string[][],
	existing: Institution[],
	rowNumbers = csvRows.slice(1).map((_, index) => index + 2),
) => {
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
			rowNumbers,
		}),
	};
};

const makeInstitutionWithCultureIndex = (): Institution => ({
	...makeInstitution(),
	culture_index: 60,
	culture_index_location: 50,
	culture_index_property: null,
	culture_index_financial: 40,
	culture_index_social_spatial: null,
	culture_index_visibility: 30,
	culture_index_global: "Offen",
});

// Headers come from the real translations, which Traduora can rename.
const NAME_HEADER = de.enumMap.field_names.name.label;

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

	it("treats an unmodified xlsx export as unchanged", () => {
		const institution = { ...makeInstitution(), notes: "x".repeat(300) };
		const { rows } = exportSpreadsheet([institution], "xlsx");
		const { plan } = planFromCsv(rows, [institution]);
		expect(plan).toMatchObject({ unchangedCount: 1, issues: [] });
	});

	it("reports spreadsheet issues at the Excel row below the notice", () => {
		const institution = makeInstitution();
		const { rows, rowNumbers } = exportSpreadsheet([institution], "xlsx");
		setCell(rows, "Kapazität", "viele");

		const { plan } = planFromCsv(rows, [institution], rowNumbers.slice(1));

		expect(rowNumbers[0]).toBe(6);
		expect(plan.issues).toEqual([
			{ row: 7, column: "Kapazität", code: "invalidNumber" },
		]);
	});

	it("reports issues at the source row after a blank row between data rows", () => {
		const alpha = makeInstitution();
		const beta = { ...makeInstitution(), id: alpha.id + 1, name: "Beta" };
		const [header, alphaRow, betaRow] = exportCsv([alpha, beta]);
		const text = [header, alphaRow, [], betaRow]
			.map((row) =>
				row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
			)
			.join("\n");
		const { rows, rowNumbers } = parseCsv(text);
		rows[2][rows[0].indexOf("Kapazität")] = "viele";

		const { plan } = planFromCsv(rows, [alpha, beta], rowNumbers.slice(1));

		expect(plan.issues).toEqual([
			{ row: 4, column: "Kapazität", code: "invalidNumber" },
		]);
	});

	it("imports culture index dimensions as scores and text", () => {
		const institution = makeInstitutionWithCultureIndex();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, "Standort und Vertragsdimension", "72,5");
		setCell(csvRows, "Sichtbarkeits- und Öffentlichkeitsdimension", "0");
		setCell(csvRows, "Globale Einschätzungen", "Stabil");

		const { plan: unchanged } = planFromCsv(exportCsv([institution]), [
			institution,
		]);
		expect(unchanged).toMatchObject({ unchangedCount: 1, issues: [] });

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.issues).toEqual([]);
		const [{ form: update, permissionFields }] = plan.updates;
		expect(update).toMatchObject({
			culture_index_location: 72.5,
			culture_index_visibility: 0,
			culture_index_global: "Stabil",
		});
		expect(permissionFields).toEqual([
			"culture_index_location",
			"culture_index_visibility",
			"culture_index_global",
		]);
	});

	it("reports culture index dimension scores that are not numbers", () => {
		const institution = makeInstitutionWithCultureIndex();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, "Finanz- und Betriebsdimension", "hoch");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.issues).toEqual([
			{
				row: 2,
				column: "Finanz- und Betriebsdimension",
				code: "invalidNumber",
			},
		]);
	});

	it("reports a culture index that is not a whole number", () => {
		const institution = makeInstitutionWithCultureIndex();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, "Kulturort-Index", "20,5");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.issues).toEqual([
			{ row: 2, column: "Kulturort-Index", code: "invalidInteger" },
		]);
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
		const [{ form: update, permissionFields }] = plan.updates;
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
		expect(permissionFields).toEqual(["capacity", "address.street", "tags"]);
	});

	it("creates rows without an ID and maps translated values back", () => {
		const csvRows = exportCsv([makeInstitution()]);
		setCell(csvRows, "ID", "");
		setCell(csvRows, NAME_HEADER, "Beta");

		const { plan } = planFromCsv(csvRows, []);

		expect(plan.issues).toEqual([]);
		expect(plan.creates).toHaveLength(1);
		expect(plan.creates[0].form).toMatchObject({
			name: "Beta",
			owner_type: "private",
			shared_use_allowed: true,
			status: "public",
			categoryIds: [1, 2],
			tagIds: [10],
			funding_sources: [{ source_name: "state_berlin", description: "Grant" }],
			contact_person_first_name: "Ada",
		});
		expect(plan.creates[0].form.established_since).toEqual(
			new Date(Date.UTC(1999, 4, 1)),
		);
	});

	it("reports empty required cells, type errors and unknown IDs", () => {
		const institution = makeInstitution();
		const csvRows = exportCsv([institution, { ...institution, id: 3000 }]);
		setCell(csvRows, NAME_HEADER, "");
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
			{ row: 2, column: NAME_HEADER, code: "emptyRequired" },
		]);
	});

	it("rejects data rows whose column count differs from the header", () => {
		const institution = makeInstitution();
		const [headers, row] = exportCsv([institution]);
		const { plan } = planFromCsv(
			[headers, row.slice(0, 2), [...row, "extra"]],
			[institution],
		);

		expect(plan.creates).toEqual([]);
		expect(plan.updates).toEqual([]);
		expect(plan.issues).toEqual([
			{ row: 2, column: "ID", code: "columnCountMismatch" },
			{ row: 3, column: "ID", code: "columnCountMismatch" },
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
		expect(plan.creates[0].form).toMatchObject({
			tagIds: [12],
			groupIds: [20],
		});
	});

	it("authorizes cleared relation columns on updates", () => {
		const institution = makeInstitution();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, "Tags", "");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.updates[0]?.permissionFields).toEqual(["tags"]);
	});

	it("keeps the exact spelling when tags differ only in case", () => {
		const institution = makeInstitution();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, "Tags", "urbane Praxis; Urbane Praxis");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.issues).toEqual([]);
		expect(plan.updates[0]?.form.tagIds).toEqual([14, 13]);
	});

	it("names every tag in a cell that does not exist", () => {
		const institution = makeInstitution();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, "Tags", "Jazz; barrier-free; music; dance; Folk");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.issues).toEqual([
			{ row: 2, column: "Tags", code: "unknownTag", values: ["Jazz", "Folk"] },
		]);
	});

	it("resolves duplicate subcategory labels within the selected parent", () => {
		const csvRows = exportCsv([makeInstitution()]);
		setCell(csvRows, "ID", "");
		setCell(csvRows, "Kategorien", "Kinos");
		setCell(csvRows, "Unterkategorien", "Ohne Unterkategorie");

		const { plan } = planFromCsv(csvRows, []);

		expect(plan.issues).toEqual([]);
		expect(plan.creates[0]?.form.categoryIds).toEqual([3, 5]);
	});

	it("reports a subcategory label that remains ambiguous", () => {
		const csvRows = exportCsv([makeInstitution()]);
		setCell(csvRows, "ID", "");
		const categoriesIndex = csvRows[0].indexOf("Kategorien");
		const subcategoriesIndex = csvRows[0].indexOf("Unterkategorien");
		csvRows[0].splice(categoriesIndex, 1);
		csvRows[1].splice(categoriesIndex, 1);
		const shiftedSubcategoriesIndex =
			subcategoriesIndex > categoriesIndex
				? subcategoriesIndex - 1
				: subcategoriesIndex;
		csvRows[1][shiftedSubcategoriesIndex] = "Ohne Unterkategorie";

		const { plan } = planFromCsv(csvRows, []);

		expect(plan.creates).toEqual([]);
		expect(plan.issues).toEqual([
			{
				row: 2,
				column: "Unterkategorien",
				code: "unknownCategory",
				values: ["Ohne Unterkategorie"],
			},
		]);
	});

	it("resolves a subcategory label shared by two selected parents", () => {
		const csvRows = exportCsv([makeInstitution()]);
		setCell(csvRows, "ID", "");
		setCell(csvRows, "Kategorien", "Kinos; Clubs und Musikspielstätten");
		setCell(
			csvRows,
			"Unterkategorien",
			"Ohne Unterkategorie; Ohne Unterkategorie",
		);

		const { plan } = planFromCsv(csvRows, []);

		expect(plan.issues).toEqual([]);
		expect(plan.creates[0]?.form.categoryIds).toEqual([3, 4, 5, 6]);
	});

	it("round-trips a shared subcategory label qualified with its parent", () => {
		const institution = {
			...makeInstitution(),
			categories: [
				{ id: 3, key: "cinemas", parent_category_id: null },
				{ id: 4, key: "clubs_music_venues", parent_category_id: null },
				{ id: 5, key: "cinemas_other", parent_category_id: 3 },
			],
		} as Institution;
		const csvRows = exportCsv([institution]);
		const subcategoriesIndex = csvRows[0].indexOf("Unterkategorien");
		expect(csvRows[1][subcategoriesIndex]).toBe("Ohne Unterkategorie (Kinos)");
		expect(planFromCsv(csvRows, [institution]).plan).toMatchObject({
			unchangedCount: 1,
			issues: [],
		});

		setCell(csvRows, "ID", "");
		const { plan } = planFromCsv(csvRows, []);

		expect(plan.issues).toEqual([]);
		expect(plan.creates[0]?.form.categoryIds).toEqual([3, 4, 5]);
	});

	it("keeps unique subcategory labels plain in the export", () => {
		const csvRows = exportCsv([makeInstitution()]);
		const subcategoriesIndex = csvRows[0].indexOf("Unterkategorien");
		expect(csvRows[1][subcategoriesIndex]).toBe("dance");
	});

	it("mixes qualified and plain subcategory labels in one cell", () => {
		const csvRows = exportCsv([makeInstitution()]);
		setCell(csvRows, "ID", "");
		setCell(csvRows, "Kategorien", "Theater; Kinos; Clubs und Musikspielstätten");
		setCell(
			csvRows,
			"Unterkategorien",
			"ohne unterkategorie (clubs und musikspielstätten); dance",
		);

		const { plan } = planFromCsv(csvRows, []);

		expect(plan.issues).toEqual([]);
		expect(plan.creates[0]?.form.categoryIds).toEqual([1, 3, 4, 6, 2]);
	});

	it("reports a qualified subcategory label with an unknown parent", () => {
		const csvRows = exportCsv([makeInstitution()]);
		setCell(csvRows, "ID", "");
		setCell(csvRows, "Kategorien", "Kinos; Clubs und Musikspielstätten");
		setCell(csvRows, "Unterkategorien", "Ohne Unterkategorie (Oper)");

		const { plan } = planFromCsv(csvRows, []);

		expect(plan.creates).toEqual([]);
		expect(plan.issues).toEqual([
			{
				row: 2,
				column: "Unterkategorien",
				code: "unknownCategory",
				values: ["Ohne Unterkategorie (Oper)"],
			},
		]);
	});

	it("rejects an unchanged child after its parent changes", () => {
		const institution = makeInstitution();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, "Kategorien", "Kinos");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.updates).toEqual([]);
		expect(plan.issues).toEqual([
			{
				row: 2,
				column: "Unterkategorien",
				code: "unknownCategory",
				values: ["dance"],
			},
		]);
	});

	it("keeps semicolons inside funding descriptions", () => {
		const institution = {
			...makeInstitution(),
			funding_sources: [
				{ id: 20, source_name: "state_berlin", description: "Grant; phase 2" },
			],
		} as Institution;
		const csvRows = exportCsv([institution]);
		setCell(csvRows, "ID", "");

		const { plan } = planFromCsv(csvRows, []);

		expect(plan.issues).toEqual([]);
		expect(plan.creates[0]?.form.funding_sources).toEqual([
			{ source_name: "state_berlin", description: "Grant; phase 2" },
		]);
	});

	it("splits multiple known funding sources", () => {
		const institution = {
			...makeInstitution(),
			funding_sources: [
				{ id: 20, source_name: "state_berlin", description: "Grant" },
				{ id: 21, source_name: "federal", description: null },
			],
		} as Institution;
		const csvRows = exportCsv([institution]);
		setCell(csvRows, "ID", "");

		const { plan } = planFromCsv(csvRows, []);

		expect(plan.issues).toEqual([]);
		expect(plan.creates[0]?.form.funding_sources).toEqual([
			{ source_name: "state_berlin", description: "Grant" },
			{ source_name: "federal", description: null },
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
		expect(plan.updates[0]?.form.categoryIds).toEqual([1, 2, 3]);
	});
});

describe("import coordinates", () => {
	const LAT_HEADER = de.enumMap.field_names.lat.label;
	const LNG_HEADER = de.enumMap.field_names.lng.label;

	it("keeps saved coordinates when the coordinate cells are empty", () => {
		const institution = makeInstitution();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, LAT_HEADER, "");
		setCell(csvRows, LNG_HEADER, "");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.issues).toEqual([]);
		expect(plan.unchangedCount).toBe(1);
	});

	it("treats coordinates written with a decimal comma as unchanged", () => {
		const institution = makeInstitution();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, LAT_HEADER, "52,52");
		setCell(csvRows, LNG_HEADER, "13,40500000001");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.unchangedCount).toBe(1);
	});
});

describe("import coordinates: guards", () => {
	const LAT_HEADER = de.enumMap.field_names.lat.label;
	const LNG_HEADER = de.enumMap.field_names.lng.label;

	it("writes a coordinate that moved beyond the tolerance", () => {
		const institution = makeInstitution();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, LAT_HEADER, "52,5201");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.issues).toEqual([]);
		expect(plan.updates).toHaveLength(1);
		expect(plan.updates[0]?.form.address).toMatchObject({ lat: 52.5201 });
		expect(plan.updates[0]?.permissionFields).toEqual(["address.lat"]);
	});

	it("writes coordinates for a saved place that had none", () => {
		const institution = makeInstitution();
		const withoutCoords = {
			...institution,
			address: { ...institution.address, lat: null, lng: null },
		} as unknown as Institution;
		// The export drops all-empty columns, so start from a file that has them.
		const csvRows = exportCsv([institution]);
		setCell(csvRows, LAT_HEADER, "52.5");
		setCell(csvRows, LNG_HEADER, "13.4");

		const { plan } = planFromCsv(csvRows, [withoutCoords]);

		expect(plan.updates).toHaveLength(1);
		expect(plan.updates[0]?.form.address).toMatchObject({
			lat: 52.5,
			lng: 13.4,
		});
	});

	it("reports an unparsable coordinate instead of ignoring it", () => {
		const institution = makeInstitution();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, LAT_HEADER, "north");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.updates).toHaveLength(0);
		expect(plan.issues.length).toBeGreaterThan(0);
	});

	it("keeps saved coordinates when only the address changes and cells are empty", () => {
		const institution = makeInstitution();
		const csvRows = exportCsv([institution]);
		setCell(csvRows, "Straße", "Neue Strasse 7a");
		setCell(csvRows, LAT_HEADER, "");
		setCell(csvRows, LNG_HEADER, "");

		const { plan } = planFromCsv(csvRows, [institution]);

		expect(plan.updates).toHaveLength(1);
		expect(plan.updates[0]?.permissionFields).toEqual(["address.street"]);
		expect(plan.updates[0]?.form.address).toMatchObject({
			lat: 52.52,
			lng: 13.405,
		});
	});
});
