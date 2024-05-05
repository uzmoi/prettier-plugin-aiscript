import { Ast } from "@syuilo/aiscript";
import { AstPath, Doc, ParserOptions, doc } from "prettier";
import { printStatement } from "./print/statement";
import { printExpression } from "./print/expression";
import { Node } from "./node";

const { group, hardline, indent, join } = doc.builders;

export const printAiScript = (
    path: AstPath<Node>,
    options: ParserOptions<Node>,
    print: (path: AstPath<Node>) => Doc,
): Doc => {
    const { node } = path;

    switch (node.type) {
        case "root":
            return [
                join([hardline, hardline], path.map(print, "body")),
                hardline,
            ];
        case "ns":
            if (node.members.length === 0) {
                return `:: ${node.name} {}`;
            }
            return group([
                `:: ${node.name} {`,
                indent([
                    hardline,
                    join([hardline, hardline], path.map(print, "members")),
                ]),
                hardline,
                "}",
            ]);
        case "meta":
            return [
                "### ",
                node.name ? ` ${node.name}` : "",
                (path as AstPath<Ast.Meta>).call(print, "value"),
            ];
        case "namedTypeSource":
        case "fnTypeSource":
            throw new Error("not implemented.");
        default:
            if (Ast.isStatement(node)) {
                return printStatement(
                    path as AstPath<Node> & { node: Ast.Statement },
                    options,
                    print,
                );
            }
            if (
                node.type === "and" ||
                node.type === "or" ||
                Ast.isExpression(node)
            ) {
                return printExpression(
                    path as AstPath<Node> & { node: Ast.Expression },
                    options,
                    print,
                );
            }
            throw new TypeError(
                `Unknown node type: '${(node as { type: string }).type}'.`,
            );
    }
};
