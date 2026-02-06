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

type UserClaimReviewModalProps = {
	claims: ClaimSubmissionDetail[];
	routePath?: string;
	returnTo?: string;
};

export function UserClaimReviewModal({
	claims,
	routePath,
	returnTo = "/account/users",
}: UserClaimReviewModalProps) {
	const { t } = useTranslation("content");
	const router = useRouter();
	const [items, setItems] = useState(claims);
	const [busyIds, setBusyIds] = useState<number[]>([]);

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

	const handleDecision = useCallback(
		async (id: number, decision: "approved" | "rejected") => {
			if (isBusy(id)) return;
			setBusyIds((prev) => [...prev, id]);
			try {
				await reviewClaimSubmission({ id, decision });
				setItems((prev) => prev.filter((item) => item.submission.id !== id));
				router.refresh();
			} finally {
				setBusyIds((prev) => prev.filter((entry) => entry !== id));
			}
		},
		[isBusy, router],
	);

	const emptyState = useMemo(() => items.length === 0, [items.length]);

	return (
		<Modal
			title={t("userClaims.title", {
				defaultValue: "Institutionen-Claims prüfen",
			})}
			variant="fullscreen"
			routePath={routePath}
			returnTo={returnTo}
			content={
				<div className="p-4 space-y-6 max-w-5xl mx-auto w-full">
					<div className="mt-10 space-y-2">
						<h1 className="font-bold">
							{t("userClaims.title", {
								defaultValue: "Institutionen-Claims prüfen",
							})}
						</h1>
						<p className="body2">
							{t("userClaims.subtitle", {
								defaultValue:
									"Überprüfen Sie die Anfragen zur Institutionen-Zuordnung.",
							})}
						</p>
					</div>

					{emptyState ? (
						<p className="body2">
							{t("userClaims.empty", {
								defaultValue: "Keine offenen Claims vorhanden.",
							})}
						</p>
					) : (
						<div className="space-y-4">
							{items.map(({ submission, institution }) => (
								<div
									key={submission.id}
									className="rounded-md border border-input p-4 space-y-3"
								>
									{(() => {
										const infoConfig: InfoWrapperConfig = {
											layout: { columns: 1 },
											alwaysShow: true,
											fields: [
												{
													type: "text",
													label: t("userClaims.institutionName", {
														defaultValue: "Institution",
													}),
													value: () =>
														institution?.name ??
														t("userClaims.unknownInstitution", {
															defaultValue: "Unbekannte Institution",
														}),
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
											],
										};
										return (
											<InfoWrapper
												data={institution ?? {}}
												config={infoConfig}
											/>
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
								</div>
							))}
						</div>
					)}
				</div>
			}
		/>
	);
}
