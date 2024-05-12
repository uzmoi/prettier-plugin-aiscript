// prettier-ignore
const keywords = new Set([
    "meta", "null", "true", "false",
    "each", "for", "loop", "break", "continue",
    "while", "match", "if", "elif", "else",
    "fn", "return", "eval",
    "let", "var", "exists", "namespace",
    "attr", "attribute",
    "static", "class", "struct",
    "module", "import", "export",
]);

const tokenTypes = [
    ["template", /(?<=})(\\[`{]|[^`{])*`?/y, { template: true }],
    ["space", /\s+/y],
    ["comment", /\/\/.*|\/\*[^]*?\*\//y],
    ["ns", /\w+(?=:)/y],
    ["num", /\d+/y],
    ["str", /(['"])(\\\1|(?!\1).)*\1/y],
    ["template", /`(\\[`{]|[^`{])*`?/y],
    ["ident", /\w+/y],
    ["delim", /[,()[\]{}]/y],
    ["mark", /[+\-*/%=!&|^~!?:.;.#@\\<>]+/y],
] as const;

export type Token = {
    type: (typeof tokenTypes)[number][0] | "keyword" | "unknown";
    value: string;
};

export const tokenize = (code: string): Token[] => {
    const tokens: Token[] = [];
    let i = 0;
    let template = 0;
    outer: while (i < code.length) {
        for (const [type, re, options] of tokenTypes) {
            if (options?.template && template === 0) continue;
            re.lastIndex = i;
            const match = re.exec(code);
            if (match && match[0]) {
                const [value] = match;
                i += value.length;
                if (type === "template") {
                    let v = value;
                    if (template === 0 && v.startsWith("`")) {
                        template++;
                        v = v.slice(1);
                    }
                    if (template > 0 && v.endsWith("`")) template--;
                }
                tokens.push({
                    type:
                        type === "ident" && keywords.has(value) ?
                            "keyword"
                        :   type,
                    value,
                });
                continue outer;
            }
        }
        tokens.push({ type: "unknown", value: code[i++] });
    }

    return tokens;
};
