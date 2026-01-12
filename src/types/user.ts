import type { Prisma } from "@/generated/prisma";

export type PrismaUserWithRelations = Prisma.UserGetPayload<{
	include: {
		role: true;
		groups: true;
		institutions: true;
	};
}>;

export type User = PrismaUserWithRelations;

export type UserCreateInput = Prisma.UserCreateInput;

export type UserUpdateInput = Prisma.UserUpdateInput;

export type UserWhereInput = Prisma.UserWhereInput;
