import { AISCRIPT_VERSION, type Ast, Parser } from "@syuilo/aiscript";
import { cmp, coerce, satisfies } from "semver";
import type { Root } from "../node";
import {
	correctLocation,
	parseCommentsByPreprocessDiff,
	parseCommentsByStringLocations,
} from "./parse-comments";
import { transformChainPlugin } from "./transform-chain";
import { parserPlugin } from "./utils";

export const emptyNsPlugin = () =>
	parserPlugin(node => {
		if (node.type === "ns") {
			node.members ??= [];
		}
		return node;
	});

const parse_0_19_0 = (source: string): Root => {
	const parser = new Parser();

	// @ts-expect-error
	parser.plugins.validate.unshift(emptyNsPlugin());

	parser.addPlugin("transform", transformChainPlugin());
	parser.addPlugin(
		"transform",
		parserPlugin(node => {
			if (node.loc == null) return node;
			const { start, end } = node.loc;
			// AiScriptのパーサーがendに最後の文字のindexを入れるので+1する。
			return { ...node, loc: { start, end: end + 1 } };
		}),
	);

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

const parse_before_0_19_0 = (source: string): Root => {
	const comments = parseCommentsByPreprocessDiff(source);

	const parser = new Parser();

	// @ts-expect-error
	parser.plugins.validate.unshift(emptyNsPlugin());

	parser.addPlugin("transform", transformChainPlugin());
	parser.addPlugin(
		"transform",
		parserPlugin(node => correctLocation(node, comments)),
	);

	const body = parser.parse(source);

	return { type: "root", body, comments };
};

export const parse = (text: string): Root => {
	const version = coerce(AISCRIPT_VERSION)!;

	if (satisfies(version, "0.19")) {
		return parse_0_19_0(text);
	}

	if (cmp(version, "<", "0.19.0")) {
		return parse_before_0_19_0(text);
	}

	throw new Error(`Unsupported AiScript version: ${AISCRIPT_VERSION}`);
};
