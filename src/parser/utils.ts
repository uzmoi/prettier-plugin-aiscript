import type { Cst } from "@syuilo/aiscript";
import { visitNode } from "@syuilo/aiscript/parser/visit.js";

export const parserPlugin =
	(f: (node: Cst.Node) => Cst.Node) => (nodes: Cst.Node[]) =>
		nodes.map(node => visitNode(node, f));
