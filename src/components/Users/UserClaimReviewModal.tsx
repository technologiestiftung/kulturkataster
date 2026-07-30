"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modals/Modal";
import { InfoWrapper } from "@/components/InfoWrapper/InfoWrapper";
import type { InfoWrapperConfig } from "@/components/InfoWrapper/types";
import { reviewClaimSubmission } from "@/server/actions/submissions";
import type { ClaimSubmissionDetail } from "@/types/submission";
import { formatDateWithLocale } from "@/lib/utils/dateUtils";
import { ActionPanel } from "@/components/ActionPanel";
import { formatUserDisplayName } from "@/lib/utils/userName";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

type UserClaimReviewModalProps = {
	claims: ClaimSubmissionDetail[];
	routePath?: string;
	returnTo?: string;
};

export function UserClaimReviewModal({
	claims,
	routePath,
	returnTo,
}: UserClaimReviewModalProps) {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const [items, setItems] = useState(claims);
	const [busyIds, setBusyIds] = useState<number[]>([]);
	const [reviewError, setReviewError] = useState<string | null>(null);

	const isBusy = useCallback((id: number) => busyIds.includes(id), [busyIds]);

	const formatAddress = useCallback(
		(
			address?: {
				street?: string | null;
				street_number?: string | null;
				zipcode?: string | null;
				city?: string | null;
			} | null,
		) => {
			if (!address) return "—";
			const street = [address.street, address.street_number]
				.filter(Boolean)
				.join(" ");
			const city = [address.zipcode, address.city].filter(Boolean).join(" ");
			return [street, city].filter(Boolean).join(", ") || "—";
		},
		[],
	);

	const formatDate = useCallback(
		(date: Date | string) =>
			formatDateWithLocale(date, {
				locale: i18n?.resolvedLanguage ?? "de",
				format: {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
				},
			}),
		[i18n?.resolvedLanguage],
	);

	const formatGroups = useCallback(
		(groups?: Array<{ name: string }> | null) => {
			if (!groups || groups.length === 0) return "—";
			return groups.map((group) => group.name).join(", ");
		},
		[],
	);

	const handleDecision = useCallback(
		async (id: number, decision: "approved" | "rejected") => {
			if (isBusy(id)) return;
			setBusyIds((prev) => [...prev, id]);
			try {
				await reviewClaimSubmission({ id, decision });
				setItems((prev) => prev.filter((item) => item.submission.id !== id));
				router.refresh();
			} catch (error) {
				setReviewError(
					t("content.userClaims.feedback.error.description", {
						defaultValue:
							"Please try again or contact support if the issue persists.",
					}),
				);
				throw error;
			} finally {
				setBusyIds((prev) => prev.filter((entry) => entry !== id));
			}
		},
		[isBusy, router, t],
	);

	const emptyState = useMemo(() => items.length === 0, [items.length]);

	return (
		<Modal
			title={t("content.userClaims.title", {
				defaultValue: "Institutionen-Anfragen prüfen",
			})}
			subtitle={t("content.userClaims.subtitle", {
				defaultValue:
					"Hier kannst du die Anfragen von Institutionen überprüfen und entscheiden, ob sie akzeptiert oder abgelehnt werden.",
			})}
			variant="fullscreen-muted"
			routePath={routePath}
			returnTo={returnTo}
			errorDialog={
				reviewError
					? {
							open: true,
							title: t("content.userClaims.feedback.error.title", {
								defaultValue: "Review failed",
							}),
							description: reviewError,
							confirmLabel: t("common.close"),
							onConfirm: () => setReviewError(null),
							onOpenChange: (open) => {
								if (!open) setReviewError(null);
							},
						}
					: undefined
			}
		>
			<div className="space-y-6 w-full">
				{emptyState ? (
					<p className="body2">
						{t("content.userClaims.empty", {
							defaultValue: "Keine offenen Anfragen vorhanden.",
						})}
					</p>
				) : (
					<div className="space-y-4">
						{items.map(({ submission, institution, claimant }) => (
							<ActionPanel
								key={submission.id}
								title={
									(institution?.name ??
										t("content.userClaims.unknownInstitution", {
											defaultValue: "Unbekannte Institution",
										})) + ` (${institution?.id ?? "—"})`
								}
								actionLabel={t("content.userClaims.approve", {
									defaultValue: "Annehmen",
								})}
								actionLabelLoading={t("content.userClaims.approve", {
									defaultValue: "Annehmen",
								})}
								onAction={async () => {
									await handleDecision(submission.id, "approved");
									return null;
								}}
								secondaryActionLabel={t("content.userClaims.reject", {
									defaultValue: "Ablehnen",
								})}
								secondaryActionLabelLoading={t("content.userClaims.reject", {
									defaultValue: "Ablehnen",
								})}
								onSecondaryAction={async () => {
									await handleDecision(submission.id, "rejected");
									return null;
								}}
								middleAction={
									<Button asChild type="button" variant="outline">
										<Link
											href={toLocalePath(
												`/account/submissions/${submission.id}`,
											)}
										>
											{t("content.userClaims.openReview", {
												defaultValue: "Prüfen",
											})}
										</Link>
									</Button>
								}
								errorFallback={t(
									"content.userClaims.feedback.error.description",
									{
										defaultValue:
											"Please try again or contact support if the issue persists.",
									},
								)}
								secondaryErrorFallback={t(
									"content.userClaims.feedback.error.description",
									{
										defaultValue:
											"Please try again or contact support if the issue persists.",
									},
								)}
								className="space-y-4"
							>
								{(() => {
									const infoConfig: InfoWrapperConfig = {
										layout: { columns: 1 },
										alwaysShow: true,
										fields: [
											{
												type: "text",
												label: t("content.userClaims.institutionAddress", {
													defaultValue: "Adresse",
												}),
												value: () => formatAddress(institution?.address),
												alwaysShow: true,
											},
											{
												type: "text",
												label: t("content.userClaims.currentUsers", {
													defaultValue: "Aktuelle Nutzer",
												}),
												value: () =>
													institution?.users?.length
														? institution.users
																.map((user) => user.email ?? user.id)
																.join(", ")
														: "—",
												alwaysShow: true,
											},
											{
												type: "text",
												label: t("content.userClaims.requestedBy", {
													defaultValue: "Requested by",
												}),
												value: () =>
													formatUserDisplayName(claimant) ??
													claimant?.email ??
													submission.created_by ??
													"—",
												alwaysShow: true,
											},
											{
												type: "text",
												label: t("content.userClaims.userGroup", {
													defaultValue: "Benutzergruppe",
												}),
												value: () => formatGroups(claimant?.groups),
												alwaysShow: true,
											},
											{
												type: "text",
												label: t("content.userClaims.claimDate", {
													defaultValue: "Datum der Anfrage",
												}),
												value: () => formatDate(submission.created_at),
												alwaysShow: true,
											},
										],
									};
									return (
										<InfoWrapper data={institution ?? {}} config={infoConfig} />
									);
								})()}
							</ActionPanel>
						))}
					</div>
				)}
			</div>
		</Modal>
	);
}
