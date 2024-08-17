import { expect, test } from "vitest";
import { format } from "../src/tests/utils";

test("comment only source", async () => {
	expect(await format("// comment")).toBe("// comment\n");
});
