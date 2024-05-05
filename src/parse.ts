import { Parser } from "@syuilo/aiscript";
import { correctLocation, parseComments } from "./parse-comments";
import { visitNode } from "@syuilo/aiscript/parser/visit.js";
import { Root } from "./node";

export const parse = (text: string): Root => {
    const comments = parseComments(text);

    const parser = new Parser();
    parser.addPlugin("transform", nodes =>
        nodes.map(node =>
            visitNode(node, node => correctLocation(node, comments)),
        ),
    );

    const body = parser.parse(text);

    const commentNodes = comments.map(([loc, contents]) => ({
        type: "comment" as const,
        loc,
        value: contents,
    }));

    return { type: "root", body, comments: commentNodes };
};
