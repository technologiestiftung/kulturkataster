import type { RolePermissions } from "./types";
import { getPermissionSummary } from "./utils";

interface PermissionsSummaryProps {
	permissions: RolePermissions;
	scopeRestriction: boolean;
}

export function PermissionsSummary({
	permissions,
	scopeRestriction,
}: PermissionsSummaryProps) {
	return (
		<span className="text-sm">
			{getPermissionSummary(permissions, scopeRestriction)}
		</span>
	);
}
