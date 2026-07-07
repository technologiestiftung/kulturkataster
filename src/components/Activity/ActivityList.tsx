"use client";

import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { ActivityItem, type Activity } from "./ActivityItem";
import { useAccountStore } from "@/lib/store/accountStore";
import type { EntityAudit } from "@/types/entityAudit";
import { useTranslation } from "react-i18next";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { formatUserDisplayName } from "@/lib/utils/userName";
import Send from "@/icons/send.svg";
import Edit from "@/icons/edit.svg";
import { EmptyActionState } from "@/components/EmptyActionState";
import { ActivityListSkeleton } from "./ActivityListSkeleton";
import { ActivityFilters } from "./ActivityFilters";
import { getEntityAuditsPage } from "@/server/actions/entityAudits";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

interface ActivityListProps {
	activities?: Activity[];
	isLoading?: boolean;
}

const INITIAL_ACTIVITY_AUDIT_PAGE_SIZE = 200;
const ACTIVITY_AUDIT_LOAD_MORE_PAGE_SIZE = 100;
const ACTIVITY_VIRTUALIZATION_THRESHOLD = 40;
const ACTIVITY_VIRTUAL_ROW_ESTIMATE = 64;
const ACTIVITY_VIRTUAL_OVERSCAN = 10;

const getAuditChangedAtMs = (audit: EntityAudit) =>
	audit.changed_at instanceof Date
		? audit.changed_at.getTime()
		: new Date(audit.changed_at).getTime();

const sortEntityAuditsDesc = (a: EntityAudit, b: EntityAudit) => {
	const changedAtDiff = getAuditChangedAtMs(b) - getAuditChangedAtMs(a);
	return changedAtDiff !== 0 ? changedAtDiff : b.id - a.id;
};

const mergeEntityAudits = (audits: EntityAudit[]) => {
	const merged = new Map<number, EntityAudit>();
	for (const audit of audits) {
		merged.set(audit.id, audit);
	}
	return Array.from(merged.values()).sort(sortEntityAuditsDesc);
};

const getActivityKey = (activity: Activity, index: number) =>
	activity.id ?? `activity-${String(activity.date)}-${index}`;

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

const getDownloadAuditMeta = (audit: EntityAudit) => {
	const meta = asObject(audit.meta_info);
	if (!meta || meta.download_event !== true) return null;
	const downloadType =
		typeof meta.download_type === "string" ? meta.download_type : null;
	if (downloadType !== "institution_export") return null;
	const requesterName =
		typeof meta.requester_name === "string" &&
		meta.requester_name.trim() &&
		meta.requester_name !== "Unknown"
			? meta.requester_name
			: null;
	const requesterEmail =
		typeof meta.requester_email === "string" && meta.requester_email.trim()
			? meta.requester_email
			: null;
	return {
		downloadType,
		requesterName,
		requesterEmail,
	};
};

const formatAuditActor = (
	audit: EntityAudit,
	t: (key: string, options?: Record<string, unknown>) => string,
) => {
	if (audit.user) {
		return formatUserDisplayName(audit.user) ?? audit.user.email;
	}
	if (isActorHidden(audit)) {
		return t("common.auth.account.activity.hiddenActor", {
			defaultValue: "Another user",
		});
	}
	return t("common.auth.account.activity.system");
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

const hasSubmissionReviewIntent = (audit: EntityAudit) =>
	getAuditIntent(audit) !== null;

const pickString = (
	record: Record<string, unknown> | null,
	key: string,
): string | null => {
	if (!record) return null;
	const value = record[key];
	return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const pickId = (
	record: Record<string, unknown> | null,
	key = "id",
): string | null => {
	if (!record) return null;
	const value = record[key];
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	if (typeof value === "string" && value.trim().length > 0) return value.trim();
	return null;
};

const firstBulkRow = (audit: EntityAudit): Record<string, unknown> | null => {
	if (audit.entity_id !== "bulk") return null;
	const rows = audit.old_data;
	if (!Array.isArray(rows) || rows.length === 0) return null;
	return asObject(rows[0]);
};

const getEntityName = (audit: EntityAudit): string | null => {
	const newData = asObject(audit.new_data);
	const oldData = asObject(audit.old_data);

	if (audit.entity_type === "institution") {
		return pickString(newData, "name") ?? pickString(oldData, "name");
	}

	if (audit.entity_type === "submission") {
		const bulkRow = firstBulkRow(audit);
		// For updateMany audits new_data is {args,result}, not the row itself —
		// prefer the first old row which is the actual submission record.
		const payload = bulkRow ?? newData ?? oldData;
		const entityType = pickString(payload, "entity_type");
		const submissionData = asObject(payload?.data);
		if (entityType === "institution") {
			return (
				pickString(submissionData, "name") ??
				pickString(asObject(submissionData?.originalInstitution), "name")
			);
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
		return t("common.auth.register.accountTypeOrganization", {
			defaultValue: "Mitarbeiter*in einer Organisation",
		});
	}
	if (accountType === "district") {
		return t("common.auth.register.accountTypeDistrict", {
			defaultValue: "Mitarbeiter*in eines Bezirks",
		});
	}
	if (accountType === "administration") {
		return t("common.auth.register.accountTypeAdministration", {
			defaultValue: "Mitarbeiter*in des Landes Berlin",
		});
	}
	return accountType;
};

const resolveSubmissionPayload = (
	audit: EntityAudit,
): Record<string, unknown> | null =>
	firstBulkRow(audit) ?? asObject(audit.new_data) ?? asObject(audit.old_data);

const getSubmissionInstitutionId = (
	audit: EntityAudit | undefined,
): string | null => {
	if (!audit || audit.entity_type !== "submission") return null;
	const payload = resolveSubmissionPayload(audit);
	const directValue = payload?.entity_id;
	if (typeof directValue === "number" && Number.isFinite(directValue)) {
		return String(directValue);
	}
	if (typeof directValue === "string" && directValue.trim().length > 0) {
		return directValue.trim();
	}
	return null;
};

const getSubmissionTypeLabel = (
	audit: EntityAudit,
	t: (key: string, options?: Record<string, unknown>) => string,
): string | null => {
	if (audit.entity_type !== "submission") return null;
	const payload = resolveSubmissionPayload(audit);
	const submissionType = pickString(payload, "type");
	if (!submissionType) return null;
	return t(`common.auth.account.activity.submissionTypes.${submissionType}`, {
		defaultValue: submissionType,
	});
};

const getSubmissionEntityTypeLabel = (
	audit: EntityAudit,
	t: (key: string, options?: Record<string, unknown>) => string,
): string | null => {
	if (audit.entity_type !== "submission") return null;
	const payload = resolveSubmissionPayload(audit);
	const submissionEntityType = pickString(payload, "entity_type");
	if (!submissionEntityType) return null;
	return t(`common.auth.account.activity.entities.${submissionEntityType}`, {
		defaultValue: submissionEntityType,
	});
};

const formatEntityLabel = (
	audit: EntityAudit,
	t: (key: string, options?: Record<string, unknown>) => string,
) => {
	if (audit.entity_type === "user") {
		const userLabel = t("common.auth.account.activity.entities.user", {
			defaultValue: "Nutzer*in",
		});
		const email = getEntityEmail(audit);
		return email
			? t("common.auth.account.activity.entities.userWithEmail", {
					defaultValue: `${userLabel} (${email})`,
					entity: userLabel,
					email,
				})
			: userLabel;
	}
	const translatedType = t(
		`common.auth.account.activity.entities.${audit.entity_type}`,
		{
			defaultValue: audit.entity_type,
		},
	);
	if (audit.entity_type === "submission") {
		const submissionTypeLabel = getSubmissionTypeLabel(audit, t);
		const submissionEntityTypeLabel = getSubmissionEntityTypeLabel(audit, t);
		// For bulk audits resolve the real numeric id from the first old row.
		const resolvedId =
			audit.entity_id !== "bulk"
				? audit.entity_id
				: (pickId(firstBulkRow(audit)) ?? null);

		const typeSuffix = submissionTypeLabel ? ` (${submissionTypeLabel})` : "";
		const entitySuffix = submissionEntityTypeLabel
			? ` [${submissionEntityTypeLabel}]`
			: "";
		const idSuffix = resolvedId ? ` #${resolvedId}` : "";
		return `${translatedType}${typeSuffix}${entitySuffix}${idSuffix}`;
	}
	const resolvedId =
		audit.entity_id !== "bulk"
			? audit.entity_id
			: (pickId(firstBulkRow(audit)) ?? null);
	const idSuffix = resolvedId ? ` #${resolvedId}` : "";
	return `${translatedType}${idSuffix}`;
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
		return t("common.auth.account.activity.status.pending", {
			defaultValue: "Pending",
		});
	}
	if (status === "active") {
		return t("common.categoryFormModal.status.active", {
			defaultValue: "Active",
		});
	}
	if (status === "inactive") {
		return t("common.categoryFormModal.status.inactive", {
			defaultValue: "Inactive",
		});
	}
	if (status === "banned") {
		return t("content.userFormModal.status.banned", {
			defaultValue: "Blocked",
		});
	}
	if (status === "approved") {
		return t("common.auth.account.activity.status.approved", {
			defaultValue: "Approved",
		});
	}
	if (status === "rejected") {
		return t("common.auth.account.activity.status.rejected", {
			defaultValue: "Rejected",
		});
	}
	if (status === "completed") {
		return t("common.auth.account.activity.status.completed", {
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
		return t("common.auth.account.activity.filters.typeValue.status_change", {
			defaultValue: "Statuswechsel",
		});
	}
	if (eventType === "assign") {
		return t("common.auth.account.activity.filters.typeValue.assign", {
			defaultValue: "Zuweisung",
		});
	}
	return t("common.auth.account.activity.filters.typeValue.create", {
		defaultValue: "Erstellt/Aktualisiert",
	});
};

const getEntityTypeLabel = (
	entityType: string,
	t: (key: string, options?: Record<string, unknown>) => string,
) =>
	t(`common.auth.account.activity.entities.${entityType}`, {
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
	canCreateInstitutions?: boolean,
	canUpdateInstitutions?: boolean,
	canReviewSubmissions?: boolean,
) => {
	if (audit.action === "delete") return undefined;
	// For updateMany audits resolve the real id from the first old row.
	const rawId = audit.entity_id;
	const id = rawId === "bulk" ? (pickId(firstBulkRow(audit)) ?? rawId) : rawId;
	if (audit.entity_type !== "user" && !isNumericId(id)) return undefined;
	switch (audit.entity_type) {
		case "submission": {
			const numericSubmissionId = Number(id);
			if (
				Number.isFinite(numericSubmissionId) &&
				canOpenSubmission(numericSubmissionId)
			) {
				const payload = resolveSubmissionPayload(audit);
				const submissionType = pickString(payload, "type");
				const submissionEntityType = pickString(payload, "entity_type");
				const base = `/account/submissions/${id}`;
				const isInstitutionCreateOrUpdate =
					submissionEntityType === "institution" &&
					(submissionType === "create" || submissionType === "update");
				if (isInstitutionCreateOrUpdate && canReviewSubmissions === true) {
					return toLocalePath(base);
				}
				const useEditRoute =
					isInstitutionCreateOrUpdate &&
					((submissionType === "create" && canCreateInstitutions === true) ||
						(submissionType === "update" && canUpdateInstitutions === true));
				return toLocalePath(useEditRoute ? `${base}/edit` : base);
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
	const { t } = useTranslation();
	const toLocalePath = useLocalePath();
	const previousVisibleActivitySignatureRef = useRef<string | null>(null);
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
	const [olderEntityAudits, setOlderEntityAudits] = useState<EntityAudit[]>([]);
	const [hasMoreAudits, setHasMoreAudits] = useState(
		() =>
			!activities && entityAudits.length >= INITIAL_ACTIVITY_AUDIT_PAGE_SIZE,
	);
	const [isLoadingMoreAudits, setIsLoadingMoreAudits] = useState(false);
	const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
	const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
	const listContainerRef = useRef<HTMLDivElement | null>(null);
	const previousActivityUserIdRef = useRef<string | null | undefined>(
		undefined,
	);
	const measuredRowHeightsRef = useRef(new Map<string, number>());
	const [listScrollMargin, setListScrollMargin] = useState(0);
	const mergedEntityAudits = useMemo(
		() => mergeEntityAudits([...entityAudits, ...olderEntityAudits]),
		[entityAudits, olderEntityAudits],
	);
	const currentUserId = currentProfile?.id ?? null;
	const currentUser = useMemo(
		() =>
			users.find((user) => user.id === currentProfile?.id) ??
			users.find((user) => user.email === currentProfile?.email),
		[currentProfile, users],
	);
	const canReadAllUsers = useMemo(() => {
		if (!currentProfile) return false;
		return Boolean(
			currentUser?.role?.table_permissions?.some(
				(permission) =>
					permission.table === "user" &&
					permission.action === "read" &&
					(permission.scope ?? "own") === "all",
			),
		);
	}, [currentProfile, currentUser]);
	const institutionPermissions = useAccountStore(
		(state) => state.institutionPermissions,
	);
	const canCreateInstitutions = institutionPermissions?.create ?? false;
	const canUpdateInstitutions = institutionPermissions?.update ?? false;
	const canReviewSubmissions =
		institutionPermissions?.reviewSubmission ?? false;
	const submissionIdSet = useMemo(
		() => new Set(submissions.map((submission) => submission.id)),
		[submissions],
	);
	const deletedSubmissionIdSet = useMemo(() => {
		const deletedIds = mergedEntityAudits
			.filter(
				(audit) =>
					audit.entity_type === "submission" && audit.action === "delete",
			)
			.map((audit) => Number(audit.entity_id))
			.filter(Number.isFinite);
		return new Set(deletedIds);
	}, [mergedEntityAudits]);
	const canOpenSubmission = useCallback(
		(id: number) => {
			if (deletedSubmissionIdSet.has(id)) return false;
			if (submissionIdSet.has(id)) return true;
			return true;
		},
		[deletedSubmissionIdSet, submissionIdSet],
	);

	const oldestLoadedAudit = useMemo(
		() => mergedEntityAudits[mergedEntityAudits.length - 1] ?? null,
		[mergedEntityAudits],
	);

	useEffect(() => {
		if (previousActivityUserIdRef.current === undefined) {
			previousActivityUserIdRef.current = currentUserId;
			return;
		}
		if (previousActivityUserIdRef.current === currentUserId) return;
		previousActivityUserIdRef.current = currentUserId;
		setOlderEntityAudits([]);
		setHasMoreAudits(
			!activities && entityAudits.length >= INITIAL_ACTIVITY_AUDIT_PAGE_SIZE,
		);
		setLoadMoreError(null);
	}, [activities, currentUserId, entityAudits.length]);

	const loadMoreAudits = useCallback(async () => {
		if (
			activities ||
			isLoadingMoreAudits ||
			!hasMoreAudits ||
			!oldestLoadedAudit
		) {
			return;
		}
		setIsLoadingMoreAudits(true);
		setLoadMoreError(null);
		try {
			const changedAt = oldestLoadedAudit.changed_at;
			const result = await getEntityAuditsPage({
				beforeChangedAt:
					changedAt instanceof Date
						? changedAt.toISOString()
						: new Date(changedAt).toISOString(),
				beforeId: oldestLoadedAudit.id,
				take: ACTIVITY_AUDIT_LOAD_MORE_PAGE_SIZE,
			});
			setOlderEntityAudits((prev) => [...prev, ...result.audits]);
			setHasMoreAudits(result.hasMore);
		} catch {
			setLoadMoreError(
				t("common.auth.account.activity.loadMore.error", {
					defaultValue: "Weitere Aktivitaeten konnten nicht geladen werden.",
				}),
			);
		} finally {
			setIsLoadingMoreAudits(false);
		}
	}, [activities, hasMoreAudits, isLoadingMoreAudits, oldestLoadedAudit, t]);

	useEffect(() => {
		if (activities || !hasMoreAudits || isLoadingMoreAudits) return;
		const target = loadMoreSentinelRef.current;
		if (!target || typeof IntersectionObserver === "undefined") return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					void loadMoreAudits();
				}
			},
			{ rootMargin: "600px 0px" },
		);
		observer.observe(target);
		return () => observer.disconnect();
	}, [activities, hasMoreAudits, isLoadingMoreAudits, loadMoreAudits]);

	const mapAuditToActivity = useCallback(
		(
			audit: EntityAudit,
			relationAudit?: EntityAudit,
			activityId?: string,
		): Activity => {
			const downloadMeta = getDownloadAuditMeta(audit);
			if (downloadMeta) {
				const payload = asObject(audit.new_data);
				const format =
					typeof payload?.format === "string"
						? payload.format.toUpperCase()
						: "";
				const institutionCount =
					typeof payload?.institution_count === "number"
						? payload.institution_count
						: null;
				const actor =
					downloadMeta.requesterName ??
					downloadMeta.requesterEmail ??
					formatAuditActor(audit, t);
				const primaryEntity = format
					? t(
							"common.auth.account.activity.download.institutionExportWithFormat",
							{
								defaultValue: `Kulturorte-Export (${format})`,
								format,
							},
						)
					: t("common.auth.account.activity.download.institutionExport", {
							defaultValue: "Kulturorte-Export",
						});
				const secondaryEntity =
					typeof institutionCount === "number"
						? t("common.auth.account.activity.download.institutionCount", {
								defaultValue: `${institutionCount} Kulturorte`,
								count: institutionCount,
							})
						: undefined;
				return {
					id: activityId,
					date: audit.changed_at,
					user: audit.user ?? null,
					entityType: "institution",
					eventType: "create",
					actor,
					primaryEntity,
					secondaryEntity,
					action: t("common.auth.account.activity.download.action", {
						defaultValue: "heruntergeladen",
					}),
					item: primaryEntity,
					relation: secondaryEntity,
					status: "completed",
				};
			}

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
						t("common.auth.account.activity.itemWithName", {
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
						t("common.auth.account.activity.itemWithName", {
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
				canCreateInstitutions,
				canUpdateInstitutions,
				canReviewSubmissions,
			);
			let displayEntityType = primarySource.entity_type;
			if (isApprovedUserSubmissionAssignment) {
				const institutionId = getSubmissionInstitutionId(secondarySource);
				const institutionLabel = t(
					"common.auth.account.activity.entities.institution",
					{
						defaultValue: "Kulturort",
					},
				);
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
							canCreateInstitutions,
							canUpdateInstitutions,
							canReviewSubmissions,
						)
					: undefined,
				from: hasStatusTransition ? fromStatus : undefined,
				to: hasStatusTransition ? toStatus : undefined,
				action: (() => {
					const baseAction = t(
						`common.auth.account.activity.actions.${actionKey}`,
						{
							defaultValue: t(
								`common.auth.account.activity.actions.${audit.action}`,
								{
									defaultValue: audit.action,
								},
							),
						},
					);
					const accountType = getEntityAccountType(primarySource);
					if (primarySource.entity_type !== "user" || !accountType) {
						return baseAction;
					}
					return t("common.auth.account.activity.actions.withAccountType", {
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
					canCreateInstitutions,
					canUpdateInstitutions,
					canReviewSubmissions,
				),
				relation: normalizedRelation,
				relationLink: secondarySource
					? mapEntityLink(
							secondarySource,
							toLocalePath,
							canOpenSubmission,
							canReadAllUsers,
							currentUserId,
							canCreateInstitutions,
							canUpdateInstitutions,
							canReviewSubmissions,
						)
					: undefined,
				status: (getUserEntityStatus(primarySource) ??
					audit.status) as Activity["status"],
			};
		},
		[
			t,
			toLocalePath,
			canOpenSubmission,
			canReadAllUsers,
			currentUserId,
			canCreateInstitutions,
			canUpdateInstitutions,
			canReviewSubmissions,
		],
	);

	const resolvedActivities = useMemo(
		() =>
			activities ??
			(() => {
				const grouped = new Map<string, EntityAudit[]>();
				const standalone: EntityAudit[] = [];
				const HIDDEN_ENTITY_TYPES = new Set([
					"role_table_permission",
					"role_field_permission",
				]);
				for (const audit of mergedEntityAudits) {
					if (HIDDEN_ENTITY_TYPES.has(audit.entity_type)) continue;
					const meta = getAuditRelationMeta(audit);
					if (!meta.correlationId) {
						standalone.push(audit);
						continue;
					}
					const existing = grouped.get(meta.correlationId) ?? [];
					existing.push(audit);
					grouped.set(meta.correlationId, existing);
				}

				const groupedActivities = Array.from(grouped.values()).flatMap(
					(group) => {
						// Only expand pure submission groups when they are not review-intent
						// audit groups. Review flows often include a root submission audit
						// plus a bulk helper audit under the same correlation id, and those
						// should stay collapsed into one visible activity.
						const allSubmissions = group.every(
							(a) => a.entity_type === "submission",
						);
						const hasReviewIntent = group.some(hasSubmissionReviewIntent);
						if (allSubmissions && !hasReviewIntent) {
							return group.map((audit) => ({
								id: `audit:${audit.id}`,
								changedAt:
									audit.changed_at instanceof Date
										? audit.changed_at.getTime()
										: new Date(audit.changed_at).getTime(),
								activity: mapAuditToActivity(
									audit,
									undefined,
									`audit:${audit.id}`,
								),
							}));
						}

						const first = group[0];
						const relationMeta = getAuditRelationMeta(first);
						const primary =
							group.find(
								(a) =>
									a.entity_type === relationMeta.rootEntityType &&
									a.entity_id === relationMeta.rootEntityId,
							) ?? group[0];
						const relationAudit = pickRelationAudit(group, primary);
						return [
							{
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
							},
						];
					},
				);

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
			})(),
		[activities, mapAuditToActivity, mergedEntityAudits],
	);

	const statusOptions = useMemo(
		() =>
			Array.from(
				new Set(resolvedActivities.map((activity) => activity.status)),
			),
		[resolvedActivities],
	);
	const typeOptions = useMemo(
		() =>
			Array.from(
				new Set(
					resolvedActivities.map(
						(activity) => activity.eventType ?? ("create" as const),
					),
				),
			),
		[resolvedActivities],
	);
	const actorOptions = useMemo(
		() =>
			Array.from(
				new Set(
					resolvedActivities
						.map((activity) => activity.actor?.trim() ?? "")
						.filter((value) => value.length > 0),
				),
			).sort((a, b) => a.localeCompare(b, "de")),
		[resolvedActivities],
	);
	const entityTypeOptions = useMemo(
		() =>
			Array.from(
				new Set(
					resolvedActivities
						.map((activity) => activity.entityType?.trim() ?? "")
						.filter((value) => value.length > 0),
				),
			).sort((a, b) =>
				getEntityTypeLabel(a, t).localeCompare(getEntityTypeLabel(b, t), "de"),
			),
		[resolvedActivities, t],
	);
	const filteredActivities = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		const now = new Date();
		return resolvedActivities.filter((activity) => {
			if (statusFilter !== "all" && activity.status !== statusFilter) {
				return false;
			}
			const eventType = activity.eventType ?? "create";
			if (typeFilter !== "all" && eventType !== typeFilter) return false;
			const entityType = activity.entityType?.trim() ?? "";
			if (entityTypeFilter !== "all" && entityType !== entityTypeFilter) {
				return false;
			}
			const actor = activity.actor?.trim() ?? "";
			if (actorFilter !== "all" && actor !== actorFilter) return false;
			if (!isActivityWithinDatePreset(activity.date, dateFilter, now)) {
				return false;
			}
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
	}, [
		actorFilter,
		dateFilter,
		entityTypeFilter,
		resolvedActivities,
		searchQuery,
		statusFilter,
		typeFilter,
	]);
	const visibleActivitySignature = useMemo(
		() =>
			filteredActivities
				.map(
					(activity, index) =>
						activity.id ?? `activity-${String(activity.date)}-${index}`,
				)
				.join("|"),
		[filteredActivities],
	);
	const shouldAnimateVisibleActivities =
		previousVisibleActivitySignatureRef.current === null ||
		previousVisibleActivitySignatureRef.current !== visibleActivitySignature;
	const shouldVirtualize =
		!activities &&
		filteredActivities.length >= ACTIVITY_VIRTUALIZATION_THRESHOLD;
	const rowVirtualizer = useWindowVirtualizer({
		count: filteredActivities.length,
		estimateSize: (index) => {
			const activity = filteredActivities[index];
			if (!activity) return ACTIVITY_VIRTUAL_ROW_ESTIMATE;
			return (
				measuredRowHeightsRef.current.get(getActivityKey(activity, index)) ??
				ACTIVITY_VIRTUAL_ROW_ESTIMATE
			);
		},
		overscan: ACTIVITY_VIRTUAL_OVERSCAN,
		scrollMargin: listScrollMargin,
		enabled: shouldVirtualize,
		getItemKey: (index) => {
			const activity = filteredActivities[index];
			return activity ? getActivityKey(activity, index) : `activity-${index}`;
		},
	});

	useLayoutEffect(() => {
		previousVisibleActivitySignatureRef.current = visibleActivitySignature;
	}, [visibleActivitySignature]);

	useLayoutEffect(() => {
		if (!shouldVirtualize) return;
		rowVirtualizer.measure();
	}, [filteredActivities, rowVirtualizer, shouldVirtualize]);

	useEffect(() => {
		if (!shouldVirtualize) return;
		const updateListScrollMargin = () => {
			const listElement = listContainerRef.current;
			if (!listElement) return;
			const nextScrollMargin =
				listElement.getBoundingClientRect().top + window.scrollY;
			setListScrollMargin((current) =>
				Math.abs(current - nextScrollMargin) < 1 ? current : nextScrollMargin,
			);
		};

		updateListScrollMargin();
		window.addEventListener("resize", updateListScrollMargin);

		return () => window.removeEventListener("resize", updateListScrollMargin);
	}, [shouldVirtualize, filteredActivities.length]);

	if (isLoading) {
		return <ActivityListSkeleton showFilters />;
	}

	if (resolvedActivities.length === 0) {
		return (
			<EmptyActionState
				title={t(
					"common.auth.account.activity.empty",
					"Keine Aktivitäten vorhanden.",
				)}
				description={t("common.auth.account.activity.emptyHint", {
					defaultValue: "Sie haben noch keine Aktivitäten.",
				})}
				actions={[
					{
						icon: <Send />,
						label: t(
							"common.auth.account.activity.emptyActions.claimLocations",
							{
								defaultValue: "Meine Orte anfragen",
							},
						),
						href: toLocalePath("/account/submissions/claim"),
					},
					{
						icon: <Edit />,
						label: t("common.auth.account.activity.emptyActions.contribute", {
							defaultValue: "Mitwirken",
						}),
						href: toLocalePath("/institution/submission"),
					},
				]}
			/>
		);
	}

	const renderListContent = () => {
		if (filteredActivities.length === 0) {
			return (
				<div className="py-8 body3 text-muted-foreground">
					{t("common.auth.account.activity.filters.empty", {
						defaultValue: "Keine Aktivitäten für die aktuellen Filter.",
					})}
				</div>
			);
		}

		if (shouldVirtualize) {
			const virtualRows = rowVirtualizer.getVirtualItems();
			const totalSize = rowVirtualizer.getTotalSize();

			return (
				<div className="relative" style={{ height: totalSize }}>
					{virtualRows.map((virtualRow) => {
						const activity = filteredActivities[virtualRow.index];
						if (!activity) return null;
						const key =
							activity.id ??
							`activity-${String(activity.date)}-${virtualRow.index}`;
						return (
							<div
								key={key}
								data-index={virtualRow.index}
								ref={(element) => {
									if (!element) return;
									rowVirtualizer.measureElement(element);
									const nextHeight = Math.ceil(
										element.getBoundingClientRect().height,
									);
									if (nextHeight <= 0) return;
									if (measuredRowHeightsRef.current.get(key) === nextHeight) {
										return;
									}
									measuredRowHeightsRef.current.set(key, nextHeight);
									rowVirtualizer.resizeItem(virtualRow.index, nextHeight);
								}}
								className={
									shouldAnimateVisibleActivities
										? "absolute left-0 top-0 w-full after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-border motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
										: "absolute left-0 top-0 w-full after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-border"
								}
								style={{
									transform: `translateY(${virtualRow.start - listScrollMargin}px)`,
									animationDelay: shouldAnimateVisibleActivities
										? `${Math.min(virtualRow.index, 12) * 28}ms`
										: undefined,
								}}
							>
								<ActivityItem activity={activity} index={virtualRow.index} />
							</div>
						);
					})}
				</div>
			);
		}

		return filteredActivities.map((activity, index) => (
			<div
				key={activity.id ?? `activity-${activity.date}-${index}`}
				className={
					shouldAnimateVisibleActivities
						? "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
						: undefined
				}
				style={
					shouldAnimateVisibleActivities
						? { animationDelay: `${Math.min(index, 12) * 28}ms` }
						: undefined
				}
			>
				<ActivityItem activity={activity} index={index} />
			</div>
		));
	};

	return (
		<div className="space-y-4">
			<ActivityFilters
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				statusFilter={statusFilter}
				onStatusChange={setStatusFilter}
				typeFilter={typeFilter}
				onTypeChange={setTypeFilter}
				entityTypeFilter={entityTypeFilter}
				onEntityTypeChange={setEntityTypeFilter}
				actorFilter={actorFilter}
				onActorChange={setActorFilter}
				dateFilter={dateFilter}
				onDateChange={setDateFilter}
				statusOptions={statusOptions}
				typeOptions={typeOptions}
				entityTypeOptions={entityTypeOptions}
				actorOptions={actorOptions}
				getStatusLabel={(status) => getStatusLabel(status, t)}
				getEventTypeLabel={(eventType) => getEventTypeLabel(eventType, t)}
				getEntityTypeLabel={(entityType) => getEntityTypeLabel(entityType, t)}
			/>

			<div
				ref={listContainerRef}
				className={shouldVirtualize ? "relative" : "divide-y divide-border"}
			>
				{renderListContent()}
			</div>
			{!activities ? (
				<div ref={loadMoreSentinelRef} className="py-4 text-center">
					{(() => {
						if (isLoadingMoreAudits) {
							return (
								<div className="body3 text-muted-foreground">
									{t("common.auth.account.activity.loadMore.loading", {
										defaultValue: "Weitere Aktivitaeten werden geladen...",
									})}
								</div>
							);
						}
						if (loadMoreError) {
							return (
								<button
									type="button"
									className="body3 underline text-muted-foreground"
									onClick={() => void loadMoreAudits()}
								>
									{loadMoreError}
								</button>
							);
						}
						if (hasMoreAudits) {
							return <div className="h-1" />;
						}
						return null;
					})()}
				</div>
			) : null}
		</div>
	);
}
