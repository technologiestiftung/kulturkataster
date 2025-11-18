import { Badge } from "@/components/ui/badge";
import type { UserAccessDetails } from "../types";

interface SourceBadgeProps {
	source: UserAccessDetails["source"];
}

export function SourceBadge({ source }: SourceBadgeProps) {
	const sourceLabels = {
		"group-inherited": "Von Gruppe",
		"individual-override": "Individuell",
		mixed: "Gemischt",
	};

	const sourceVariants = {
		"group-inherited": "secondary",
		"individual-override": "outline",
		mixed: "default",
	} as const;

	return (
		<Badge variant={sourceVariants[source]} className="text-xs ml-2">
			{sourceLabels[source]}
		</Badge>
	);
}
