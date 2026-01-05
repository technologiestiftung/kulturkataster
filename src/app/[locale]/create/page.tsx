"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import {
	HorizontalStepper,
	StepIndicator,
	useHorizontalStepper,
	type StepConfig,
} from "@/components/HorizontalStepper";

interface InstitutionFormData {
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

function CreateInstitutionContent() {
	const router = useRouter();
	const {
		currentStepId,
		currentStepIndex,
		totalSteps,
		nextStep,
		previousStep,
		canGoNext,
		canGoPrevious,
		steps,
	} = useHorizontalStepper();

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

	const updateFormData = (field: keyof InstitutionFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = () => {
		console.log("Submitting institution:", formData);
		// TODO: Implement actual submission logic
		router.push("/account/institutions");
	};

	const handleCancel = () => {
		router.push("/account/institutions");
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
			<Card>
				<CardHeader>
					<CardTitle>{currentStep.title}</CardTitle>
					<CardDescription>{currentStep.description}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Step 1: Basic Information */}
					{currentStepId === "basic" && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Institution Name *</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) => updateFormData("name", e.target.value)}
									placeholder="e.g., Staatliche Kunsthalle"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="slug">Slug *</Label>
								<Input
									id="slug"
									value={formData.slug}
									onChange={(e) => updateFormData("slug", e.target.value)}
									placeholder="e.g., staatliche-kunsthalle"
								/>
								<p className="text-xs text-muted-foreground">
									URL-friendly identifier for the institution
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="type">Institution Type *</Label>
								<Select
									value={formData.type}
									onValueChange={(value) => updateFormData("type", value)}
								>
									<SelectTrigger id="type">
										<SelectValue placeholder="Select institution type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="museum">Museum</SelectItem>
										<SelectItem value="gallery">Gallery</SelectItem>
										<SelectItem value="theater">Theater</SelectItem>
										<SelectItem value="library">Library</SelectItem>
										<SelectItem value="archive">Archive</SelectItem>
										<SelectItem value="monument">Monument</SelectItem>
										<SelectItem value="other">Other</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Input
									id="description"
									value={formData.description}
									onChange={(e) =>
										updateFormData("description", e.target.value)
									}
									placeholder="Brief description of the institution"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="website">Website</Label>
								<Input
									id="website"
									type="url"
									value={formData.website}
									onChange={(e) => updateFormData("website", e.target.value)}
									placeholder="https://example.com"
								/>
							</div>
						</div>
					)}

					{/* Step 2: Address */}
					{currentStepId === "address" && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="street">Street Address *</Label>
								<Input
									id="street"
									value={formData.street}
									onChange={(e) => updateFormData("street", e.target.value)}
									placeholder="e.g., Lichtentaler Allee 8a"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="postalCode">Postal Code *</Label>
									<Input
										id="postalCode"
										value={formData.postalCode}
										onChange={(e) =>
											updateFormData("postalCode", e.target.value)
										}
										placeholder="e.g., 76530"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="city">City *</Label>
									<Input
										id="city"
										value={formData.city}
										onChange={(e) => updateFormData("city", e.target.value)}
										placeholder="e.g., Baden-Baden"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="district">District</Label>
								<Input
									id="district"
									value={formData.district}
									onChange={(e) => updateFormData("district", e.target.value)}
									placeholder="e.g., Stadtkreis Baden-Baden"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="country">Country *</Label>
								<Input
									id="country"
									value={formData.country}
									onChange={(e) => updateFormData("country", e.target.value)}
								/>
							</div>
						</div>
					)}

					{/* Step 3: Contact */}
					{currentStepId === "contact" && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="contactName">Contact Name *</Label>
								<Input
									id="contactName"
									value={formData.contactName}
									onChange={(e) =>
										updateFormData("contactName", e.target.value)
									}
									placeholder="e.g., Dr. Anna Schmidt"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="contactEmail">Contact Email *</Label>
								<Input
									id="contactEmail"
									type="email"
									value={formData.contactEmail}
									onChange={(e) =>
										updateFormData("contactEmail", e.target.value)
									}
									placeholder="e.g., contact@institution.de"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="contactPhone">Contact Phone</Label>
								<Input
									id="contactPhone"
									type="tel"
									value={formData.contactPhone}
									onChange={(e) =>
										updateFormData("contactPhone", e.target.value)
									}
									placeholder="e.g., +49 7221 300760"
								/>
							</div>
						</div>
					)}

					{/* Step 4: Review */}
					{currentStepId === "review" && (
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
					)}
				</CardContent>
			</Card>

			{/* Navigation Buttons */}
			<div className="flex items-center justify-between mt-8">
				<div>
					{canGoPrevious && (
						<Button variant="outline" onClick={previousStep}>
							<ChevronLeft className="h-4 w-4 mr-2" />
							Previous
						</Button>
					)}
				</div>

				<div className="flex items-center gap-4">
					<Button variant="ghost" onClick={handleCancel}>
						Cancel
					</Button>

					{currentStepIndex < totalSteps - 1 ? (
						<Button onClick={nextStep} disabled={!canGoNext}>
							Next
							<ChevronRight className="h-4 w-4 ml-2" />
						</Button>
					) : (
						<Button onClick={handleSubmit}>
							<Check className="h-4 w-4 mr-2" />
							Submit
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
