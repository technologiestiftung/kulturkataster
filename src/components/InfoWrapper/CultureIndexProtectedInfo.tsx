import type { Institution } from "@/types";
import { getFieldLabel } from "@/lib/i18n/fieldLabels";
import { getCultureIndexRangeForValue } from "@/lib/constants/cultureIndexRanges";
import { PrivateBadge } from "@/components/shared/PrivateBadge";

const DIMENSION_KEYS = [
	"location",
	"property",
	"financial",
	"socialSpatial",
	"visibility",
	"global",
] as const;

type CultureIndexProtectedInfoProps = {
	data: Partial<Institution>;
	t: (key: string) => string;
};

export function CultureIndexProtectedInfo({
	data,
	t,
}: CultureIndexProtectedInfoProps) {
	const cultureIndexRange =
		typeof data.culture_index === "number"
			? getCultureIndexRangeForValue(data.culture_index)
			: null;
	const cultureIndexDisplay = cultureIndexRange
		? `${data.culture_index} - ${t(`content.filter.cultureIndex.ranges.${cultureIndexRange}`)}`
		: "—";

	return (
		<div className="flex flex-col gap-4 rounded-sm bg-neutral-10 p-4">
			<div className="flex flex-col gap-0">
				<strong className="body2">{getFieldLabel(t, "culture_index")}:</strong>
				<strong className="body2">{cultureIndexDisplay}</strong>
			</div>
			<PrivateBadge />
			<div className="flex flex-col gap-2">
				{DIMENSION_KEYS.map((key) => (
					<span key={key} className="body2">
						{t(`common.institution.cultureIndexDimensions.${key}`)}: XX
					</span>
				))}
			</div>
		</div>
	);
}
