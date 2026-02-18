"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modals/Modal";
import { Button } from "@/components/ui/button";
import { InfoWrapper } from "@/components/InfoWrapper/InfoWrapper";
import type { InfoWrapperConfig } from "@/components/InfoWrapper/types";
import { reviewClaimSubmission } from "@/server/actions/submissions";
import type { ClaimSubmissionDetail } from "@/types/submission";
import { Card } from "../ui/card";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

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
	const { t } = useTranslation("content");
	const router = useRouter();
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

	const formatDate = useCallback((date: Date | string) => {
		const dateObj = typeof date === "string" ? new Date(date) : date;
		return dateObj.toLocaleDateString("de-DE", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	}, []);

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
				showSuccessToast(
					decision === "approved"
						? t("userClaims.feedback.approve.title", {
								defaultValue: "Claim approved",
							})
						: t("userClaims.feedback.reject.title", {
								defaultValue: "Claim rejected",
							}),
					decision === "approved"
						? t("userClaims.feedback.approve.description", {
								defaultValue: "The claim has been approved successfully.",
							})
						: t("userClaims.feedback.reject.description", {
								defaultValue: "The claim has been rejected successfully.",
							}),
				);
				router.refresh();
			} catch {
				setReviewError(
					t("userClaims.feedback.error.description", {
						defaultValue:
							"Please try again or contact support if the issue persists.",
					}),
				);
			} finally {
				setBusyIds((prev) => prev.filter((entry) => entry !== id));
			}
		},
		[isBusy, router, t],
	);

	const emptyState = useMemo(() => items.length === 0, [items.length]);

	return (
		<Modal
			title={t("userClaims.title", {
				defaultValue: "Institutionen-Anfragen prüfen",
			})}
			subtitle={t("userClaims.subtitle", {
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
							title: t("userClaims.feedback.error.title", {
								defaultValue: "Review failed",
							}),
							description: reviewError,
							confirmLabel: t("close"),
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
						{t("userClaims.empty", {
							defaultValue: "Keine offenen Anfragen vorhanden.",
						})}
					</p>
				) : (
					<div className="space-y-4">
						{items.map(({ submission, institution, claimant }) => (
							<Card
								key={submission.id}
								variant={"filter"}
								className="space-y-4"
							>
								{(() => {
									const infoConfig: InfoWrapperConfig = {
										layout: { columns: 1 },
										alwaysShow: true,
										fields: [
											{
												type: "title",
												label: t("userClaims.institutionName", {
													defaultValue: "Institution",
												}),
												value: () => {
													return (
														(institution?.name ??
															t("userClaims.unknownInstitution", {
																defaultValue: "Unbekannte Institution",
															})) + ` (${institution?.id ?? "—"})`
													);
												},
												alwaysShow: true,
											},
											{
												type: "text",
												label: t("userClaims.institutionAddress", {
													defaultValue: "Adresse",
												}),
												value: () => formatAddress(institution?.address),
												alwaysShow: true,
											},
											{
												type: "text",
												label: t("userClaims.currentUsers", {
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
												label: t("userClaims.userGroup", {
													defaultValue: "Benutzergruppe",
												}),
												value: () => formatGroups(claimant?.groups),
												alwaysShow: true,
											},
											{
												type: "text",
												label: t("userClaims.claimDate", {
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
								<div className="flex flex-wrap gap-2">
									<Button
										variant="outline"
										onClick={() => handleDecision(submission.id, "rejected")}
										disabled={isBusy(submission.id)}
									>
										{t("userClaims.reject", {
											defaultValue: "Ablehnen",
										})}
									</Button>
									<Button
										onClick={() => handleDecision(submission.id, "approved")}
										disabled={isBusy(submission.id)}
									>
										{t("userClaims.approve", {
											defaultValue: "Annehmen",
										})}
									</Button>
								</div>
							</Card>
						))}
					</div>
				)}
			</div>
		</Modal>
	);
}
