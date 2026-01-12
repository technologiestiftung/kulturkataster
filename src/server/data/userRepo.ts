import { prisma } from "@/server/prisma";
import { UserCreateInput, UserUpdateInput, UserWhereInput } from "@/types/user";

const include = {
	role: true,
	institutions: true,
	groups: true,
} as const;

export const userRepo = {
	list: () => prisma.user.findMany({ include }),
	create: (data: UserCreateInput) =>
		prisma.user.create({
			data,
			include,
		}),
	update: (id: string, data: UserUpdateInput) =>
		prisma.user.update({
			where: { id },
			data,
			include,
		}),
	remove: (id: string) => prisma.user.delete({ where: { id } }),
	search: (where: UserWhereInput, take = 50) =>
		prisma.user.findMany({
			where,
			include,
			take,
			orderBy: { id: "asc" },
		}),
};
