"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
import { Button } from "@/components/ui/button";
import { InstitutionDraftSelectSearch } from "@/components/Institution/InstitutionDraftSelectSearch";
import { SelectableOptionsList } from "@/components/MultiSelect/SelectableOptionsList";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useAccountStore } from "@/lib/store/accountStore";
import { searchInstitutions } from "@/server/actions/institutions";
import { createSubmission } from "@/server/actions/submissions";
import {
	$Enums,
	SubmissionEntityType,
	SubmissionType,
} from "@/generated/prisma";
import type { Institution } from "@/types/institution";
import { Card } from "../ui/card";
import { JsonValue } from "@/generated/prisma/runtime/client";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

export function InstitutionClaimSelectModal({
	routePath,
	returnTo,
}: {
	routePath?: string;
	returnTo?: string;
}) {
	const { t } = useTranslation("content");
	const closeModal = useRoutedModalClose({
		returnTo: returnTo ?? "/account/institutions",
	});
	const institutions = useInstitutionStore((state) => state.allInstitutions);
	const isLoading = useInstitutionStore((state) => state.isLoading);
	const error = useInstitutionStore((state) => state.error);
	const ownedInstitutions = useAccountStore((state) => state.institutions);
	const upsertSubmission = useAccountStore((state) => state.upsertSubmission);
	const ownedInstitutionIds = useMemo(
		() => new Set(ownedInstitutions.map((institution) => institution.id)),
		[ownedInstitutions],
	);

	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Institution[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const selectableInstitutions = useMemo(() => {
		const sourceInstitutions =
			query.trim().length === 0 ? (institutions ?? []) : searchResults;
		return sourceInstitutions.filter(
			(institution) => !ownedInstitutionIds.has(institution.id),
		);
	}, [institutions, ownedInstitutionIds, query, searchResults]);

	const selectableOptions = useMemo(
		() =>
			selectableInstitutions.map((institution) => ({
				value: String(institution.id),
				label: institution.name,
				description: institution.address?.street
					? `${institution.address.street} ${institution.address.street_number ?? ""}`.trim()
					: t("institution.editSelectNoAddress", {
							defaultValue: "Keine Adresse hinterlegt",
						}),
			})),
		[selectableInstitutions, t],
	);

	const institutionById = useMemo(
		() =>
			new Map(
				selectableInstitutions.map((institution) => [
					String(institution.id),
					institution,
				]),
			),
		[selectableInstitutions],
	);

	useEffect(() => {
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}
		let active = true;
		setSearchLoading(true);
		const handle = setTimeout(() => {
			void searchInstitutions(query)
				.then((results) => {
					if (!active) return;
					setSearchResults(results as Institution[]);
				})
				.catch(() => {
					if (!active) return;
					setSearchResults([]);
				})
				.finally(() => {
					if (!active) return;
					setSearchLoading(false);
				});
		}, 300);

		return () => {
			active = false;
			clearTimeout(handle);
		};
	}, [query]);

	const toggleSelection = useCallback((value: string) => {
		setSelectedIds((prev) => {
			if (prev.includes(value)) {
				return prev.filter((id) => id !== value);
			}
			return [...prev, value];
		});
	}, []);

	const handleSubmitClaims = useCallback(async () => {
		if (selectedIds.length === 0) return;
		setIsSubmitting(true);
		setSubmitError(null);
		try {
			const institutionsToClaim = selectedIds
				.map((id) => institutionById.get(id))
				.filter(Boolean) as Institution[];

			const createdSubmissions = await Promise.all(
				institutionsToClaim.map((institution) =>
					createSubmission({
						entityType: SubmissionEntityType.institution,
						entityId: institution.id,
						type: SubmissionType.claim,
						status: "approval_pending",
						data: {
							...institution,
						},
					}),
				),
			);
			createdSubmissions.forEach(
				(submission: {
					data: JsonValue;
					id: number;
					entity_type: $Enums.SubmissionEntityType;
					entity_id: number | null;
					status: $Enums.SubmissionStatus;
					type: $Enums.SubmissionType;
					diff: JsonValue | null;
					meta: JsonValue | null;
					review_notes: string | null;
					created_by: string | null;
					reviewed_by: string | null;
					created_at: Date;
					updated_at: Date;
					reviewed_at: Date | null;
				}) => {
					if (submission) {
						upsertSubmission(submission);
					}
				},
			);

			setSelectedIds([]);
			closeModal();
			showSuccessToast(
				t("institution.claimSubmitSuccess.title", {
					defaultValue: "Claim submitted",
				}),
				t("institution.claimSubmitSuccess.description", {
					defaultValue:
						"Your institution claim request has been submitted for review.",
				}),
			);
		} catch {
			setSubmitError(
				t("institution.claimSubmitError", {
					defaultValue:
						"The claim request could not be submitted. Please try again.",
				}),
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [closeModal, institutionById, selectedIds, t, upsertSubmission]);

	return (
		<Modal
			title={t("institution.claimSelectTitle", {
				defaultValue: "Institutionen beanspruchen",
			})}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			returnTo={returnTo}
			closeConfirmation={{
				title: t("institutionModalCloseConfirmation.title"),
				description: t("institutionModalCloseConfirmation.description"),
				confirmLabel: t("institutionModalCloseConfirmation.confirm"),
				cancelLabel: t("institutionModalCloseConfirmation.cancel"),
			}}
			containerClassName="p-0 md:p-0 mt-0 md:mt-0"
			contentWrapperClassName="flex-1"
			contentClassName=""
			errorDialog={
				!isLoading && (submitError || error)
					? {
							open: true,
							title: t("error"),
							description: submitError || error || "",
							confirmLabel: t("close"),
							onConfirm: () => setSubmitError(null),
							onOpenChange: (open) => {
								if (!open) setSubmitError(null);
							},
						}
					: undefined
			}
		>
			<div className="p-4 space-y-6 flex-1 flex-col max-w-5xl mx-auto w-full">
				<div className="mt-18 space-y-2">
					<h1 className="font-bold">
						{t("institution.claimSelectTitle", {
							defaultValue: "Institutionen beanspruchen",
						})}
					</h1>
					<p className="body2">
						{t("institution.claimSelectSubtitle", {
							defaultValue:
								"Wählen Sie die Institutionen aus, die Sie beanspruchen möchten.",
						})}
					</p>
				</div>

				<Card className="space-y-4 mb-10 p-10 h-full" variant="tertiary">
					<InstitutionDraftSelectSearch onQueryChange={setQuery} />
					{isLoading || searchLoading ? (
						<p className="body2">
							{t("institution.loading", {
								defaultValue: "Lädt...",
							})}
						</p>
					) : (
						<SelectableOptionsList
							options={selectableOptions}
							selectedValues={selectedIds}
							containerClassName="max-h-52 md:max-h-69 overflow-auto"
							emptyText={t("institution.editSelectEmpty", {
								defaultValue: "Keine Kulturorte gefunden.",
							})}
							onToggle={toggleSelection}
							variant="panel"
						/>
					)}
				</Card>

				<div className="flex flex-wrap gap-3">
					<Button variant="outline" onClick={closeModal}>
						{t("actions.cancel", { defaultValue: "Abbrechen" })}
					</Button>
					<Button
						onClick={handleSubmitClaims}
						disabled={selectedIds.length === 0 || isSubmitting}
					>
						{isSubmitting
							? t("institution.claimSubmitting", {
									defaultValue: "Wird gesendet...",
								})
							: t("institution.claimSubmit", {
									defaultValue: "Anfrage senden",
								})}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
