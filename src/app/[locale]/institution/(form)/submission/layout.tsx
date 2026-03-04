import { ReactNode } from "react";

interface SubmissionLayoutProps {
	children: ReactNode;
}

export default function SubmissionLayout({ children }: SubmissionLayoutProps) {
	return <>{children}</>;
}
