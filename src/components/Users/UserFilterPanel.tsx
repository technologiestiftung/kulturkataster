"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { UserStatus } from "@/generated/prisma";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import type { SelectOption } from "@/components/FormWrapper/types";
import { Card } from "@/components/ui/card";

export type UserFilters = {
	status: "all" | UserStatus;
	role: "all" | string;
	groups: string[];
};

type UserFilterPanelProps = {
	value: UserFilters;
	roleOptions: SelectOption[];
	groupOptions: SelectOption[];
	getStatusLabel: (status: UserStatus) => string;
	onChange: (next: UserFilters) => void;
	onApply: () => void;
	onReset: () => void;
	onCancel: () => void;
};

export function UserFilterPanel({
	value,
	roleOptions,
	groupOptions,
	getStatusLabel,
	onChange,
	onApply,
	onReset,
	onCancel,
}: UserFilterPanelProps) {
	const { t } = useTranslation();

	const formKey = useMemo(() => JSON.stringify(value), [value]);

	const config = useMemo<FormWrapperConfig>(
		() => ({
			formId: "users-table-filter-form",
			className: "grid-cols-1 gap-4",
			fields: [
				{
					name: "status",
					label: t("content.userTable.columns.status"),
					type: "select",
					options: [
						{
							label: t("content.userTable.filter.allStatuses"),
							value: "all",
						},
						{ label: getStatusLabel("active"), value: "active" },
						{
							label: getStatusLabel("approval_pending"),
							value: "approval_pending",
						},
						{ label: getStatusLabel("inactive"), value: "inactive" },
						{ label: getStatusLabel("banned"), value: "banned" },
					],
				},
				{
					name: "role",
					label: t("content.userTable.columns.role"),
					type: "select",
					options: roleOptions,
				},
				{
					name: "groups",
					label: t("content.userTable.columns.groups"),
					type: "multiselect",
					multiselectVariant: "list",
					options: groupOptions,
					emptyText: t("content.userTable.emptyValue"),
				},
			],

			initialValues: value,
			onChange: (data) => {
				onChange({
					status:
						typeof data.status === "string"
							? (data.status as UserFilters["status"])
							: "all",
					role:
						typeof data.role === "string"
							? (data.role as "all" | string)
							: "all",
					groups: Array.isArray(data.groups)
						? (data.groups.filter(
								(item) => typeof item === "string",
							) as string[])
						: [],
				});
			},
			onSubmit: () => {
				onApply();
			},
			showCancel: true,
			cancelLabel: t("common.cancel"),
			onCancel,
			submitLabel: t("content.userTable.filter.apply", {
				defaultValue: "Apply",
			}),
			deleteAction: {
				label: t("content.userTable.filter.reset", { defaultValue: "Reset" }),
				onClick: onReset,
				className: "p-0!",
			},
		}),
		[
			getStatusLabel,
			groupOptions,
			onApply,
			onCancel,
			onChange,
			onReset,
			roleOptions,
			t,
			value,
		],
	);

	return (
		<Card variant="filter">
			<FormWrapper key={formKey} config={config} />
		</Card>
	);
}
