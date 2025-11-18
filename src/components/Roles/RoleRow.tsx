import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActionMenu } from "@/components/shared";
import type { ActionMenuItem } from "@/components/shared";
import type { Role } from "./types";
import { PermissionsSummary } from "./PermissionsSummary";

interface RoleRowProps {
	role: Role;
	onEdit: (role: Role) => void;
}

export function RoleRow({ role, onEdit }: RoleRowProps) {
	const actionItems: ActionMenuItem[] = [
		{
			label: "Edit Role",
			onClick: () => onEdit(role),
		},
	];

	return (
		<TableRow>
			<TableCell className="font-medium">
				{role.name}
				{role.isSystemRole && (
					<Badge variant="outline" className="ml-2 text-xs">
						System
					</Badge>
				)}
			</TableCell>
			<TableCell className="text-sm text-muted-foreground">
				{role.description}
			</TableCell>
			<TableCell className="text-sm">
				<PermissionsSummary
					permissions={role.permissions}
					scopeRestriction={role.scopeRestriction}
				/>
			</TableCell>
			<TableCell>
				<Badge variant="secondary">{role.userCount}</Badge>
			</TableCell>
			<TableCell>
				<ActionMenu items={actionItems} />
			</TableCell>
		</TableRow>
	);
}
