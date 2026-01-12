import { prisma } from "@/server/prisma";
import { Prisma } from "@/generated/prisma";

const institutionInclude = {
	address: true,
	categories: true,
	tags: true,
	users: true,
} as const;

export const institutionRepo = {
	list: () => prisma.institution.findMany({ include: institutionInclude }),
	listWithSelect: (select: Prisma.InstitutionSelect) =>
		prisma.institution.findMany({ select }),
	search: (where: Prisma.InstitutionWhereInput, take = 50) =>
		prisma.institution.findMany({
			where,
			take,
			orderBy: { id: "asc" },
		}),
	searchWithSelect: (
		where: Prisma.InstitutionWhereInput,
		select: Prisma.InstitutionSelect,
		take = 50,
	) =>
		prisma.institution.findMany({
			where,
			select,
			take,
			orderBy: { id: "asc" },
		}),
};
