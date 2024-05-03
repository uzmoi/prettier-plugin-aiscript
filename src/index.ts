import prettier from "prettier";
import { Parser } from "@syuilo/aiscript";
import { Node, printAiScript } from "./printer";

const parser: prettier.Parser<Node> = {
    parse(text, _options) {
        const body = Parser.parse(text);
        return { type: "root", body };
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
