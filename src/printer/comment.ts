import { type Doc, doc, type ParserOptions } from "prettier";
import type * as dst from "../dst";
import type { AstPath } from "../types";

const { hardline, join } = doc.builders;

export const hasComments = (node: dst.NodeBase) =>
	node.comments != null && node.comments.length > 0;

export const printComment = (
	{ node }: AstPath,
	_options: ParserOptions<dst.Node>,
): Doc => {
	if (node.type !== "Comment") return "";
	return node.value;
};

export const printDanglingComments = (
	path: AstPath<dst.NodeBase>,
	options: ParserOptions<dst.Node>,
): Doc => {
	if (!hasComments(path.node)) return "";

	return join(
		hardline,
		path
			.map(path => {
				const { node: comment } = path;
				if (comment.leading || comment.trailing) return "";
				comment.printed = true;
				return printComment(path, options);
			}, "comments")
			.filter(Boolean),
	);
};
