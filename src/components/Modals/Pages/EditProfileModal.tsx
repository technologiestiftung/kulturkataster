"use client";

import { useTranslation } from "react-i18next";
import { PageModal } from "../PageModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function EditProfileModal() {
	const { t } = useTranslation("common");
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		organization: "",
		phone: "",
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Handle form submission
		console.log("Form submitted:", formData);
	};

	const handleChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const content = (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="name">
						{t("editProfile.name", { defaultValue: "Name" })}
					</Label>
					<Input
						id="name"
						type="text"
						value={formData.name}
						onChange={(e) => handleChange("name", e.target.value)}
						placeholder={t("editProfile.namePlaceholder", {
							defaultValue: "Enter your name",
						})}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="email">
						{t("editProfile.email", { defaultValue: "Email" })}
					</Label>
					<Input
						id="email"
						type="email"
						value={formData.email}
						onChange={(e) => handleChange("email", e.target.value)}
						placeholder={t("editProfile.emailPlaceholder", {
							defaultValue: "Enter your email",
						})}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="organization">
						{t("editProfile.organization", { defaultValue: "Organization" })}
					</Label>
					<Input
						id="organization"
						type="text"
						value={formData.organization}
						onChange={(e) => handleChange("organization", e.target.value)}
						placeholder={t("editProfile.organizationPlaceholder", {
							defaultValue: "Enter your organization",
						})}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="phone">
						{t("editProfile.phone", { defaultValue: "Phone" })}
					</Label>
					<Input
						id="phone"
						type="tel"
						value={formData.phone}
						onChange={(e) => handleChange("phone", e.target.value)}
						placeholder={t("editProfile.phonePlaceholder", {
							defaultValue: "Enter your phone number",
						})}
					/>
				</div>
			</div>

			<div className="flex justify-end gap-3">
				<Button type="button" variant="outline">
					{t("cancel", { defaultValue: "Cancel" })}
				</Button>
				<Button type="submit">
					{t("save", { defaultValue: "Save Changes" })}
				</Button>
			</div>
		</form>
	);

	return (
		<PageModal
			title={t("editProfile.title", { defaultValue: "Edit Profile" })}
			subtitle={t("editProfile.subtitle", {
				defaultValue: "Update your personal information",
			})}
			content={content}
			variant="medium"
			hasFooter={false}
		/>
	);
}