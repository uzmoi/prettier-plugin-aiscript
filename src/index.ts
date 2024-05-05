import prettier from "prettier";
import { Parser } from "@syuilo/aiscript";
import { printAiScript } from "./printer";
import { correctLocation, parseComments } from "./parse-comments";
import { visitNode } from "@syuilo/aiscript/parser/visit.js";
import { Comment, Node } from "./node";

const parser: prettier.Parser<Node> = {
    parse(text, _options) {
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
    },
    astFormat: "aiscript",
    locStart(node) {
        return node.loc?.start ?? 0;
    },
    locEnd(node) {
        return node.loc?.end ?? 0;
    },
};

const printer: prettier.Printer<Node> = {
    print(path, options, print, _args) {
        return printAiScript(path, options, print);
    },
    hasPrettierIgnore(path) {
        const { node } = path;

        if (!node.comments) {
            return false;
        }

        return node.comments.some(comment =>
            /\/[/*]\s*prettier-ignore/.test(comment.value),
        );
    },
    canAttachComment(node) {
        return (node as { type: string }).type !== "comment";
    },
    printComment(commentPath, _options) {
        const node = commentPath.node as unknown as Comment;
        return node.type === "comment" ? node.value : "";
    },
};

const plugin: prettier.Plugin<Node> = {
    languages: [
        {
            name: "AiScript",
            parsers: ["aiscript"],
            extensions: ["is"],
        },
    ],
    parsers: { aiscript: parser },
    printers: { aiscript: printer },
};

export default plugin;
