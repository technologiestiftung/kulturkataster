import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/prisma";
import {
	InstitutionCreateInput,
	InstitutionUpdateInput,
	InstitutionWhereInput,
} from "@/types";

const institutionInclude = {
	address: true,
	categories: true,
	contact_person: true,
	funding_sources: true,
	tags: true,
	users: true,
	groups: true,
} as const;

export const institutionRepo = {
	list: () =>
		prisma.institution.findMany({
			include: {
				...institutionInclude,
				categories: { where: { status: "active" } },
			},
		}),
	listWithSelect: (select: Prisma.InstitutionSelect) =>
		prisma.institution.findMany({ select }),
	listWithSelectWhere: (
		where: Prisma.InstitutionWhereInput,
		select: Prisma.InstitutionSelect,
	) => prisma.institution.findMany({ where, select }),
	listForUser: (userId: string) =>
		prisma.institution.findMany({
			where: {
				OR: [
					{ users: { some: { id: userId } } },
					{ groups: { some: { users: { some: { id: userId } } } } },
				],
			},
			distinct: ["id"],
			include: institutionInclude,
		}),
	listByIds: (ids: number[]) =>
		prisma.institution.findMany({
			where: { id: { in: ids } },
			include: institutionInclude,
		}),
	create: (data: InstitutionCreateInput) =>
		prisma.institution.create({ data, include: institutionInclude }),
	update: (id: number, data: InstitutionUpdateInput) =>
		prisma.institution.update({
			where: { id },
			data,
			include: institutionInclude,
		}),
	updateWhere: (
		where: Prisma.InstitutionWhereInput,
		data: InstitutionUpdateInput,
	) => prisma.institution.updateMany({ where, data }),
	remove: (id: number) => prisma.institution.delete({ where: { id } }),
	removeWhere: (where: Prisma.InstitutionWhereInput) =>
		prisma.institution.deleteMany({ where }),
	findFirstWithInclude: (where: Prisma.InstitutionWhereInput) =>
		prisma.institution.findFirst({ where, include: institutionInclude }),
	findFirstWithSelect: (
		where: Prisma.InstitutionWhereInput,
		select: Prisma.InstitutionSelect,
	) => prisma.institution.findFirst({ where, select }),
	search: (where: InstitutionWhereInput, take = 50) =>
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
