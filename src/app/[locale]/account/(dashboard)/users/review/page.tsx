import { redirect } from "next/navigation";

export default async function UserClaimsReviewPage() {
	redirect("/account/users");
}
