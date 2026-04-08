import { Card, CardContent } from "@/components/ui/card";

function InstitutionCardSkeleton() {
	return (
		<Card className="w-full rounded-lg overflow-hidden border-none shadow-sm">
			<CardContent className="p-4 space-y-2 md:space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
					{/* Left Column */}
					<div className="space-y-3">
						<div className="motion-safe:animate-pulse space-y-3">
							{/* Parent organization */}
							<div className="h-4 bg-gray-200 rounded w-1/3"></div>

							{/* Institution name (title) */}
							<div className="h-6 bg-gray-200 rounded w-3/4"></div>

							{/* Categories with icon */}
							<div className="flex items-center gap-2">
								<div className="w-5 h-5 bg-gray-200 rounded"></div>
								<div className="h-4 bg-gray-200 rounded w-1/2"></div>
								<div className="h-4 bg-gray-200 rounded w-2"></div>
								<div className="h-4 bg-gray-200 rounded w-1/3"></div>
							</div>

							{/* Status indicator */}
							<div className="flex items-center gap-2 bg-neutral-5 p-2">
								<div className="w-4 h-4 bg-gray-200 rounded-full"></div>
								<div className="h-4 bg-gray-200 rounded w-1/2"></div>
							</div>

							{/* Address */}
							<div className="space-y-2">
								<div className="h-3 bg-gray-200 rounded w-2/3"></div>
								<div className="h-3 bg-gray-200 rounded w-1/2"></div>
							</div>
						</div>
					</div>

					{/* Right Column - Contact */}
					<div className="space-y-3">
						<div className="motion-safe:animate-pulse space-y-2">
							<div className="h-4 bg-gray-200 rounded w-1/4"></div>
							<div className="h-3 bg-gray-200 rounded w-3/4"></div>
							<div className="h-3 bg-gray-200 rounded w-2/3"></div>
							<div className="h-3 bg-gray-200 rounded w-1/2"></div>
						</div>
					</div>
				</div>

				{/* Toggle button */}
				<div className="motion-safe:animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-24"></div>
				</div>
			</CardContent>
		</Card>
	);
}

export default InstitutionCardSkeleton;
