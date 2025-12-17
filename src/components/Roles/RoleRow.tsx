import { Badge } from "@/components/ui/badge";
import {
	StickyActionsCell,
	StickyTableCell,
	StickyTableRow,
} from "@/components/ui/sticky-table";
import type { Role } from "./types";
import { PermissionsSummary } from "./PermissionsSummary";

interface RoleRowProps {
	role: Role;
	onEdit: (role: Role) => void;
}

export function RoleRow({ role, onEdit }: RoleRowProps) {
	return (
		<StickyTableRow>
			<StickyTableCell className="font-medium">
				{role.name}
				{role.isSystemRole && (
					<Badge variant="outline" className="ml-2 text-xs">
						System
					</Badge>
				)}
			</StickyTableCell>
			<StickyTableCell className="text-sm text-muted-foreground">
				{role.description}
			</StickyTableCell>
			<StickyTableCell className="text-sm">
				<PermissionsSummary permissions={role.permissions} />
			</StickyTableCell>
			<StickyTableCell>
				<Badge variant="secondary">{role.userCount}</Badge>
			</StickyTableCell>
			<StickyActionsCell onEdit={() => onEdit(role)} />
		</StickyTableRow>
	);
}
