import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DistrictTags from "@/components/Filter/DistrictTags/DistrictTags";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { translatedName?: string }) => {
			if (key === "content.filter.districtTagsSwitchAriaLabel") {
				return `${options?.translatedName} ein- oder ausschalten`;
			}
			if (key.startsWith("enumMap.")) {
				return `translated ${key}`;
			}
			return key;
		},
	}),
}));

vi.mock("@/icons/close.svg", () => ({
	default: () => <span aria-hidden="true" />,
}));

describe("DistrictTags", () => {
	it("renders district values without enumMap translation", () => {
		render(
			<DistrictTags districts={["Mitte"]} selected={[]} onChange={vi.fn()} />,
		);

		expect(
			screen.getByRole("switch", { name: "Mitte ein- oder ausschalten" }),
		).toBeInTheDocument();
		expect(screen.getByText("Mitte")).toBeInTheDocument();
		expect(
			screen.queryByText("translated enumMap.Mitte"),
		).not.toBeInTheDocument();
	});
});
