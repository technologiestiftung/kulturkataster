import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Group } from "./types";
import { formatDate } from "./utils";

interface GroupRowProps {
	group: Group;
	onEdit: (group: Group) => void;
}

export function GroupRow({ group, onEdit }: GroupRowProps) {
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
				<Button size="sm" variant="secondary" onClick={() => onEdit(group)}>
					Edit
				</Button>
			</TableCell>
		</TableRow>
	);
}
