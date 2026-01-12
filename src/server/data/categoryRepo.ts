import { prisma } from "@/server/prisma";

export const categoryRepo = {
	listWithChildren: () =>
		prisma.category.findMany({
			include: { child_categories: true },
			orderBy: { id: "asc" },
		}),
};
