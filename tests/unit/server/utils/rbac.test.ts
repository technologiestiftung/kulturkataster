import { describe, expect, it } from "vitest";
import {
	buildAccessContext,
	getFieldPermissionListsForTable,
	type AccessContext,
} from "@/server/utils/rbac";

describe("rbac field permission lists", () => {
	it("separates download permissions from readable fields", () => {
		const context: AccessContext = {
			role: "exporter",
			table: {},
			tableScope: {},
			field: {
				institution: {
					name: new Set(["read"]),
					email: new Set(["download"]),
					phone: new Set(["read", "download"]),
				},
			},
			fieldOrder: {
				institution: {
					email: 0,
					name: 1,
					phone: 2,
				},
			},
			fieldPins: {},
		};

		expect(getFieldPermissionListsForTable(context, "institution")).toEqual({
			read: ["name", "phone"],
			create: [],
			update: [],
			delete: [],
			download: ["email", "phone"],
			pinned: [],
		});
	});

	it("expands legacy relation fields to subfields for downloads", () => {
		const context = buildAccessContext(
			{
				id: 1,
				name: "guest",
				description: null,
				is_system: true,
				is_guest: true,
				created_at: new Date("2025-01-01"),
				updated_at: new Date("2025-01-01"),
				table_permissions: [],
				field_permissions: [
					{
						id: 1,
						role_id: 1,
						table: "institution",
						field: "address",
						action: "download",
					},
					{
						id: 2,
						role_id: 1,
						table: "institution",
						field: "contact_person",
						action: "download",
					},
				],
			},
			{
				institution: {
					"address.street": 0,
					"address.city": 1,
					"contact_person.email": 2,
				},
			},
			{},
		);

		expect(
			getFieldPermissionListsForTable(context, "institution").download,
		).toEqual([
			"address.street",
			"address.city",
			"contact_person.email",
			"address.address_suffix",
			"address.cultural_area",
			"address.district",
			"address.lat",
			"address.lng",
			"address.neighbourhood",
			"address.zipcode",
			"contact_person.first_name",
			"contact_person.last_name",
			"contact_person.phone",
		]);
	});

	it("normalizes legacy flat contact person field permissions", () => {
		const context = buildAccessContext({
			id: 1,
			name: "admin",
			description: null,
			is_system: true,
			is_guest: false,
			created_at: new Date("2025-01-01"),
			updated_at: new Date("2025-01-01"),
			table_permissions: [],
			field_permissions: [
				{
					id: 1,
					role_id: 1,
					table: "institution",
					field: "contact_person_email",
					action: "create",
				},
			],
		});

		expect(
			getFieldPermissionListsForTable(context, "institution").create,
		).toEqual(["contact_person.email"]);
	});

	it("sorts pinned fields by the global field order", () => {
		const context = buildAccessContext(
			{
				id: 1,
				name: "admin",
				description: null,
				is_system: true,
				is_guest: false,
				created_at: new Date("2025-01-01"),
				updated_at: new Date("2025-01-01"),
				table_permissions: [],
				field_permissions: [],
			},
			{
				institution: {
					status: 0,
					id: 1,
					name: 2,
				},
			},
			{
				institution: {
					name: true,
					status: true,
					id: true,
					email: false,
				},
			},
		);

		expect(
			getFieldPermissionListsForTable(context, "institution").pinned,
		).toEqual(["status", "id", "name"]);
	});
});
