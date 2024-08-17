import type { Node } from "./node";
import { isSugarCall } from "./sugar";

export const locStart = (node: Node): number => {
	if (isSugarCall(node)) {
		return locStart(node.args[0]);
	}

	if ("target" in node) {
		return locStart(node.target);
	}

	return node.loc?.start ?? 0;
};

export const locEnd = (node: Node): number => {
	return node.loc?.end ?? 0;
};
