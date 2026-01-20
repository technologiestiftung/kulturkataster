"use client";

import { ActivityItem, type Activity } from "./ActivityItem";

interface ActivityListProps {
	activities: Activity[];
	emptyMessage?: string;
}

export function ActivityList({
	activities,
	emptyMessage = "No activities yet",
}: ActivityListProps) {
	if (activities.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				{emptyMessage}
			</div>
		);
	}

	return (
		<div className="divide-y divide-border">
			{activities.map((activity, index) => (
				<ActivityItem key={index} activity={activity} index={index} />
			))}
		</div>
	);
}
