import { prisma } from "@/server/prisma";
import { CategoryCreateInput, CategoryUpdateInput } from "@/types";

const include = {
	parent_category: true,
	child_categories: true,
} as const;

export const categoryRepo = {
	listWithChildren: () =>
		prisma.category.findMany({
			where: { status: "active" },
			include: { child_categories: { where: { status: "active" } } },
			orderBy: { id: "asc" },
		}),
	listAll: () =>
		prisma.category.findMany({
			include,
			orderBy: { key: "asc" },
		}),
	findById: (id: number) =>
		prisma.category.findUnique({
			where: { id },
			include,
		}),
	create: (data: CategoryCreateInput) =>
		prisma.category.create({
			data,
			include,
		}),
	update: (id: number, data: CategoryUpdateInput) =>
		prisma.category.update({
			where: { id },
			data,
			include,
		}),
	remove: (id: number) => prisma.category.delete({ where: { id } }),
};
