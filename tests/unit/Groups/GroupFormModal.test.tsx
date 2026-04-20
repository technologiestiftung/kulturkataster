import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GroupFormModal } from "@/components/Groups/GroupFormModal";
import { createGroup, updateGroup } from "@/server/actions/groups";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { useAccountStore } from "@/lib/store/accountStore";

const closeModalMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key,
		i18n: { language: "de" },
	}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: refreshMock }),
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
		};
	}) => (
		<div>
			<button
				type="button"
				onClick={() =>
					void config.onSubmit({
						name: "Updated group",
						description: "Updated description",
						userIds: [],
						institutionIds: [],
					})
				}
			>
				Submit
			</button>
		</div>
	),
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector: (state: {
			allInstitutions: unknown[];
			categories: unknown[];
		}) => unknown,
	) => selector({ allInstitutions: [], categories: [] }),
}));

vi.mock("@/lib/hooks/useInstitutionMultiSelect", () => ({
	useInstitutionMultiSelect: () => ({
		institutionOptions: [],
		filteredInstitutionOptions: [],
		filterPanel: null,
	}),
}));

vi.mock("@/server/actions/groups", () => ({
	createGroup: vi.fn(),
	updateGroup: vi.fn(),
	deleteGroup: vi.fn(),
	getGroupById: vi.fn(),
}));

vi.mock("@/lib/utils/feedbackToast", () => ({
	showSuccessToast: vi.fn(),
}));

const mockedCreateGroup = vi.mocked(createGroup);
const mockedUpdateGroup = vi.mocked(updateGroup);
const mockedShowSuccessToast = vi.mocked(showSuccessToast);

describe("GroupFormModal", () => {
	beforeEach(() => {
		closeModalMock.mockReset();
		refreshMock.mockReset();
		mockedCreateGroup.mockReset();
		mockedUpdateGroup.mockReset();
		mockedShowSuccessToast.mockReset();
		useAccountStore.setState({
			groups: [
				{
					id: 21,
					name: "Existing group",
					description: "Desc",
					created_at: new Date("2025-01-01"),
					updated_at: new Date("2025-01-01"),
					users: [],
					institutions: [],
				},
			],
			users: [],
		} as never);
	});

	it("creates a group in create mode", async () => {
		mockedCreateGroup.mockResolvedValueOnce({
			ok: true,
			data: {
				id: 99,
				name: "Updated group",
				description: "Updated description",
				created_at: new Date("2025-01-01"),
				updated_at: new Date("2025-01-01"),
				users: [],
				institutions: [],
			},
		} as never);

		render(<GroupFormModal mode="create" routePath="/account/groups/new" />);
		fireEvent.click(screen.getByRole("button", { name: "Submit" }));

		await waitFor(() => {
			expect(mockedCreateGroup).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "Updated group",
					description: "Updated description",
				}),
			);
		});
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
		expect(closeModalMock).toHaveBeenCalledTimes(1);
	});

	it("updates an existing group in edit mode", async () => {
		mockedUpdateGroup.mockResolvedValueOnce({
			ok: true,
			data: {
				id: 21,
				name: "Updated group",
				description: "Updated description",
				created_at: new Date("2025-01-01"),
				updated_at: new Date("2025-01-02"),
				users: [],
				institutions: [],
			},
		} as never);

		render(
			<GroupFormModal
				mode="edit"
				groupId="21"
				routePath="/account/groups/21/edit"
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Submit" }));

		await waitFor(() => {
			expect(mockedUpdateGroup).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 21,
					name: "Updated group",
					description: "Updated description",
				}),
			);
		});
		expect(mockedShowSuccessToast).toHaveBeenCalledTimes(1);
		expect(closeModalMock).toHaveBeenCalledTimes(1);
	});
});
