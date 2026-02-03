import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { vi } from "vitest";

afterEach(() => {
	cleanup();
});

if (!("ResizeObserver" in globalThis)) {
	class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}

	globalThis.ResizeObserver = ResizeObserver;
}

const SvgMock = () => null;

vi.mock("@/icons/chevron-down.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/chevron-up.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/check.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/circle.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/eye.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/eye-off.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/close.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/chevron-left.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/info-circle.svg", () => ({ default: SvgMock }));
