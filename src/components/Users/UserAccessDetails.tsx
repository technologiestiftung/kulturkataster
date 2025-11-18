import type { UserAccessDetails as UserAccessDetailsType } from "./types";
import { SourceBadge } from "./shared";

interface UserAccessDetailsProps {
	access: UserAccessDetailsType;
}

export function UserAccessDetails({ access }: UserAccessDetailsProps) {
	if (access.type === "inherit") {
		return (
			<div className="text-xs text-muted-foreground mt-1 flex items-center">
				<span>Access inherited from groups</span>
				<SourceBadge source={access.source} />
			</div>
		);
	}

	if (access.type === "custom" && access.customInstitutions) {
		return (
			<div className="text-xs text-muted-foreground mt-1 flex items-center">
				<span>{access.customInstitutions.map((i) => i.name).join(", ")}</span>
				<SourceBadge source={access.source} />
			</div>
		);
	}

	return (
		<div className="text-xs text-muted-foreground mt-1 flex items-center">
			<span>Custom access configured</span>
			<SourceBadge source={access.source} />
		</div>
	);
}
