"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
import { InstitutionDraftSelectSearch } from "@/components/Institution/InstitutionDraftSelectSearch";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useAccountStore } from "@/lib/store/accountStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useInstitutionDraftStore } from "@/lib/store/institutionDraftStore";
import { searchInstitutions } from "@/server/actions/institutions";
import type { Institution } from "@/types/institution";
import { buildStreetLine } from "@/lib/utils/formUtils";
import { institutionSubmissionToDraft } from "@/lib/utils/institutionSubmissionUtils";
import { SelectableOptionsList } from "@/components/MultiSelect/SelectableOptionsList";
import { buildCategoryFilterStateFromIds } from "@/lib/utils/institutionCategoryUtils";
import { buildCategoryGroups } from "@/lib/utils/categoryUtils";
import { Card } from "../ui/card";

export function InstitutionDraftSelectModal({
	routePath,
}: {
	routePath?: string;
}) {
	const { t } = useTranslation();
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const accountCategories = useAccountStore((state) => state.categories);
	const institutions = useInstitutionStore((state) => state.allInstitutions);
	const institutionCategories = useInstitutionStore(
		(state) => state.categories,
	);
	const categories = useMemo(
		() =>
			institutionCategories?.length
				? institutionCategories
				: buildCategoryGroups(accountCategories),
		[institutionCategories, accountCategories],
	);
	const isLoading = useInstitutionStore((state) => state.isLoading);
	const error = useInstitutionStore((state) => state.error);
	const setDraft = useInstitutionDraftStore((state) => state.setDraft);
	const setStepId = useInstitutionDraftStore((state) => state.setStepId);
	const setMode = useInstitutionDraftStore((state) => state.setMode);

	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Institution[]>([]);

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
					: t("common.institution.editSelectNoAddress", {
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
				});
		}, 300);

		return () => {
			active = false;
			clearTimeout(handle);
		};
	}, [query]);

	const handleSelectInstitution = useCallback(
		(institution: Institution) => {
			setMode("update");
			setStepId("review");

			const baseDraft = institutionSubmissionToDraft({
				data: institution as unknown as Record<string, unknown>,
			});
			const address = baseDraft.address ?? institution.address ?? null;
			const categoryIds =
				baseDraft.categoryIds ??
				institution.categories?.map((category) => category.id) ??
				[];
			const categoryFilters = buildCategoryFilterStateFromIds(
				categoryIds,
				categories,
			);

			setDraft({
				...baseDraft,
				categoryIds,
				categoryFilters,
				entityId: institution.id,
				originalInstitution: institution,
				"address.streetLine": buildStreetLine(
					address?.street,
					address?.street_number,
				),
				"address.city": address?.city ?? "",
				"address.zip": address?.zipcode ?? "",
				"address.address_suffix": address?.address_suffix ?? "",
				"address.neighbourhood": address?.neighbourhood ?? "",
				"address.cultural_area": address?.cultural_area ?? "",
				"address.lat": address?.lat ?? "",
				"address.lng": address?.lng ?? "",
			});
			router.replace(toLocalePath("/institution/submission"));
		},
		[categories, setDraft, setMode, setStepId, router],
	);

	return (
		<Modal
			title={t("common.institution.editSelectTitle", {
				defaultValue: "Bestehenden Kulturort auswählen",
			})}
			titleClassName="sr-only"
			showBackButton={true}
			backTo="/institution"
			variant="fullscreen"
			routePath={routePath}
			containerClassName=""
			contentWrapperClassName="flex-1"
			contentClassName=""
		>
			<div className="md:p-4 space-y-6 flex-1 flex-col max-w-5xl mx-auto w-full">
				<div className="mt-18 space-y-2">
					<h1 className="font-bold">
						{t("common.institution.editSelectTitle", {
							defaultValue: "Bestehenden Kulturort auswählen",
						})}
					</h1>
					<p className="body2">
						{t("common.institution.editSelectSubtitle", {
							defaultValue:
								"Wählen Sie einen bestehenden Kulturort aus, den Sie aktualisieren möchten.",
						})}
					</p>
				</div>

				<Card className="space-y-4 mb-10 md:p-10 h-full p-0" variant="tertiary">
					<InstitutionDraftSelectSearch onQueryChange={setQuery} />
					{error && !isLoading ? (
						<p className="body2 text-destructive">{error}</p>
					) : (
						<SelectableOptionsList
							options={selectableOptions}
							selectedValues={[]}
							multiSelect={false}
							containerClassName="max-h-52 md:max-h-69 overflow-auto"
							emptyText={t("common.institution.editSelectEmpty", {
								defaultValue: "Keine Kulturorte gefunden.",
							})}
							variant="panel"
							showCheckbox={true}
							onToggle={(value) => {
								const institution = institutionById.get(value);
								if (institution) {
									handleSelectInstitution(institution);
								}
							}}
						/>
					)}
				</Card>
			</div>
		</Modal>
	);
}
