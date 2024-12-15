import { assert } from "emnorst";
import { type Doc, type ParserOptions, doc } from "prettier";
import type * as dst from "../dst";
import type { AstPath } from "../types";

const { join, line } = doc.builders;

export const printTypeSource = (
	path: AstPath<dst.Ty>,
	_options: ParserOptions<dst.Node>,
	print: (path: AstPath) => Doc,
): Doc => {
	const { node } = path;

	switch (node.type) {
		case "TypeReference":
			assert.as<AstPath<typeof node>>(path);
			return node.argument == null ?
					node.name.name
				:	[node.name.name, "<", path.call(print, "argument"), ">"];
		case "FnType":
			assert.as<AstPath<typeof node>>(path);
			return [
				"@(",
				join([",", line], path.map(print, "params")),
				") => ",
				path.call(print, "return"),
			];
	}
};
