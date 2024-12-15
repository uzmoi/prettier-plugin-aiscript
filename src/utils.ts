import type { ParserOptions } from "prettier";
import type * as dst from "./dst";

export const getNodeSourceCode = (
	node: dst.Node,
	options: ParserOptions<dst.Node>,
) => {
	const { originalText, locStart, locEnd } = options;
	return originalText.slice(locStart(node), locEnd(node));
};
