import { prisma } from "@/server/prisma";
import { CategoryCreateInput, CategoryUpdateInput } from "@/types";
import { withAuditContext } from "@/lib/middleware/contextMiddleware";

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
	create: (data: CategoryCreateInput) =>
		withAuditContext(() =>
			prisma.category.create({
				data,
				include,
			}),
		),
	update: (id: number, data: CategoryUpdateInput) =>
		withAuditContext(() =>
			prisma.category.update({
				where: { id },
				data,
				include,
			}),
		),
	remove: (id: number) =>
		withAuditContext(() => prisma.category.delete({ where: { id } })),
};
