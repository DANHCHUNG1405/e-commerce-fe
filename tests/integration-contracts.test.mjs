import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";

async function loadTypescript(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
const { mergeMessages, validMessage } = await loadTypescript(
  "../src/features/chat/lib/messages.ts",
);
const { createCheckoutAttempt } = await loadTypescript("../src/features/checkout/lib/attempt.ts");

test("ACK, push and history for the same message do not duplicate the transcript", () => {
  const first = { id: "a", sequence: 1, body: "hello" };
  const second = { id: "b", sequence: 2, body: "world" };
  assert.deepEqual(mergeMessages([second], [first, second, first]), [first, second]);
});
test("out-of-order history preserves all messages in sequence order", () => {
  assert.deepEqual(
    mergeMessages(
      [{ id: "3", sequence: 3 }],
      [
        { id: "1", sequence: 1 },
        { id: "2", sequence: 2 },
      ],
    ).map((m) => m.sequence),
    [1, 2, 3],
  );
});
test("chat limits count Unicode code points rather than UTF-16 units", () => {
  assert.equal(validMessage("😀".repeat(5000)), true);
  assert.equal(validMessage("😀".repeat(5001)), false);
  assert.equal(validMessage(" \n\t "), false);
  assert.equal(validMessage("<script>alert('text only')</script>"), true);
});
test("empty selection must never become whole-cart checkout", () => {
  assert.throws(() =>
    createCheckoutAttempt({ addressId: "address", variantIds: [], method: "cod" }, "key"),
  );
});
test("checkout captures an independent normalized payload for exact retries", () => {
  const input = {
    addressId: "a",
    method: "sepay",
    variantIds: ["b", "a", "b"],
    couponCode: " welcome10 ",
  };
  const attempt = createCheckoutAttempt(input, "stable-key");
  input.variantIds.push("c");
  input.couponCode = "OTHER";
  assert.deepEqual(attempt, {
    key: "stable-key",
    payload: { addressId: "a", method: "sepay", variantIds: ["a", "b"], couponCode: "WELCOME10" },
  });
  assert.deepEqual(JSON.parse(JSON.stringify(attempt)), attempt);
});
