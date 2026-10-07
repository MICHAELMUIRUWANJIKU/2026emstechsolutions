const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data, error } = await supabase
      .from('bookings')
      .delete()
      .lt('created_at', sixMonthsAgo.toISOString())
      .select('id');

    if (error) throw error;

    const deleted = data ? data.length : 0;
    console.log(`Cleanup: deleted ${deleted} bookings older than ${sixMonthsAgo.toISOString()}`);

    return res.status(200).json({ success: true, deleted, cutoff: sixMonthsAgo.toISOString() });
  } catch (err) {
    console.error('Cleanup error:', err);
    return res.status(500).json({ error: err.message });
  }
};