import { describe, expect, it } from "vitest";
import { organizationInfoConfig } from "@/config/infoConfig/configs";

describe("organizationInfoConfig", () => {
	it("renders closing_reason through enum translations", () => {
		expect(organizationInfoConfig).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					value: "closing_reason",
					type: "enum",
					enumKey: "closing_reason",
				}),
			]),
		);
	});
});
