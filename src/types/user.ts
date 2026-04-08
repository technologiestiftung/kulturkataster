import type { Prisma, UserStatus } from "@/generated/prisma";

export type PrismaUserWithRelations = Prisma.UserGetPayload<{
	include: {
		role: {
			include: {
				table_permissions: true;
			};
		};
		groups: true;
		submissions: true;
		institutions: { select: { id: true } };
	};
}>;

export type User = PrismaUserWithRelations;

export type Profile = Prisma.UserGetPayload<Record<string, never>>;

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
	meta_info?: string | null;
	account_type?: string | null;
	roleId?: number | null;
	groupIds?: number[];
	institutionIds?: number[];
};
