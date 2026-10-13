import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SelectableOptionsList } from "@/components/MultiSelect/SelectableOptionsList";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const options = [
	{ value: "a", label: "Alpha" },
	{ value: "b", label: "Beta" },
];

describe("SelectableOptionsList", () => {
	it("exposes panel rows as checkboxes with their checked state", () => {
		const onToggle = vi.fn();
		render(
			<SelectableOptionsList
				options={options}
				selectedValues={["b"]}
				onToggle={onToggle}
				variant="panel"
			/>,
		);

		const alpha = screen.getByRole("checkbox", { name: "Alpha" });
		expect(alpha).toHaveAttribute("aria-checked", "false");
		expect(screen.getByRole("checkbox", { name: "Beta" })).toHaveAttribute(
			"aria-checked",
			"true",
		);

		fireEvent.keyDown(alpha, { key: " " });
		expect(onToggle).toHaveBeenCalledWith("a");
	});

	it("exposes single-select panel rows as radios", () => {
		render(
			<SelectableOptionsList
				options={options}
				selectedValues={["a"]}
				onToggle={vi.fn()}
				variant="panel"
				multiSelect={false}
			/>,
		);

		expect(screen.getByRole("radiogroup")).toBeInTheDocument();
		expect(screen.getByRole("radio", { name: "Alpha" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
	});

	it("keeps the header outside the listbox so options map to list indices", () => {
		const listRef = { current: null as HTMLDivElement | null };
		render(
			<SelectableOptionsList
				options={options}
				selectedValues={["a"]}
				onToggle={vi.fn()}
				headingLabel="Suggestions"
				listId="results"
				listRef={listRef}
			/>,
		);

		const listbox = screen.getByRole("listbox", { name: "Suggestions" });
		expect(listbox).toHaveAttribute("aria-multiselectable", "true");
		expect(listRef.current).toBe(listbox);
		expect(listbox.children).toHaveLength(2);
		expect(listbox.children[0]).toHaveAccessibleName("Alpha");
		expect(screen.getByRole("option", { name: "Alpha" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});

	it("follows the active index for single-select listbox options", () => {
		render(
			<SelectableOptionsList
				options={options}
				selectedValues={[]}
				onToggle={vi.fn()}
				multiSelect={false}
				activeIndex={1}
			/>,
		);

		expect(screen.getByRole("listbox")).not.toHaveAttribute(
			"aria-multiselectable",
		);
		expect(screen.getByRole("option", { name: "Beta" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});
});
