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
	fireEvent.click(screen.getByRole("combobox"));
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
