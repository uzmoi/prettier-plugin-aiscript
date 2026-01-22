import type { errors } from "@syuilo/aiscript";
import { expose } from "comlink";
import * as prettier from "prettier";
import plugin from "../../src";

export interface Position {
	line: number;
	column: number;
}

export type FormatError =
	| { name: "Syntax"; message: string; pos: Position }
	| { name: "Format"; message: string | null };

export const exports = {
	async format(
		value: string,
		options: prettier.Options,
	): Promise<[string | undefined, FormatError?]> {
		let formatted: string | undefined;

		try {
			formatted = await prettier.format(value, {
				parser: "aiscript",
				plugins: [plugin],
				...options,
			});

			// optionsはパーサーで未使用
			// 使ったときにすぐ気付いてｶﾞｯできるようにnullを渡す。
			plugin.parsers!.aiscript.parse(formatted, null as never);
			return [formatted];
		} catch (error) {
			return [
				formatted,
				error instanceof Error && error.name === "Syntax" ?
					{
						name: "Syntax",
						message: error.message,
						pos: (error as errors.AiScriptSyntaxError).pos,
					}
				:	{
						name: "Format",
						message:
							error instanceof Error ?
								`${error.message}\n\n${error.stack}`
							:	null,
					},
			];
		}
	},
};

expose(exports);
