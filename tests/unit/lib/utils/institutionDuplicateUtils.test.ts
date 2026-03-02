import { describe, expect, it } from "vitest";
import type { Institution } from "@/types/institution";
import {
	findPotentialInstitutionDuplicates,
	hasDuplicateInstitutionByNameAndAddress,
} from "@/lib/utils/institutionDuplicateUtils";

const createInstitution = ({
	id,
	name,
	address,
}: {
	id: number;
	name: string;
	address: {
		street?: string | null;
		street_number?: string | null;
		address_suffix?: string | null;
		zipcode?: string | null;
		city?: string | null;
		lat?: number | null;
		lng?: number | null;
	};
}): Institution =>
	({
		id,
		name,
		address: {
			street: address.street ?? null,
			street_number: address.street_number ?? null,
			address_suffix: address.address_suffix ?? null,
			zipcode: address.zipcode ?? null,
			city: address.city ?? null,
			lat: address.lat ?? null,
			lng: address.lng ?? null,
		},
	} as Institution);

describe("institutionDuplicateUtils", () => {
	it("detects hard duplicates using canonicalized name and street", () => {
		const institutions = [
			createInstitution({
				id: 1,
				name: "Sisyphos",
				address: {
					street: "Hauptstraße",
					street_number: "12",
					zipcode: "10115",
					city: "Berlin",
				},
			}),
		];

		const hasDuplicate = hasDuplicateInstitutionByNameAndAddress({
			formData: {
				name: "  sisyphos  ",
				"address.streetLine": "Hauptstr. 12",
				"address.zip": "10115",
				"address.city": "Berlin",
			},
			institutions,
		});

		expect(hasDuplicate).toBe(true);
	});

	it("does not flag the currently edited institution as duplicate", () => {
		const institutions = [
			createInstitution({
				id: 7,
				name: "Sisyphos",
				address: {
					street: "Hauptstraße",
					street_number: "12",
					zipcode: "10115",
					city: "Berlin",
				},
			}),
		];

		const hasDuplicate = hasDuplicateInstitutionByNameAndAddress({
			formData: {
				name: "Sisyphos",
				"address.streetLine": "Hauptstraße 12",
				"address.zip": "10115",
				"address.city": "Berlin",
			},
			institutions,
			currentInstitutionId: 7,
		});

		expect(hasDuplicate).toBe(false);
	});

	it("returns potential duplicates for fuzzy name + nearby coordinates", () => {
		const institutions = [
			createInstitution({
				id: 2,
				name: "Sisyphos Berlin",
				address: {
					street: "Hauptstraße",
					street_number: "12",
					zipcode: "10115",
					city: "Berlin",
					lat: 52.52,
					lng: 13.405,
				},
			}),
			createInstitution({
				id: 3,
				name: "Completely Different",
				address: {
					street: "Andere Straße",
					street_number: "3",
					zipcode: "10999",
					city: "Berlin",
					lat: 52.49,
					lng: 13.37,
				},
			}),
		];

		const matches = findPotentialInstitutionDuplicates({
			formData: {
				name: "Sisyphos Berln",
				"address.streetLine": "Somewhere 99",
				"address.zip": "10437",
				"address.city": "Berlin",
				"address.lat": 52.5201,
				"address.lng": 13.4051,
			},
			institutions,
		});

		expect(matches.map((item) => item.id)).toEqual([2]);
	});

	it("does not return fuzzy matches when address context is missing", () => {
		const institutions = [
			createInstitution({
				id: 4,
				name: "Sisyphos",
				address: {
					street: "Hauptstraße",
					street_number: "12",
					zipcode: "10115",
					city: "Berlin",
				},
			}),
		];

		const matches = findPotentialInstitutionDuplicates({
			formData: {
				name: "Sisyphos",
			},
			institutions,
		});

		expect(matches).toEqual([]);
	});
});

