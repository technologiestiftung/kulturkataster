import type { Prisma, UserStatus } from "@/generated/prisma";

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

export type UserFormInput = {
	id?: string;
	email: string;
	first_name?: string | null;
	last_name?: string | null;
	status?: UserStatus;
	compliance?: boolean;
	institution_claims?: string[];
	account_type?: string | null;
	roleId?: number | null;
	groupIds?: number[];
	institutionIds?: number[];
};
