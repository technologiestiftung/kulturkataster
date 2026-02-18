"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Trans, useTranslation } from "react-i18next";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
	User as DbUser,
	ActivityStatus as AuditActivityStatus,
} from "@/generated/prisma";

export type ActivityStatus = AuditActivityStatus;
export type ActivityEventType = "create" | "assign" | "status_change";

export interface Activity {
	id?: string;
	date: Date | string;
	user: DbUser | null;
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

const statusColors: Record<ActivityStatus, string> = {
	approval_pending: "bg-muted-foreground",
	approved: "bg-green-500",
	rejected: "bg-red-500",
	completed: "bg-blue-500",
};

const formatDate = (date: Date | string | null | undefined) => {
	if (!date) return "-";
	const parsed = date instanceof Date ? date : new Date(date);
	if (!Number.isFinite(parsed.getTime())) return "-";
	return new Intl.DateTimeFormat("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(parsed);
};

const formatDateTime = (date: Date | string | null | undefined) => {
	if (!date) return "-";
	const parsed = date instanceof Date ? date : new Date(date);
	if (!Number.isFinite(parsed.getTime())) return "-";
	return new Intl.DateTimeFormat("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(parsed);
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
		const key = `${prefix}.${status}`;
		const translated = tEnum(key, { ns: "enumMap" });
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
		const translated = tContent(contentKey, { ns: "content" });
		if (translated !== contentKey) return translated;
	}

	const commonStatusKeyMap: Record<string, string> = {
		approval_pending: "auth.account.activity.status.pending",
		approved: "auth.account.activity.status.approved",
		rejected: "auth.account.activity.status.rejected",
		completed: "auth.account.activity.status.completed",
	};
	const commonKey = commonStatusKeyMap[status];
	if (commonKey) {
		const translated = tCommon(commonKey, { ns: "common" });
		if (translated !== commonKey) return translated;
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
	const { t } = useTranslation("common");
	const { t: tContent } = useTranslation("content");
	const { t: tEnum } = useTranslation("enumMap");
	const statusLabel = mapStatusLabel(activity.status, t, tContent, tEnum);
	const fromLabel =
		typeof activity.from === "string" && activity.from.trim().length > 0
			? mapStatusLabel(activity.from, t, tContent, tEnum)
			: "-";
	const toLabel =
		typeof activity.to === "string" && activity.to.trim().length > 0
			? mapStatusLabel(activity.to, t, tContent, tEnum)
			: "-";
	const dateLabel = formatDate(activity.date);
	const dateTimeLabel = formatDateTime(activity.date);
	const formattedName = activity.user
		? [activity.user.first_name, activity.user.last_name]
				.filter((part): part is string =>
					Boolean(part && part.trim().length > 0),
				)
				.join(" ")
		: "";
	let fallbackActor: string;
	if (!activity.user) {
		fallbackActor = t("auth.account.activity.system");
	} else if (formattedName) {
		fallbackActor = `${formattedName} (${activity.user.email})`;
	} else {
		fallbackActor = activity.user.email;
	}
	const actor = activity.actor ?? fallbackActor;
	const eventType = activity.eventType;
	const primaryEntity =
		activity.primaryEntity ??
		activity.item ??
		t("auth.account.activity.unknown");
	const secondaryEntity = activity.secondaryEntity ?? activity.relation;
	const hasStatusDiff =
		typeof activity.from === "string" &&
		typeof activity.to === "string" &&
		activity.from.trim().length > 0 &&
		activity.to.trim().length > 0 &&
		activity.from !== "-" &&
		activity.to !== "-";

	let action = activity.action;
	if (!action) {
		if (eventType === "assign") {
			action = t("auth.account.activity.actions.update", {
				defaultValue: "assigned",
			});
		} else if (eventType === "status_change") {
			action = t("auth.account.activity.actions.update", {
				defaultValue: "changed",
			});
		} else {
			action = t("auth.account.activity.actions.create", {
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
					i18nKey="auth.account.activity.templates.assign"
					defaults="<actor>{{actor}}</actor> {{action}} <secondary>{{secondaryEntity}}</secondary> to <primary>{{primaryEntity}}</primary>"
					values={{ actor, action, secondaryEntity, primaryEntity }}
					components={{
						actor: <span className="body3" />,
						secondary: secondaryNode,
						primary: primaryNode,
					}}
				/>
			);
		}

		if (eventType === "status_change") {
			if (secondaryEntity) {
				if (!hasStatusDiff) {
					return (
						<Trans
							i18nKey="auth.account.activity.templates.statusChangeWithSecondaryNoDiff"
							defaults="<actor>{{actor}}</actor> hat <primary>{{primaryEntity}}</primary> für <secondary>{{secondaryEntity}}</secondary> {{action}}"
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
						i18nKey="auth.account.activity.templates.statusChangeWithSecondary"
						defaults="<actor>{{actor}}</actor> changed <primary>{{primaryEntity}}</primary> status from <from>{{from}}</from> to <to>{{to}}</to> for <secondary>{{secondaryEntity}}</secondary>"
							values={{
								actor,
								action,
								primaryEntity,
								secondaryEntity,
								from: fromLabel,
								to: toLabel,
							}}
						components={{
							actor: <span className="body3" />,
							primary: primaryNode,
							from: <span className="body3 font-bold" />,
							to: <span className="body3 font-bold" />,
							secondary: secondaryNode,
						}}
					/>
				);
			}
			if (!hasStatusDiff) {
				return (
					<Trans
						i18nKey="auth.account.activity.templates.statusChangeNoDiff"
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
					i18nKey="auth.account.activity.templates.statusChange"
					defaults="<actor>{{actor}}</actor> {{action}} <primary>{{primaryEntity}}</primary> status from <from>{{from}}</from> to <to>{{to}}</to>"
						values={{
							actor,
							action,
							primaryEntity,
							from: fromLabel,
							to: toLabel,
						}}
					components={{
						actor: <span className="body3" />,
						primary: primaryNode,
						from: <span className="body3 font-bold" />,
						to: <span className="body3 font-bold" />,
					}}
				/>
			);
		}

		return (
			<Trans
				i18nKey="auth.account.activity.templates.create"
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
							statusColors[activity.status],
						)}
						aria-label={t("auth.account.activity.statusAria", {
							status: statusLabel,
							defaultValue: `Status: ${statusLabel}`,
						})}
					/>
				</TooltipTrigger>
				<TooltipContent side="top">{statusLabel}</TooltipContent>
			</Tooltip>

			<div className="flex-1 min-w-0">
				<div className="flex items-baseline gap-2 flex-wrap">
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="body3 font-bold cursor-help">{dateLabel}</span>
						</TooltipTrigger>
						<TooltipContent side="top">{dateTimeLabel}</TooltipContent>
					</Tooltip>
					<span className="body3">•</span>
					{renderEventMessage()}
				</div>
			</div>
		</div>
	);
}
