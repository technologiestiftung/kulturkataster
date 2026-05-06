import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";
import {
	createInstitution,
	updateInstitution,
} from "@/server/actions/institutions";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

const closeModalMock = vi.fn();
const addInstitutionMock = vi.fn();
const upsertInstitutionMock = vi.fn();
let mockAccountCategories: Array<Record<string, unknown>> = [];
let mockInstitutionStoreCategories: Array<Record<string, unknown>> | null = null;
let lastFormConfig: {
	onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
	onChange?: (data: Record<string, unknown>) => void;
	fields?: Array<Record<string, unknown>>;
} | null = null;

const findFieldByName = (
	fields: Array<Record<string, unknown>> | undefined,
	name: string,
): Record<string, unknown> | undefined => {
	if (!fields) return undefined;
	for (const field of fields) {
		if (field.name === name) return field;
		const nested = Array.isArray(field.fields)
			? findFieldByName(field.fields as Array<Record<string, unknown>>, name)
			: undefined;
		if (nested) return nested;
	}
	return undefined;
};

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key,
	}),
}));

vi.mock("@/components/Modals/useRoutedModalClose", () => ({
	useRoutedModalClose: () => closeModalMock,
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/dialog", () => ({
	DialogTitle: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/FormWrapper", () => ({
	FormWrapper: ({
		config,
	}: {
		config: {
			onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
			onChange?: (data: Record<string, unknown>) => void;
			fields?: Array<Record<string, unknown>>;
		};
	}) => {
		lastFormConfig = config;
		return (
			<div>
				<button
					type="button"
					onClick={() =>
						void config.onSubmit({
							name: "New Institution",
							parent_organization: "Kultur Trägerverein",
							source: "Bezirksamt Mitte",
							categoryIds: ["1"],
							utilization_status: "in_use",
							"address.streetLine": "Main 1",
							"address.city": "Berlin",
							"address.zip": "10115",
							"address.lat": "52.5",
							"address.lng": "13.4",
							legal_form: "e.V.",
							website: "https://example.com",
							email: "contact@example.com",
							phone: "+49 30 123",
							owner_type: "public",
							owner_name: "Eigentümer GmbH",
							rental_contract_type: "limited_lease",
							rental_contract_end: "2030-12-31",
							funding_type: "institutional_funding",
							funding_sources: [
								{
									source_name: "state_berlin",
									description: "Landesmittel",
								},
							],
							protection_status: "long_term_secured",
							protection_status_info: "Status bestätigt",
							protection_status_internal_notes:
								"Interne Hinweise zum Sicherungsstatus",
							shared_use_allowed: true,
							shared_use_info: "Raum ist grundsätzlich für Dritte nutzbar.",
							shared_use_equipment: "Tische, Stühle",
							shared_use_audience: "Proben und Lesungen",
							shared_use_availability: "Mo-Fr 10:00-18:00",
							shared_use_contact_person: "Kontakt: +49 30 222",
							accessibility: "Aufzug vorhanden",
							cost: "Miete je Nutzung",
							established_since: "2009-01-01",
							established_until: "2036-12-31",
							closing_reason: "Kein Schließungsgrund",
							area: "550",
							capacity: "320",
							number_of_rooms: "9",
							notes: "Öffentliche Notiz",
							internal_notes: "Interne Notiz",
							contact_person_first_name: "Anna",
							contact_person_last_name: "Beispiel",
							contact_person_email: "contact@example.com",
							contact_person_phone: "+49 30 654321",
						})
					}
				>
					submit-form
				</button>
			</div>
		);
	},
}));

vi.mock("@/server/actions/institutions", () => ({
	createInstitution: vi.fn(),
	updateInstitution: vi.fn(),
}));

vi.mock("@/lib/utils/feedbackToast", () => ({
	showSuccessToast: vi.fn(),
}));

vi.mock("@/lib/hooks/useInstitutionPrivateFieldResolver", () => ({
	useInstitutionPrivateFieldResolver: () => ({
		isPrivateField: () => false,
	}),
}));

vi.mock("@/lib/utils/institutionFieldAccess", () => ({
	applyInstitutionFieldAccess: ({ fields }: { fields: unknown }) => fields,
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: {
			addInstitution: (item: unknown) => void;
			upsertInstitution: (item: unknown) => void;
			institutionFieldPermissions: {
				read: string[];
				create: string[];
				update: string[];
				delete: string[];
			};
			categories: Array<Record<string, unknown>>;
		}) => unknown,
	) =>
		selector({
			addInstitution: addInstitutionMock,
			upsertInstitution: upsertInstitutionMock,
			institutionFieldPermissions: {
				read: [],
				create: [],
				update: [],
				delete: [],
			},
			categories: mockAccountCategories,
		}),
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector: (state: {
			categories: Array<Record<string, unknown>> | null;
		}) => unknown,
	) =>
		selector({
			categories: mockInstitutionStoreCategories,
		}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: vi.fn() }),
}));

const mockedCreateInstitution = vi.mocked(createInstitution);
const mockedUpdateInstitution = vi.mocked(updateInstitution);
const mockedShowSuccessToast = vi.mocked(showSuccessToast);

describe("InstitutionFormModal", () => {
	beforeEach(() => {
		closeModalMock.mockReset();
		addInstitutionMock.mockReset();
		upsertInstitutionMock.mockReset();
		mockAccountCategories = [
			{ id: 1, key: "cat-a", parent_category_id: null },
			{ id: 2, key: "cat-b", parent_category_id: 1 },
		];
		mockInstitutionStoreCategories = [
			{
				id: 1,
				key: "cat-a",
				parent_category_id: null,
				child_categories: [{ id: 2, key: "cat-b", parent_category_id: 1 }],
			},
		];
		lastFormConfig = null;
		mockedCreateInstitution.mockReset();
		mockedUpdateInstitution.mockReset();
		mockedShowSuccessToast.mockReset();

		mockedCreateInstitution.mockResolvedValue({
			ok: true,
			data: {
				id: 1,
				name: "New Institution",
			},
		} as never);
		mockedUpdateInstitution.mockResolvedValue({
			ok: true,
			data: {
				id: 2,
				name: "Updated Institution",
			},
		} as never);
	});

	it("creates a new institution", async () => {
		render(
			<InstitutionFormModal
				mode="create"
				routePath="/account/institutions/new"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "submit-form" }));

		await waitFor(() => {
			expect(mockedCreateInstitution).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "New Institution",
					categoryIds: [1],
					parent_organization: "Kultur Trägerverein",
					source: "Bezirksamt Mitte",
					utilization_status: "in_use",
					address: expect.objectContaining({
						street: "Main",
						street_number: "1",
						city: "Berlin",
						zipcode: "10115",
						lat: 52.5,
						lng: 13.4,
					}),
					website: "https://example.com",
					email: "contact@example.com",
					phone: "+49 30 123",
					legal_form: "e.V.",
					owner_type: "public",
					owner_name: "Eigentümer GmbH",
					rental_contract_type: "limited_lease",
					rental_contract_end: expect.any(Date),
					funding_type: "institutional_funding",
					funding_sources: [
						{
							source_name: "state_berlin",
							description: "Landesmittel",
						},
					],
					protection_status: "long_term_secured",
					protection_status_info: "Status bestätigt",
					protection_status_internal_notes:
						"Interne Hinweise zum Sicherungsstatus",
					shared_use_allowed: true,
					shared_use_equipment: "Tische, Stühle",
					shared_use_audience: "Proben und Lesungen",
					shared_use_availability: "Mo-Fr 10:00-18:00",
					shared_use_contact_person: "Kontakt: +49 30 222",
					accessibility: "Aufzug vorhanden",
					cost: "Miete je Nutzung",
					area: 550,
					capacity: 320,
					number_of_rooms: 9,
					notes: "Öffentliche Notiz",
					internal_notes: "Interne Notiz",
					contact_person_first_name: "Anna",
					contact_person_last_name: "Beispiel",
					contact_person_email: "contact@example.com",
					contact_person_phone: "+49 30 654321",
				}),
			);
		});
		expect(addInstitutionMock).toHaveBeenCalledTimes(1);
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
		expect(closeModalMock).toHaveBeenCalledTimes(1);
	});

	it("updates an existing institution", async () => {
		render(
			<InstitutionFormModal
				mode="edit"
				institution={
					{
						id: 2,
						name: "Existing",
						address: { id: 9 },
						categories: [],
					} as never
				}
				routePath="/account/institutions/2/edit"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "submit-form" }));

		await waitFor(() => {
			expect(mockedUpdateInstitution).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 2,
					name: "New Institution",
					parent_organization: "Kultur Trägerverein",
					source: "Bezirksamt Mitte",
					utilization_status: "in_use",
					address: expect.objectContaining({
						id: 9,
						street: "Main",
						street_number: "1",
						city: "Berlin",
						zipcode: "10115",
						lat: 52.5,
						lng: 13.4,
					}),
					website: "https://example.com",
					email: "contact@example.com",
					phone: "+49 30 123",
					legal_form: "e.V.",
					owner_type: "public",
					owner_name: "Eigentümer GmbH",
					rental_contract_type: "limited_lease",
					rental_contract_end: expect.any(Date),
					funding_type: "institutional_funding",
					funding_sources: [
						{
							source_name: "state_berlin",
							description: "Landesmittel",
						},
					],
					protection_status: "long_term_secured",
					protection_status_info: "Status bestätigt",
					protection_status_internal_notes:
						"Interne Hinweise zum Sicherungsstatus",
					shared_use_allowed: true,
					shared_use_equipment: "Tische, Stühle",
					shared_use_audience: "Proben und Lesungen",
					shared_use_availability: "Mo-Fr 10:00-18:00",
					shared_use_contact_person: "Kontakt: +49 30 222",
					accessibility: "Aufzug vorhanden",
					cost: "Miete je Nutzung",
					area: 550,
					capacity: 320,
					number_of_rooms: 9,
					notes: "Öffentliche Notiz",
					internal_notes: "Interne Notiz",
					contact_person_first_name: "Anna",
					contact_person_last_name: "Beispiel",
					contact_person_email: "contact@example.com",
					contact_person_phone: "+49 30 654321",
				}),
			);
		});
		expect(upsertInstitutionMock).toHaveBeenCalledTimes(1);
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
		expect(closeModalMock).toHaveBeenCalledTimes(1);
	});

	it("falls back to grouped account categories when the public category store is empty", () => {
		mockInstitutionStoreCategories = null;

		render(
			<InstitutionFormModal
				mode="edit"
				institution={
					{
						id: 2,
						name: "Existing",
						address: { id: 9 },
						categories: [],
					} as never
				}
				routePath="/account/institutions/2/edit"
			/>,
		);

		const categoryField = findFieldByName(lastFormConfig?.fields, "categoryFilters");

		expect(categoryField?.filterPanel).toMatchObject({
			categoryGroups: [
				{
					id: 1,
					key: "cat-a",
					child_categories: [{ id: 2, key: "cat-b", parent_category_id: 1 }],
				},
			],
		});
	});

	it("does not flag the edited institution itself as duplicate when validator receives partial form data", () => {
		render(
			<InstitutionFormModal
				mode="edit"
				institution={
					{
						id: 2,
						name: "Existing",
						address: {
							id: 9,
							street: "Main",
							street_number: "1",
							zipcode: "10115",
							city: "Berlin",
						},
						categories: [],
					} as never
				}
				routePath="/account/institutions/2/edit"
			/>,
		);

		lastFormConfig?.onChange?.({
			name: "Existing",
			"address.streetLine": "Main 1",
			"address.city": "Berlin",
			"address.zip": "10115",
		});

		const basicSection = lastFormConfig?.fields?.[0] as
			| { fields?: Array<Record<string, unknown>> }
			| undefined;
		const nameField = basicSection?.fields?.find(
			(field) => field.name === "name",
		) as
			| {
					validators?: Array<
						(
							value: unknown,
							formData: Record<string, unknown>,
						) => string | undefined
					>;
			  }
			| undefined;
		const duplicateValidator = nameField?.validators?.[0];

		expect(typeof duplicateValidator).toBe("function");
		expect(
			duplicateValidator?.("Existing", {
				name: "Existing",
				"address.streetLine": "Main 1",
				"address.city": "Berlin",
				"address.zip": "10115",
			}),
		).toBeUndefined();
	});

	it("includes protection status internal notes in the form config", () => {
		render(
			<InstitutionFormModal
				mode="create"
				routePath="/account/institutions/new"
			/>,
		);

		const field = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"protection_status_internal_notes",
		);

		expect(field).toEqual(
			expect.objectContaining({
				name: "protection_status_internal_notes",
				type: "textarea",
			}),
		);
	});

	it("shared_use_allowed field uses boolean option values, not strings", () => {
		render(
			<InstitutionFormModal
				mode="create"
				routePath="/account/institutions/new"
			/>,
		);

		const field = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"shared_use_allowed",
		);

		expect(field).toBeDefined();
		const options = field?.options as Array<{ value: unknown }> | undefined;
		expect(options).toBeDefined();
		expect(options?.map((o) => o.value)).toEqual([true, false]);
	});

	it("shared_use_allowed condition triggers on boolean true, not string", () => {
		render(
			<InstitutionFormModal
				mode="create"
				routePath="/account/institutions/new"
			/>,
		);

		const detailsSection = findFieldByName(
			lastFormConfig?.fields as Array<Record<string, unknown>> | undefined,
			"shared_use_details",
		);

		expect(detailsSection).toBeDefined();
		const condition = detailsSection?.condition as
			| ((data: Record<string, unknown>) => boolean)
			| undefined;

		expect(condition?.({ shared_use_allowed: true })).toBe(true);
		expect(condition?.({ shared_use_allowed: false })).toBe(false);
		expect(condition?.({ shared_use_allowed: "yes" })).toBe(false);
	});

	it("submits shared_use_allowed as boolean true to the server action", async () => {
		render(
			<InstitutionFormModal
				mode="create"
				routePath="/account/institutions/new"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "submit-form" }));

		await waitFor(() => {
			expect(mockedCreateInstitution).toHaveBeenCalledWith(
				expect.objectContaining({
					shared_use_allowed: true,
				}),
			);
		});
	});
});
