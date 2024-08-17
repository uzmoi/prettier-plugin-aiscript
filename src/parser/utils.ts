import type { Cst } from "@syuilo/aiscript";

export const visitNode = <T extends {}>(node: T, f: (node: T) => T) => {
	if (Array.isArray(node)) {
		for (const [i, element] of node.entries()) {
			if (typeof element !== "object") continue;
			node[i] = visitNode(element, f);
		}
	} else if (node instanceof Map) {
		for (const [key, value] of node) {
			node.set(key, visitNode(value, f));
		}
	} else {
		if ("type" in node) {
			// biome-ignore lint/style/noParameterAssign: ゆるして
			node = f(node);
		}

		for (const [key, value] of Object.entries(node)) {
			if (value == null || typeof value !== "object") continue;
			if ("start" in value && "end" in value) continue;

			node[key as keyof T] = visitNode(value as T, f) as T[keyof T];
		}
	}

	return node;
};

export const parserPlugin =
	(f: (node: Cst.Node) => Cst.Node) => (nodes: Cst.Node[]) =>
		nodes.map(node => visitNode(node, f));
