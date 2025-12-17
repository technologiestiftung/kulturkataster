"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type ActivityStatus = "pending" | "approved" | "rejected" | "completed";

export interface Activity {
	date: string;
	user: string;
	action: string;
	item: string;
	itemLink?: string;
	relation?: string;
	relationLink?: string;
	status: ActivityStatus;
}

interface ActivityItemProps {
	activity: Activity;
}

const statusColors: Record<ActivityStatus, string> = {
	pending: "bg-muted-foreground",
	approved: "bg-green-500",
	rejected: "bg-red-500",
	completed: "bg-blue-500",
};

export function ActivityItem({ activity }: ActivityItemProps) {
	return (
		<div className="flex items-center gap-3 py-3">
			<div
				className={cn(
					"w-4 h-4 rounded-full flex-shrink-0",
					statusColors[activity.status],
				)}
				aria-label={`Status: ${activity.status}`}
			/>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="flex items-baseline gap-2 flex-wrap">
					<span className="text-sm font-bold">{activity.date}</span>
					<span className="text-sm">•</span>
					<span className="text-sm">{activity.action}</span>
					{activity.itemLink ? (
						<Link
							href={activity.itemLink}
							className="text-sm font-bold underline text-primary "
						>
							{activity.item}
						</Link>
					) : (
						<span className="text-sm font-bold ">{activity.item}</span>
					)}

					{activity.relation && (
						<>
							<span className="text-sm mx-1">in</span>
							{activity.relationLink ? (
								<Link
									href={activity.relationLink}
									className="text-sm hover:underline"
								>
									{activity.relation}
								</Link>
							) : (
								<span className="text-sm">{activity.relation}</span>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
