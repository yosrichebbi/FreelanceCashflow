import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBankCsv, SAMPLE_CSV } from '../src/utils/cashflowParser.js';

const qonto = `Settlement Date;Operation Type;Counterparty Name;Reference;Category;Total Amount (Incl. VAT);VAT Amount;VAT Rate;Currency;Status
30-10-2026;card;Google Workspace;1;Business;-16,56;-2,76;20%;EUR;settled
06-05-2026;income;Atelier Lumiere;2;Business;5538,13;923,02;20%;EUR;settled
29-10-2026;card;URSSAF;3;Business;-815,90;0,00;0%;EUR;settled
29-10-2026;income;Nordic Cloud;4;Business;2251,96;375,33;20%;EUR;settled`;

test('requires a starting balance and never mistakes VAT for a bank balance', () => {
  const missing = parseBankCsv(qonto);
  assert.equal(missing.openingBalance, null);
  assert.equal(missing.latestBalance, null);
  assert.equal(missing.runwayDays, null);
  assert.equal(missing.transactions.at(-1).date, '2026-10-30');

  const metrics = parseBankCsv(qonto, 1000);
  assert.equal(metrics.latestBalance, 7957.63);
  assert.equal(metrics.transactions[0].amount, 5538.13);
  assert.equal(metrics.transactions.at(-1).balance, 7957.63);
  assert.equal(metrics.recurringBurn, 832.46);
});

test('preserves explicit balances and existing sample metrics', () => {
  const metrics = parseBankCsv(SAMPLE_CSV);
  assert.equal(metrics.latestBalance, 12723.96);
  assert.ok(Math.abs(metrics.recurringBurn - 6072.07) < 0.001);
  assert.ok(Math.abs(metrics.safeToSpend - 4051.81) < 0.01);
  assert.equal(metrics.runwayDays, 63);
});

test('infers an opening balance from a dated balance after sorting', () => {
  const csv = `Date,Transaction Label,Amount,Balance
2026-06-02,Client,200,1200
2026-06-01,Google,-100,1000`;
  const metrics = parseBankCsv(csv);
  assert.equal(metrics.openingBalance, 1100);
  assert.equal(metrics.latestBalance, 1200);
});

test('rejects invalid numbers and dates', () => {
  assert.throws(() => parseBankCsv(qonto.replace('5538,13', 'invalid')), /Montant invalide/);
  assert.throws(() => parseBankCsv(qonto.replace('30-10-2026', '31-02-2026')), /Date invalide/);
});
