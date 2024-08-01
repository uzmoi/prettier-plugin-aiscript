import { Parser } from "@syuilo/aiscript";
import type { Root } from "../node";
import {
	correctLocation,
	parseCommentsByPreprocessDiff,
} from "./parse-comments";
import { transformChainPlugin } from "./transform-chain";
import { parserPlugin } from "./utils";

export const parse = (text: string): Root => {
	const comments = parseCommentsByPreprocessDiff(text);

	const parser = new Parser();

	parser.addPlugin("transform", transformChainPlugin());
	parser.addPlugin(
		"transform",
		parserPlugin(node => correctLocation(node, comments)),
	);

	const body = parser.parse(text);

	return { type: "root", body, comments };
};
