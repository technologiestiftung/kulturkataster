import { Badge } from "@/components/ui/badge";
import {
	StickyActionsCell,
	StickyTableCell,
	StickyTableRow,
} from "@/components/ui/sticky-table";
import type { Group } from "./types";
import { formatDate } from "./utils";

interface GroupRowProps {
	group: Group;
	onEdit: (group: Group) => void;
}

export function GroupRow({ group, onEdit }: GroupRowProps) {
	return (
		<StickyTableRow>
			<StickyTableCell className="font-medium">{group.name}</StickyTableCell>
			<StickyTableCell className="text-sm text-muted-foreground">
				{group.description}
			</StickyTableCell>
			<StickyTableCell>
				<Badge variant="secondary">{group.userCount}</Badge>
			</StickyTableCell>
			<StickyTableCell>
				<Badge variant="outline">{group.institutionCount}</Badge>
			</StickyTableCell>
			<StickyTableCell className="text-sm text-muted-foreground">
				{formatDate(group.createdAt)}
			</StickyTableCell>
			<StickyActionsCell onEdit={() => onEdit(group)} />
		</StickyTableRow>
	);
}
