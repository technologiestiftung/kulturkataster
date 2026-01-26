import { useTranslation } from "react-i18next";
import { Status } from "./types";

export function StatusItem({
	value,
	label,
	enumKey,
	variant = "default",
}: {
	value: Status | undefined;
	label: string | undefined;
	enumKey: string | undefined;
	variant?: "default" | "plain";
}) {
	const { t: tEnum } = useTranslation("enumMap");

	if (!value || typeof value !== "string") return null;
	const labelKey = `${enumKey}.${value}`;
	const showCircle = variant === "plain" || !label;
	const wrapperClassName =
		variant === "plain"
			? "flex items-center w-full gap-2 p-4 flex-wrap bg-secondary"
			: `flex items-center w-full gap-2 p-4 flex-wrap ${
					label && value === "L0" ? "bg-brand-light" : "bg-alert"
				}`;

	return (
		<div className={wrapperClassName}>
			{showCircle && (
				<div
					className={`w-4 h-4 rounded-full ${
						value === "L0" ? "bg-brand-default" : "bg-alert"
					}`}
				/>
			)}
			{label && <strong className="body2">{label}:</strong>}
			<span className="body2 font-medium">{tEnum(labelKey)}</span>
		</div>
	);
}
