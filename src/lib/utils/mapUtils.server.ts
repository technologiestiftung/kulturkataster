import fs from "fs";
import path from "path";

export function getLocalJson(url: string) {
	const filePath = path.join(process.cwd(), "public", url);
	const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
	return json;
}
