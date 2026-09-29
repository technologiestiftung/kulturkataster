import { prisma } from "@/server/prisma";

const select = { id: true, name: true } as const;

export const tagRepo = {
	list: () => prisma.tag.findMany({ select, orderBy: { name: "asc" } }),
	findByNamesIgnoringCase: (names: string[]) =>
		prisma.tag.findMany({
			where: {
				OR: names.map((name) => ({
					name: { equals: name, mode: "insensitive" as const },
				})),
			},
			select,
		}),
	createMany: (names: string[]) =>
		prisma.tag.createMany({
			data: names.map((name) => ({ name })),
			skipDuplicates: true,
		}),
	findByNames: (names: string[]) =>
		prisma.tag.findMany({ where: { name: { in: names } }, select }),
};
