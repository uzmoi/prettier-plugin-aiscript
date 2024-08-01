import type { Cst, Ast } from "@syuilo/aiscript";
import { parserPlugin } from "./utils";

const transformChain = (node: { chain: Cst.ChainMember[] }) => {
	const { chain, ...hostNode } = node;

	let parent = hostNode as Ast.Expression;

	for (const item of chain) {
		switch (item.type) {
			case "callChain": {
				parent = {
					type: "call",
					target: parent,
					args: item.args as Ast.Expression[],
					loc: item.loc,
				};
				break;
			}
			case "indexChain": {
				parent = {
					type: "index",
					target: parent,
					index: item.index as Ast.Expression,
					loc: item.loc,
				};
				break;
			}
			case "propChain": {
				parent = {
					type: "prop",
					target: parent,
					name: item.name,
					loc: item.loc,
				};
				break;
			}
			default:
				break;
		}
	}

	return parent;
};

/**
 * `@syuilo/aiscript`のパーサーが一部のchainを変形しないので、\
 * これらを変形するパーサープラグイン。
 *
 * どうせインタプリタでも無視されるし、not, and, orに続くprop, index, callってそもそも\
 * 式としておかしいので問題になることはほぼないと思うんだけど、フォーマッタでコードの\
 * 一部が消えるのもどうかと思ったので。
 */
export const transformChainPlugin = () =>
	parserPlugin(node => {
		if (
			(node.type === "not" || node.type === "and" || node.type === "or") &&
			"chain" in node &&
			node.chain != null
		) {
			return transformChain(node as { chain: Cst.ChainMember[] }) as Cst.Node;
		}
		return node;
	});
