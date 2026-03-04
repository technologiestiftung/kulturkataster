import type { SubmissionType } from "@/generated/prisma";
import type { InstitutionActionPermissions } from "@/types/account";

export const canReviewInstitutionSubmissionType = (
	permissions: InstitutionActionPermissions,
	type: SubmissionType,
): boolean => {
	if (!permissions.reviewSubmission) return false;
	if (type === "create") return permissions.create;
	if (type === "update" || type === "claim") return permissions.update;
	if (type === "delete") return permissions.delete;
	return false;
};
