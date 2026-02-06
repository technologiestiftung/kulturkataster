"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
import { Button } from "@/components/ui/button";
import { InstitutionDraftSelectSearch } from "@/components/Institution/InstitutionDraftSelectSearch";
import { SelectableOptionsList } from "@/components/MultiSelect/SelectableOptionsList";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { searchInstitutions } from "@/server/actions/institutions";
import { createSubmission } from "@/server/actions/submissions";
import { SubmissionEntityType, SubmissionType } from "@/generated/prisma";
import type { Institution } from "@/types/institution";
import { Card } from "../ui/card";
import { AlertDialog } from "../ui/alert-dialog";

export function InstitutionClaimSelectModal({
	routePath,
}: {
	routePath?: string;
}) {
	const { t } = useTranslation("content");
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const institutions = useInstitutionStore((state) => state.allInstitutions);
	const isLoading = useInstitutionStore((state) => state.isLoading);
	const error = useInstitutionStore((state) => state.error);

	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Institution[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const selectableInstitutions = useMemo(() => {
		if (query.trim().length === 0) {
			return institutions ?? [];
		}
		return searchResults;
	}, [institutions, query, searchResults]);

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
		try {
			const institutionsToClaim = selectedIds
				.map((id) => institutionById.get(id))
				.filter(Boolean) as Institution[];

			await Promise.all(
				institutionsToClaim.map((institution) =>
					createSubmission({
						entityType: SubmissionEntityType.institution,
						entityId: institution.id,
						type: SubmissionType.claim,
						status: "approval_pending",
						data: {
							id: institution.id,
							name: institution.name,
							address: institution.address ?? null,
						},
					}),
				),
			);

			setSelectedIds([]);
			router.push(toLocalePath("/account/institutions"));
		} finally {
			setIsSubmitting(false);
		}
	}, [institutionById, router, selectedIds, toLocalePath]);

	return (
		<Modal
			title={t("institution.claimSelectTitle", {
				defaultValue: "Institutionen beanspruchen",
			})}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			containerClassName="p-0 md:p-0 mt-0 md:mt-0"
			contentWrapperClassName="flex-1"
			contentClassName=""
			content={
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

					{!isLoading && error && (
						<AlertDialog
							title={t("error")}
							status="error"
							description={error ?? ""}
							open={Boolean(error)}
							confirmLabel={t("close")}
						/>
					)}

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
						<Button
							variant="outline"
							onClick={() => router.push(toLocalePath("/account/institutions"))}
						>
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
			}
		/>
	);
}
