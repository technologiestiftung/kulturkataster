import { prisma } from "@/server/prisma";
import { Prisma } from "@/generated/prisma";

export const addressRepo = {
	listDistinct: (where?: Prisma.AddressWhereInput) =>
		prisma.address.findMany({
			select: { district: true },
			where: { district: { not: null }, ...where },
			distinct: ["district"],
			orderBy: { district: "asc" },
		}),
};
