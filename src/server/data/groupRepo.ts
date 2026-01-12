import { prisma } from "@/server/prisma";

const include = {
	users: true,
	institutions: true,
} as const;

export const groupRepo = {
	list: () => prisma.group.findMany({ include }),
	create: (data: {
		name: string;
		description?: string | null;
		userIds?: string[];
		institutionIds?: number[];
	}) =>
		prisma.group.create({
			data: {
				name: data.name,
				description: data.description ?? null,
				users: data.userIds
					? { connect: data.userIds.map((id) => ({ id })) }
					: undefined,
				institutions: data.institutionIds
					? { connect: data.institutionIds.map((id) => ({ id })) }
					: undefined,
			},
			include,
		}),
	update: (
		id: number,
		data: {
			name?: string;
			description?: string | null;
			userIds?: string[];
			institutionIds?: number[];
		},
	) =>
		prisma.group.update({
			where: { id },
			data: {
				name: data.name,
				description: data.description ?? undefined,
				users: data.userIds
					? { set: data.userIds.map((userId) => ({ id: userId })) }
					: undefined,
				institutions: data.institutionIds
					? { set: data.institutionIds.map((instId) => ({ id: instId })) }
					: undefined,
			},
			include,
		}),
	remove: (id: number) => prisma.group.delete({ where: { id } }),
};
