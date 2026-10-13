"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Trans, useTranslation } from "react-i18next";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatUserDisplayName } from "@/lib/utils/userName";
import { formatDateWithLocale } from "@/lib/utils/dateUtils";
import type {
	User as DbUser,
	ActivityStatus as AuditActivityStatus,
} from "@/generated/prisma";

export type ActivityStatus =
	| AuditActivityStatus
	| "active"
	| "inactive"
	| "banned";
export type ActivityEventType = "create" | "assign" | "status_change";

export interface Activity {
	id?: string;
	date: Date | string;
	user: DbUser | null;
	entityType?: string;
	eventType?: ActivityEventType;
	actor?: string;
	primaryEntity?: string;
	primaryEntityLink?: string;
	secondaryEntity?: string;
	secondaryEntityLink?: string;
	from?: string;
	to?: string;
	action?: string;
	item?: string;
	itemLink?: string;
	relation?: string;
	relationLink?: string;
	status: ActivityStatus;
}

interface ActivityItemProps {
	activity: Activity;
	index: number;
}

const statusColors: Record<string, string> = {
	approval_pending: "bg-muted-foreground",
	approved: "bg-green-500",
	rejected: "bg-red-500",
	completed: "bg-blue-500",
	active: "bg-green-500",
	inactive: "bg-neutral-50",
	banned: "bg-red-500",
};

const mapStatusLabel = (
	status: string,
	tCommon: (
		key: string,
		options?: { defaultValue?: string; ns?: string },
	) => string,
	tContent: (
		key: string,
		options?: { defaultValue?: string; ns?: string },
	) => string,
	tEnum: (
		key: string,
		options?: { defaultValue?: string; ns?: string },
	) => string,
) => {
	const enumPrefixes = [
		"submission_status",
		"institution_status",
		"utilization_status",
		"protection_status",
	] as const;
	for (const prefix of enumPrefixes) {
		const key = `enumMap.${prefix}.${status}`;
		const translated = tEnum(key);
		if (translated !== key) return translated;
	}

	const contentStatusKeyMap: Record<string, string> = {
		active: "userFormModal.status.active",
		inactive: "userFormModal.status.inactive",
		banned: "userFormModal.status.banned",
		approval_pending: "userFormModal.status.approvalPending",
	};
	const contentKey = contentStatusKeyMap[status];
	if (contentKey) {
		const fullContentKey = `content.${contentKey}`;
		const translated = tContent(fullContentKey);
		if (translated !== fullContentKey) return translated;
	}

	const commonStatusKeyMap: Record<string, string> = {
		approval_pending: "auth.account.activity.status.pending",
		approved: "auth.account.activity.status.approved",
		rejected: "auth.account.activity.status.rejected",
		completed: "auth.account.activity.status.completed",
	};
	const commonKey = commonStatusKeyMap[status];
	if (commonKey) {
		const fullCommonKey = `common.${commonKey}`;
		const translated = tCommon(fullCommonKey);
		if (translated !== fullCommonKey) return translated;
	}

	const defaults: Record<string, string> = {
		invited: "Eingeladen",
		pending: "Ausstehend",
		needs_changes: "Änderungen erforderlich",
		draft: "Entwurf",
		public: "Öffentlich",
		private: "Privat",
		archived: "Archiviert",
		removal_pending: "Löschung beantragt",
	};
	if (defaults[status]) return defaults[status];

	return status.replace(/_/g, " ");
};

export function ActivityItem({ activity, index }: ActivityItemProps) {
	const { t, i18n } = useTranslation();
	const { t: tContent } = useTranslation();
	const { t: tEnum } = useTranslation();
	const statusLabel = mapStatusLabel(activity.status, t, tContent, tEnum);
	const dateTimeLabel = formatDateWithLocale(activity.date, {
		locale: i18n.resolvedLanguage,
		format: {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		},
	});
	const fallbackActor =
		formatUserDisplayName(activity.user) ??
		t("common.auth.account.activity.system");
	const actor = activity.actor ?? fallbackActor;
	const eventType = activity.eventType;
	const primaryEntity =
		activity.primaryEntity ??
		activity.item ??
		t("common.auth.account.activity.unknown");
	const secondaryEntity = activity.secondaryEntity ?? activity.relation;

	let action = activity.action;
	if (!action) {
		if (eventType === "assign") {
			action = t("common.auth.account.activity.actions.update", {
				defaultValue: "assigned",
			});
		} else if (eventType === "status_change") {
			action = t("common.auth.account.activity.actions.update", {
				defaultValue: "changed",
			});
		} else {
			action = t("common.auth.account.activity.actions.create", {
				defaultValue: "created",
			});
		}
	}

	const primaryNode =
		(activity.primaryEntityLink ?? activity.itemLink) ? (
			<Link
				href={activity.primaryEntityLink ?? activity.itemLink ?? "#"}
				className="body3 font-bold underline text-primary"
			>
				{primaryEntity}
			</Link>
		) : (
			<span className="body3 font-bold">{primaryEntity}</span>
		);

	let secondaryNode: React.ReactNode;
	if (!secondaryEntity) {
		secondaryNode = <span className="body3 font-bold">-</span>;
	} else if (activity.secondaryEntityLink ?? activity.relationLink) {
		secondaryNode = (
			<Link
				href={activity.secondaryEntityLink ?? activity.relationLink ?? "#"}
				className="body3 font-bold underline text-primary"
			>
				{secondaryEntity}
			</Link>
		);
	} else {
		secondaryNode = <span className="body3 font-bold">{secondaryEntity}</span>;
	}

	const renderEventMessage = () => {
		if (eventType === "assign") {
			return (
				<Trans
					i18nKey="common.auth.account.activity.templates.assignBasedOn"
					defaults="<actor>{{actor}}</actor> hat <primary>{{primaryEntity}}</primary> auf Basis von <secondary>{{secondaryEntity}}</secondary> {{action}}"
					values={{ actor, action, secondaryEntity, primaryEntity }}
					components={{
						actor: <span className="body3" />,
						primary: primaryNode,
						secondary: secondaryNode,
					}}
				/>
			);
		}

		if (eventType === "status_change") {
			if (secondaryEntity) {
				return (
					<Trans
						i18nKey="common.auth.account.activity.templates.statusChangeBasedOnSecondaryNoDiff"
						defaults="<actor>{{actor}}</actor> hat <primary>{{primaryEntity}}</primary> auf Basis von <secondary>{{secondaryEntity}}</secondary> {{action}}"
						values={{
							actor,
							action,
							primaryEntity,
							secondaryEntity,
						}}
						components={{
							actor: <span className="body3" />,
							primary: primaryNode,
							secondary: secondaryNode,
						}}
					/>
				);
			}
			return (
				<Trans
					i18nKey="common.auth.account.activity.templates.statusChangeNoDiff"
					defaults="<actor>{{actor}}</actor> hat <primary>{{primaryEntity}}</primary> {{action}}"
					values={{
						actor,
						action,
						primaryEntity,
					}}
					components={{
						actor: <span className="body3" />,
						primary: primaryNode,
					}}
				/>
			);
		}

		return (
			<Trans
				i18nKey="common.auth.account.activity.templates.create"
				defaults="<actor>{{actor}}</actor> {{action}} <primary>{{primaryEntity}}</primary>"
				values={{ actor, action, primaryEntity }}
				components={{
					actor: <span className="body3" />,
					primary: primaryNode,
				}}
			/>
		);
	};

	return (
		<div
			className={cn(
				"flex items-center gap-3 p-3",
				index % 2 === 0 ? "bg-neutral-0" : "bg-neutral-5",
			)}
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						className={cn(
							"w-4 h-4 rounded-full flex-shrink-0 cursor-help",
							statusColors[activity.status] ?? "bg-blue-500",
						)}
						aria-hidden="true"
					/>
				</TooltipTrigger>
				<TooltipContent side="top">{statusLabel}</TooltipContent>
			</Tooltip>
			<span className="sr-only">
				{t("common.auth.account.activity.statusAria", {
					status: statusLabel,
					defaultValue: `Status: ${statusLabel}`,
				})}
			</span>

			<div className="flex-1 min-w-0">
				<div className="body3 flex items-baseline gap-1 text-wrap flex-wrap">
					<span className="font-bold">{dateTimeLabel}</span>
					<span className="">•</span>
					{renderEventMessage()}
				</div>
			</div>
		</div>
	);
}
