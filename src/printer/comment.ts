import { type Doc, type ParserOptions, doc } from "prettier";
import type prettier from "prettier";
import type { Node } from "../node";
import type { AstPath } from "../types";

const { hardline, join } = doc.builders;

export const hasComments = (node: Node) =>
	node.comments != null && node.comments.length > 0;

export const printDanglingComments = (
	path: AstPath,
	options: ParserOptions<Node>,
): Doc => {
	const { node } = path;

	if (node.comments == null) return "";

	return join(
		hardline,
		path
			.map(path => {
				const { node: comment } = path;
				if (comment.leading || comment.trailing) return "";
				comment.printed = true;
				return (options.printer as prettier.Printer<Node>).printComment!(
					path as unknown as prettier.AstPath<Node>,
					options,
				);
			}, "comments")
			.filter(Boolean),
	);
};
