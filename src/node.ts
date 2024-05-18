import type { Ast } from "@syuilo/aiscript";

export type Comment = {
	type: "comment";
	loc: Ast.Loc;
	value: string;
};

export type Root = {
	type: "root";
	body: Ast.Node[];
	loc?: Ast.Loc;
	comments: Comment[];
};

export type Node =
	| (Ast.Node & { comments?: Comment[]; sugar?: boolean })
	| Root;
