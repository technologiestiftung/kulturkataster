import { AboutModal } from "@/components/Modals/Pages/AboutModal";
import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.about",
	{
		absolute: true,
	},
);

export default function AboutPage() {
	return <AboutModal routePath="/about" />;
}
