import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteFocusManager } from "@/app/[locale]/_components/RouteFocusManager";

const pathnameState = { value: "/de/map" };

vi.mock("next/navigation", () => ({
	usePathname: () => pathnameState.value,
}));

function setup() {
	const main = document.createElement("main");
	main.id = "main-content";
	main.tabIndex = -1;
	document.body.appendChild(main);
	const view = render(<RouteFocusManager />);
	const navigate = (path: string) => {
		pathnameState.value = path;
		view.rerender(<RouteFocusManager />);
		act(() => {
			vi.runAllTimers();
		});
	};
	return { main, navigate };
}

describe("RouteFocusManager", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		pathnameState.value = "/de/map";
	});

	afterEach(() => {
		vi.useRealTimers();
		document.body.innerHTML = "";
	});

	it("does nothing on the first render", () => {
		const { main } = setup();
		act(() => {
			vi.runAllTimers();
		});
		expect(document.activeElement).not.toBe(main);
	});

	it("moves lost focus to the main landmark after navigation", () => {
		const { main, navigate } = setup();
		navigate("/de/list");
		expect(document.activeElement).toBe(main);
	});

	it("keeps focus on an element that is still focused", () => {
		const { navigate } = setup();
		const button = document.createElement("button");
		document.body.appendChild(button);
		button.focus();
		navigate("/de/list");
		expect(document.activeElement).toBe(button);
	});

	it("does not steal focus while a dialog is open", () => {
		const { main, navigate } = setup();
		const dialog = document.createElement("div");
		dialog.setAttribute("role", "dialog");
		document.body.appendChild(dialog);
		navigate("/de/about");
		expect(document.activeElement).not.toBe(main);
	});
});
