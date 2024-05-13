import {
    doc,
    util,
    type AstPath,
    type Doc,
    type ParserOptions,
} from "prettier";
import type { Ast } from "@syuilo/aiscript";

const { group, indent, line, hardline } = doc.builders;

export const printBlock = (
    path: AstPath<Ast.Node>,
    options: ParserOptions<Ast.Node>,
    print: (path: AstPath<Ast.Node>) => Doc,
    key: "statements" | "children" | "members" = "statements",
) => {
    return group([
        "{",
        indent([
            line,
            path.call(
                path => printStatementSequence(path, options, print),
                key,
            ),
        ]),
        line,
        "}",
    ]);
};

export const printStatementSequence = (
    path: AstPath<Ast.Node[]>,
    options: ParserOptions<Ast.Node>,
    print: (path: AstPath<Ast.Node>) => Doc,
): Doc => {
    const { node } = path;
    const result: Doc[] = [];

    path.each((path, index) => {
        result.push(print(path));

        const isLast = index === node.length - 1;
        if (isLast) return;
        result.push(hardline);

        const { originalText, locEnd } = options;
        if (util.isNextLineEmpty(originalText, locEnd(path.node))) {
            result.push(hardline);
        }
    });

    return result;
};
