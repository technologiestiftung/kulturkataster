import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Profile – Kulturkataster",
};

export default function ProfilePage() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold">Profile</h2>
				<p className="text-muted-foreground mt-2">
					View and manage your profile information
				</p>
			</div>

			<div className="space-y-4">
				<p className="text-muted-foreground">
					Your profile information will appear here.
				</p>
			</div>
		</div>
	);
}
