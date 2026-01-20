import type { Ast } from "@syuilo/aiscript";
import type * as dst from "../../dst";
import { loc } from "./helpers";

export const liftType = <T extends Ast.TypeSource | undefined>(
	node: T,
): dst.Ty | (undefined extends T ? null : never) => {
	if (node == null) {
		return null as undefined extends T ? null : never;
	}

	switch (node.type) {
		case "namedTypeSource": {
			return {
				type: "TypeReference",
				name: {
					type: "Identifier",
					name: node.name,
					// TODO: loc
					loc: loc(undefined),
				},
				argument: liftType(node.inner),
				loc: loc(node.loc),
			};
		}
		case "fnTypeSource": {
			return {
				type: "FnType",
				params: node.params.map(liftType),
				return: liftType(node.result),
				loc: loc(node.loc),
			};
		}
	}
};
