import { Ast } from "@syuilo/aiscript";
import { type AstPath, type Doc, type ParserOptions, doc } from "prettier";
import { printStatement } from "./print/statement";
import { printExpression } from "./print/expression";
import { printBlock, printStatementSequence } from "./print/block";
import type { Node } from "./node";

const { hardline } = doc.builders;

export const printAiScript = (
    path: AstPath<Node>,
    options: ParserOptions<Node>,
    print: (path: AstPath<Node>) => Doc,
): Doc => {
    const { node } = path;

    switch (node.type) {
        case "root":
            return [
                path.call(
                    path => printStatementSequence(path, options, print),
                    "body",
                ),
                hardline,
            ];
        case "ns":
            return [
                `:: ${node.name} `,
                printBlock(
                    path as AstPath<Ast.Node>,
                    options,
                    print,
                    "members",
                ),
            ];
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
                node.type === "not" ||
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
