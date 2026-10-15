import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubMenuOption } from "@/components/Menu/SubMenuOption";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const Icon = () => null;

describe("SubMenuOption", () => {
	it("renders a native button for action rows", () => {
		const onClick = vi.fn();
		render(
			<SubMenuOption icon={Icon} titleKey="map.title" onClick={onClick} />,
		);

		fireEvent.click(screen.getByRole("button", { name: "common.map.title" }));

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it("toggles switch rows once via the switch or its row label", () => {
		const onSwitchChange = vi.fn();
		render(
			<SubMenuOption
				icon={Icon}
				titleKey="accessibility.contrast"
				hasSwitch
				switchChecked={false}
				onSwitchChange={onSwitchChange}
			/>,
		);

		const toggle = screen.getByRole("switch", {
			name: "common.accessibility.contrast",
		});
		fireEvent.click(toggle);
		expect(onSwitchChange).toHaveBeenCalledTimes(1);
		expect(onSwitchChange).toHaveBeenLastCalledWith(true);

		fireEvent.click(screen.getByText("common.accessibility.contrast"));
		expect(onSwitchChange).toHaveBeenCalledTimes(2);
		expect(screen.queryByRole("button", { name: /contrast/ })).toBeNull();
	});
});
