import { Locale } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getDirection(locale: Locale) {
	if (locale === "de") {
		return "ltr";
	}
	return "ltr";
}
