import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Settings – Kulturkataster",
};

export default function SettingsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold">Settings</h2>
				<p className="text-muted-foreground mt-2">
					Manage your account settings
				</p>
			</div>

			<div className="space-y-4">
				<p className="text-muted-foreground">
					Your account settings will appear here.
				</p>
			</div>
		</div>
	);
}
