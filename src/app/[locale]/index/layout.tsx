import { ReactNode } from "react";

interface QuestionnaireLayoutProps {
	children: ReactNode;
}

export default function QuestionnaireLayout({
	children,
}: QuestionnaireLayoutProps) {
	return <>{children}</>;
}
