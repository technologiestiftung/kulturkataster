"use client";

import { useTranslation } from "react-i18next";

export function Account() {
	const { t } = useTranslation("common");

	return (
		<div className="Account-root">
			<div className="Account-Top h-84">
				<div className="space-y-4">
					<h1 className="text-3xl font-bold">
						{t("account.title", { defaultValue: "My Account" })}
					</h1>
					<p className="text-muted-foreground">
						{t("account.description", {
							defaultValue:
								"View and manage your account details and preferences.",
						})}
					</p>
				</div>
			</div>

			<div className="space-y-4">
				<h2 className="text-2xl font-bold">
					{t("account.preferences", { defaultValue: "Preferences" })}
				</h2>
				<p className="text-muted-foreground">
					{t("account.preferencesDescription", {
						defaultValue: "Manage your application preferences.",
					})}
				</p>
			</div>
		</div>
	);
}
