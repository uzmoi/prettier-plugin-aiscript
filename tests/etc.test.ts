import { expect, test } from "vitest";
import { format } from "./utils";

test("comment only source", async () => {
	expect(await format("// comment")).toBe("// comment\n");
});
