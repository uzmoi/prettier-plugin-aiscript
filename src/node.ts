import type { Ast } from "@syuilo/aiscript";
import type * as dst from "./dst";

export type Comment = {
	type: "comment";
	loc: Ast.Loc;
	value: string;
	nodeDescription?: string;
	placement?: "ownLine" | "endOfLine" | "remaining";
	leading?: boolean;
	trailing?: boolean;
	printed?: boolean;
};

export type Root = {
	type: "root";
	body: Ast.Node[];
	loc?: Ast.Loc;
	comments: dst.Comment[];
};

export type Node = (Ast.Node & { comments?: Comment[] }) | Root;
