/**
 * Converts a markdown string into a complete email-safe HTML document.
 *
 * The body column in email_template stores pure markdown.
 * Go template placeholders ({{ .Data.first_name }} etc.) are preserved as-is
 * and substituted later by renderTemplate in sendTemplatedEmail.
 *
 * A standalone link paragraph — a paragraph whose only content is a single
 * markdown link — is automatically rendered as a CTA button:
 *   [Zum Portal]({{ .Data.portal_url }})
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Element, Text } from "hast";

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
	body: "margin:0;padding:24px;background:#f8f6f2;font-family:Barlow,Arial,Helvetica,sans-serif;color:#161616;",
	card: "max-width:620px;width:100%;background:#ffffff;border:1px solid #e2dfdb;border-radius:12px;",
	titleCell:
		"padding:28px 24px 8px 24px;font-size:24px;line-height:1.2;font-weight:700;",
	contentCell: "padding:0 24px 24px 24px;font-size:16px;line-height:1.6;",
	p: "margin:0 0 16px 0;",
	btn: "display:inline-block;background:#c288ff;color:#161616;text-decoration:none;padding:12px 18px;border-radius:4px;font-size:16px;line-height:1.5;font-weight:700;margin:0 0 16px 0;",
};

const STANDALONE_MARKDOWN_LINK_PATTERN = /^\[([^\]]+)\]\((.+)\)$/s;
const TAG_STYLE_MAP: Partial<Record<Element["tagName"], string>> = {
	strong: "font-weight:700;",
	ul: "margin:0 0 16px 0;padding-left:24px;",
	li: S.p,
	hr: "border:none;border-top:1px solid #e2dfdb;margin:24px 0;",
};

function createButtonLinkFromMarkdownText(value: string): Element | null {
	const match = value.trim().match(STANDALONE_MARKDOWN_LINK_PATTERN);
	if (!match) return null;

	const [, label, href] = match;
	return {
		type: "element",
		tagName: "a",
		properties: {
			href,
			style: S.btn,
		},
		children: [{ type: "text", value: label }],
	};
}

function getButtonAnchor(node: Element): Element | null {
	const nonEmpty = node.children.filter(
		(c) => !(c.type === "text" && !(c as Text).value.trim()),
	);
	if (nonEmpty.length !== 1) return null;

	const child = nonEmpty[0];
	if (child.type === "element" && (child as Element).tagName === "a") {
		return child as Element;
	}
	if (child.type === "text") {
		return createButtonLinkFromMarkdownText((child as Text).value);
	}
	return null;
}

function rehypeEmailButton() {
	return (tree: Parameters<typeof visit>[0]) => {
		visit(tree, "element", (node: Element) => {
			if (node.tagName !== "p") return;

			const child = node.children.find(
				(c) => !(c.type === "text" && !(c as Text).value.trim()),
			);
			const a = getButtonAnchor(node);
			if (!a) return;

			if (a !== child) {
				node.children = [a];
			}
			a.properties = { ...a.properties, style: S.btn };
			node.properties = { ...node.properties, style: "margin:0 0 16px 0;" };
		});
	};
}

// ─── Rehype plugin: add inline styles to common elements ─────────────────────

function applyEmailStyles(node: Element) {
	if (node.tagName === "p") {
		if (!node.properties?.style) {
			node.properties = {
				...node.properties,
				style: `${S.p}word-break:break-word;`,
			};
		}
		return;
	}

	if (node.tagName === "a") {
		if (!node.properties?.style) {
			node.properties = {
				...node.properties,
				style: "color:#161616;text-decoration:underline;",
			};
		}
		return;
	}

	const style = TAG_STYLE_MAP[node.tagName];
	if (!style) return;

	node.properties = {
		...node.properties,
		style,
	};
}

function rehypeEmailStyles() {
	return (tree: Parameters<typeof visit>[0]) => {
		visit(tree, "element", (node: Element) => {
			applyEmailStyles(node);
		});
	};
}

// ─── Processor ───────────────────────────────────────────────────────────────

const processor = unified()
	.use(remarkParse)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeEmailButton)
	.use(rehypeEmailStyles)
	.use(rehypeStringify, { allowDangerousHtml: true });

// ─── Main export ─────────────────────────────────────────────────────────────

export async function mdToEmailHtml(
	body: string,
	subject: string,
): Promise<string> {
	const contentHtml = String(await processor.process(body));

	return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="${S.body}">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="${S.card}">
            <tr>
              <td style="${S.titleCell}">${subject}</td>
            </tr>
            <tr>
              <td style="${S.contentCell}">
                ${contentHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Returns true if the body column contains markdown (not legacy HTML). */
export function isMarkdownTemplate(content: string): boolean {
	return (
		!content.trimStart().startsWith("<!doctype") &&
		!content.trimStart().startsWith("<html")
	);
}
