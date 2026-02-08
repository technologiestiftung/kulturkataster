import { useTranslation } from "react-i18next";
import { getStatusLevel } from "./types";
import { PrivateBadge } from "./PrivateBadge";

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
	const { t: tEnum } = useTranslation("enumMap");

	if (!value || typeof value !== "string") return null;
	const labelKey = `${enumKey}.${value}`;
	const showCircle = variant === "plain" || !label;
	const isPositive = getStatusLevel(value) === "positive";

	const wrapperClassName =
		variant === "plain"
			? "flex items-center w-full gap-2 p-4 flex-wrap bg-secondary"
			: `flex items-center w-full gap-2 p-4 flex-wrap ${
					label && isPositive ? "bg-brand-light" : "bg-alert"
				}`;

	return (
		<div className={wrapperClassName}>
			{showCircle && (
				<div
					className={`w-4 h-4 rounded-full ${
						isPositive ? "bg-brand-default" : "bg-alert"
					}`}
				/>
			)}
			{label && <strong className="body2">{label}:</strong>}
			<span className="body2 font-medium">{tEnum(labelKey)}</span>
			{isPrivate ? <PrivateBadge /> : null}
			<div className="ml-auto flex items-center gap-2">{action}</div>
		</div>
	);
}
