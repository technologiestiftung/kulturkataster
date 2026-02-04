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

if (!("indexedDB" in globalThis)) {
	const mockIDB = {
		open: vi.fn(),
		deleteDatabase: vi.fn(),
		cmp: vi.fn(),
	};
	// @ts-expect-error - Mocking IndexedDB for test environment
	globalThis.indexedDB = mockIDB;
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
