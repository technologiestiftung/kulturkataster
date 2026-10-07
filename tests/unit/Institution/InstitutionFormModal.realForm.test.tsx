import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";

const closeModalMock = vi.fn();
let mockAccountCategories: Array<Record<string, unknown>> = [];
let mockInstitutionStoreCategories: Array<Record<string, unknown>> | null =
	null;

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key,
		i18n: { resolvedLanguage: "de" },
	}),
}));

vi.mock("@/components/Modals/useRoutedModalClose", () => ({
	useRoutedModalClose: () => closeModalMock,
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/lib/hooks/useInstitutionPrivateFieldResolver", () => ({
	useInstitutionPrivateFieldResolver: () => ({
		isPrivateField: () => false,
	}),
}));

vi.mock("@/lib/utils/institutionFieldAccess", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("@/lib/utils/institutionFieldAccess")
	>()),
	applyInstitutionFieldAccess: ({ fields }: { fields: unknown }) => fields,
}));

vi.mock("@/server/actions/maptiler", () => ({
	geocodeAddress: vi.fn(),
	reverseGeocode: vi.fn(),
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: {
			addInstitution: (item: unknown) => void;
			upsertInstitution: (item: unknown) => void;
			users: Array<Record<string, unknown>>;
			groups: Array<Record<string, unknown>>;
			institutionFieldPermissions: {
				read: string[];
				create: string[];
				update: string[];
				delete: string[];
				download: string[];
				pinned: string[];
			};
			categories: Array<Record<string, unknown>>;
		}) => unknown,
	) =>
		selector({
			addInstitution: vi.fn(),
			upsertInstitution: vi.fn(),
			users: [],
			groups: [],
			institutionFieldPermissions: {
				read: [],
				create: [],
				update: [],
				delete: [],
				download: [],
				pinned: [],
			},
			categories: mockAccountCategories,
		}),
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector: (state: {
			categories: Array<Record<string, unknown>> | null;
			allInstitutions: Array<Record<string, unknown>>;
		}) => unknown,
	) =>
		selector({
			categories: mockInstitutionStoreCategories,
			allInstitutions: [],
		}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: vi.fn() }),
}));

const getInput = (container: HTMLElement, id: string) => {
	const input = container.querySelector<HTMLInputElement>(`#${id}`);
	expect(input, `Expected input #${id}`).not.toBeNull();
	return input as HTMLInputElement;
};

// Renders the full real form; under full-suite parallel load this can exceed the 5s default.
describe("InstitutionFormModal real form", { timeout: 15_000 }, () => {
	beforeEach(() => {
		closeModalMock.mockReset();
		mockAccountCategories = [{ id: 1, key: "cat-a", parent_category_id: null }];
		mockInstitutionStoreCategories = [
			{
				id: 1,
				key: "cat-a",
				parent_category_id: null,
				child_categories: [],
			},
		];
	});

	it("submits changed contact person fields in submission edit forms", async () => {
		const onSubmit = vi.fn();
		const { container } = render(
			<InstitutionFormModal
				mode="create"
				permissionContext="submission"
				routePath="/account/submissions/11/edit"
				closeOnSubmit={false}
				institution={
					{
						id: 11,
						name: "Draft Institution",
						contact_person: {
							first_name: "Existing",
							last_name: "Contact",
							email: "existing@example.com",
							phone: "+49 30 654321",
						},
						address: { street: "Main", street_number: "1", city: "Berlin" },
						categories: [],
						tags: [],
						users: [],
						groups: [],
					} as never
				}
				onSubmit={onSubmit}
			/>,
		);

		fireEvent.change(getInput(container, "contact_person_first_name"), {
			target: { value: "Changed" },
		});
		fireEvent.change(getInput(container, "contact_person_last_name"), {
			target: { value: "Person" },
		});
		fireEvent.change(getInput(container, "contact_person_email"), {
			target: { value: "changed@example.com" },
		});
		fireEvent.change(getInput(container, "contact_person_phone"), {
			target: { value: "+49 30 999999" },
		});

		const submitButton = container.querySelector<HTMLButtonElement>(
			'button[type="submit"]',
		);
		expect(submitButton).not.toBeNull();
		fireEvent.click(submitButton as HTMLButtonElement);

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalled();
		});
		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					contact_person_first_name: "Changed",
					contact_person_last_name: "Person",
					contact_person_email: "changed@example.com",
					contact_person_phone: "+49 30 999999",
				}),
			}),
		);
	});
});
