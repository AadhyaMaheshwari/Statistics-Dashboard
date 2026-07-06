import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEmailInsights } from '../services/emailInsights.js';

test('buildEmailInsights summarizes key mailbox trends', () => {
  const stats = {
    inbox: 120,
    unread: 18,
    spam: 5,
    promotions: 25,
    sent: 40,
    social: 15,
    updates: 10,
  };

  const insights = buildEmailInsights(stats);

  assert.equal(insights.totalInbox, 120);
  assert.equal(insights.unreadCount, 18);
  assert.equal(insights.unreadRatio, 15);
  assert.equal(insights.topCategory, 'promotions');
  assert.equal(insights.topCategoryCount, 25);
  assert.match(insights.summary, /promotions/i);
});
