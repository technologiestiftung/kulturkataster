import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Group } from "./types";
import { ActionMenu } from "@/components/shared";
import type { ActionMenuItem } from "@/components/shared";
import { formatDate } from "./utils";

interface GroupRowProps {
	group: Group;
	onEdit: (group: Group) => void;
	onDelete: (groupId: string) => void;
}

export function GroupRow({ group, onEdit, onDelete }: GroupRowProps) {
	const actionItems: ActionMenuItem[] = [
		{
			label: "Edit Group",
			onClick: () => onEdit(group),
		},
		{
			label: "Delete Group",
			onClick: () => onDelete(group.id),
			variant: "destructive",
		},
	];

	return (
		<TableRow>
			<TableCell className="font-medium">{group.name}</TableCell>
			<TableCell className="text-sm text-muted-foreground">
				{group.description}
			</TableCell>
			<TableCell>
				<Badge variant="secondary">{group.userCount}</Badge>
			</TableCell>
			<TableCell>
				<Badge variant="outline">{group.institutionCount}</Badge>
			</TableCell>
			<TableCell className="text-sm text-muted-foreground">
				{formatDate(group.createdAt)}
			</TableCell>
			<TableCell>
				<ActionMenu items={actionItems} />
			</TableCell>
		</TableRow>
	);
}
