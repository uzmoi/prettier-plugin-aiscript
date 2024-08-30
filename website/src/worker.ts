import { expose } from "comlink";
import * as prettier from "prettier";
import plugin from "../../src";

export const exports = {
	async format(
		value: string,
		options: prettier.Options,
	): Promise<[string, unknown?]> {
		const formatted = await prettier.format(value, {
			parser: "aiscript",
			plugins: [plugin],
			...options,
		});

		try {
			// optionsはパーサーで未使用
			// 使ったときにすぐ気付いてｶﾞｯできるようにnullを渡す。
			plugin.parsers!.aiscript.parse(formatted, null as never);
			return [formatted];
		} catch (error) {
			return [formatted, error];
		}
	},
};

expose(exports);
