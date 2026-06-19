import { test } from "node:test";
import assert from "node:assert/strict";
import { hashImage } from "../src/lib/server/imagehash.ts";

test("no usable image returns null", () => {
  assert.equal(hashImage(undefined), null);
  assert.equal(hashImage(""), null);
});

test("identical bytes hash equal; different bytes hash differently", () => {
  const a = Buffer.from("a-can-photo").toString("base64");
  const b = Buffer.from("a-different-photo").toString("base64");
  assert.equal(hashImage(a), hashImage(a));
  assert.notEqual(hashImage(a), hashImage(b));
});

test("the data-url prefix is stripped before hashing", () => {
  const payload = Buffer.from("payload-bytes").toString("base64");
  assert.equal(hashImage(`data:image/jpeg;base64,${payload}`), hashImage(payload));
});

test("the hash is a 64-char sha-256 hex digest", () => {
  const h = hashImage(Buffer.from("x").toString("base64"));
  assert.ok(h !== null);
  assert.match(h, /^[0-9a-f]{64}$/);
});
