import type { ParserOptions } from "prettier";
import type { Node } from "./node";

// export const getNodeSourceCode = (node: Node, options: ParserOptions<Node>) => {
// 	const { originalText, locStart, locEnd } = options;
// 	return originalText.slice(locStart(node), locEnd(node));
// };

export const startsWith = (
	string: string,
	node: Node,
	options: ParserOptions<Node>,
) => {
	const { originalText, locStart } = options;
	return originalText.startsWith(string, locStart(node));
};
