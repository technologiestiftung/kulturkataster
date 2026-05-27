import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InstitutionDraftEditModal } from "@/components/Institution/InstitutionDraftEditModal";
import {
	updateSubmission,
	getSubmissionById,
} from "@/server/actions/submissions";

const institutionFormModalMock = vi.fn();
const mockSubmissions: Array<Record<string, unknown>> = [];

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key.replace(/^content\./, ""),
	}),
}));

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/components/Institution/InstitutionFormModal", () => ({
	InstitutionFormModal: (props: Record<string, unknown>) => {
		institutionFormModalMock(props);
		return (
			<div>
				<button
					type="button"
					onClick={() => {
						const onSubmit = props.onSubmit as
							| ((args: { data: Record<string, unknown> }) => void)
							| undefined;
						onSubmit?.({
							data: {
								name: "Updated draft",
								"address.streetLine": "Main 1",
								"address.city": "Berlin",
								"address.zip": "10115",
								categoryFilters: {
									district_keys: [],
									category_keys: ["cat-a"],
									child_category_keys: [],
									include_closed: false,
								},
							},
						});
					}}
				>
					submit-draft
				</button>
			</div>
		);
	},
}));

vi.mock("@/components/ui/alert-dialog", () => ({
	AlertDialog: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: {
			submissions: Array<Record<string, unknown>>;
			categories: Array<Record<string, unknown>>;
			upsertSubmission: (submission: unknown) => void;
			removeSubmission: (id: number) => void;
		}) => unknown,
	) =>
		selector({
			submissions: mockSubmissions,
			categories: [{ id: 1, key: "cat-a", parent_category_id: null }],
			upsertSubmission: vi.fn(),
			removeSubmission: vi.fn(),
		}),
}));

vi.mock("@/server/actions/submissions", () => ({
	updateSubmission: vi.fn(),
	getSubmissionById: vi.fn(),
	deleteSubmission: vi.fn(),
}));

const mockedUpdateSubmission = vi.mocked(updateSubmission);
const mockedGetSubmissionById = vi.mocked(getSubmissionById);

describe("InstitutionDraftEditModal", () => {
	beforeEach(() => {
		institutionFormModalMock.mockReset();
		mockedUpdateSubmission.mockReset();
		mockedGetSubmissionById.mockReset();
		refreshMock.mockReset();
		mockSubmissions.length = 0;
		mockSubmissions.push({
			id: 11,
			entity_type: "institution",
			type: "create",
			data: {
				name: "Draft Name",
				address: { street: "Draft", street_number: "2", city: "Berlin" },
				categoryIds: [1],
			},
		});
		mockedUpdateSubmission.mockResolvedValue({ id: 11 } as never);
	});

	it("renders form modal and updates draft submission", async () => {
		render(
			<InstitutionDraftEditModal
				submissionId={11}
				routePath="/account/submissions/11/edit"
			/>,
		);

		expect(institutionFormModalMock).toHaveBeenCalledTimes(1);
		const props = institutionFormModalMock.mock.calls[0][0] as {
			routePath: string;
			closeOnSubmit: boolean;
			submitLabel: string;
		};
		expect(props.routePath).toBe("/account/submissions/11/edit");
		expect(props.closeOnSubmit).toBe(true);
		expect(props.submitLabel).toBe("institutionFormModal.actions.save");

		fireEvent.click(screen.getByRole("button", { name: "submit-draft" }));

		await waitFor(() => {
			expect(mockedUpdateSubmission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 11 }),
			);
		});
		expect(mockedUpdateSubmission).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					categoryIds: [1],
				}),
			}),
		);
	});

	it("shows not-found alert when submission does not exist", async () => {
		mockedGetSubmissionById.mockResolvedValueOnce(null);

		render(
			<InstitutionDraftEditModal
				submissionId={999}
				routePath="/account/submissions/999/edit"
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByText("institutionFormModal.dialog.notFound.title"),
			).toBeInTheDocument();
		});
	});

	it("prefills all review-visible fields in edit modal for submission 343", async () => {
		mockSubmissions.length = 0;
		mockSubmissions.push({
			id: 343,
			entity_type: "institution",
			type: "create",
			data: {
				name: "All Fields Institution",
				parent_organization: "Kulturverein Berlin",
				email: "allfields@example.com",
				phone: "+49 30 123456",
				website: "https://example.org/location",
				utilization_status: "in_use",
				utilization_status_info: "Nutzung werktags mit wechselnden Formaten",
				shared_use_allowed: true,
				shared_use_info: "Raum ist grundsätzlich für Dritte nutzbar.",
				shared_use_equipment: "Tische, Stühle, WLAN, Grundbeleuchtung",
				shared_use_audience:
					"Geeignet für Proben, Lesungen, kleinere Veranstaltungen",
				shared_use_availability: "Mo-Fr 10:00-18:00",
				shared_use_contact_person: "Kontakt: +49 30 222",
				legal_form: "e.V.",
				funding_type: "mixed",
				funding_sources: [
					{ source_name: "state", description: "Landesmittel" },
				],
				established_since: "2008-01-01",
				established_until: "2035-12-31",
				closing_reason: "Kein Schließungsgrund",
				owner_type: "public",
				owner_name: "Eigentümer GmbH",
				rental_contract_type: "limited",
				rental_contract_end: "2030-12-31",
				protection_status: "none",
				protection_status_info: "Status laut letzter Abstimmung",
				area: 450,
				number_of_rooms: 8,
				capacity: 280,
				accessibility: "Aufzug vorhanden",
				cost: "Miete abhängig von Nutzungsdauer",
				notes: "Zusätzliche Hinweise für Review",
				consent_contact_listing: true,
				contact_person_first_name: "Max",
				contact_person_last_name: "Mustermann",
				contact_person_email: "contact-all@example.com",
				contact_person_phone: "+49 30 654321",
				categoryIds: [1],
				address: {
					street: "Alexanderplatz",
					street_number: "1",
					zipcode: "10178",
					city: "Berlin",
					address_suffix: "Aufgang B",
					neighbourhood: "Mitte",
					cultural_area: "Zentrum",
					lat: 52.520008,
					lng: 13.404954,
				},
			},
		});

		render(
			<InstitutionDraftEditModal
				submissionId={343}
				routePath="/account/submissions/343/edit"
			/>,
		);

		await waitFor(() => {
			expect(institutionFormModalMock).toHaveBeenCalled();
		});

		const latestProps = institutionFormModalMock.mock.calls.at(-1)?.[0] as {
			institution?: Record<string, unknown>;
		};
		const institution = latestProps.institution ?? {};
		expect(institution.name).toBe("All Fields Institution");
		expect(institution.parent_organization).toBe("Kulturverein Berlin");
		expect(institution.email).toBe("allfields@example.com");
		expect(institution.phone).toBe("+49 30 123456");
		expect(institution.website).toBe("https://example.org/location");
		expect(institution.utilization_status).toBe("in_use");
		expect(institution.utilization_status_info).toBe(
			"Nutzung werktags mit wechselnden Formaten",
		);
		expect(institution.shared_use_info).toBe(
			"Raum ist grundsätzlich für Dritte nutzbar.",
		);
		expect(institution.legal_form).toBe("e.V.");
		expect(institution.owner_name).toBe("Eigentümer GmbH");
		expect(institution.accessibility).toBe("Aufzug vorhanden");
		expect(
			(institution.contact_person as Record<string, unknown>)?.first_name,
		).toBe("Max");
		expect(
			(institution.contact_person as Record<string, unknown>)?.last_name,
		).toBe("Mustermann");
		expect((institution.contact_person as Record<string, unknown>)?.email).toBe(
			"contact-all@example.com",
		);
		expect((institution.contact_person as Record<string, unknown>)?.phone).toBe(
			"+49 30 654321",
		);
		expect((institution.address as Record<string, unknown>)?.street).toBe(
			"Alexanderplatz",
		);
		expect(
			(institution.address as Record<string, unknown>)?.street_number,
		).toBe("1");
		expect((institution.address as Record<string, unknown>)?.city).toBe(
			"Berlin",
		);
		expect((institution.address as Record<string, unknown>)?.zipcode).toBe(
			"10178",
		);
		expect(
			(institution.address as Record<string, unknown>)?.address_suffix,
		).toBe("Aufgang B");
		expect(
			(institution.address as Record<string, unknown>)?.neighbourhood,
		).toBe("Mitte");
		expect(
			(institution.address as Record<string, unknown>)?.cultural_area,
		).toBe("Zentrum");
		expect((institution.address as Record<string, unknown>)?.lat).toBe(
			52.520008,
		);
		expect((institution.address as Record<string, unknown>)?.lng).toBe(
			13.404954,
		);
	});

	it("passes submission entity_id through to the institution form", async () => {
		mockSubmissions.length = 0;
		mockSubmissions.push({
			id: 501,
			entity_type: "institution",
			entity_id: 77,
			type: "update",
			data: {
				name: "Existing Institution Draft",
				address: {
					street: "Main",
					street_number: "1",
					city: "Berlin",
				},
			},
		});

		render(
			<InstitutionDraftEditModal
				submissionId={501}
				routePath="/account/submissions/501/edit"
			/>,
		);

		await waitFor(() => {
			expect(institutionFormModalMock).toHaveBeenCalled();
		});

		const latestProps = institutionFormModalMock.mock.calls.at(-1)?.[0] as {
			institution?: Record<string, unknown>;
		};
		expect(latestProps.institution?.id).toBe(77);
	});
});
