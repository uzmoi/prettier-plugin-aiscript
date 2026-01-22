import type { Ast } from "@syuilo/aiscript";
import type * as dst from "../../dst";
import type { LiftContext } from "./context";
import { liftStatement } from "./statement";

export const DUMMY_LOC: dst.Loc = {
	start: 0,
	end: 0,
};

const aiscriptPosToIndex = (pos: Ast.Pos, ctx: LiftContext) =>
	ctx.lines.indexForLocation({
		line: pos.line - 1,
		column: pos.column - 1,
	});

const readBackWhiteSpace = (source: string, index: number) => {
	while (index > 0 && /\s/.test(source[index - 1]!)) {
		index--;
	}

	return index;
};

export const readBackComments = (ctx: LiftContext, index: number) => {
	index = readBackWhiteSpace(ctx.source, index);

	while (ctx.commentReadBackMap.has(index)) {
		index = readBackWhiteSpace(ctx.source, ctx.commentReadBackMap.get(index)!);
	}

	return index;
};

export const liftLoc = (loc: Ast.Loc, ctx: LiftContext): dst.Loc => {
	const start = aiscriptPosToIndex(loc.start, ctx) ?? 0;
	const end = aiscriptPosToIndex(loc.end, ctx) ?? 0;
	return { start, end: readBackComments(ctx, end) };
};

export const identifierLocOf = (start: number, source: string) => {
	const re = /\s*(\w+)/y;
	re.lastIndex = start;
	const match = re.exec(source);
	if (match == null) {
		throw new Error("identifier ないなった！");
	}

	const end = start + match[0].length;
	return { start: end - match[1]!.length, end };
};

export const block = (
	statements: (Ast.Statement | Ast.Expression)[],
	loc: dst.Loc,
	ctx: LiftContext,
): dst.Block => ({
	type: "Block",
	body: statements.map(statement => liftStatement(statement, ctx)),
	loc,
});

export const identifier = (name: string, loc: dst.Loc): dst.Identifier => ({
	type: "Identifier",
	name,
	loc,
});
