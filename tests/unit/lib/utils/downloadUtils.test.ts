import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx-js-style";
import {
	DEFAULT_INSTITUTION_EXPORT_COLUMN_ORDER,
	generateExcelBuffer,
	prepareDataForExport,
} from "@/lib/utils/downloadUtils";
import type { Institution } from "@/types";

const makeInstitution = (): Institution =>
	({
		id: 2646,
		name: "Alpha",
		status: "public",
		email: "alpha@example.de",
		phone: "+49 30 123456",
		website: "https://example.de",
		notes: "Some notes",
		address: {
			street: "Musterstrasse",
			street_number: "12",
			zipcode: "10115",
			city: "Berlin",
			district: "Mitte",
			neighbourhood: "Spandauer Vorstadt",
		},
		contact_person: {
			first_name: "Ada",
			last_name: "Lovelace",
			email: "ada@example.de",
			phone: "+49 30 654321",
		},
		categories: [
			{ id: 1, key: "theater", parent_category_id: null },
			{ id: 2, key: "dance", parent_category_id: 1 },
		],
		tags: [{ id: 10, name: "barrier-free" }],
		funding_sources: [{ id: 20, source_name: "state", description: "Grant" }],
	}) as unknown as Institution;

describe("prepareDataForExport", () => {
	it("flattens the nested prisma institution shape for export", () => {
		const rows = prepareDataForExport([makeInstitution()], {
			readablePermissionFields: [
				"name",
				"status",
				"website",
				"notes",
				"address",
				"contact_person",
				"categories",
				"tags",
				"funding_sources",
			],
			audience: "internal",
		});

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			Name: "Alpha",
			Status: "public",
			Website: "https://example.de",
			Street: "Musterstrasse 12",
			Zipcode: "10115",
			City: "Berlin",
			District: "Mitte",
			Neighbourhood: "Spandauer Vorstadt",
			"Contact Person First Name": "Ada",
			"Contact Person Last Name": "Lovelace",
			Categories: "theater",
			Subcategories: "dance",
			Tags: "barrier-free",
			"Funding Sources": "state: Grant",
		});
	});

	it("filters export fields by guest permissions and excludes email and phone", () => {
		const rows = prepareDataForExport([makeInstitution()], {
			readablePermissionFields: [
				"name",
				"email",
				"phone",
				"website",
				"address",
				"contact_person",
			],
			audience: "guest",
		});

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			Name: "Alpha",
			Website: "https://example.de",
			Street: "Musterstrasse 12",
			Zipcode: "10115",
			City: "Berlin",
			District: "Mitte",
			Neighbourhood: "Spandauer Vorstadt",
			"Contact Person First Name": "Ada",
			"Contact Person Last Name": "Lovelace",
		});
		expect(rows[0]).not.toHaveProperty("Email");
		expect(rows[0]).not.toHaveProperty("Phone");
		expect(rows[0]).not.toHaveProperty("Contact Person Email");
		expect(rows[0]).not.toHaveProperty("Contact Person Phone");
	});

	it("uses the shared field option translation logic for enums", () => {
		const rows = prepareDataForExport(
			[
				{
					...makeInstitution(),
					owner_type: "federal_property",
					funding_type: "workspace_program",
					utilization_status: "temporarily_closed",
					shared_use_allowed: true,
					funding_sources: [
						{
							id: 20,
							source_name: "workspace_program",
							description: "Grant",
						},
					],
				} as Institution,
			],
			{
				readablePermissionFields: [
					"name",
					"status",
					"categories",
					"funding_sources",
					"funding_type",
					"owner_type",
					"utilization_status",
					"shared_use_allowed",
				],
				audience: "internal",
				translateFn: (key) =>
					(
						({
							"enumMap.field_names.name.label": "Name",
							"enumMap.field_names.subcategories.label": "Unterkategorien",
							"enumMap.institution_status.public": "Öffentlich",
							"enumMap.category.theater": "Theater",
							"enumMap.category.dance": "Tanz",
							"enumMap.field_names.funding_type.options.workspace_program":
								"Arbeitsraumprogramm",
							"enumMap.field_names.funding_source.options.workspace_program":
								"Arbeitsraumprogramm",
							"enumMap.field_names.owner_type.options.federal_property": "Bund",
							"enumMap.field_names.utilization_status.options.temporarily_closed":
								"Vorübergehend geschlossen",
							"enumMap.field_names.shared_use_allowed.options.yes": "Ja",
						}) as Record<string, string>
					)[key] ?? key,
			},
		);

		expect(rows[0]).toMatchObject({
			Name: "Alpha",
			Status: "Öffentlich",
			Categories: "Theater",
			Unterkategorien: "Tanz",
			"Funding Sources": "Arbeitsraumprogramm: Grant",
			"Funding Type": "Arbeitsraumprogramm",
			"Owner Type": "Bund",
			"Utilization Status": "Vorübergehend geschlossen",
			"Shared Use Allowed": "Ja",
		});
	});

	it("translates funding source option values like state_berlin", () => {
		const rows = prepareDataForExport(
			[
				{
					...makeInstitution(),
					funding_sources: [
						{
							id: 20,
							source_name: "state_berlin",
							description: "Grant",
						},
					],
				} as Institution,
			],
			{
				readablePermissionFields: ["funding_sources"],
				audience: "internal",
				translateFn: (key) =>
					(
						({
							"enumMap.field_names.funding_sources.label":
								"Finanzierungsquellen",
							"enumMap.field_names.funding_source.options.state_berlin":
								"Land Berlin",
						}) as Record<string, string>
					)[key] ?? key,
			},
		);

		expect(rows[0]).toMatchObject({
			Finanzierungsquellen: "Land Berlin: Grant",
		});
	});

	it("formats exported date values as dd.mm.yyyy", () => {
		const rows = prepareDataForExport(
			[
				{
					...makeInstitution(),
					established_since: "2020-12-01T00:00:00.000Z",
					established_until: "2025-01-31",
					rental_contract_end: new Date("2030-06-15T00:00:00.000Z"),
				} as Institution,
			],
			{
				readablePermissionFields: [
					"established_since",
					"established_until",
					"rental_contract_end",
				],
				audience: "internal",
				translateFn: (key) =>
					(
						({
							"enumMap.field_names.established_since.label":
								"Bestehen am Standort seit",
							"enumMap.field_names.established_until.label":
								"Bestehen am Standort bis",
							"enumMap.field_names.rental_contract_end.label": "Vertragsende",
						}) as Record<string, string>
					)[key] ?? key,
			},
		);

		expect(rows[0]).toMatchObject({
			"Bestehen am Standort seit": "01.12.2020",
			"Bestehen am Standort bis": "31.01.2025",
			Vertragsende: "15.06.2030",
		});
	});

	it("excludes internal-only metadata and keeps utilization status details ordered", () => {
		const rows = prepareDataForExport(
			[
				{
					...makeInstitution(),
					utilization_status: "temporarily_closed",
					utilization_status_info: "Temporarily under renovation",
					utilization_status_internal_notes: "Internal follow-up",
					groups: [{ id: 3, name: "Group A" }],
					users: [{ id: "user-1", name: "User A" }],
					contact_person: {
						id: 17,
						first_name: "Ada",
						last_name: "Lovelace",
						email: "ada@example.de",
						phone: "+49 30 654321",
					},
					import_identifier: "legacy-import-42",
					created_at: new Date("2025-01-01T00:00:00.000Z"),
					updated_at: new Date("2025-01-02T00:00:00.000Z"),
				} as unknown as Institution,
			],
			{
				readablePermissionFields: [
					"status",
					"utilization_status",
					"utilization_status_info",
					"utilization_status_internal_notes",
					"groups",
					"users",
					"contact_person",
					"import_identifier",
					"created_at",
					"updated_at",
				],
				audience: "internal",
				columnOrder: [...DEFAULT_INSTITUTION_EXPORT_COLUMN_ORDER],
			},
		);

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			Status: "public",
			"Utilization Status": "temporarily_closed",
			"Utilization Status Info": "Temporarily under renovation",
			"Utilization Status Internal Notes": "Internal follow-up",
			"Contact Person First Name": "Ada",
			"Contact Person Last Name": "Lovelace",
		});
		expect(rows[0]).not.toHaveProperty("Groups");
		expect(rows[0]).not.toHaveProperty("Users");
		expect(rows[0]).not.toHaveProperty("Contact Person Id");
		expect(rows[0]).not.toHaveProperty("Import Identifier");
		expect(rows[0]).not.toHaveProperty("Created At");
		expect(rows[0]).not.toHaveProperty("Updated At");
		expect(Object.keys(rows[0])).toEqual([
			"Status",
			"Utilization Status",
			"Utilization Status Info",
			"Utilization Status Internal Notes",
			"Contact Person First Name",
			"Contact Person Last Name",
		]);
	});
});

describe("generateExcelBuffer", () => {
	it("adds the Kulturkataster notice above the exported table", () => {
		const buffer = generateExcelBuffer(
			[
				{
					Status: "Öffentlich",
					ID: "2646",
					Kulturort: "Alpha",
					Webseite: "https://example.de",
				},
			],
			"xlsx",
		);
		const workbook = XLSX.read(buffer, { type: "array", cellStyles: true });
		const worksheet = workbook.Sheets.Kulturorte;

		expect(worksheet.A1?.v).toBe(
			"Die Daten stammen vom Berliner Kulturkataster.",
		);
		expect(worksheet.A2?.v).toBe(
			"Bitte benennen Sie bei Verwendung das Kulturkataster als Download-Quelle und beachten Sie die rechtlichen Hinweise.",
		);
		expect(worksheet.A3?.v).toBe("www.kulturkataster.berlin");
		expect(worksheet.A4?.v).toBe("Ein Projekt der Kulturraum Berlin gGmbH");
		expect(worksheet.A1?.l).toBeUndefined();
		expect(worksheet.A2?.l).toBeUndefined();
		expect(worksheet.A3?.l?.Target).toBe("https://www.kulturkataster.berlin");
		expect(worksheet.A4?.l).toBeUndefined();
		expect(worksheet.A6?.v).toBe("Status");
		expect(worksheet.B6?.v).toBe("ID");
		expect(worksheet.A7?.v).toBe("Öffentlich");
		expect(worksheet.D7?.v).toBe("https://example.de");
		expect(worksheet.D7?.l?.Target).toBe("https://example.de");
		expect(worksheet["!merges"]).toEqual(
			expect.arrayContaining([
				{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
				{ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
				{ s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
				{ s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
			]),
		);
		expect(worksheet["!cols"]?.[0]?.wch).toBeGreaterThanOrEqual(30);
	});

	it("uses translated Kulturkataster notice rows when provided", () => {
		const translateFn = (
			key: string,
			options?: Record<string, unknown>,
		): string => {
			if (key === "common.download.exportNotice.row1") return "Translated 1";
			return String(options?.defaultValue ?? key);
		};

		const buffer = generateExcelBuffer(
			[
				{
					Status: "Public",
				},
			],
			"xlsx",
			translateFn,
		);
		const workbook = XLSX.read(buffer, { type: "array", cellStyles: true });
		const worksheet = workbook.Sheets.Kulturorte;

		expect(worksheet.A1?.v).toBe("Translated 1");
		expect(worksheet.A2?.v).toBe(
			"Bitte benennen Sie bei Verwendung das Kulturkataster als Download-Quelle und beachten Sie die rechtlichen Hinweise.",
		);
	});
});
