"use client";

import type { ComponentType } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PrivateBadge } from "@/components/shared/PrivateBadge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
	FormWrapperFieldConfig,
	PermissionAction,
} from "@/components/FormWrapper/types";
import DownloadIcon from "@/icons/download.svg";
import EditIcon from "@/icons/edit.svg";
import EyeIcon from "@/icons/eye.svg";
import PlusIcon from "@/icons/plus.svg";
import TrashIcon from "@/icons/trash.svg";

type FieldPermissionRow = {
	key: string;
	label: string;
	relationLabel?: string;
	relationShortLabel?: string;
	isRelationField?: boolean;
};

type FieldPermissionsConfig = {
	sections: {
		id: string;
		title: string;
		fields: FieldPermissionRow[];
	}[];
	actions?: PermissionAction[];
	actionLabels?: Partial<Record<PermissionAction, string>>;
	fieldLabel?: string;
	reorderable?: boolean;
	reorderLabel?: string;
	onReorderFields?: (sectionId: string, fields: FieldPermissionRow[]) => void;
};

type FieldPermissionsFieldProps = {
	field: FormWrapperFieldConfig;
	fieldPermissions: FieldPermissionsConfig;
	value: unknown;
	updateField: (name: string, value: unknown) => void;
	isPrivate: boolean;
	resolvedPrivateDescription: string;
};

const toggleFieldPermissionValue = (
	currentValue: Record<string, PermissionAction[]>,
	key: string,
	action: PermissionAction,
) => {
	const currentActions = new Set(currentValue[key] ?? []);
	if (currentActions.has(action)) {
		currentActions.delete(action);
	} else {
		currentActions.add(action);
	}

	const nextValue = { ...currentValue };
	if (currentActions.size === 0) {
		delete nextValue[key];
	} else {
		nextValue[key] = Array.from(currentActions);
	}

	return nextValue;
};

const toggleSectionPermissionValue = (
	permissionValue: Record<string, PermissionAction[]>,
	sectionKeys: string[],
	action: PermissionAction,
) => {
	const nextValue = { ...permissionValue };
	const isAllChecked = sectionKeys.every((key) =>
		(nextValue[key] ?? []).includes(action),
	);

	sectionKeys.forEach((key) => {
		const current = new Set(nextValue[key] ?? []);
		if (isAllChecked) {
			current.delete(action);
		} else {
			current.add(action);
		}
		if (current.size === 0) {
			delete nextValue[key];
		} else {
			nextValue[key] = Array.from(current);
		}
	});

	return nextValue;
};

const reorderFieldPermissionRows = (
	fields: FieldPermissionRow[],
	sourceKey: string,
	targetKey: string,
) => {
	if (sourceKey === targetKey) return fields;
	const sourceIndex = fields.findIndex((field) => field.key === sourceKey);
	const targetIndex = fields.findIndex((field) => field.key === targetKey);
	if (sourceIndex === -1 || targetIndex === -1) return fields;

	const nextFields = [...fields];
	const [movedField] = nextFields.splice(sourceIndex, 1);
	nextFields.splice(targetIndex, 0, movedField);
	return nextFields;
};

const getActionLabel = (
	action: PermissionAction,
	labels: Partial<Record<PermissionAction, string>> | undefined,
) => labels?.[action] ?? action;

const flattenFieldPermissionRows = (
	sections: FieldPermissionsConfig["sections"],
): FieldPermissionRow[] =>
	sections.flatMap((section) =>
		section.fields.map((field) => {
			const isRelationField =
				field.isRelationField ??
				(section.id !== "institution" && section.id !== "all");
			return {
				...field,
				relationLabel:
					field.relationLabel ?? (isRelationField ? section.title : undefined),
				isRelationField,
			};
		}),
	);

const toFieldPermissionRows = (fields: FieldPermissionRow[]) =>
	fields.map(({ key, label }) => ({ key, label }));

const permissionActionIcons = {
	read: EyeIcon,
	create: PlusIcon,
	update: EditIcon,
	delete: TrashIcon,
	download: DownloadIcon,
} satisfies Record<PermissionAction, ComponentType<{ className?: string }>>;

export function FieldPermissionsField({
	field,
	fieldPermissions,
	value,
	updateField,
	isPrivate,
	resolvedPrivateDescription,
}: FieldPermissionsFieldProps) {
	const actions = fieldPermissions.actions ?? [
		"read",
		"create",
		"update",
		"delete",
		"download",
	];
	const permissionValue = (value as Record<string, PermissionAction[]>) ?? {};
	const canReorder = Boolean(fieldPermissions.reorderable) && !field.disabled;
	const actionLabels = fieldPermissions.actionLabels;
	const fields = flattenFieldPermissionRows(fieldPermissions.sections);
	const fieldKeys = fields.map((item) => item.key);

	const toggleAllFieldsAction = (action: PermissionAction) => {
		if (field.disabled) return;
		updateField(
			field.name,
			toggleSectionPermissionValue(permissionValue, fieldKeys, action),
		);
	};

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center justify-between gap-2">
				<Label className="">{field.label}</Label>
				{isPrivate ? (
					<PrivateBadge hoverDescription={resolvedPrivateDescription} />
				) : null}
			</div>
			<div className="mt-4 overflow-x-auto rounded-md border border-input bg-background">
				<table className="border-collapse w-full">
					<thead className="bg-neutral-5 text-foreground">
						<tr className="text-left">
							{canReorder && (
								<th className="border-b border-input px-3 py-2 w-12">
									<span className="sr-only">
										{fieldPermissions.reorderLabel ?? "Reorder"}
									</span>
								</th>
							)}
							<th className="border-b border-input px-3 py-2">
								{fieldPermissions.fieldLabel ?? "Field"}
							</th>
							{actions.map((action) => {
								const ActionIcon = permissionActionIcons[action];

								return (
									<th
										key={action}
										className="border-b border-input px-3 py-2 text-center"
									>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-neutral-80 transition-colors hover:bg-neutral-10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
													aria-label={getActionLabel(action, actionLabels)}
													onClick={() => toggleAllFieldsAction(action)}
													disabled={field.disabled}
												>
													<ActionIcon className="h-4 w-4" />
												</button>
											</TooltipTrigger>
											<TooltipContent side="top">
												{getActionLabel(action, actionLabels)}
											</TooltipContent>
										</Tooltip>
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody className="[&>tr:last-child>td]:border-b-0 [&>tr:nth-child(even)]:bg-neutral-5/60">
						{fields.map((fieldItem) => (
							<tr
								key={fieldItem.key}
								className="border-input"
								draggable={canReorder}
								onDragStart={(event) => {
									if (!canReorder) return;
									event.dataTransfer.setData("text/plain", fieldItem.key);
									event.dataTransfer.effectAllowed = "move";
								}}
								onDragOver={(event) => {
									if (!canReorder) return;
									event.preventDefault();
									event.dataTransfer.dropEffect = "move";
								}}
								onDrop={(event) => {
									if (!canReorder) return;
									event.preventDefault();
									const sourceKey = event.dataTransfer.getData("text/plain");
									const reorderedFields = reorderFieldPermissionRows(
										fields,
										sourceKey,
										fieldItem.key,
									);
									fieldPermissions.onReorderFields?.(
										"all",
										toFieldPermissionRows(reorderedFields),
									);
								}}
							>
								{canReorder && (
									<td className="border-b border-input px-3 py-2 text-center text-neutral-70 cursor-grab">
										::
									</td>
								)}
								<td className="border-b border-input px-3 py-2 text-neutral-80">
									<div className="flex items-center gap-2">
										{fieldItem.relationLabel ? (
											<Tooltip>
												<TooltipTrigger asChild>
													<span className="caption inline-flex min-w-8 items-center justify-center whitespace-nowrap rounded-sm bg-neutral-10 px-1.5 py-0.5 text-neutral-70">
														{fieldItem.relationShortLabel ??
															fieldItem.relationLabel}
													</span>
												</TooltipTrigger>
												<TooltipContent side="top">
													{fieldItem.relationLabel}
												</TooltipContent>
											</Tooltip>
										) : null}
										<span>{fieldItem.label}</span>
									</div>
								</td>
								{actions.map((action) => {
									const checkboxId = `${field.name}-${fieldItem.key}-${action}`;
									const isChecked =
										permissionValue[fieldItem.key]?.includes(action) ?? false;
									return (
										<td
											key={action}
											className="border-b border-input px-3 py-2 text-center"
										>
											<div className="flex items-center justify-center">
												<Checkbox
													id={checkboxId}
													checked={isChecked}
													onCheckedChange={() =>
														updateField(
															field.name,
															toggleFieldPermissionValue(
																permissionValue,
																fieldItem.key,
																action,
															),
														)
													}
													disabled={field.disabled}
												/>
											</div>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
