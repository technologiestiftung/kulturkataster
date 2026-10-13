import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { SelectOption } from "@/components/FormWrapper";
import { MultiSelectModal } from "@/components/MultiSelect/MultiSelectModal";

vi.mock("@/icons/chevron-down.svg", () => ({ default: () => null }));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) =>
			options?.count !== undefined ? `${key}:${options.count}` : key,
	}),
}));

function TagPicker({ onChange }: { onChange: (values: string[]) => void }) {
	const [options, setOptions] = useState<SelectOption[]>([
		{ value: "7", label: "Kunst" },
	]);
	return (
		<MultiSelectModal
			title="Tags"
			options={options}
			selected={[]}
			onChange={onChange}
			createOption={{
				getLabel: (name) => `„${name}“ hinzufügen`,
				onCreate: (name) => {
					setOptions((current) => [
						...current,
						{ value: `new:${name}`, label: `${name} (neu)` },
					]);
					return `new:${name}`;
				},
			}}
		/>
	);
}

const openAndSearch = (term: string) => {
	fireEvent.click(screen.getByRole("button", { name: "common.select" }));
	fireEvent.change(screen.getByRole("textbox"), { target: { value: term } });
};

describe("MultiSelectModal create option", () => {
	it("offers to add a term that matches no option and selects it", () => {
		const onChange = vi.fn();
		render(<TagPicker onChange={onChange} />);

		openAndSearch("Jazz");
		fireEvent.click(screen.getByRole("button", { name: "„Jazz“ hinzufügen" }));
		fireEvent.click(
			screen.getByRole("button", {
				name: "common.multiSelectModal.actions.apply",
			}),
		);

		expect(onChange).toHaveBeenCalledWith(["new:Jazz"]);
	});

	it("does not offer to add a term that already exists in any capitalisation", () => {
		render(<TagPicker onChange={vi.fn()} />);

		openAndSearch("kunst");

		expect(
			screen.queryByRole("button", { name: "„kunst“ hinzufügen" }),
		).not.toBeInTheDocument();
	});
});

describe("MultiSelectModal trigger", () => {
	it("is a dialog button named by the field label and its value", () => {
		render(
			<>
				<span id="tags-label">Tags</span>
				<MultiSelectModal
					title="Tags"
					options={[{ value: "7", label: "Kunst" }]}
					selected={["7"]}
					onChange={vi.fn()}
					labelId="tags-label"
					describedBy="tags-error"
					invalid
				/>
				<p id="tags-error">Required</p>
			</>,
		);

		const trigger = screen.getByRole("button", {
			name: "Tags common.multiSelectModal.selectedCount:1",
		});
		expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
		expect(trigger).toHaveAttribute("aria-expanded", "false");
		expect(trigger).toHaveAttribute("aria-invalid", "true");
		expect(trigger).toHaveAccessibleDescription("Required");
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
	});

	it("labels the search input and announces the result count", () => {
		render(<TagPicker onChange={vi.fn()} />);

		fireEvent.click(screen.getByRole("button", { name: "common.select" }));

		expect(
			screen.getByRole("textbox", {
				name: "common.a11y.forms.searchOptions",
			}),
		).toBeInTheDocument();
		expect(screen.getByRole("status")).toHaveTextContent(
			"common.multiSelectModal.resultsCount:1",
		);
	});
});
