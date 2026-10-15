import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DistrictTags from "@/components/Filter/DistrictTags/DistrictTags";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => {
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

		expect(screen.getByText("Mitte")).toBeInTheDocument();
		expect(
			screen.queryByText("translated enumMap.Mitte"),
		).not.toBeInTheDocument();
	});

	it("renders each district as a keyboard-reachable toggle button", () => {
		const onChange = vi.fn();
		render(
			<>
				<h3 id="districts-heading">Bezirke</h3>
				<DistrictTags
					districts={["Mitte", "Pankow"]}
					selected={["Pankow"]}
					onChange={onChange}
					labelledBy="districts-heading"
				/>
			</>,
		);

		expect(screen.getByRole("group", { name: "Bezirke" })).toBeInTheDocument();

		const mitte = screen.getByRole("button", { name: "Mitte" });
		expect(mitte.tagName).toBe("BUTTON");
		expect(mitte).toHaveAttribute("type", "button");
		expect(mitte).toHaveAttribute("aria-pressed", "false");
		expect(screen.getByRole("button", { name: "Pankow" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);

		fireEvent.click(mitte);
		expect(onChange).toHaveBeenCalledWith("Mitte");
	});
});
