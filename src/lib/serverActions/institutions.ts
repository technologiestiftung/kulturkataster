/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import type { Category, District, FilterState } from "@/types";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

export async function getInstitutions() {
	const institutions = await prisma.institution.findMany({
		include: {
			address: true,
			categories: true,
			tags: true,
			users: true,
		},
	});

	return institutions;
}

export async function searchInstitutions(query: string) {
	if (!query || query.trim().length === 0) {
		return [];
	}

	const terms = query
		.split(" ")
		.map((term) => term.trim())
		.filter((term) => term.length > 0);

	const whereConditions: Prisma.InstitutionWhereInput | undefined =
		terms.length > 0
			? {
					AND: terms.map((term) => ({
						OR: [
							{
								name: {
									contains: term,
									mode: Prisma.QueryMode.insensitive,
								},
							},
							{
								website: {
									contains: term,
									mode: Prisma.QueryMode.insensitive,
								},
							},
							{
								email: {
									contains: term,
									mode: Prisma.QueryMode.insensitive,
								},
							},
							{
								notes: {
									contains: term,
									mode: Prisma.QueryMode.insensitive,
								},
							},
							{
								address: {
									street: {
										contains: term,
										mode: Prisma.QueryMode.insensitive,
									},
								},
							},
							{
								address: {
									street_number: {
										contains: term,
										mode: Prisma.QueryMode.insensitive,
									},
								},
							},
							{
								address: {
									address_suffix: {
										contains: term,
										mode: Prisma.QueryMode.insensitive,
									},
								},
							},
							{
								address: {
									zipcode: {
										contains: term,
										mode: Prisma.QueryMode.insensitive,
									},
								},
							},
						],
					})),
				}
			: undefined;

	const institutions = await prisma.institution.findMany({
		where: whereConditions,
		include: {
			address: true,
			categories: true,
			tags: true,
			users: true,
		},
		take: 50,
		orderBy: {
			id: "asc",
		},
	});

	return institutions;
}

export async function filterInstitutions(query: FilterState) {
	const filters: Prisma.InstitutionWhereInput[] = [];

	if (!query.include_closed) {
		filters.push({
			utilization_status: { not: "permanently_closed" },
		});
	}

	if (query.district_keys.length > 0) {
		filters.push({
			address: {
				district: { in: query.district_keys },
			},
		});
	}

	const categoryConditions: Prisma.InstitutionWhereInput[] = [];
	if (query.category_keys.length > 0) {
		categoryConditions.push({
			categories: {
				some: {
					key: { in: query.category_keys },
					parent_category_id: null,
				},
			},
		});
	}

	if (query.subcategory_keys.length > 0) {
		categoryConditions.push({
			categories: {
				some: {
					key: { in: query.subcategory_keys },
					parent_category_id: { not: null },
				},
			},
		});
	}

	if (categoryConditions.length > 0) {
		filters.push({ OR: categoryConditions });
	}

	const where: Prisma.InstitutionWhereInput =
		filters.length > 0 ? { AND: filters } : {};

	const institutions = await prisma.institution.findMany({
		where,
		include: {
			address: true,
			categories: true,
			tags: true,
			users: true,
		},
	});

	return institutions;
}

export async function getCategoriesWithSubcategories(): Promise<Category[]> {
	const categories = await prisma.category.findMany({
		include: {
			child_categories: true,
		},
		orderBy: { id: "asc" },
	});

	return categories
		.filter((category) => !category.parent_category_id)
		.map((category) => ({
			...category,
			subcategory: category.child_categories,
		})) as Category[];
}

export async function getDistricts(): Promise<District[]> {
	const districts = await prisma.address.findMany({
		select: { district: true },
		where: { district: { not: null } },
		distinct: ["district"],
		orderBy: { district: "asc" },
	});

	return districts
		.filter((d): d is { district: string } => !!d.district)
		.map((d) => ({
			key: d.district,
			name: d.district,
		})) as District[];
}
