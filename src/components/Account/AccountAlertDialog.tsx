"use client";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { useAccountStore } from "@/lib/store/accountStore";
import { useTranslation } from "react-i18next";

function AccountAlertDialog() {
	const alertDialog = useAccountStore((state) => state.alertDialog);
	const setAlertDialog = useAccountStore((state) => state.setAlertDialog);
	const { t } = useTranslation("common");

	if (!alertDialog) return null;

	return (
		<AlertDialog
			open
			status="success"
			title={alertDialog.title}
			description={alertDialog.description}
			confirmLabel={t("confirm")}
			onConfirm={() => setAlertDialog(null)}
			onOpenChange={(open) => {
				if (!open) setAlertDialog(null);
			}}
		/>
	);
}

export { AccountAlertDialog };
