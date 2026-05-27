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
import { SubmissionEntityType, SubmissionType } from "@/generated/prisma";
import type { Institution } from "@/types/institution";
import { Card } from "../ui/card";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { Loading } from "../ui/loading";

export function InstitutionClaimSelectModal({
	routePath,
	returnTo,
}: {
	routePath?: string;
	returnTo?: string;
}) {
	const { t } = useTranslation();
	const closeModal = useRoutedModalClose({
		returnTo: returnTo ?? "/account/institutions",
	});
	const institutions = useInstitutionStore((state) => state.allInstitutions);
	const isLoading = useInstitutionStore((state) => state.isLoading);
	const error = useInstitutionStore((state) => state.error);
	const ownedInstitutions = useAccountStore((state) => state.institutions);
	const upsertSubmission = useAccountStore((state) => state.upsertSubmission);
	const allSubmissions = useAccountStore((state) => state.submissions);
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
			(institution) =>
				!ownedInstitutionIds.has(institution.id) &&
				!allSubmissions.some(
					(submission) =>
						submission.entity_type === "institution" &&
						submission.entity_id === institution.id &&
						submission.status === "approval_pending",
				),
		);
	}, [institutions, ownedInstitutionIds, allSubmissions, query, searchResults]);

	const selectableOptions = useMemo(
		() =>
			selectableInstitutions.map((institution) => ({
				value: String(institution.id),
				label: institution.name,
				description: institution.address?.street
					? `${institution.address.street} ${institution.address.street_number ?? ""}`.trim()
					: t("content.institution.editSelectNoAddress", {
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
			setSearchLoading(false);
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
						data: {
							...institution,
						},
					}),
				),
			);
			createdSubmissions.forEach((submission) => {
				if (submission) {
					upsertSubmission(submission);
				}
			});

			setSelectedIds([]);
			closeModal();
			showSuccessToast(
				t("content.institution.claimSubmitSuccess.title", {
					defaultValue: "Claim submitted",
				}),
				t("content.institution.claimSubmitSuccess.description", {
					defaultValue:
						"Your institution claim request has been submitted for review.",
				}),
			);
		} catch {
			setSubmitError(
				t("content.institution.claimSubmitError", {
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
			title={t("content.institution.claimSelectTitle", {
				defaultValue: "Institutionen beanspruchen",
			})}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			returnTo={returnTo}
			closeConfirmation={{
				title: t("content.institutionModalCloseConfirmation.title"),
				description: t("content.institutionModalCloseConfirmation.description"),
				confirmLabel: t("content.institutionModalCloseConfirmation.confirm"),
				cancelLabel: t("content.institutionModalCloseConfirmation.cancel"),
			}}
			containerClassName=""
			contentWrapperClassName="flex-1"
			contentClassName=""
			errorDialog={
				!isLoading && (submitError || error)
					? {
							open: true,
							title: t("content.error"),
							description: submitError || error || "",
							confirmLabel: t("content.close"),
							onConfirm: () => setSubmitError(null),
							onOpenChange: (open) => {
								if (!open) setSubmitError(null);
							},
						}
					: undefined
			}
		>
			<div className="md:p-4 space-y-6 flex-1 flex-col max-w-5xl mx-auto w-full">
				<div className="mt-18 space-y-4">
					<div className="">
						<h1 className="font-bold">
							{t("content.institution.claimSelectTitle", {
								defaultValue: "Institutionen beanspruchen",
							})}
						</h1>
						<p className="body2 font-bold">
							{t("content.institution.claimSelectSubtitle", {
								defaultValue:
									"Wählen Sie die Institutionen aus, die Sie beanspruchen möchten.",
							})}
						</p>
					</div>
					<p className="body2">
						{t("content.institution.claimSelectDescription")}
					</p>
				</div>

				<Card className="space-y-4 mb-10 md:p-10 h-full p-0" variant="tertiary">
					<p className="body2 mb-4">
						{t("content.institution.claimSelectSearchLabel", {
							defaultValue: "Name oder Adresse des Kulturortes",
						})}
					</p>
					<InstitutionDraftSelectSearch onQueryChange={setQuery} />
					{isLoading || searchLoading ? (
						<Loading />
					) : (
						<SelectableOptionsList
							options={selectableOptions}
							selectedValues={selectedIds}
							containerClassName="max-h-52 md:max-h-69 overflow-auto"
							emptyText={t("content.institution.editSelectEmpty", {
								defaultValue: "Keine Kulturorte gefunden.",
							})}
							onToggle={toggleSelection}
							variant="panel"
						/>
					)}
				</Card>

				<div className="flex flex-wrap gap-3 mb-10">
					<Button variant="outline" onClick={closeModal}>
						{t("content.actions.cancel", { defaultValue: "Abbrechen" })}
					</Button>
					<Button
						onClick={handleSubmitClaims}
						disabled={selectedIds.length === 0 || isSubmitting}
					>
						{isSubmitting
							? t("content.institution.claimSubmitting", {
									defaultValue: "Wird gesendet...",
								})
							: t("content.institution.claimSubmit", {
									defaultValue: "Anfrage senden",
								})}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
