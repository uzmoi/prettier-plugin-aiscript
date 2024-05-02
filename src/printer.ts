import { Ast } from "@syuilo/aiscript";

export type Node = Ast.Node | { type: "root"; body: Ast.Node[]; loc?: Ast.Loc };
