import { describe, expect, it } from "vitest";
import {
	normalizeOptionalSubmissionJson,
	normalizeSubmissionJson,
} from "@/lib/utils/submissionJsonUtils";

describe("submissionJsonUtils", () => {
	it("normalizes tagged DateTime objects to ISO strings", () => {
		const normalized = normalizeSubmissionJson({
			established_since: {
				$type: "DateTime",
				value: "2019-01-01T00:00:00.000Z",
			},
			address: {
				created_at: {
					$type: "DateTime",
					value: "2020-01-01T00:00:00.000Z",
				},
			},
		});

		expect(normalized).toEqual({
			established_since: "2019-01-01T00:00:00.000Z",
			address: {
				created_at: "2020-01-01T00:00:00.000Z",
			},
		});
	});

	it("keeps optional fields undefined/null as undefined", () => {
		expect(normalizeOptionalSubmissionJson(undefined)).toBeUndefined();
		expect(normalizeOptionalSubmissionJson(null)).toBeUndefined();
	});
});

