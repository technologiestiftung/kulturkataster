import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

const institutionInclude = {
	address: true,
	categories: true,
	tags: true,
	users: true,
} as const;

export const institutionRepo = {
	list: () => prisma.institution.findMany({ include: institutionInclude }),
	search: (where: Prisma.InstitutionWhereInput, take = 50) =>
		prisma.institution.findMany({
			where,
			include: institutionInclude,
			take,
			orderBy: { id: "asc" },
		}),
};
