"use client";

import {
	CircleCheck,
	Info,
	LoaderCircle,
	OctagonX,
	TriangleAlert,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			position="top-center"
			icons={{
				success: <CircleCheck className="h-4 w-4 text-green-500" />,
				info: <Info className="h-4 w-4 text-blue-500" />,
				warning: <TriangleAlert className="h-4 w-4 text-amber-500" />,
				error: <OctagonX className="h-4 w-4 text-red-500" />,
				loading: (
					<LoaderCircle className="h-4 w-4 motion-safe:animate-spin text-muted-foreground" />
				),
			}}
			toastOptions={{
				duration: 7000,
				classNames: {
					toast:
						"group toast bg-background! border-border! rounded-sm! shadow-none!",
					title: "font-extrabold! text-[1rem]! text-foreground! leading-[2rem]",
					description: "body2! text-[0.875rem]! text-foreground!",
					success: "",
					error: "border-l-red-500",
					warning: "border-l-amber-500",
					info: "border-l-blue-500",
					actionButton: "bg-primary text-primary-foreground",
					cancelButton: "bg-muted text-muted-foreground",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
