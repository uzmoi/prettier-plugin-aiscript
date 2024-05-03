import { Ast } from "@syuilo/aiscript";
import { AstPath, Doc, ParserOptions, doc } from "prettier";
import { Node } from "../printer";

const { group, line, softline, hardline, indent, join } = doc.builders;

export const printFunction = (
    path: AstPath<Node> & { node: Ast.Fn },
    _options: ParserOptions<Ast.Node>,
    print: (path: AstPath<Ast.Node>) => Doc,
) => {
    const { node } = path;

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
        ") {",
        node.children.length === 0 ?
            ""
        :   [
                indent([hardline, join(hardline, path.map(print, "children"))]),
                hardline,
            ],
        "}",
    ];
};
