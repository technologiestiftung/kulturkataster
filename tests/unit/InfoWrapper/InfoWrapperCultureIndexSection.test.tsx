import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InfoWrapper } from "@/components/InfoWrapper/InfoWrapper";
import type { InfoWrapperConfig } from "@/components/InfoWrapper/types";
import {
	cultureIndexInfoConfig,
	hasCultureIndex,
} from "@/config/infoConfig/configs";
import type { Institution } from "@/types";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { resolvedLanguage: "en" },
	}),
}));

const config: InfoWrapperConfig = {
	fields: [
		{
			type: "section",
			id: "culture_index_section",
			cardVariant: "muted",
			condition: hasCultureIndex,
			fields: cultureIndexInfoConfig,
		},
	],
};

describe("InfoWrapper culture index section", () => {
	it("shows the culture index together with its dimensions", () => {
		render(
			<InfoWrapper
				data={
					{
						culture_index: 60,
						culture_index_location: 0,
						culture_index_global: "Stable",
					} as Institution
				}
				config={config}
			/>,
		);

		expect(
			screen.getByText("enumMap.field_names.culture_index.label:"),
		).toBeInTheDocument();
		expect(screen.getByText("0")).toBeInTheDocument();
		expect(screen.getByText("Stable")).toBeInTheDocument();
	});

	it("hides the whole section when there is no culture index", () => {
		const { container } = render(
			<InfoWrapper
				data={
					{
						culture_index: null,
						culture_index_location: 50,
						culture_index_global: "Stable",
					} as Institution
				}
				config={config}
			/>,
		);

		expect(screen.queryByText("Stable")).not.toBeInTheDocument();
		expect(container.querySelector(".InfoItem")).toBeNull();
	});
});
