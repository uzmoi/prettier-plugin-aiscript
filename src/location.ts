import type { Node } from "./node";

export const locStart = (node: Node): number => {
	if ("target" in node) {
		return locStart(node.target);
	}

	return node.loc?.start ?? 0;
};

export const locEnd = (node: Node): number => {
	return node.loc?.end ?? 0;
};
