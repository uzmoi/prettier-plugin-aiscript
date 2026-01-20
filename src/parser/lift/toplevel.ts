import type { Ast } from "@syuilo/aiscript";
import type * as dst from "../../dst";
import type { Root } from "../../node";
import { liftExpression } from "./expression";
import { identifier, identifierLocOf, loc } from "./helpers";
import { liftStatement } from "./statement";

export const liftRoot = (root: Root, source: string): dst.Script => {
	return {
		type: "Script",
		body: root.body.map(body => liftTopLevel(body, source)),
		comments: root.comments.map(comment => ({
			type: "Comment",
			value: comment.value,
			loc: loc(comment.loc),
		})),
		loc: loc({ start: 0, end: source.length }),
	};
};

const liftTopLevel = (
	node: Ast.Node,
	source: string,
): dst.TopLevel | dst.Statement => {
	switch (node.type) {
		case "ns": {
			return {
				type: "Namespace",
				name: identifier(
					node.name,
					// "::" を読み飛ばして次の identifier が name
					loc(node.loc && identifierLocOf(node.loc.start + 2, source)),
				),
				body: node.members.map(
					// ns の .members には ns もしくは def しかない
					member => liftTopLevel(member, source) as dst.NamespaceItem,
				),
				loc: loc(node.loc),
			};
		}
		case "meta": {
			return {
				type: "Meta",
				name:
					node.name == null ?
						null
					:	identifier(
							node.name,
							// "###" を読み飛ばして次の identifier が name
							loc(node.loc && identifierLocOf(node.loc.start + 3, source)),
						),
				value: liftExpression(node.value, source),
				loc: loc(node.loc),
			};
		}
		case "namedTypeSource":
		case "fnTypeSource": {
			throw new Error("エラーはでないはずだよ");
		}
		default: {
			return liftStatement(node, source);
		}
	}
};
