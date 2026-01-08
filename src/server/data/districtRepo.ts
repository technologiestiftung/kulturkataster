import { prisma } from "@/lib/prisma";

export const districtRepo = {
	listDistinct: () =>
		prisma.address.findMany({
			select: { district: true },
			where: { district: { not: null } },
			distinct: ["district"],
			orderBy: { district: "asc" },
		}),
};
