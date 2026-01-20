import type { Ast } from "@syuilo/aiscript";
import type * as dst from "../../dst";

import { liftStatement } from "./statement";

export const loc = (loc: Ast.Loc | undefined): dst.Loc => ({
	start: loc?.start ?? 0,
	end: loc?.end ?? 0,
});

export const identifierLocOf = (start: number, source: string) => {
	const mat = /\s+(\w+)/y.exec(source);
	if (mat == null) return;
	const end = start + mat[0].length;
	return { start: end - mat[1]!.length, end };
};

export const block = (
	statements: (Ast.Statement | Ast.Expression)[],
	loc: dst.Loc,
	source: string,
): dst.Block => ({
	type: "Block",
	body: statements.map(statement => liftStatement(statement, source)),
	loc,
});

export const identifier = (name: string, loc: dst.Loc): dst.Identifier => ({
	type: "Identifier",
	name,
	loc,
});
