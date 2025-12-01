import type { RolePermissions } from "./types";
import { getPermissionSummary } from "./utils";

interface PermissionsSummaryProps {
	permissions: RolePermissions;
}

export function PermissionsSummary({ permissions }: PermissionsSummaryProps) {
	return <span className="text-sm">{getPermissionSummary(permissions)}</span>;
}
