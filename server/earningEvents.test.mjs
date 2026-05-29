import assert from "node:assert/strict";
import test from "node:test";
import { isAprEvent, mapAprEventAlert, parseEventText } from "./earningEvents.mjs";

test("parseEventText extracts APR event signals from Binance-style copy", () => {
  const parsed = parseEventText(
    "Subscribe to ABC Simple Earn Flexible Products and Enjoy up to 18.5% APR. "
      + "Campaign Period: 2026-06-01 00:00 (UTC) - 2026-06-08 23:59 (UTC). "
      + "Earn rewards on ABC Flexible Products and ABC/USDT trading pair.",
  );

  assert.equal(parsed.type, "earn");
  assert.deepEqual(parsed.assets, ["ABC"]);
  assert.deepEqual(parsed.pairs, ["ABC/USDT"]);
  assert.ok(parsed.apr.includes("up to 18.5% APR"));
  assert.equal(parsed.periods.length, 1);
});

test("isAprEvent only accepts earn-style APR events", () => {
  assert.equal(isAprEvent({
    title: "ABC Simple Earn Special APR Campaign",
    type: "earn",
    excerpt: "Enjoy up to 12% APR",
    apr: ["up to 12% APR"],
  }), true);

  assert.equal(isAprEvent({
    title: "ABC/USDT Zero Trading Fee Campaign",
    type: "fee",
    excerpt: "Zero maker fee",
    apr: [],
  }), false);
});

test("mapAprEventAlert creates a Telegram/app alert payload", () => {
  const alert = mapAprEventAlert({
    code: "abc-apr-event",
    title: "ABC Simple Earn Special APR Campaign",
    assets: ["ABC", "USDT"],
    apr: ["up to 12% APR"],
    rewards: ["earn reward vouchers"],
    releaseDate: Date.UTC(2026, 5, 1, 0, 0),
    url: "https://www.binance.com/en/support/announcement/abc-apr-event",
  });

  assert.equal(alert.title, "ABC Simple Earn Special APR Campaign");
  assert.equal(alert.level, "success");
  assert.equal(alert.eventCode, "abc-apr-event");
  assert.match(alert.body, /ABC, USDT/);
  assert.match(alert.body, /up to 12% APR/);
});
