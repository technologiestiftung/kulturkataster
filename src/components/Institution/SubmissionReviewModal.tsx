"use client";

import { useEffect, useMemo, useState } from "react";
import { CategorySubmissionReviewModal } from "@/components/Institution/CategorySubmissionReviewModal";
import { InstitutionDraftReviewModal } from "@/components/Institution/InstitutionDraftReviewModal";
import { useAccountStore } from "@/lib/store/accountStore";
import { getSubmissionById } from "@/server/actions/submissions";
import type { Submission } from "@/types/submission";

type SubmissionReviewModalProps = {
	submissionId: number;
	returnTo?: string;
	routePath?: string;
	shouldRefresh?: boolean;
};

export function SubmissionReviewModal({
	submissionId,
	returnTo,
	routePath,
	shouldRefresh,
}: SubmissionReviewModalProps) {
	const submissions = useAccountStore((state) => state.submissions);
	const [fetchedSubmission, setFetchedSubmission] = useState<Submission | null>(
		null,
	);
	const [didResolveSubmission, setDidResolveSubmission] = useState(false);

	const submission = useMemo(
		() =>
			submissions.find((item) => item.id === submissionId) ??
			fetchedSubmission ??
			null,
		[fetchedSubmission, submissionId, submissions],
	);

	useEffect(() => {
		if (submission) {
			setDidResolveSubmission(true);
			return;
		}
		let isMounted = true;
		void getSubmissionById(submissionId)
			.then((result) => {
				if (!isMounted) return;
				setFetchedSubmission(result);
				setDidResolveSubmission(true);
			})
			.catch(() => {
				if (!isMounted) return;
				setFetchedSubmission(null);
				setDidResolveSubmission(true);
			});
		return () => {
			isMounted = false;
		};
	}, [submission, submissionId]);

	if (submission?.entity_type === "category") {
		return (
			<CategorySubmissionReviewModal
				submission={submission}
				returnTo={returnTo}
				routePath={routePath}
				shouldRefresh={shouldRefresh}
			/>
		);
	}

	return (
		<InstitutionDraftReviewModal
			submissionId={submissionId}
			submission={submission}
			didResolveSubmission={didResolveSubmission}
			returnTo={returnTo}
			routePath={routePath}
			shouldRefresh={shouldRefresh}
		/>
	);
}
