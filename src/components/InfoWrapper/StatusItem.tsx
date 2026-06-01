import { useTranslation } from "react-i18next";
import { PrivateBadge } from "../shared/PrivateBadge";
import { getFieldOptionLabel } from "@/lib/i18n/fieldLabels";
import { getStatusAccentClass, getStatusCircleClass } from "./statusTone";

export function StatusItem({
	value,
	label,
	enumKey,
	variant = "default",
	isPrivate = false,
	action,
}: {
	value: string;
	label: string | undefined;
	enumKey: string | undefined;
	variant?: "default" | "plain";
	isPrivate?: boolean;
	action?: React.ReactNode;
}) {
	const { t: tEnum } = useTranslation();

	if (!value || typeof value !== "string") return null;
	const showCircle = variant === "plain" || !label;
	const accentClass = getStatusAccentClass(value);
	const circleClass = getStatusCircleClass(value);

	const wrapperClassName =
		variant === "plain"
			? "flex items-center w-full gap-2 p-4 flex-wrap bg-secondary"
			: `flex items-center w-full gap-2 p-4 flex-wrap ${
					label ? accentClass : "bg-secondary"
				}`;

	return (
		<div className={wrapperClassName}>
			{showCircle && <div className={`w-4 h-4 rounded-full ${circleClass}`} />}
			{label && <strong className="body2">{label}:</strong>}
			<span className="body2 font-medium">
				{enumKey ? getFieldOptionLabel(tEnum, enumKey, value) : value}
			</span>
			{isPrivate ? <PrivateBadge /> : null}
			<div className="ml-auto flex items-center gap-2">{action}</div>
		</div>
	);
}
