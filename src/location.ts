import type * as dst from "./dst";

export const locStart = (node: dst.NodeBase): number => {
	return node.loc.start;
};

export const locEnd = (node: dst.NodeBase): number => {
	return node.loc.end;
};
