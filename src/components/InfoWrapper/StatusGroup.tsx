import { cn } from "@/lib/utils";
import type { Institution } from "@/types";
import { getFieldLabel, getFieldOptionLabel } from "@/lib/i18n/fieldLabels";
import { getStatusCircleClass } from "./statusTone";

type StatusGroupProps = {
	data: Partial<Institution>;
	t: (key: string) => string;
};

type Row = {
	key: string;
	circleClass: string;
	label: string;
	value: string;
};

export function StatusGroup({ data, t }: StatusGroupProps) {
	const rows: Row[] = [];

	if (data.utilization_status) {
		rows.push({
			key: "utilization_status",
			circleClass: getStatusCircleClass(data.utilization_status),
			label: getFieldLabel(t, "utilization_status"),
			value: getFieldOptionLabel(
				t,
				"utilization_status",
				data.utilization_status,
			),
		});
	}

	if (data.protection_status) {
		rows.push({
			key: "protection_status",
			circleClass: getStatusCircleClass(data.protection_status),
			label: getFieldLabel(t, "protection_status"),
			value: getFieldOptionLabel(
				t,
				"protection_status",
				data.protection_status,
			),
		});
	}

	if (rows.length === 0) return null;

	return (
		<div className="bg-secondary">
			{rows.map((row, index) => (
				<div key={row.key}>
					{index > 0 && <div className="mx-2 h-px bg-neutral-40" />}
					<div className="flex items-center w-full gap-2 p-2 flex-wrap">
						<div className={cn("w-4 h-4 rounded-full", row.circleClass)} />
						<strong className="body2">{row.label}:</strong>
						<span className="body2 font-medium">{row.value}</span>
					</div>
				</div>
			))}
		</div>
	);
}
