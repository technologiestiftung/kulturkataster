"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormWrapper } from "@/components/shared/FormWrapper";
import type { FormWrapperConfig } from "@/components/shared/FormWrapper";
import {
	HorizontalStepper,
	StepIndicator,
	useHorizontalStepper,
	type StepConfig,
} from "@/components/HorizontalStepper";
import { ChevronRight, Check } from "lucide-react";

const stepConfigs: StepConfig[] = [
	{
		id: "basic",
		icon: null,
		title: "Basic Information",
		description: "Tell us about your institution",
	},
	{
		id: "address",
		icon: null,
		title: "Address",
		description: "Where is your institution located?",
	},
	{
		id: "contact",
		icon: null,
		title: "Contact",
		description: "How can we reach you?",
	},
	{
		id: "review",
		icon: null,
		title: "Review",
		description: "Review and submit",
	},
];

interface InstitutionFormData extends Record<string, unknown> {
	// Basic Information
	name: string;
	slug: string;
	type: string;
	description: string;
	website: string;

	// Address
	street: string;
	city: string;
	district: string;
	postalCode: string;
	country: string;

	// Contact
	contactName: string;
	contactEmail: string;
	contactPhone: string;
}

function CreateInstitutionContent() {
	const router = useRouter();
	const { currentStepId, currentStepIndex, totalSteps, nextStep, steps } =
		useHorizontalStepper();

	const [formData, setFormData] = useState<InstitutionFormData>({
		name: "",
		slug: "",
		type: "",
		description: "",
		website: "",
		street: "",
		city: "",
		district: "",
		postalCode: "",
		country: "Germany",
		contactName: "",
		contactEmail: "",
		contactPhone: "",
	});

	const currentStep = steps[currentStepIndex];

	const handleStepSubmit = (data: Record<string, unknown>) => {
		// Update form data
		setFormData((prev) => ({ ...prev, ...data }));

		// Go to next step or submit
		if (currentStepIndex < totalSteps - 1) {
			nextStep();
		} else {
			handleFinalSubmit({ ...formData, ...data } as InstitutionFormData);
		}
	};

	const handleFinalSubmit = (data: InstitutionFormData) => {
		console.log("Submitting institution:", data);
		// TODO: Implement actual submission logic
		router.push("/account/institutions");
	};

	const handleCancel = () => {
		router.push("/account/institutions");
	};

	// Form config for Basic Information step
	const basicFormConfig: FormWrapperConfig = {
		sections: [
			{
				id: "basic",
				title: "Basic Information",
				description: "Tell us about your institution",
				useAccordion: true,
				defaultOpen: true,
				fields: [
					{
						name: "name",
						label: "Institution Name",
						type: "text",
						placeholder: "e.g., Staatliche Kunsthalle",
						required: true,
						gridColumn: "full",
					},
					{
						name: "slug",
						label: "Slug",
						type: "text",
						placeholder: "e.g., staatliche-kunsthalle",
						required: true,
						description: "URL-friendly identifier for the institution",
						gridColumn: "full",
					},
					{
						name: "type",
						label: "Institution Type",
						type: "select",
						required: true,
						gridColumn: "half",
						options: [
							{ label: "Museum", value: "museum" },
							{ label: "Gallery", value: "gallery" },
							{ label: "Theater", value: "theater" },
							{ label: "Library", value: "library" },
							{ label: "Archive", value: "archive" },
							{ label: "Monument", value: "monument" },
							{ label: "Other", value: "other" },
						],
					},
					{
						name: "website",
						label: "Website",
						type: "url",
						placeholder: "https://example.com",
						gridColumn: "half",
					},
				],
			},
			{
				id: "description",
				title: "Description",
				description: "Provide details about the institution",
				useAccordion: false,
				defaultOpen: true,
				fields: [
					{
						name: "description",
						label: "Description",
						type: "textarea",
						placeholder: "Brief description of the institution",
						gridColumn: "full",
					},
				],
			},
		],
		initialValues: formData,
		onSubmit: handleStepSubmit,
		hideActions: true,
		gridColumns: 2,
	};

	// Form config for Address step
	const addressFormConfig: FormWrapperConfig = {
		sections: [
			{
				id: "address",
				title: "Address",
				description: "Where is your institution located?",
				useAccordion: false,
				fields: [
					{
						name: "street",
						label: "Street Address",
						type: "text",
						placeholder: "e.g., Lichtentaler Allee 8a",
						required: true,
						gridColumn: "full",
					},
					{
						name: "postalCode",
						label: "Postal Code",
						type: "text",
						placeholder: "e.g., 76530",
						required: true,
						gridColumn: "half",
					},
					{
						name: "city",
						label: "City",
						type: "text",
						placeholder: "e.g., Baden-Baden",
						required: true,
						gridColumn: "half",
					},
					{
						name: "district",
						label: "District",
						type: "text",
						placeholder: "e.g., Stadtkreis Baden-Baden",
						gridColumn: "half",
					},
					{
						name: "country",
						label: "Country",
						type: "text",
						defaultValue: "Germany",
						required: true,
						gridColumn: "half",
					},
				],
			},
		],
		initialValues: formData,
		onSubmit: handleStepSubmit,
		hideActions: true,
		gridColumns: 2,
	};

	// Form config for Contact step
	const contactFormConfig: FormWrapperConfig = {
		sections: [
			{
				id: "contact",
				title: "Contact Information",
				description: "How can we reach you?",
				useAccordion: false,
				fields: [
					{
						name: "contactName",
						label: "Contact Name",
						type: "text",
						placeholder: "e.g., Dr. Anna Schmidt",
						required: true,
						gridColumn: "half",
					},
					{
						name: "contactEmail",
						label: "Contact Email",
						type: "email",
						placeholder: "e.g., contact@institution.de",
						required: true,
						gridColumn: "half",
					},
					{
						name: "contactPhone",
						label: "Contact Phone",
						type: "tel",
						placeholder: "e.g., +49 7221 300760",
						gridColumn: "half",
					},
				],
			},
		],
		initialValues: formData,
		onSubmit: handleStepSubmit,
		hideActions: true,
		gridColumns: 2,
	};

	// Get current form config based on step
	const getCurrentFormConfig = () => {
		switch (currentStepId) {
			case "basic":
				return basicFormConfig;
			case "address":
				return addressFormConfig;
			case "contact":
				return contactFormConfig;
			default:
				return basicFormConfig;
		}
	};

	return (
		<div className="container mx-auto max-w-4xl py-10">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Add New Institution</h1>
				<p className="text-muted-foreground mt-2">
					Complete the following steps to add a new cultural institution
				</p>
			</div>

			{/* Step Indicators */}
			<div className="mb-8 flex flex-col items-center space-y-2 mx-24">
				<StepIndicator />
				<span className="body2">
					Schritt {currentStepIndex + 1} / {totalSteps}
				</span>
			</div>

			{/* Form Content */}
			<Card variant="secondary">
				<CardHeader>
					<CardTitle>{currentStep.title}</CardTitle>
					<CardDescription>{currentStep.description}</CardDescription>
				</CardHeader>
				<CardContent variant="secondary">
					{currentStepId === "review" ? (
						/* Review Step */
						<div className="space-y-6">
							<div>
								<h3 className="text-lg font-semibold mb-4">
									Basic Information
								</h3>
								<dl className="grid grid-cols-2 gap-4">
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											Name
										</dt>
										<dd className="text-sm">{formData.name || "—"}</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											Slug
										</dt>
										<dd className="text-sm">{formData.slug || "—"}</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											Type
										</dt>
										<dd className="text-sm">{formData.type || "—"}</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											Website
										</dt>
										<dd className="text-sm">{formData.website || "—"}</dd>
									</div>
									<div className="col-span-2">
										<dt className="text-sm font-medium text-muted-foreground">
											Description
										</dt>
										<dd className="text-sm">{formData.description || "—"}</dd>
									</div>
								</dl>
							</div>

							<div>
								<h3 className="text-lg font-semibold mb-4">Address</h3>
								<dl className="grid grid-cols-2 gap-4">
									<div className="col-span-2">
										<dt className="text-sm font-medium text-muted-foreground">
											Street
										</dt>
										<dd className="text-sm">{formData.street || "—"}</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											City
										</dt>
										<dd className="text-sm">{formData.city || "—"}</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											Postal Code
										</dt>
										<dd className="text-sm">{formData.postalCode || "—"}</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											District
										</dt>
										<dd className="text-sm">{formData.district || "—"}</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											Country
										</dt>
										<dd className="text-sm">{formData.country || "—"}</dd>
									</div>
								</dl>
							</div>

							<div>
								<h3 className="text-lg font-semibold mb-4">Contact</h3>
								<dl className="grid grid-cols-2 gap-4">
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											Name
										</dt>
										<dd className="text-sm">{formData.contactName || "—"}</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											Email
										</dt>
										<dd className="text-sm">{formData.contactEmail || "—"}</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-muted-foreground">
											Phone
										</dt>
										<dd className="text-sm">{formData.contactPhone || "—"}</dd>
									</div>
								</dl>
							</div>
						</div>
					) : (
						/* Form Steps */
						<FormWrapper config={getCurrentFormConfig()} />
					)}
				</CardContent>
			</Card>

			{/* Navigation Buttons */}
			<div className="flex items-center justify-between mt-8">
				<div className="flex items-center gap-4 w-full">
					<Button variant="outline" onClick={handleCancel} className="flex-1">
						Cancel
					</Button>

					{currentStepId === "review" ? (
						<Button
							onClick={() => handleFinalSubmit(formData)}
							className="flex-1"
						>
							<Check className="h-4 w-4 mr-2" />
							Previous
						</Button>
					) : (
						<Button
							type="submit"
							form="institution-form"
							className="flex-1"
							onClick={() => {
								// Trigger form submit
								const form = document.querySelector("form") as HTMLFormElement;
								form?.requestSubmit();
							}}
						>
							Next
							<ChevronRight className="h-4 w-4 ml-2" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

export default function CreateInstitutionPage() {
	return (
		<HorizontalStepper steps={stepConfigs}>
			<CreateInstitutionContent />
		</HorizontalStepper>
	);
}
