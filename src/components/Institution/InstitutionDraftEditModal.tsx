"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";
import {
	buildAddressFromFormData,
	buildStreetLine,
} from "@/lib/utils/formUtils";
import { institutionSubmissionToDraft } from "@/lib/utils/institutionSubmissionUtils";
import {
	getSubmissionById,
	updateSubmission,
} from "@/server/actions/submissions";
import { useAccountStore } from "@/lib/store/accountStore";
import type { Category, FilterState } from "@/types";
import type { Submission } from "@/types/submission";
import { useRouter } from "next/navigation";
import { AlertDialog } from "../ui/alert-dialog";

type InstitutionDraftEditModalProps = {
	returnTo?: string;
	submissionId?: number;
	shouldRefresh?: boolean;
};

export function InstitutionDraftEditModal({
	returnTo,
	submissionId,
	shouldRefresh = true,
}: InstitutionDraftEditModalProps) {
	const { t } = useTranslation("content");
	const submissions = useAccountStore((state) => state.submissions);
	const upsertSubmission = useAccountStore((state) => state.upsertSubmission);
	const categories = useAccountStore((state) => state.categories);
	const router = useRouter();

	const hasSubmissionId = typeof submissionId === "number";
	const [fetchedSubmission, setFetchedSubmission] = useState<Submission | null>(
		null,
	);
	const [didFetchSubmission, setDidFetchSubmission] = useState(false);

	const resolvedSubmission = useMemo(() => {
		if (!hasSubmissionId) return undefined;
		return submissions.find((item) => item.id === submissionId) ?? undefined;
	}, [hasSubmissionId, submissions, submissionId]);

	const resolvedSubmissionWithFallback =
		resolvedSubmission ?? fetchedSubmission ?? undefined;

	useEffect(() => {
		if (!hasSubmissionId || resolvedSubmission || didFetchSubmission) return;
		let active = true;
		const fetchSubmission = async () => {
			try {
				const result = await getSubmissionById(submissionId);
				if (!active) return;
				setFetchedSubmission(result ?? null);
			} catch {
				if (active) {
					setFetchedSubmission(null);
				}
			} finally {
				if (active) {
					setDidFetchSubmission(true);
				}
			}
		};
		fetchSubmission();
		return () => {
			active = false;
		};
	}, [didFetchSubmission, hasSubmissionId, resolvedSubmission, submissionId]);

	const handleSubmit = useCallback(
		async (data: Record<string, unknown>) => {
			const payload = {
				...data,
				address: buildAddressFromFormData(data),
			};
			if (!resolvedSubmissionWithFallback || !hasSubmissionId) return;
			const updated = await updateSubmission({
				id: submissionId,
				data: payload,
			});
			if (updated) {
				upsertSubmission(updated);
			}
			if (shouldRefresh) {
				router.refresh();
			}
		},
		[
			router,
			upsertSubmission,
			submissionId,
			shouldRefresh,
			hasSubmissionId,
			resolvedSubmissionWithFallback,
		],
	);

	const buildCategoryFilterStateFromIds = useCallback(
		(
			categoryIds: number[] | undefined,
			categoryGroups: Category[],
		): FilterState => {
			const category_keys: string[] = [];
			const subcategory_keys: string[] = [];
			const categoryMap = new Map(
				categoryGroups.map((category) => [category.id, category]),
			);
			(categoryIds ?? []).forEach((id) => {
				const category = categoryMap.get(id);
				if (!category) return;
				if (category.parent_category_id) {
					subcategory_keys.push(category.key);
				} else {
					category_keys.push(category.key);
				}
			});
			return {
				district_keys: [],
				category_keys,
				subcategory_keys,
				include_closed: false,
				status: undefined,
			};
		},
		[],
	);

	const initialValues = useMemo(() => {
		const draft = institutionSubmissionToDraft({
			data: (resolvedSubmissionWithFallback?.data ?? {}) as Record<
				string,
				unknown
			>,
		});
		const address = draft.address;
		return {
			...draft,
			categoryIds: draft.categoryIds?.map((id) => String(id)) ?? [],
			categoryFilters: buildCategoryFilterStateFromIds(
				draft.categoryIds,
				categories,
			),
			"address.streetLine": buildStreetLine(
				address?.street,
				address?.street_number,
			),
			"address.city": address?.city ?? "",
			"address.zip": address?.zipcode ?? "",
			"address.address_suffix": address?.address_suffix ?? "",
			"address.neighbourhood": address?.neighbourhood ?? "",
			"address.cultural_area": address?.cultural_area ?? "",
			"address.lat": address?.lat ?? null,
			"address.lng": address?.lng ?? null,
		};
	}, [
		resolvedSubmissionWithFallback,
		categories,
		buildCategoryFilterStateFromIds,
	]);

	const isLoading =
		hasSubmissionId && !resolvedSubmissionWithFallback && !didFetchSubmission;
	const isNotFound =
		!hasSubmissionId || (!isLoading && !resolvedSubmissionWithFallback);

	if (isLoading) {
		return null;
	}

	if (isNotFound) {
		return (
			<AlertDialog
				title={t("institutionFormModal.dialog.notFound.title")}
				description={t("institutionFormModal.dialog.notFound.description")}
			/>
		);
	}

	return (
		<InstitutionFormModal
			mode="create"
			returnTo={returnTo}
			formKey={`draft-${submissionId ?? "new"}-${
				resolvedSubmissionWithFallback ? "loaded" : "loading"
			}`}
			initialValues={initialValues}
			onSubmit={({ data }) => handleSubmit(data)}
			closeOnSubmit
			submitLabel={t("institutionFormModal.actions.save")}
			shouldRefresh={shouldRefresh}
		/>
	);
}
