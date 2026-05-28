import { describe, expect, it } from "vitest";
import { areStoreSliceValuesEqual } from "@/lib/utils/storeEquality";

describe("areStoreSliceValuesEqual", () => {
	it("returns true for structurally identical arrays with new references", () => {
		const left = [
			{
				id: 2646,
				name: "Test",
				address: { city: "Berlin", district: "Mitte" },
			},
		];
		const right = [
			{
				id: 2646,
				name: "Test",
				address: { city: "Berlin", district: "Mitte" },
			},
		];

		expect(areStoreSliceValuesEqual(left, right)).toBe(true);
	});

	it("returns false when nested content changes", () => {
		const left = [
			{
				id: 2646,
				name: "Test",
				address: { city: "Berlin", district: "Mitte" },
			},
		];
		const right = [
			{
				id: 2646,
				name: "Changed",
				address: { city: "Berlin", district: "Mitte" },
			},
		];

		expect(areStoreSliceValuesEqual(left, right)).toBe(false);
	});

	it("treats matching dates as equal", () => {
		const left = {
			id: 2646,
			updated_at: new Date("2026-04-29T12:00:00.000Z"),
		};
		const right = {
			id: 2646,
			updated_at: new Date("2026-04-29T12:00:00.000Z"),
		};

		expect(areStoreSliceValuesEqual(left, right)).toBe(true);
	});

	it("ignores object key order", () => {
		const left = {
			id: 2646,
			address: { city: "Berlin", district: "Mitte" },
		};
		const right = {
			address: { district: "Mitte", city: "Berlin" },
			id: 2646,
		};

		expect(areStoreSliceValuesEqual(left, right)).toBe(true);
	});
});
