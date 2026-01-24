import type prettier from "prettier";
import type * as dst from "./dst";
import { locEnd, locStart } from "./location";
import { parse } from "./parser";
import { printAiScript } from "./printer";
import { printComment } from "./printer/comment";
import type { AstPath } from "./types";

const parser: prettier.Parser<dst.Node> = {
	parse(text, _options) {
		return parse(text);
	},
	astFormat: "aiscript",
	locStart,
	locEnd,
};

const printer: prettier.Printer<dst.Node> = {
	print(path, options, print, _args) {
		return printAiScript(
			path as AstPath,
			options,
			print as (path: AstPath) => prettier.Doc,
		);
	},
	hasPrettierIgnore(path) {
		const { node } = path;

		if (!node.comments) {
			return false;
		}

		return node.comments.some(comment =>
			/\/[/*]\s*prettier-ignore/.test(comment.value),
		);
	},
	canAttachComment(node) {
		return "type" in node && node.type !== "Comment";
	},
	printComment(path, options) {
		return printComment(path as AstPath, options);
	},
	isBlockComment(node) {
		return (node as dst.Comment).value.startsWith("/*");
	},
};

const plugin: prettier.Plugin = {
	languages: [
		{
			name: "AiScript",
			parsers: ["aiscript"],
			extensions: ["is", "ais"],
			vscodeLanguageIds: ["aiscript"],
		},
	],
	parsers: { aiscript: parser },
	printers: { aiscript: printer },
	options: {
		// https://github.com/prettier/prettier/blob/90f036500c8f9240227246f171b4aafa5d76e589/src/common/common-options.evaluate.js#L12-L17
		singleQuote: {
			category: "Common",
			type: "boolean",
			default: false,
			description: "Use single quotes instead of double quotes.",
		},
		semi: {
			category: "AiScript",
			type: "boolean",
			default: true,
			description: "Print semicolons.",
		},
	},
};

export default plugin;
