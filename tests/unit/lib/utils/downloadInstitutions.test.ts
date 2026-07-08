import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getDownloadReadableFieldsMock } = vi.hoisted(() => ({
	getDownloadReadableFieldsMock: vi.fn(),
}));

vi.mock("@/server/actions/permissions", () => ({
	getDownloadReadableFields: getDownloadReadableFieldsMock,
}));

import { downloadInstitutions } from "@/lib/utils/downloadUtils";
import type { Institution } from "@/types";

const makeInstitution = (overrides: Partial<Institution> = {}): Institution =>
	({
		id: 2646,
		name: "Alpha",
		status: "public",
		email: "alpha@example.de",
		phone: "+49 30 000000",
		address: {
			street: "Musterstrasse",
			street_number: "12",
			zipcode: "10115",
			city: "Berlin",
		},
		...overrides,
	}) as unknown as Institution;

describe("downloadInstitutions permission resolution", () => {
	let blobArg: { text: () => Promise<string> } | null;
	let OriginalBlob: typeof Blob;

	beforeEach(() => {
		getDownloadReadableFieldsMock.mockReset();
		blobArg = null;
		OriginalBlob = globalThis.Blob;

		class MockBlob {
			private content: string;

			constructor(parts: unknown[]) {
				this.content = parts.map((part) => String(part)).join("");
			}

			async text() {
				return this.content;
			}
		}

		// @ts-expect-error - test-only blob shim
		globalThis.Blob = MockBlob;

		URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
			if ("text" in blob) {
				blobArg = blob;
			}
			return "blob:test";
		});
		URL.revokeObjectURL = vi.fn();

		HTMLAnchorElement.prototype.click = vi.fn();
	});

	afterEach(() => {
		globalThis.Blob = OriginalBlob;
	});

	it("uses internal readable fields for logged-in downloads", async () => {
		getDownloadReadableFieldsMock.mockResolvedValue({
			readableFields: [
				"name",
				"email",
				"phone",
				"address.street",
				"address.zipcode",
				"address.city",
			],
			guestReadableFields: ["name"],
			columnFields: [
				"name",
				"email",
				"phone",
				"address.street",
				"address.zipcode",
				"address.city",
			],
			audience: "internal",
			internalInstitutionIds: null,
		});

		await downloadInstitutions({
			data: [makeInstitution()],
			filename: "kulturorte",
			format: "csv",
			translateFn: (key) =>
				(
					({
						"enumMap.field_names.name.label": "Name",
						"enumMap.field_names.email.label": "E-Mail",
						"enumMap.field_names.phone.label": "Telefon",
						"enumMap.field_names.street.label": "Straße",
						"enumMap.field_names.zipcode.label": "PLZ",
						"enumMap.field_names.city.label": "Ort",
					}) as Record<string, string>
				)[key] ?? key,
		});

		expect(getDownloadReadableFieldsMock).toHaveBeenCalledWith("institution", [
			2646,
		]);
		const csv = await blobArg?.text();
		expect(csv).toContain("E-Mail");
		expect(csv).toContain("Telefon");
		expect(csv).toContain("alpha@example.de");
	});

	it("resolves address and contact person subfields independently for downloads", async () => {
		getDownloadReadableFieldsMock.mockResolvedValue({
			readableFields: ["name", "address.city", "contact_person.email"],
			guestReadableFields: ["name"],
			columnFields: ["name", "address.city", "contact_person.email"],
			audience: "internal",
			internalInstitutionIds: null,
		});

		await downloadInstitutions({
			data: [
				makeInstitution({
					contact_person: {
						first_name: "Ada",
						last_name: "Lovelace",
						email: "ada@example.de",
						phone: "+49 30 654321",
					},
				} as Partial<Institution>),
			],
			filename: "kulturorte",
			format: "csv",
			translateFn: (key) =>
				(
					({
						"enumMap.field_names.name.label": "Name",
						"enumMap.field_names.city.label": "Ort",
						"enumMap.field_names.contact_person_email.label":
							"Ansprechperson E-Mail",
					}) as Record<string, string>
				)[key] ?? key,
		});

		const csv = await blobArg?.text();
		expect(csv?.replace(/^\uFEFF/, "").split("\r\n")[0]).toBe(
			'"Name","Ort","Ansprechperson E-Mail"',
		);
		expect(csv).toContain('"Alpha","Berlin","ada@example.de"');
		expect(csv).not.toContain("Musterstrasse");
		expect(csv).not.toContain("+49 30 654321");
	});

	it("still restricts guest downloads to guest-readable fields", async () => {
		getDownloadReadableFieldsMock.mockResolvedValue({
			readableFields: ["name", "address.street"],
			guestReadableFields: ["name", "address.street"],
			columnFields: ["name", "address.street"],
			audience: "guest",
			internalInstitutionIds: [],
		});

		await downloadInstitutions({
			data: [makeInstitution()],
			filename: "kulturorte",
			format: "csv",
			translateFn: (key) =>
				(
					({
						"enumMap.field_names.name.label": "Name",
						"enumMap.field_names.email.label": "E-Mail",
						"enumMap.field_names.phone.label": "Telefon",
						"enumMap.field_names.street.label": "Straße",
						"enumMap.field_names.zipcode.label": "PLZ",
						"enumMap.field_names.city.label": "Ort",
					}) as Record<string, string>
				)[key] ?? key,
		});

		const csv = await blobArg?.text();
		expect(csv).not.toContain("E-Mail");
		expect(csv).not.toContain("Telefon");
		expect(csv).not.toContain("alpha@example.de");
	});

	it("falls back to guest fields for institutions outside the user's scope", async () => {
		getDownloadReadableFieldsMock.mockResolvedValue({
			readableFields: ["name", "email"],
			guestReadableFields: ["name"],
			columnFields: ["name", "email"],
			audience: "internal",
			internalInstitutionIds: [2646],
		});

		await downloadInstitutions({
			data: [
				makeInstitution(),
				makeInstitution({
					id: 9999,
					name: "Beta",
					email: "beta@example.de",
				} as Partial<Institution>),
			],
			filename: "kulturorte",
			format: "csv",
			translateFn: (key) =>
				(
					({
						"enumMap.field_names.name.label": "Name",
						"enumMap.field_names.email.label": "E-Mail",
					}) as Record<string, string>
				)[key] ?? key,
		});

		expect(getDownloadReadableFieldsMock).toHaveBeenCalledWith(
			"institution",
			[2646, 9999],
		);
		const csv = await blobArg?.text();
		expect(csv?.replace(/^\uFEFF/, "").split("\r\n")[0]).toBe(
			'"Name","E-Mail"',
		);
		expect(csv).toContain('"Alpha","alpha@example.de"');
		expect(csv).toContain('"Beta",""');
		expect(csv).not.toContain("beta@example.de");
	});
});
