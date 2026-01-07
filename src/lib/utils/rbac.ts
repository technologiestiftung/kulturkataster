import { prisma } from "@/lib/prisma";
import { FieldAction, FieldPermission, Role } from "@/generated/prisma";

type RoleWithPermissions = Role & { field_permissions: FieldPermission[] };

type TablePermissionMap = Record<string, Set<FieldAction>>;
type FieldPermissionMap = Record<string, Record<string, Set<FieldAction>>>;

export interface AccessContext {
	role: string | null;
	tables: TablePermissionMap;
	fields: FieldPermissionMap;
}

interface AuthorizeParams {
	context: AccessContext;
	resource: string;
	action: FieldAction;
	fields?: string[];
}

const parseTablePermissions = (
	permissions?: string | null,
): TablePermissionMap => {
	if (!permissions) return {};

	try {
		const parsed = JSON.parse(permissions) as Record<string, FieldAction[]>;
		return Object.entries(parsed).reduce<TablePermissionMap>(
			(acc, [table, actions]) => {
				if (Array.isArray(actions)) {
					acc[table] = new Set(actions);
				}
				return acc;
			},
			{},
		);
	} catch (error) {
		console.warn("[RBAC] Failed to parse role.permissions JSON:", error);
		return {};
	}
};

const parseFieldPermissions = (
	fieldPermissions: FieldPermission[],
): FieldPermissionMap => {
	return fieldPermissions.reduce<FieldPermissionMap>((acc, permission) => {
		const [maybeTable, ...rest] = permission.field_name.split(".");
		const table = rest.length ? maybeTable : "institution";
		const fieldName = rest.length ? rest.join(".") : maybeTable;

		if (!acc[table]) acc[table] = {};
		if (!acc[table][fieldName]) acc[table][fieldName] = new Set();
		acc[table][fieldName].add(permission.action);
		return acc;
	}, {});
};

export const buildAccessContext = (
	role: RoleWithPermissions | null,
): AccessContext => {
	if (!role) {
		return { role: null, tables: {}, fields: {} };
	}

	return {
		role: role.name,
		tables: parseTablePermissions(role.permissions),
		fields: parseFieldPermissions(role.field_permissions ?? []),
	};
};

export const hasTableAccess = (
	context: AccessContext,
	resource: string,
	action: FieldAction,
): boolean => {
	const tablePerms = context.tables[resource];
	if (!tablePerms) return false;
	return tablePerms.has(action);
};

export const hasFieldAccess = (
	context: AccessContext,
	resource: string,
	fields: string[],
	action: FieldAction,
): boolean => {
	if (fields.length === 0) return true;
	const resourceFields = context.fields[resource] ?? {};
	return fields.every((field) => resourceFields[field]?.has(action));
};

export const authorize = ({
	context,
	resource,
	action,
	fields = [],
}: AuthorizeParams): { allowed: boolean; reason?: string } => {
	if (!hasTableAccess(context, resource, action)) {
		return {
			allowed: false,
			reason: `Role "${context.role ?? "anonymous"}" lacks ${action} on ${resource}`,
		};
	}

	if (fields.length > 0 && !hasFieldAccess(context, resource, fields, action)) {
		return {
			allowed: false,
			reason: `Role "${context.role ?? "anonymous"}" lacks ${action} on some fields of ${resource}`,
		};
	}

	return { allowed: true };
};

export const throwIfUnauthorized = (params: AuthorizeParams) => {
	const result = authorize(params);
	if (!result.allowed) {
		const error = new Error(result.reason ?? "Unauthorized");
		error.name = "RBACError";
		throw error;
	}
};

export const getAccessContextForUser = async (
	userId: string | null,
): Promise<AccessContext> => {
	if (!userId) {
		const guestRole = await prisma.role.findUnique({
			where: { name: "guest" },
			include: { field_permissions: true },
		});
		return buildAccessContext(guestRole ?? null);
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			role: {
				include: {
					field_permissions: true,
				},
			},
		},
	});

	return buildAccessContext(user?.role ?? null);
};
