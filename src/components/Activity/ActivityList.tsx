"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityItem, type Activity } from "./ActivityItem";
import { useAccountStore } from "@/lib/store/accountStore";
import type { EntityAudit } from "@/types/entityAudit";
import { useTranslation } from "react-i18next";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { formatUserDisplayName } from "@/lib/utils/userName";
import { SearchInput } from "@/components/ui/search-input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Send from "@/icons/send.svg";
import Edit from "@/icons/edit.svg";
import { EmptyActionState } from "@/components/EmptyActionState";
import { ActivityListSkeleton } from "./ActivityListSkeleton";

interface ActivityListProps {
	activities?: Activity[];
	isLoading?: boolean;
}

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
		return formatUserDisplayName(audit.user) ?? audit.user.email;
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

const getEntityEmail = (audit: EntityAudit): string | null => {
	if (audit.entity_type !== "user") return null;
	const newData = asObject(audit.new_data);
	const oldData = asObject(audit.old_data);
	return (
		pickString(newData, "email") ??
		pickString(oldData, "email") ??
		(typeof audit.user?.email === "string" && audit.user.email.trim().length > 0
			? audit.user.email
			: null)
	);
};

const getEntityAccountType = (audit: EntityAudit): string | null => {
	if (audit.entity_type !== "user") return null;
	const newData = asObject(audit.new_data);
	const oldData = asObject(audit.old_data);
	const accountType =
		pickString(newData, "account_type") ??
		pickString(oldData, "account_type") ??
		(typeof audit.user?.account_type === "string" &&
		audit.user.account_type.trim().length > 0
			? audit.user.account_type
			: null);
	return accountType?.trim() || null;
};

const getUserEntityStatus = (audit: EntityAudit): string | null => {
	if (audit.entity_type !== "user") return null;
	const newData = asObject(audit.new_data);
	const oldData = asObject(audit.old_data);
	return pickString(newData, "status") ?? pickString(oldData, "status");
};

const getAccountTypeLabel = (
	accountType: string,
	t: (key: string, options?: Record<string, unknown>) => string,
) => {
	if (accountType === "organization") {
		return t("auth.register.accountTypeOrganization", {
			defaultValue: "Mitarbeiter*in einer Organisation",
		});
	}
	if (accountType === "district") {
		return t("auth.register.accountTypeDistrict", {
			defaultValue: "Mitarbeiter*in eines Bezirks",
		});
	}
	if (accountType === "administration") {
		return t("auth.register.accountTypeAdministration", {
			defaultValue: "Mitarbeiter*in des Landes Berlin",
		});
	}
	return accountType;
};

const getSubmissionInstitutionId = (
	audit: EntityAudit | undefined,
): string | null => {
	if (!audit || audit.entity_type !== "submission") return null;
	const newData = asObject(audit.new_data);
	const oldData = asObject(audit.old_data);
	const payload = newData ?? oldData;
	const directValue = payload?.entity_id;
	if (typeof directValue === "number" && Number.isFinite(directValue)) {
		return String(directValue);
	}
	if (typeof directValue === "string" && directValue.trim().length > 0) {
		return directValue.trim();
	}
	return null;
};

const formatEntityLabel = (
	audit: EntityAudit,
	t: (key: string, options?: Record<string, unknown>) => string,
) => {
	if (audit.entity_type === "user") {
		const userLabel = t("auth.account.activity.entities.user", {
			defaultValue: "Nutzer*in",
		});
		const email = getEntityEmail(audit);
		return email
			? t("auth.account.activity.entities.userWithEmail", {
					defaultValue: `${userLabel} (${email})`,
					entity: userLabel,
					email,
				})
			: userLabel;
	}
	const translatedType = t(
		`auth.account.activity.entities.${audit.entity_type}`,
		{
			defaultValue: audit.entity_type,
		},
	);
	return `${translatedType} #${audit.entity_id}`;
};

const normalizeEntityText = (value: string) =>
	value
		.replace(/\(\s*\)/g, "")
		.replace(/\s{2,}/g, " ")
		.trim();

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

const getEventTypeLabel = (
	eventType: Activity["eventType"] | undefined,
	t: (key: string, options?: Record<string, unknown>) => string,
) => {
	if (eventType === "status_change") {
		return t("auth.account.activity.filters.typeValue.status_change", {
			defaultValue: "Statuswechsel",
		});
	}
	if (eventType === "assign") {
		return t("auth.account.activity.filters.typeValue.assign", {
			defaultValue: "Zuweisung",
		});
	}
	return t("auth.account.activity.filters.typeValue.create", {
		defaultValue: "Erstellt/Aktualisiert",
	});
};

const getEntityTypeLabel = (
	entityType: string,
	t: (key: string, options?: Record<string, unknown>) => string,
) =>
	t(`auth.account.activity.entities.${entityType}`, {
		defaultValue: entityType,
	});

const isActivityWithinDatePreset = (
	date: Date | string,
	preset: string,
	now: Date,
) => {
	if (preset === "all") return true;
	const parsed = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(parsed.getTime())) return false;

	if (preset === "today") {
		return parsed.toDateString() === now.toDateString();
	}
	if (preset === "last_7_days") {
		const lowerBound = new Date(now);
		lowerBound.setDate(now.getDate() - 7);
		return parsed >= lowerBound;
	}
	if (preset === "last_30_days") {
		const lowerBound = new Date(now);
		lowerBound.setDate(now.getDate() - 30);
		return parsed >= lowerBound;
	}
	if (preset === "this_month") {
		return (
			parsed.getFullYear() === now.getFullYear() &&
			parsed.getMonth() === now.getMonth()
		);
	}
	if (preset === "last_month") {
		const lastMonthDate = new Date(now);
		lastMonthDate.setMonth(now.getMonth() - 1);
		return (
			parsed.getFullYear() === lastMonthDate.getFullYear() &&
			parsed.getMonth() === lastMonthDate.getMonth()
		);
	}
	return true;
};

const mapEntityLink = (
	audit: EntityAudit,
	toLocalePath: (path: string) => string,
	canOpenSubmission: (id: number) => boolean,
	canReadAllUsers: boolean,
	currentUserId?: string | null,
) => {
	if (audit.action === "delete") return undefined;
	const id = audit.entity_id;
	if (audit.entity_type !== "user" && !isNumericId(id)) return undefined;
	switch (audit.entity_type) {
		case "submission": {
			const numericSubmissionId = Number(id);
			if (
				Number.isFinite(numericSubmissionId) &&
				canOpenSubmission(numericSubmissionId)
			) {
				return toLocalePath(`/account/submissions/${id}`);
			}
			return undefined;
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
			if (canReadAllUsers) {
				return toLocalePath(`/account/users/${id}/edit`);
			}
			return typeof id === "string" && currentUserId === id
				? toLocalePath("/account/edit")
				: undefined;
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

export function ActivityList({
	activities,
	isLoading = false,
}: ActivityListProps) {
	const { t } = useTranslation("common");
	const toLocalePath = useLocalePath();
	const [hasHydrated, setHasHydrated] = useState(() =>
		useAccountStore.persist.hasHydrated(),
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");
	const [entityTypeFilter, setEntityTypeFilter] = useState("all");
	const [actorFilter, setActorFilter] = useState("all");
	const [dateFilter, setDateFilter] = useState("all");
	const entityAudits = useAccountStore((state) => state.entityAudits) ?? [];
	const currentProfile = useAccountStore((state) => state.currentProfile);
	const users = useAccountStore((state) => state.users) ?? [];
	const submissions = useAccountStore((state) => state.submissions) ?? [];
	const currentUserId = currentProfile?.id ?? null;
	const canReadAllUsers = useMemo(() => {
		if (!currentProfile) return false;
		const currentUser =
			users.find((user) => user.id === currentProfile.id) ??
			users.find((user) => user.email === currentProfile.email);
		return Boolean(
			currentUser?.role?.table_permissions?.some(
				(permission) =>
					permission.table === "user" &&
					permission.action === "read" &&
					(permission.scope ?? "own") === "all",
			),
		);
	}, [currentProfile, users]);
	const submissionIdSet = useMemo(
		() => new Set(submissions.map((submission) => submission.id)),
		[submissions],
	);
	const deletedSubmissionIdSet = useMemo(() => {
		const deletedIds = entityAudits
			.filter(
				(audit) =>
					audit.entity_type === "submission" && audit.action === "delete",
			)
			.map((audit) => Number(audit.entity_id))
			.filter(Number.isFinite);
		return new Set(deletedIds);
	}, [entityAudits]);
	const canOpenSubmission = useCallback(
		(id: number) => {
			if (deletedSubmissionIdSet.has(id)) return false;
			if (submissionIdSet.has(id)) return true;
			return true;
		},
		[deletedSubmissionIdSet, submissionIdSet],
	);

	useEffect(() => {
		if (useAccountStore.persist.hasHydrated()) {
			setHasHydrated(true);
			return;
		}

		return useAccountStore.persist.onFinishHydration(() => {
			setHasHydrated(true);
		});
	}, []);

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
			? formatEntityLabel(secondarySource, t)
			: undefined;
		const relationEntityName = secondarySource
			? getEntityName(secondarySource)
			: null;
		let relation: string | undefined;
		if (relationEntityLabel) {
			if (relationEntityName) {
				relation = normalizeEntityText(
					t("auth.account.activity.itemWithName", {
						defaultValue: `${relationEntityLabel}: ${relationEntityName}`,
						item: relationEntityLabel,
						name: relationEntityName,
					}),
				);
			} else {
				relation = normalizeEntityText(relationEntityLabel);
			}
		} else {
			relation = undefined;
		}
		const primaryBase = formatEntityLabel(primarySource, t);
		const primaryName = getEntityName(primarySource);
		const primaryEntity = primaryName
			? normalizeEntityText(
					t("auth.account.activity.itemWithName", {
						defaultValue: `${primaryBase}: ${primaryName}`,
						item: primaryBase,
						name: primaryName,
					}),
				)
			: normalizeEntityText(primaryBase);
		const oldData = asObject(audit.old_data);
		const newData = asObject(audit.new_data);
		const oldStatus =
			typeof oldData?.status === "string" ? oldData.status : undefined;
		const newStatus =
			typeof newData?.status === "string" ? newData.status : undefined;
		const hasStatusTransition = intent
			? false
			: Boolean(oldStatus && newStatus && oldStatus !== newStatus);
		const fromStatus = intent
			? getStatusLabel("approval_pending", t)
			: getStatusLabel(oldStatus, t);
		const toStatus = intent
			? getStatusLabel(audit.status, t)
			: getStatusLabel(newStatus ?? audit.status, t);
		const normalizedRelation =
			relation && relation === primaryEntity ? undefined : relation;
		const isApprovedUserSubmissionAssignment =
			intent === "submission_review_approved" &&
			primarySource.entity_type === "user" &&
			secondarySource?.entity_type === "submission";
		let displayPrimaryEntity = primaryEntity;
		let displayPrimaryEntityLink = mapEntityLink(
			primarySource,
			toLocalePath,
			canOpenSubmission,
			canReadAllUsers,
			currentUserId,
		);
		let displayEntityType = primarySource.entity_type;
		if (isApprovedUserSubmissionAssignment) {
			const institutionId = getSubmissionInstitutionId(secondarySource);
			const institutionLabel = t("auth.account.activity.entities.institution", {
				defaultValue: "Kulturort",
			});
			const userLabel = normalizeEntityText(
				formatEntityLabel(primarySource, t),
			);
			const institutionEntity = institutionId
				? `${institutionLabel} #${institutionId}`
				: institutionLabel;
			displayPrimaryEntity = `${institutionEntity} dem ${userLabel} hinzugefügt`;
			displayEntityType = "institution";
			if (institutionId && isNumericId(institutionId)) {
				displayPrimaryEntityLink = toLocalePath(
					`/map/institution/${institutionId}`,
				);
			}
		}
		let eventType: "status_change" | "assign" | "create";
		if (hasStatusTransition) {
			eventType = "status_change";
		} else if (normalizedRelation) {
			eventType = "assign";
		} else {
			eventType = "create";
		}
		return {
			id: activityId,
			date: audit.changed_at,
			user: audit?.user || null,
			entityType: displayEntityType,
			eventType,
			actor,
			primaryEntity: displayPrimaryEntity,
			primaryEntityLink: displayPrimaryEntityLink,
			secondaryEntity: normalizedRelation,
			secondaryEntityLink: secondarySource
				? mapEntityLink(
						secondarySource,
						toLocalePath,
						canOpenSubmission,
						canReadAllUsers,
						currentUserId,
					)
				: undefined,
			from: hasStatusTransition ? fromStatus : undefined,
			to: hasStatusTransition ? toStatus : undefined,
			action: (() => {
				const baseAction = t(`auth.account.activity.actions.${actionKey}`, {
					defaultValue: t(`auth.account.activity.actions.${audit.action}`, {
						defaultValue: audit.action,
					}),
				});
				const accountType = getEntityAccountType(primarySource);
				if (primarySource.entity_type !== "user" || !accountType) {
					return baseAction;
				}
				return t("auth.account.activity.actions.withAccountType", {
					defaultValue: `${baseAction} (${getAccountTypeLabel(accountType, t)})`,
					action: baseAction,
					accountType: getAccountTypeLabel(accountType, t),
				});
			})(),
			item: primaryEntity,
			itemLink: mapEntityLink(
				audit,
				toLocalePath,
				canOpenSubmission,
				canReadAllUsers,
				currentUserId,
			),
			relation: normalizedRelation,
			relationLink: secondarySource
				? mapEntityLink(
						secondarySource,
						toLocalePath,
						canOpenSubmission,
						canReadAllUsers,
						currentUserId,
					)
				: undefined,
			status: (getUserEntityStatus(primarySource) ??
				audit.status) as Activity["status"],
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

	if (isLoading || (!activities && !hasHydrated)) {
		return <ActivityListSkeleton showFilters />;
	}

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

	const statusOptions = Array.from(
		new Set(resolvedActivities.map((activity) => activity.status)),
	);
	const typeOptions = Array.from(
		new Set(
			resolvedActivities.map(
				(activity) => activity.eventType ?? ("create" as const),
			),
		),
	);
	const actorOptions = Array.from(
		new Set(
			resolvedActivities
				.map((activity) => activity.actor?.trim() ?? "")
				.filter((value) => value.length > 0),
		),
	).sort((a, b) => a.localeCompare(b, "de"));
	const entityTypeOptions = Array.from(
		new Set(
			resolvedActivities
				.map((activity) => activity.entityType?.trim() ?? "")
				.filter((value) => value.length > 0),
		),
	).sort((a, b) =>
		getEntityTypeLabel(a, t).localeCompare(getEntityTypeLabel(b, t), "de"),
	);
	const filteredActivities = resolvedActivities.filter((activity) => {
		if (statusFilter !== "all" && activity.status !== statusFilter)
			return false;
		const eventType = activity.eventType ?? "create";
		if (typeFilter !== "all" && eventType !== typeFilter) return false;
		const entityType = activity.entityType?.trim() ?? "";
		if (entityTypeFilter !== "all" && entityType !== entityTypeFilter)
			return false;
		const actor = activity.actor?.trim() ?? "";
		if (actorFilter !== "all" && actor !== actorFilter) return false;
		if (!isActivityWithinDatePreset(activity.date, dateFilter, new Date())) {
			return false;
		}

		const query = searchQuery.trim().toLowerCase();
		if (!query) return true;
		const searchable = [
			actor,
			activity.primaryEntity ?? activity.item ?? "",
			activity.secondaryEntity ?? activity.relation ?? "",
			activity.action ?? "",
			activity.status ?? "",
		]
			.join(" ")
			.toLowerCase();
		return searchable.includes(query);
	});

	const renderListContent = () => {
		if (filteredActivities.length === 0) {
			return (
				<div className="py-8 body3 text-muted-foreground">
					{t("auth.account.activity.filters.empty", {
						defaultValue: "Keine Aktivitäten für die aktuellen Filter.",
					})}
				</div>
			);
		}

		return filteredActivities.map((activity, index) => (
			<div
				key={activity.id ?? `activity-${activity.date}-${index}`}
				className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
				style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
			>
				<ActivityItem activity={activity} index={index} />
			</div>
		));
	};

	return (
		<div className="space-y-4">
			<div className="gap-3 md:grid-cols-2 xl:grid-cols-6 md:grid hidden">
				<SearchInput
					value={searchQuery}
					onChange={(event) => setSearchQuery(event.target.value)}
					placeholder={t("auth.account.activity.filters.search", {
						defaultValue: "Aktivität durchsuchen",
					})}
					containerClassName="w-full"
				/>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger variant="pill">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("auth.account.activity.filters.allStatuses", {
								defaultValue: "Alle Status",
							})}
						</SelectItem>
						{statusOptions.map((status) => (
							<SelectItem key={status} value={status}>
								{getStatusLabel(status, t)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={typeFilter} onValueChange={setTypeFilter}>
					<SelectTrigger variant="pill">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("auth.account.activity.filters.allTypes", {
								defaultValue: "Alle Typen",
							})}
						</SelectItem>
						{typeOptions.map((eventType) => (
							<SelectItem key={eventType} value={eventType}>
								{getEventTypeLabel(eventType, t)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
					<SelectTrigger variant="pill">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("auth.account.activity.filters.allEntities", {
								defaultValue: "Alle Entitäten",
							})}
						</SelectItem>
						{entityTypeOptions.map((entityType) => (
							<SelectItem key={entityType} value={entityType}>
								{getEntityTypeLabel(entityType, t)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={actorFilter} onValueChange={setActorFilter}>
					<SelectTrigger variant="pill">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("auth.account.activity.filters.allUsers", {
								defaultValue: "Alle Nutzer*innen",
							})}
						</SelectItem>
						{actorOptions.map((actor) => (
							<SelectItem key={actor} value={actor}>
								{actor}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={dateFilter} onValueChange={setDateFilter}>
					<SelectTrigger variant="pill">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("auth.account.activity.filters.allDates", {
								defaultValue: "Alle",
							})}
						</SelectItem>
						<SelectItem value="today">
							{t("auth.account.activity.filters.dateValue.today", {
								defaultValue: "Heute",
							})}
						</SelectItem>
						<SelectItem value="last_7_days">
							{t("auth.account.activity.filters.dateValue.last7Days", {
								defaultValue: "Letzte 7 Tage",
							})}
						</SelectItem>
						<SelectItem value="last_30_days">
							{t("auth.account.activity.filters.dateValue.last30Days", {
								defaultValue: "Letzte 30 Tage",
							})}
						</SelectItem>
						<SelectItem value="this_month">
							{t("auth.account.activity.filters.dateValue.thisMonth", {
								defaultValue: "Dieser Monat",
							})}
						</SelectItem>
						<SelectItem value="last_month">
							{t("auth.account.activity.filters.dateValue.lastMonth", {
								defaultValue: "Letzter Monat",
							})}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="divide-y divide-border">{renderListContent()}</div>
		</div>
	);
}
