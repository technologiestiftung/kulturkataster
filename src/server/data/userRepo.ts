import { prisma } from "@/server/prisma";
import { UserCreateInput, UserUpdateInput, UserWhereInput } from "@/types/user";

const include = {
	role: {
		include: {
			table_permissions: true,
		},
	},
	institutions: { select: { id: true } },
	submissions: { where: { type: "claim" } },
	groups: true,
} as const;

export const userRepo = {
	list: () => prisma.user.findMany({ include }),
	findById: (id: string) =>
		prisma.user.findUnique({
			where: { id },
			include,
		}),
	ensureUser: async ({ id, email }: { id: string; email: string }) => {
		const existing = await prisma.user.findUnique({
			where: { id },
			include,
		});
		if (existing) {
			if (email && existing.email !== email) {
				return prisma.user.update({
					where: { id },
					data: { email },
					include,
				});
			}
			if (!existing.role_id) {
				const guestRole = await prisma.role.findFirst({
					where: { is_guest: true },
					select: { id: true },
				});
				if (guestRole) {
					return prisma.user.update({
						where: { id },
						data: { role: { connect: { id: guestRole.id } } },
						include,
					});
				}
			}
			return existing;
		}

		const guestRole = await prisma.role.findFirst({
			where: { is_guest: true },
			select: { id: true },
		});

		return prisma.user.create({
			data: {
				id,
				email,
				role: guestRole ? { connect: { id: guestRole.id } } : undefined,
			},
			include,
		});
	},
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
