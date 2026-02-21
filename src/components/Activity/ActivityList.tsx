"use client";

import { ActivityItem, type Activity } from "./ActivityItem";
import { useAccountStore } from "@/lib/store/accountStore";
import type { EntityAudit } from "@/types/entityAudit";
import { useTranslation } from "react-i18next";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import Send from "@/icons/send.svg";
import Edit from "@/icons/edit.svg";
import { EmptyActionState } from "@/components/EmptyActionState";

interface ActivityListProps {
	activities?: Activity[];
}

const mapAction = (action: EntityAudit["action"]) => {
	if (action === "create") return "erstellt";
	if (action === "update") return "aktualisiert";
	return "löscht";
};

const mapEntityLabel = (audit: EntityAudit) => {
	return `${audit.entity_type} #${audit.entity_id}`;
};

const isNumericId = (value: string) => /^\d+$/.test(value);

const asObject = (value: unknown): Record<string, unknown> | null =>
	typeof value === "object" && value !== null
		? (value as Record<string, unknown>)
		: null;

type AuditRelationMeta = {
	correlationId?: string;
	rootEntityType?: string;
	rootEntityId?: string;
	intent?:
		| "submission_review_approved"
		| "submission_review_rejected"
		| "submission_review_completed";
};

const getAuditRelationMeta = (audit: EntityAudit): AuditRelationMeta => {
	const meta = asObject(audit.meta_info);
	if (!meta) return {};
	const correlationId =
		typeof meta.correlation_id === "string" && meta.correlation_id
			? meta.correlation_id
			: undefined;
	const rootEntityType =
		typeof meta.root_entity_type === "string" && meta.root_entity_type
			? meta.root_entity_type
			: undefined;
	const rootEntityId =
		typeof meta.root_entity_id === "string" && meta.root_entity_id
			? meta.root_entity_id
			: undefined;
	const intent =
		meta.intent === "submission_review_approved" ||
		meta.intent === "submission_review_rejected" ||
		meta.intent === "submission_review_completed"
			? meta.intent
			: undefined;
	return { correlationId, rootEntityType, rootEntityId, intent };
};

const isActorHidden = (audit: EntityAudit) => {
	const meta = asObject(audit.meta_info);
	return meta?.actor_hidden === true;
};

const formatAuditActor = (
	audit: EntityAudit,
	t: (key: string, options?: Record<string, unknown>) => string,
) => {
	if (audit.user) {
		const fullName = [audit.user.first_name, audit.user.last_name]
			.filter((part): part is string => Boolean(part && part.trim().length > 0))
			.join(" ");
		return fullName ? `${fullName} (${audit.user.email})` : audit.user.email;
	}
	if (isActorHidden(audit)) {
		return t("auth.account.activity.hiddenActor", {
			defaultValue: "Another user",
		});
	}
	return t("auth.account.activity.system");
};

const getAuditIntent = (
	audit: EntityAudit,
):
	| "submission_review_approved"
	| "submission_review_rejected"
	| "submission_review_completed"
	| null => {
	const meta = asObject(audit.meta_info);
	if (!meta) return null;
	const intent = meta.intent;
	if (
		intent === "submission_review_approved" ||
		intent === "submission_review_rejected" ||
		intent === "submission_review_completed"
	) {
		return intent;
	}
	return null;
};

const pickString = (
	record: Record<string, unknown> | null,
	key: string,
): string | null => {
	if (!record) return null;
	const value = record[key];
	return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const getSubmissionEntityTarget = (
	audit: EntityAudit,
): { entityType?: string; entityId?: string } => {
	if (audit.entity_type !== "submission") return {};

	let payload: Record<string, unknown> | null = null;
	if (asObject(audit.new_data)) {
		payload = asObject(audit.new_data);
	} else if (asObject(audit.old_data)) {
		payload = asObject(audit.old_data);
	}
	if (!payload) return {};

	const entityType =
		typeof payload.entity_type === "string" ? payload.entity_type : undefined;
	const rawEntityId = payload.entity_id;
	let entityId: string | undefined;
	if (typeof rawEntityId === "number") {
		entityId = String(rawEntityId);
	} else if (typeof rawEntityId === "string") {
		entityId = rawEntityId;
	} else {
		entityId = undefined;
	}

	return { entityType, entityId };
};

const getEntityName = (audit: EntityAudit): string | null => {
	const newData = asObject(audit.new_data);
	const oldData = asObject(audit.old_data);

	if (audit.entity_type === "institution") {
		return pickString(newData, "name") ?? pickString(oldData, "name");
	}

	if (audit.entity_type === "submission") {
		const payload = newData ?? oldData;
		const entityType = pickString(payload, "entity_type");
		const submissionData = asObject(payload?.data);
		if (entityType === "institution") {
			return pickString(submissionData, "name");
		}
		if (entityType === "category") {
			return pickString(submissionData, "key");
		}
	}

	return null;
};

const getStatusLabel = (
	status: string | undefined | null,
	t: (key: string, options?: Record<string, unknown>) => string,
) => {
	if (!status) return "-";
	if (status === "approval_pending") {
		return t("auth.account.activity.status.pending", {
			defaultValue: "Pending",
		});
	}
	if (status === "approved") {
		return t("auth.account.activity.status.approved", {
			defaultValue: "Approved",
		});
	}
	if (status === "rejected") {
		return t("auth.account.activity.status.rejected", {
			defaultValue: "Rejected",
		});
	}
	if (status === "completed") {
		return t("auth.account.activity.status.completed", {
			defaultValue: "Completed",
		});
	}
	return status;
};

const mapEntityLink = (
	audit: EntityAudit,
	toLocalePath: (path: string) => string,
) => {
	if (audit.action === "delete") return undefined;
	if (!isNumericId(audit.entity_id)) return undefined;
	const id = audit.entity_id;
	switch (audit.entity_type) {
		case "submission": {
			const { entityType, entityId } = getSubmissionEntityTarget(audit);
			if (entityType === "category" && entityId && isNumericId(entityId)) {
				return toLocalePath(`/account/categories/${entityId}/edit`);
			}
			if (entityType === "category") {
				return toLocalePath("/account/categories");
			}
			if (entityType === "institution" && id && isNumericId(id)) {
				return toLocalePath(`/account/submissions/${id}`);
			}
			return toLocalePath(`/account/submissions/${id}`);
		}
		case "institution":
			return toLocalePath(`/map/institution/${id}`);
		case "category":
			return toLocalePath(`/account/categories/${id}/edit`);
		case "group":
			return toLocalePath(`/account/groups/${id}/edit`);
		case "role":
			return toLocalePath(`/account/roles/${id}/edit`);
		case "user":
			return toLocalePath(`/account/users/${id}/edit`);
		default:
			return undefined;
	}
};

const toTimestamp = (value: Date | string) =>
	value instanceof Date ? value.getTime() : new Date(value).getTime();

const pickRelationAudit = (group: EntityAudit[], primary: EntityAudit) => {
	const candidates = group.filter((a) => a.id !== primary.id);
	if (candidates.length === 0) return undefined;

	const preferred = candidates
		.filter((a) => a.entity_type !== "submission" && a.action !== "delete")
		.sort((a, b) => toTimestamp(b.changed_at) - toTimestamp(a.changed_at))[0];
	if (preferred) return preferred;

	const fallback = candidates
		.filter((a) => a.action !== "delete")
		.sort((a, b) => toTimestamp(b.changed_at) - toTimestamp(a.changed_at))[0];
	if (fallback) return fallback;

	return candidates.sort(
		(a, b) => toTimestamp(b.changed_at) - toTimestamp(a.changed_at),
	)[0];
};

export function ActivityList({ activities }: ActivityListProps) {
	const { t } = useTranslation("common");
	const toLocalePath = useLocalePath();
	const entityAudits = useAccountStore((state) => state.entityAudits) ?? [];

	const mapAuditToActivity = (
		audit: EntityAudit,
		relationAudit?: EntityAudit,
		activityId?: string,
	): Activity => {
		const actor = formatAuditActor(audit, t);
		const intent = getAuditIntent(audit);
		const actionKey = intent ?? audit.action;
		const primarySource =
			intent === "submission_review_approved" && relationAudit
				? relationAudit
				: audit;
		let secondarySource: EntityAudit | undefined;
		if (relationAudit && relationAudit.id !== primarySource.id) {
			secondarySource = relationAudit;
		} else if (audit.id !== primarySource.id) {
			secondarySource = audit;
		} else {
			secondarySource = undefined;
		}
		const relationEntityLabel = secondarySource
			? t(`auth.account.activity.entities.${secondarySource.entity_type}`, {
					defaultValue: mapEntityLabel(secondarySource),
					id: secondarySource.entity_id,
					email: secondarySource.user?.email,
				})
			: undefined;
		const relationEntityName = secondarySource
			? getEntityName(secondarySource)
			: null;
		let relation: string | undefined;
		if (relationEntityLabel) {
			if (relationEntityName) {
				relation = t("auth.account.activity.itemWithName", {
					defaultValue: `${relationEntityLabel}: ${relationEntityName}`,
					item: relationEntityLabel,
					name: relationEntityName,
				});
			} else {
				relation = relationEntityLabel;
			}
		} else {
			relation = undefined;
		}
		const primaryBase = t(
			`auth.account.activity.entities.${primarySource.entity_type}`,
			{
				defaultValue: mapEntityLabel(primarySource),
				id: primarySource.entity_id,
				email: primarySource.user?.email,
			},
		);
		const primaryName = getEntityName(primarySource);
		const primaryEntity = primaryName
			? t("auth.account.activity.itemWithName", {
					defaultValue: `${primaryBase}: ${primaryName}`,
					item: primaryBase,
					name: primaryName,
				})
			: primaryBase;
		const oldData = asObject(audit.old_data);
		const newData = asObject(audit.new_data);
		const oldStatus =
			typeof oldData?.status === "string" ? oldData.status : undefined;
		const newStatus =
			typeof newData?.status === "string" ? newData.status : undefined;
		const hasStatusTransition = intent
			? audit.status !== "approval_pending"
			: Boolean(oldStatus && newStatus && oldStatus !== newStatus);
		const fromStatus = intent
			? getStatusLabel("approval_pending", t)
			: getStatusLabel(oldStatus, t);
		const toStatus = intent
			? getStatusLabel(audit.status, t)
			: getStatusLabel(newStatus ?? audit.status, t);
		let eventType: "status_change" | "assign" | "create";
		if (hasStatusTransition) {
			eventType = "status_change";
		} else if (relation) {
			eventType = "assign";
		} else {
			eventType = "create";
		}
		return {
			id: activityId,
			date: audit.changed_at,
			user: audit?.user || null,
			eventType,
			actor,
			primaryEntity,
			primaryEntityLink: mapEntityLink(primarySource, toLocalePath),
			secondaryEntity: relation,
			secondaryEntityLink: secondarySource
				? mapEntityLink(secondarySource, toLocalePath)
				: undefined,
			from: hasStatusTransition ? fromStatus : undefined,
			to: hasStatusTransition ? toStatus : undefined,
			action: t(`auth.account.activity.actions.${actionKey}`, {
				defaultValue: mapAction(audit.action),
			}),
			item: primaryEntity,
			itemLink: mapEntityLink(audit, toLocalePath),
			relation,
			relationLink: relationAudit
				? mapEntityLink(relationAudit, toLocalePath)
				: undefined,
			status: audit.status,
		};
	};

	const resolvedActivities =
		activities ??
		(() => {
			const grouped = new Map<string, EntityAudit[]>();
			const standalone: EntityAudit[] = [];
			for (const audit of entityAudits) {
				const meta = getAuditRelationMeta(audit);
				if (!meta.correlationId) {
					standalone.push(audit);
					continue;
				}
				const existing = grouped.get(meta.correlationId) ?? [];
				existing.push(audit);
				grouped.set(meta.correlationId, existing);
			}

			const groupedActivities = Array.from(grouped.values()).map((group) => {
				const first = group[0];
				const relationMeta = getAuditRelationMeta(first);
				const primary =
					group.find(
						(a) =>
							a.entity_type === relationMeta.rootEntityType &&
							a.entity_id === relationMeta.rootEntityId,
					) ?? group[0];
				const relationAudit = pickRelationAudit(group, primary);
				return {
					id: relationMeta.correlationId ?? `audit:${primary.id}`,
					changedAt:
						primary.changed_at instanceof Date
							? primary.changed_at.getTime()
							: new Date(primary.changed_at).getTime(),
					activity: mapAuditToActivity(
						primary,
						relationAudit,
						relationMeta.correlationId ?? `audit:${primary.id}`,
					),
				};
			});

			const standaloneActivities = standalone.map((audit) => ({
				id: `audit:${audit.id}`,
				changedAt:
					audit.changed_at instanceof Date
						? audit.changed_at.getTime()
						: new Date(audit.changed_at).getTime(),
				activity: mapAuditToActivity(audit, undefined, `audit:${audit.id}`),
			}));

			return [...groupedActivities, ...standaloneActivities]
				.sort((a, b) => b.changedAt - a.changedAt)
				.map((entry) => entry.activity);
		})();

	if (resolvedActivities.length === 0) {
		return (
			<EmptyActionState
				title={t("auth.account.activity.empty", "Keine Aktivitäten vorhanden.")}
				description={t("auth.account.activity.emptyHint", {
					defaultValue: "Sie haben noch keine Aktivitäten.",
				})}
				actions={[
					{
						icon: <Send />,
						label: t("auth.account.activity.emptyActions.claimLocations", {
							defaultValue: "Meine Orte anfragen",
						}),
						href: toLocalePath("/account/submissions/claim"),
					},
					{
						icon: <Edit />,
						label: t("auth.account.activity.emptyActions.contribute", {
							defaultValue: "Mitwirken",
						}),
						href: toLocalePath("/institution/submission"),
					},
				]}
			/>
		);
	}

	return (
		<div className="divide-y divide-border">
			{resolvedActivities.map((activity, index) => (
				<ActivityItem
					key={activity.id ?? `activity-${activity.date}-${index}`}
					activity={activity}
					index={index}
				/>
			))}
		</div>
	);
}
