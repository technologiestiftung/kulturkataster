"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { User } from "./types";
import {
	getRoleBadgeVariant,
	getStatusBadgeVariant,
	formatLastActivity,
	getRoleLabel,
	getAccessLabel,
} from "./utils";
import { UserAccessDetails } from "./UserAccessDetails";

interface UserRowProps {
	user: User;
	onEdit: (user: User) => void;
}

export function UserRow({ user, onEdit }: UserRowProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<>
			<TableRow>
				<TableCell>
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="hover:bg-muted p-1 rounded"
						aria-label={isExpanded ? "Collapse row" : "Expand row"}
					>
						{isExpanded ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</button>
				</TableCell>
				<TableCell className="font-medium">{user.name}</TableCell>
				<TableCell>{user.email}</TableCell>
				<TableCell>
					<Badge variant={getRoleBadgeVariant(user.role)}>
						{getRoleLabel(user.role)}
					</Badge>
				</TableCell>
				<TableCell>
					<div className="flex flex-wrap gap-1">
						{user.groups.length > 0 ? (
							user.groups.map((group) => (
								<Badge key={group.id} variant="secondary" className="text-xs">
									{group.name}
								</Badge>
							))
						) : (
							<span className="text-sm text-muted-foreground">-</span>
						)}
					</div>
				</TableCell>
				<TableCell>
					<Badge variant={getStatusBadgeVariant(user.status)}>
						{user.status}
					</Badge>
				</TableCell>
				<TableCell>
					<div className="flex items-center gap-2">
						<Badge variant="outline">{getAccessLabel(user.access)}</Badge>
						<span className="text-sm text-muted-foreground">
							({user.access.institutionCount})
						</span>
					</div>
				</TableCell>
				<TableCell className="text-sm text-muted-foreground">
					{formatLastActivity(user.lastActivity)}
				</TableCell>
				<TableCell>
					<Badge
						variant={user.complianceAccepted ? "default" : "secondary"}
						className="text-xs"
					>
						{user.complianceAccepted ? "Accepted" : "Pending"}
					</Badge>
				</TableCell>
				<TableCell>
					<div className="flex flex-wrap gap-2">
						<Button size="sm" variant="secondary" onClick={() => onEdit(user)}>
							Edit
						</Button>
					</div>
				</TableCell>
			</TableRow>
			{isExpanded && (
				<TableRow key={`${user.id}-details`}>
					<TableCell></TableCell>
					<TableCell colSpan={8}>
						<div className="py-2">
							<div className="text-sm font-medium mb-1">Access Details:</div>
							<UserAccessDetails access={user.access} />
						</div>
					</TableCell>
				</TableRow>
			)}
		</>
	);
}
