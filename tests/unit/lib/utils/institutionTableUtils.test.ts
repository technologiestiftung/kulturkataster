import { describe, expect, it } from "vitest";
import {
	buildSubmissionRow,
	isSubmissionRow,
} from "@/lib/utils/institutionTableUtils";
import type { Submission } from "@/types/submission";
import type { Category } from "@/types/category";

const categories: Category[] = [
	{ id: 1, key: "music", parent_category_id: null } as Category,
	{ id: 2, key: "jazz", parent_category_id: 1 } as Category,
];

const submission = {
	id: 10,
	notes: [],
	status: "approval_pending",
	created_at: new Date("2024-01-01T10:00:00Z"),
	updated_at: new Date("2024-02-01T10:00:00Z"),
	data: {
		name: "Submission Institution",
		email: "submit@example.com",
		categoryIds: ["2", 1],
	},
	type: "create",
} as unknown as Submission;

describe("institutionTableUtils", () => {
	it("builds a submission row with mapped fields", () => {
		const row = buildSubmissionRow(submission, categories);
		expect(row.rowKind).toBe("submission");
		expect(row.rowKey).toBe("submission-10");
		expect(row.name).toBe("Submission Institution");
		expect(row.email).toBe("submit@example.com");
		expect(row.status).toBe("approval_pending");
		expect(row.categories.map((cat) => cat.id)).toEqual([2, 1]);
		expect(row.created_at).toEqual(submission.created_at);
		expect(row.updated_at).toEqual(submission.updated_at);
		expect(row.submissionType).toEqual(submission.type);
		expect(isSubmissionRow(row)).toBe(true);
	});

	it("falls back to address fields when address object is missing", () => {
		const row = buildSubmissionRow(
			{
				...submission,
				id: 11,
				data: {
					name: "With Address Fields",
					"address.streetLine": "Main 1",
					"address.zip": "10115",
					"address.city": "Berlin",
					"address.lat": 52.52,
					"address.lng": 13.405,
				},
			} as unknown as Submission,
			categories,
		);

		expect(row.address?.street).toBe("Main");
		expect(row.address?.street_number).toBe("1");
		expect(row.address?.zipcode).toBe("10115");
		expect(row.address?.city).toBe("Berlin");
		expect(row.address?.lat).toBe(52.52);
		expect(row.address?.lng).toBe(13.405);
	});
});
