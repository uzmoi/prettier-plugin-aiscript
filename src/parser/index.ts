import { type Ast, Parser } from "@syuilo/aiscript";
import type { Root } from "../node";
import { parseCommentsByStringLocations } from "./comments";
import { parserPlugin } from "./utils";

export const parse = (source: string): Root => {
	const parser = new Parser();

	const stringLocations: Ast.Loc[] = [];
	parser.addPlugin(
		"transform",
		// collect string locations
		parserPlugin(node => {
			const isStringNode = node.type === "str" || node.type === "tmpl";
			if (isStringNode && node.loc) {
				stringLocations.push(node.loc);
			}
			return node;
		}),
	);

	const body = parser.parse(source);

	const comments = parseCommentsByStringLocations(source, stringLocations);

	return { type: "root", body, comments };
};
