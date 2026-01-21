import { expect, test } from "vitest";
import { format } from "./utils";

test("comment only source", async () => {
	expect(await format("// comment")).toBe("// comment\n");
});

test("bug 1", async () => {
	// 何らかの条件で tmpl ノードの終了位置が後ろにずれることがあり
	// 終了位置に } があるかで判定してテンプレートの後ろ側で
	// TemplatePartと判定されない（`{"a"}`となる）バグがあった。
	// なぜ終了位置の } を見ていたか忘れたが、おそらく以前のパーサーのlocがズレるバグのせい？
	expect(await format("loop { `a` }")).toBe("loop { `a` }\n");
});
