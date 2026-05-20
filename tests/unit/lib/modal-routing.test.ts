import { describe, expect, it } from "vitest";
import { getModalLink } from "@/lib/utils/modalRouting";

describe("getModalLink", () => {
	it("keeps accessibility settings on the desktop route", () => {
		expect(
			getModalLink("accessibilitySettings", (path) => `/de${path}`),
		).toEqual({
			url: "/de/accessibilitySettings",
			target: "_self",
		});
	});

	it("reroutes accessibility settings to the mobile menu on mobile", () => {
		expect(
			getModalLink("accessibilitySettings", (path) => `/de${path}`, {
				isMobile: true,
			}),
		).toEqual({
			url: "/de/mobileMenu",
			target: "_self",
		});
	});
});
