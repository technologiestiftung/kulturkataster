import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { vi } from "vitest";
import dotenv from "dotenv";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.test" });

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

if (!("matchMedia" in window)) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

Object.defineProperty(window, "scrollTo", {
	writable: true,
	value: vi.fn(),
});

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
vi.mock("@/icons/plus.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/edit.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/download.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/trash.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/close.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/chevron-left.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/info-circle.svg", () => ({ default: SvgMock }));
vi.mock("@/icons/warning.svg", () => ({ default: SvgMock }));
vi.mock("@/logos/kuka-small.svg", () => ({ default: SvgMock }));
vi.mock("@/logos/kuka-large.svg", () => ({ default: SvgMock }));
vi.mock("@/logos/KRB.svg", () => ({ default: SvgMock }));
vi.mock("@/logos/senate.svg", () => ({ default: SvgMock }));
