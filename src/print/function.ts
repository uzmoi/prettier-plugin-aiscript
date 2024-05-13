import type { Ast } from "@syuilo/aiscript";
import { type AstPath, type Doc, type ParserOptions, doc } from "prettier";
import { printBlock } from "./block";

const { group, line, softline, indent, join } = doc.builders;

export const printFunction = (
    path: AstPath<Ast.Node> & { node: Ast.Fn },
    options: ParserOptions<Ast.Node>,
    print: (path: AstPath<Ast.Node>) => Doc,
) => {
    return [
        "(",
        group([
            indent([
                softline,
                join(
                    [",", line],
                    path.node.args.map(arg => arg.name),
                ),
            ]),
            softline,
        ]),
        ") ",
        printBlock(path as AstPath<Ast.Node>, options, print, "children"),
    ];
};
