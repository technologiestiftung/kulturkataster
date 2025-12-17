import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Preferences – Kulturkataster",
};

export default function PreferencesPage() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold">Preferences</h2>
				<p className="text-muted-foreground mt-2">
					Manage your application preferences
				</p>
			</div>

			<div className="space-y-4">
				<p className="text-muted-foreground">
					Your preferences will appear here.
				</p>
			</div>
		</div>
	);
}
