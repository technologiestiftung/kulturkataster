import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InfoWrapper } from "@/components/InfoWrapper/InfoWrapper";
import type { InfoWrapperConfig } from "@/components/InfoWrapper/types";
import type { Institution } from "@/types";

// "referral"/"referralOther" are stand-ins to exercise the generic
// enum + free-text mechanism; no real Institution field uses them yet.
const asInstitutionData = (data: Record<string, unknown>) =>
	data as Partial<Institution>;

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const labels: Record<string, string> = {
				"enumMap.field_names.referral.options.friend": "Friend",
				"enumMap.field_names.referral.options.other": "Other",
				"content.infoWrapper.diffLabel.edited": "edited",
				"content.infoWrapper.diffLabel.addition": "addition",
				"content.infoWrapper.diffLabel.removed": "removed",
			};
			return labels[key] ?? key;
		},
		i18n: { resolvedLanguage: "en" },
	}),
}));

const config: InfoWrapperConfig = {
	fields: [
		{
			id: "referral",
			label: "Referral",
			value: "referral",
			type: "enum",
			enumKey: "referral",
			freeTextKey: "referralOther",
			freeTextValue: "other",
		},
	],
};

describe("InfoWrapper enum free-text display", () => {
	it("shows the plain enum label when the free-text option is not selected", () => {
		render(
			<InfoWrapper
				data={asInstitutionData({ referral: "friend", referralOther: "" })}
				config={config}
			/>,
		);

		expect(screen.getByText("Friend")).toBeInTheDocument();
	});

	it("appends the free text when the free-text option is selected", () => {
		render(
			<InfoWrapper
				data={asInstitutionData({
					referral: "other",
					referralOther: "Newsletter",
				})}
				config={config}
			/>,
		);

		expect(screen.getByText("Other: Newsletter")).toBeInTheDocument();
	});

	it("ignores stray free text when a different option is selected", () => {
		render(
			<InfoWrapper
				data={asInstitutionData({
					referral: "friend",
					referralOther: "Newsletter",
				})}
				config={config}
			/>,
		);

		expect(screen.getByText("Friend")).toBeInTheDocument();
		expect(screen.queryByText(/Newsletter/)).not.toBeInTheDocument();
	});

	it("flags a diff when only the free text changes on the free-text option", () => {
		render(
			<InfoWrapper
				data={asInstitutionData({
					referral: "other",
					referralOther: "Newsletter",
				})}
				newData={asInstitutionData({
					referral: "other",
					referralOther: "Flyer",
				})}
				config={config}
			/>,
		);

		expect(screen.getByText("edited")).toBeInTheDocument();
		expect(screen.getByText("Other: Flyer")).toBeInTheDocument();
	});
});
