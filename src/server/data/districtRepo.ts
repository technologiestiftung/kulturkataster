import { prisma } from "@/server/prisma";

export const districtRepo = {
	listDistinct: () =>
		prisma.address.findMany({
			select: { district: true },
			where: { district: { not: null } },
			distinct: ["district"],
			orderBy: { district: "asc" },
		}),
};
