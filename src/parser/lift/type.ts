import type { Ast } from "@syuilo/aiscript";
import type * as dst from "../../dst";
import type { LiftContext } from "./context";
import { identifier, identifierLocOf, liftLoc } from "./helpers";

export const liftType = <T extends Ast.TypeSource | undefined>(
	node: T,
	ctx: LiftContext,
): dst.Ty | (undefined extends T ? null : never) => {
	if (node == null) {
		return null as undefined extends T ? null : never;
	}

	const loc = liftLoc(node.loc, ctx);

	switch (node.type) {
		case "namedTypeSource": {
			return {
				type: "TypeReference",
				name: identifier(node.name, identifierLocOf(loc.start, ctx.source)),
				argument: liftType(node.inner, ctx),
				loc,
			};
		}
		case "fnTypeSource": {
			return {
				type: "FnType",
				params: node.params.map(param => liftType(param, ctx)),
				return: liftType(node.result, ctx),
				loc,
			};
		}
		case "unionTypeSource": {
			return {
				type: "UnionType",
				union: node.inners.map(inner => liftType(inner, ctx)),
				loc,
			};
		}
	}
};
