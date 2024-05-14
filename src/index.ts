import prettier from "prettier";
import { printAiScript } from "./printer";
import type { Comment, Node } from "./node";
import { parse } from "./parse";

const parser: prettier.Parser<Node> = {
	parse(text, _options) {
		return parse(text);
	},
	astFormat: "aiscript",
	locStart(node) {
		return node.loc?.start ?? 0;
	},
	locEnd(node) {
		return node.loc?.end ?? 0;
	},
};

const printer: prettier.Printer<Node> = {
	print(path, options, print, _args) {
		return printAiScript(path, options, print);
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
		return (node as { type: string }).type !== "comment";
	},
	printComment(commentPath, _options) {
		const node = commentPath.node as unknown as Comment;
		return node.type === "comment" ? node.value : "";
	},
	getCommentChildNodes(node, _options) {
		switch (node.type) {
			case "if":
				return [
					node.cond,
					node.then,
					...node.elseif.flatMap(({ cond, then }) => [cond, then]),
					...(node.else ? [node.else] : []),
				];
			case "match":
				return [
					node.about,
					...node.qs.flatMap(q => [q.q, q.a]),
					...(node.default ? [node.default] : []),
				];
			case "obj":
				return [...node.value.values()];
		}
	},
};

const plugin: prettier.Plugin = {
	languages: [
		{
			name: "AiScript",
			parsers: ["aiscript"],
			extensions: ["is"],
		},
	],
	parsers: { aiscript: parser },
	printers: { aiscript: printer },
};

export default plugin;
