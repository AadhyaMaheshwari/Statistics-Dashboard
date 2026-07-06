export function buildEmailInsights(stats = {}) {
  const safeStats = {
    inbox: Number(stats.inbox) || 0,
    unread: Number(stats.unread) || 0,
    spam: Number(stats.spam) || 0,
    promotions: Number(stats.promotions) || 0,
    sent: Number(stats.sent) || 0,
    social: Number(stats.social) || 0,
    updates: Number(stats.updates) || 0,
  };

  const categories = [
    { key: 'promotions', count: safeStats.promotions },
    { key: 'social', count: safeStats.social },
    { key: 'updates', count: safeStats.updates },
    { key: 'spam', count: safeStats.spam },
  ];

  const topCategory = categories.reduce(
    (current, category) => (category.count > current.count ? category : current),
    { key: 'promotions', count: -1 }
  );

  const unreadRatio = safeStats.inbox > 0
    ? Math.round((safeStats.unread / safeStats.inbox) * 100)
    : 0;

  return {
    totalInbox: safeStats.inbox,
    unreadCount: safeStats.unread,
    unreadRatio,
    topCategory: topCategory.key,
    topCategoryCount: topCategory.count,
    summary: `You have ${safeStats.unread} unread messages and ${safeStats.promotions} promotional emails, with ${topCategory.key} leading your current inbox mix.`,
  };
}
