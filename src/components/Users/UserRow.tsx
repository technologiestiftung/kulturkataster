"use client";

import { useState } from "react";
import {
	StickyTableCell,
	StickyTableRow,
	StickyActionsCell,
} from "@/components/ui/sticky-table";
import { Badge } from "@/components/ui/badge";
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
	const toggleExpanded = () => setIsExpanded((prev) => !prev);

	return (
		<>
			<StickyTableRow
				onClick={toggleExpanded}
				className="cursor-pointer"
				aria-expanded={isExpanded}
			>
				<StickyTableCell className="font-medium">{user.name}</StickyTableCell>
				<StickyTableCell>{user.email}</StickyTableCell>
				<StickyTableCell>
					<Badge variant={getRoleBadgeVariant(user.role)}>
						{getRoleLabel(user.role)}
					</Badge>
				</StickyTableCell>
				<StickyTableCell>
					<div className="flex flex-wrap gap-1">
						{user.groups.length > 0 ? (
							user.groups.map((group) => (
								<Badge key={group.id} variant="secondary" className="text-xs">
									{group.name}
								</Badge>
							))
						) : (
							<span className="text-sm text-foreground">-</span>
						)}
					</div>
				</StickyTableCell>
				<StickyTableCell>
					<Badge variant={getStatusBadgeVariant(user.status)}>
						{user.status}
					</Badge>
				</StickyTableCell>
				<StickyTableCell>
					<div className="flex items-center gap-2">
						<Badge variant="outline">{getAccessLabel(user.access)}</Badge>
						<span className="text-sm text-foreground">
							({user.access.institutionCount})
						</span>
					</div>
				</StickyTableCell>
				<StickyTableCell className="text-sm text-foreground">
					{formatLastActivity(user.lastActivity)}
				</StickyTableCell>
				<StickyTableCell>
					<Badge
						variant={user.complianceAccepted ? "default" : "secondary"}
						className="text-xs"
					>
						{user.complianceAccepted ? "Accepted" : "Pending"}
					</Badge>
				</StickyTableCell>
				<StickyActionsCell
					onEdit={() => onEdit(user)}
					onClick={(event) => event.stopPropagation()}
				/>
			</StickyTableRow>
			{isExpanded && (
				<StickyTableRow key={`${user.id}-details`}>
					<StickyTableCell colSpan={9}>
						<div className="py-2">
							<div className="text-sm font-medium mb-1">Access Details:</div>
							<UserAccessDetails access={user.access} />
						</div>
					</StickyTableCell>
				</StickyTableRow>
			)}
		</>
	);
}
