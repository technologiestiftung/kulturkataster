import { getClaimSubmissionsDetailed } from "@/server/actions/submissions";
import { UserClaimReviewModal } from "@/components/Users/UserClaimReviewModal";

export default async function UserClaimsReviewModalPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const claims = await getClaimSubmissionsDetailed(id);
	return (
		<UserClaimReviewModal
			claims={claims}
			routePath={`/account/users/${id}/review`}
			returnTo="/account/users"
		/>
	);
}
