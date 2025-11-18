import type { Group } from "./types";

export const sampleGroups: Group[] = [
	{
		id: "g1",
		name: "Redaktion",
		description: "Editorial group with full access to all institutions",
		institutionAccess: {
			type: "all",
		},
		userCount: 1,
		institutionCount: 234,
		createdAt: new Date("2025-01-15T10:00:00"),
	},
	{
		id: "g2",
		name: "Open Spaces",
		description: "Open Spaces department with category-based access",
		institutionAccess: {
			type: "category",
			categories: [
				{ key: "parks", name: "Parks & Gardens" },
				{ key: "plazas", name: "Public Plazas" },
			],
		},
		userCount: 1,
		institutionCount: 67,
		createdAt: new Date("2025-02-20T14:30:00"),
	},
	{
		id: "g3",
		name: "Custom District",
		description: "District-based access to Mitte institutions",
		institutionAccess: {
			type: "district",
			districts: [{ key: "mitte", name: "Mitte" }],
		},
		userCount: 1,
		institutionCount: 89,
		createdAt: new Date("2025-03-10T09:15:00"),
	},
];
