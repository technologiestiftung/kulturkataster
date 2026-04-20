import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserIdMock = vi.fn<() => Promise<string | null>>();
const getAccessContextForUserMock = vi.fn();
const authorizeTableMock = vi.fn();
const authorizeFieldsMock = vi.fn();
const buildInstitutionPermissionFieldsMock = vi.fn();
const revalidateAccountMock = vi.fn();

const createMock = vi.fn();

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/server/utils/rbac", () => ({
	authorizeTable: authorizeTableMock,
	authorizeFields: authorizeFieldsMock,
	getAccessContextForUser: getAccessContextForUserMock,
	getTableScope: vi.fn(() => "all"),
}));

vi.mock("@/lib/utils/institutionPermissionUtils", () => ({
	buildInstitutionPermissionFields: buildInstitutionPermissionFieldsMock,
}));

vi.mock("@/server/data/institutionRepo", () => ({
	institutionRepo: {
		create: createMock,
	},
}));

vi.mock("@/server/utils/actionsUtils", () => ({
	revalidateAccount: revalidateAccountMock,
}));

describe("createInstitution integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getCurrentUserIdMock.mockResolvedValue("user-1");
		getAccessContextForUserMock.mockResolvedValue({ userId: "user-1" });
		buildInstitutionPermissionFieldsMock.mockReturnValue([]);
		createMock.mockResolvedValue({ id: 1, name: "LatLng only" });
	});

	it("accepts address payload with only lat/lng and no street", async () => {
		const { createInstitution } = await import("@/server/actions/institutions");

		await expect(
			createInstitution({
				name: "LatLng only",
				address: {
					lat: 52.520008,
					lng: 13.404954,
				} as never,
			}),
		).resolves.toEqual({
			ok: true,
			data: { id: 1, name: "LatLng only" },
		});

		expect(createMock).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "LatLng only",
				address: {
					create: expect.objectContaining({
						lat: 52.520008,
						lng: 13.404954,
					}),
				},
			}),
		);
		expect(revalidateAccountMock).toHaveBeenCalled();
	});

	it("maps a complete institution payload with all form fields", async () => {
		const { createInstitution } = await import("@/server/actions/institutions");

		await expect(
			createInstitution({
				name: "Full Payload Institution",
				website: "https://kultur.example",
				phone: "+49 30 123456",
				email: "kontakt@kultur.example",
				area: 150,
				number_of_rooms: 5,
				parent_organization: "Kulturverein Berlin e.V.",
				legal_form: "e.V.",
				capacity: 120,
				owner_name: "Land Berlin",
				owner_type: "state_property",
				rental_contract_type: "limited_lease",
				rental_contract_end: new Date("2030-12-31"),
				funding_type: "institutional_funding",
				funding_sources: [
					{
						source_name: "state_berlin",
						description: "Jahresfoerderung",
					},
					{
						source_name: "district",
						description: "Projektbezogen",
					},
				],
				utilization_status: "in_use",
				utilization_status_info: "Regelbetrieb",
				protection_status: "long_term_secured",
				protection_status_info: "Vertrag bis 2030",
				shared_use_allowed: true,
				shared_use_info: "Raeume tageweise nutzbar",
				shared_use_equipment: "PA, Licht, Stuehle",
				shared_use_audience: "Theater, Musik",
				shared_use_availability: "Mo-Fr 10-20 Uhr",
				shared_use_contact_person: "Max Mustermann",
				accessibility: "Rollstuhlgerecht",
				cost: "ab 50 EUR",
				established_since: new Date("2010-01-01"),
				established_until: null,
				closing_reason: null,
				notes: "Zusatzinfos",
				internal_notes: "Intern",
				status: "public",
				import_identifier: "ext-123",
				source: "manual",
				contact_person_id: 11,
				address: {
					street: "Musterstrasse",
					street_number: "12",
					address_suffix: "2. OG",
					zipcode: "10115",
					city: "Berlin",
					district: "Mitte",
					neighbourhood: "Spandauer Vorstadt",
					cultural_area: "Zentrum",
					lat: 52.52,
					lng: 13.405,
				} as never,
				categoryIds: [10, 20],
				tagIds: [30, 40],
				userIds: ["user-a", "user-b"],
				groupIds: [50, 60],
			}),
		).resolves.toEqual({
			ok: true,
			data: { id: 1, name: "LatLng only" },
		});

		expect(createMock).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Full Payload Institution",
				website: "https://kultur.example",
				phone: "+49 30 123456",
				email: "kontakt@kultur.example",
				area: 150,
				number_of_rooms: 5,
				parent_organization: "Kulturverein Berlin e.V.",
				legal_form: "e.V.",
				capacity: 120,
				owner_name: "Land Berlin",
				owner_type: "state_property",
				rental_contract_type: "limited_lease",
				funding_type: "institutional_funding",
				utilization_status: "in_use",
				utilization_status_info: "Regelbetrieb",
				protection_status: "long_term_secured",
				protection_status_info: "Vertrag bis 2030",
				shared_use_allowed: true,
				shared_use_info: "Raeume tageweise nutzbar",
				shared_use_equipment: "PA, Licht, Stuehle",
				shared_use_audience: "Theater, Musik",
				shared_use_availability: "Mo-Fr 10-20 Uhr",
				shared_use_contact_person: "Max Mustermann",
				accessibility: "Rollstuhlgerecht",
				cost: "ab 50 EUR",
				notes: "Zusatzinfos",
				internal_notes: "Intern",
				status: "public",
				import_identifier: "ext-123",
				source: "manual",
				address: {
					create: expect.objectContaining({
						street: "Musterstrasse",
						street_number: "12",
						zipcode: "10115",
						city: "Berlin",
						lat: 52.52,
						lng: 13.405,
					}),
				},
				contact_person: { connect: { id: 11 } },
				categories: { connect: [{ id: 10 }, { id: 20 }] },
				tags: { connect: [{ id: 30 }, { id: 40 }] },
				users: { connect: [{ id: "user-a" }, { id: "user-b" }] },
				groups: { connect: [{ id: 50 }, { id: 60 }] },
				funding_sources: {
					create: [
						{ source_name: "state_berlin", description: "Jahresfoerderung" },
						{ source_name: "district", description: "Projektbezogen" },
					],
				},
			}),
		);
	});
});
