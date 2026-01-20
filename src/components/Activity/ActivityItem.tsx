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
	index: number;
}

const statusColors: Record<ActivityStatus, string> = {
	pending: "bg-muted-foreground",
	approved: "bg-green-500",
	rejected: "bg-red-500",
	completed: "bg-blue-500",
};

export function ActivityItem({ activity, index }: ActivityItemProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 p-3",
				index % 2 === 0 ? "bg-neutral-0" : "bg-neutral-5",
			)}
		>
			<div
				className={cn(
					"w-4 h-4 rounded-full flex-shrink-0",
					statusColors[activity.status],
				)}
				aria-label={`Status: ${activity.status}`}
			/>

			<div className="flex-1 min-w-0">
				<div className="flex items-baseline gap-2 flex-wrap">
					<span className="body3 font-bold">{activity.date}</span>
					<span className="body3">•</span>
					<span className="body3">{activity.action}</span>
					{activity.itemLink ? (
						<Link
							href={activity.itemLink}
							className="body3 font-bold underline text-primary "
						>
							{activity.item}
						</Link>
					) : (
						<span className="body3 font-bold ">{activity.item}</span>
					)}

					{activity.relation && (
						<>
							<span className="body3 mx-1">in</span>
							{activity.relationLink ? (
								<Link
									href={activity.relationLink}
									className="body3 hover:underline"
								>
									{activity.relation}
								</Link>
							) : (
								<span className="body3">{activity.relation}</span>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
