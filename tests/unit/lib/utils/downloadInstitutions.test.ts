import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getDownloadReadableFieldsMock } = vi.hoisted(() => ({
	getDownloadReadableFieldsMock: vi.fn(),
}));

vi.mock("@/server/actions/permissions", () => ({
	getDownloadReadableFields: getDownloadReadableFieldsMock,
}));

import { downloadInstitutions } from "@/lib/utils/downloadUtils";
import type { Institution } from "@/types";

const makeInstitution = (): Institution =>
	({
		id: 2646,
		name: "Alpha",
		status: "public",
		email: "alpha@example.de",
		phone: "+49 30 123456",
		address: {
			street: "Musterstrasse",
			street_number: "12",
			zipcode: "10115",
			city: "Berlin",
		},
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

		URL.createObjectURL = vi.fn((blob: { text: () => Promise<string> }) => {
			blobArg = blob;
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
			readableFields: ["name", "email", "phone", "address"],
			audience: "internal",
		});

		await downloadInstitutions({
			data: [makeInstitution()],
			filename: "kulturorte",
			format: "csv",
			translateFn: (key) =>
				(
					({
						"field_names.name.label": "Name",
						"field_names.email.label": "E-Mail",
						"field_names.phone.label": "Telefon",
						"field_names.street.label": "Straße",
						"field_names.zipcode.label": "PLZ",
						"field_names.city.label": "Ort",
					}) as Record<string, string>
				)[key] ?? key,
		});

		expect(getDownloadReadableFieldsMock).toHaveBeenCalledWith("institution");
		const csv = await blobArg?.text();
		expect(csv).toContain("E-Mail");
		expect(csv).toContain("Telefon");
		expect(csv).toContain("alpha@example.de");
	});

	it("still restricts guest downloads to guest-readable fields", async () => {
		getDownloadReadableFieldsMock.mockResolvedValue({
			readableFields: ["name", "address"],
			audience: "guest",
		});

		await downloadInstitutions({
			data: [makeInstitution()],
			filename: "kulturorte",
			format: "csv",
			translateFn: (key) =>
				(
					({
						"field_names.name.label": "Name",
						"field_names.email.label": "E-Mail",
						"field_names.phone.label": "Telefon",
						"field_names.street.label": "Straße",
						"field_names.zipcode.label": "PLZ",
						"field_names.city.label": "Ort",
					}) as Record<string, string>
				)[key] ?? key,
		});

		const csv = await blobArg?.text();
		expect(csv).not.toContain("E-Mail");
		expect(csv).not.toContain("Telefon");
		expect(csv).not.toContain("alpha@example.de");
	});
});
