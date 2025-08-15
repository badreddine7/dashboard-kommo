const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

require('dotenv').config();

// Logger utility
const logger = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data);
  },
  error: (message, error = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  },
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data);
  },
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, data);
    }
  }
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL, 'https://yourdomain.com'] 
      : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost', 'http://127.0.0.1:8080'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Import authentication system
const authRoutes = require('./routes/auth');
const stripeRoutes = require('./routes/stripe');
const usageRoutes = require('./routes/usage');
const reportsRoutes = require('./routes/reports');
const { authenticate, requireFeature, requireUsageLimit } = require('./middleware/auth');
const { dbHelpers } = require('./database');
const { syncSubscriptionStatus } = require('./services/webhooks');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;

if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URL) {
  logger.error('OAuth configuration missing - required environment variables not set');
  process.exit(1);
}

logger.info('Server starting with configuration', {
  nodeEnv: process.env.NODE_ENV,
  hasClientId: !!CLIENT_ID,
  hasClientSecret: !!CLIENT_SECRET,
  callbackUrl: CALLBACK_URL
});

// Rate limiting
const RATE_LIMIT_RPS = 7;
let callsThisSecond = 0;
setInterval(() => { callsThisSecond = 0; }, 1000);






// Request wrapper with per-user tokens
async function kommoGet(accountId, token, endpoint, params = {}) {
  while (callsThisSecond >= RATE_LIMIT_RPS) {
    await new Promise(r => setTimeout(r, 150));
  }
  callsThisSecond++;
  const domain = accountId.includes('.') ? accountId : `${accountId}.kommo.com`;
  const url = `https://${domain}/api/v4${endpoint}`;
  
  logger.debug('Making Kommo API request', { accountId, endpoint, params });
  
  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 250, ...params }
    });
    logger.debug('Kommo API request successful', { endpoint, status: res.status });
    return res.data;
  } catch (error) {
    logger.error('Kommo API request failed', { 
      accountId, 
      endpoint, 
      status: error.response?.status,
      message: error.message 
    });
    throw error;
  }
}

// Pagination
async function paginate(accountId, token, entity, params = {}) {
  let page = 1;
  let all = [];
  
  logger.debug('Starting pagination', { accountId, entity, params });
  
  while (true) {
    const data = await kommoGet(accountId, token, `/${entity}`, { page, ...params });
    if (!data._embedded || data._embedded[entity].length === 0) break;
    all.push(...data._embedded[entity]);
    if (!data._links.next) break;
    page++;
  }
  
  logger.debug('Pagination completed', { entity, totalItems: all.length, pages: page - 1 });
  return all;
}

// Paginate for custom fields
async function paginate_sol(accountId, token, entity, plus, params = {}) {
  let page = 1;
  let all = [];
  
  logger.debug('Starting custom pagination', { accountId, entity, plus, params });
  
  while (true) {
    const data = await kommoGet(accountId, token, `/${entity+plus}`, { page, ...params });
    if (!data._embedded || data._embedded[plus].length === 0) break;
    all.push(...data._embedded[plus]);
    if (!data._links.next) break;
    page++;
  }
  
  logger.debug('Custom pagination completed', { entity: entity+plus, totalItems: all.length, pages: page - 1 });
  return all;
}
async function fetchPipelineStages(accountId, token) {
  logger.debug('Fetching pipeline stages', { accountId });
  
  const pipelines = await kommoGet(accountId, token, `/leads/pipelines`);
  const stageCache = {};
  
  for (const p of pipelines._embedded?.pipelines || []) {
    const statuses = await kommoGet(accountId, token, `/leads/pipelines/${p.id}/statuses`);
    for (const s of statuses._embedded?.statuses || []) {
      stageCache[`${p.id}@${s.id}`] = s.name;
    }
  }
  
  logger.debug('Pipeline stages fetched', { 
    accountId, 
    pipelinesCount: pipelines._embedded?.pipelines?.length || 0,
    stagesCount: Object.keys(stageCache).length 
  });
  
  return stageCache;
}

function getStageNameFromCache(stageCache, pipelineId, statusId) {
  if (statusId === '0'){
    return 'New Lead'; // Default name for new leads
  }
  return stageCache[`${pipelineId}@${statusId}`] || `Stage ${statusId}`;
}

// Utility functions for calculations
function avg(arr) {
  return arr.reduce((a,b) => a + b, 0) / arr.length;
}
function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a,b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0
    ? (s[mid - 1] + s[mid]) / 2
    : s[mid];
}
// Aggregate user stats
async function aggregate(accountId, token) {
  logger.info('Starting data aggregation', { accountId });
  
  const domain = accountId.includes('.') ? accountId : `${accountId}.kommo.com`;
  const refreshedToken = token.access_token;
  
  // Define the time range for the heatmap (90 days)
  const edges = 90 * 24 * 3600 * 1000;
  const since = Date.now() - edges;
  const sinceTimestamp = Math.floor(since / 1000);

  const [users, leads, tasks, events, noteEvents, messageEvents, activityEvents, customFields, callEvents] = await Promise.all([
    paginate(accountId, refreshedToken, 'users'),
    paginate(accountId, refreshedToken, 'leads',{ with: ['source'] }),
    paginate(accountId, refreshedToken, 'tasks'),
    paginate(accountId, refreshedToken, 'events', { 'filter[type]': 'lead_status_changed' }),
    paginate(accountId, refreshedToken, 'events', {'filter[type]': 'common_note_added'}),
    paginate(accountId, refreshedToken, 'events', {'filter[type]': ['outgoing_mail', 'outgoing_chat_message', 'outgoing_sms']}),
    paginate(accountId, refreshedToken, 'events', {'filter[created_at][from]': sinceTimestamp}),
    paginate_sol(accountId, refreshedToken, 'leads/','custom_fields'),
    paginate(accountId, refreshedToken, 'events', {'filter[type]': ['incoming_call', 'outgoing_call']})
  ]);

  logger.info('Data fetched successfully', { 
    accountId,
    usersCount: users.length,
    leadsCount: leads.length,
    tasksCount: tasks.length,
    eventsCount: events.length
  });

  const reps = {};
  const incomingByUser = {};
  users.forEach(u => {
    reps[u.id] = {
      name: u.name || '',
      leads: [],
      tasks: { created: 0, completed: 0, overdue: 0 }
    };
    incomingByUser[u.id] = { total: 0, bySource: {}, byFunnel: {} };
  });

  const now = Date.now();
  leads.forEach(l => {
    if (reps[l.responsible_user_id]) reps[l.responsible_user_id].leads.push(l);
    const userId = l.responsible_user_id;
    if (!incomingByUser[userId]) {
      incomingByUser[userId] = { total: 0, bySource: {}, byFunnel: {} };
    }

    const userStats = incomingByUser[userId];
    userStats.total++;

    // Source name (if included in embedded data)
    const sourceName = l._embedded?.source?.name || 'Unknown';
    userStats.bySource[sourceName] = (userStats.bySource[sourceName] || 0) + 1;

    // Funnel (pipeline name or ID)
    const funnelName = `Pipeline ${l.pipeline_id}`;
    userStats.byFunnel[funnelName] = (userStats.byFunnel[funnelName] || 0) + 1;
  });

  tasks.forEach(t => {
    const rep = reps[t.responsible_user_id];
    if (!rep) return;
    rep.tasks.created++;
    if (t.completed_at) rep.tasks.completed++;
    else if (new Date(t.due_date).getTime() < now) rep.tasks.overdue++;
  });
  // Fetch pipeline stages
  const stageCache = await fetchPipelineStages(accountId, refreshedToken);

  // Build a mapping of lead events by lead ID
  const eventsByLead = events
  .filter(e => e.type === 'lead_status_changed')
  .reduce((map, e) => {
    const id = e.entity_id;
    map[id] = map[id] || [];
    map[id].push({ status: e.value_after[0].lead_status.id, ts: e.created_at });
    return map;
  }, {});
  
  
  // Group messages by user
  const messagesByUser = {};

  messageEvents.forEach(e => {
    const uid = e.created_by;  
    messagesByUser[uid] = messagesByUser[uid] || { messages: 0, emails: 0, sms: 0 };
    if (e.type === 'outgoing_chat_message')    messagesByUser[uid].messages++;
    else if (e.type === 'outgoing_mail')        messagesByUser[uid].emails++;
    else if (e.type === 'outgoing_sms')         messagesByUser[uid].sms++;
  });
  logger.debug('Messages aggregated by user', { messagesByUser });

  // Group calls by user
  const callsByUser = {};

  callEvents.forEach(e => {
    const uid = e.created_by;
    callsByUser[uid] = callsByUser[uid] || { incoming: 0, outgoing: 0, total: 0 };
    if (e.type === 'incoming_call') {
      callsByUser[uid].incoming++;
      callsByUser[uid].total++;
    } else if (e.type === 'outgoing_call') {
      callsByUser[uid].outgoing++;
      callsByUser[uid].total++;
    }
  });
  logger.debug('Calls aggregated by user', { callsByUser });

  //building the heatmap data
  const heatmap = {};
  const heatMapUserData={};

  activityEvents.forEach(e => {
    const uid = e.created_by;
    const ts = e.created_at*1000;
    heatMapUserData[uid] = (heatMapUserData[uid] ?? 0) + 1;
    if (!heatmap[uid]) heatmap[uid] = {};
    const day = new Date(ts).toISOString().split('T')[0]; // YYYY-MM-DD
    heatmap[uid][day] = (heatmap[uid][day] || 0) + 1;
  });

  // Map pipeline@status → [fieldId, …]
  const requiredByKey = {};
  customFields.forEach(cf => {
    (cf.required_statuses || []).forEach(({ pipeline_id, status_id }) => {
      const key = `${pipeline_id}@${status_id}`;
      requiredByKey[key] = requiredByKey[key] || [];
      requiredByKey[key].push(cf.id);
    });
  });





  // Group events by user and optionally by lead
    const notesByUser = {};
    noteEvents.forEach(e => {
      const as = e.created_by;
      notesByUser[as] = notesByUser[as] ?? { count: 0};
      notesByUser[as].count++;
    });

  const result = Object.entries(reps).map(([uid, r]) => {
    const totalLeads = r.leads.length;
    // use correct status_id values (e.g. 142 = won, 143 = lost)
    const wonLeads = r.leads.filter(l => l.status_id === 142).length;
    const lostLeads = r.leads.filter(l => l.status_id === 143).length;
    const winRate = totalLeads > 0 ? wonLeads / totalLeads : 0;

    // Average cycle time: updated_at − created_at
    const cycleTimes = r.leads
      .filter(l => l.created_at && l.updated_at)
      .map(l => new Date(l.updated_at).getTime() - new Date(l.created_at).getTime());
    const avgCycleDays = cycleTimes.length
      ? cycleTimes.reduce((a, b) => a + b) / cycleTimes.length / 1000 / 60 / 60 / 24
      : null;

    const followUpRatio = totalLeads > 0 ? r.tasks.completed / totalLeads : 0;
    const completion_rate = r.tasks.created > 0 ? r.tasks.completed / r.tasks.created : 0;

    // Average deal size: use custom_fields_values array
    const valueFieldName = "Budget"; // replace with your custom field ID , for now its hardcoded
    const budgetIDs= customFields
      .filter(cf => cf.name.toLowerCase().includes(valueFieldName.toLowerCase()) || cf.name.toLowerCase().includes("value"))
      .map(cf => cf.id);
    const totalValue = r.leads
      .filter(l => l.status_id === 142)
      .reduce((sum, l) => {
        const field = l.custom_fields_values?.find(f => budgetIDs.includes(f.field_id));
        const val = field?.values?.[0]?.value;
        return sum + (parseFloat(val) || 0);
      }, 0);
    const avgDealSize = wonLeads > 0 ? totalValue / wonLeads : null;

    // preserve existing data
    const byStage = {};
    r.leads.forEach(l => {
      const st = l.status_id || 'unknown';
      const stageName = getStageNameFromCache(stageCache, l.pipeline_id, st) || `Stage ${st}`;
      byStage[stageName] = (byStage[stageName] || 0) + 1;
    });
    const conversion = {};
    const stages = Object.keys(byStage);
    for (let i = 1; i < stages.length; i++) {
      conversion[`${stages[i - 1]}->${stages[i]}`] = byStage[stages[i - 1]]
        ? byStage[stages[i]] / byStage[stages[i - 1]]
        : 0;
    }


    // ── INSERT SALES‑FUNNEL METRICS BELOW ──

    // Ensure your 'leads' array includes embedded tags via API param:
    //    kommoGet(accountId, token, '/leads', { page, with: ['tags','source'] })
    const sqlTagName = 'SQL'; // replace if your trigger is via custom field, tag, etc.
    const unreachableTag = 'Unreachable';
    const notSqlTag = 'Not SQL';

    const leadTagSets = r.leads.map(l =>
      ((l._embedded || {}).tags || []).map(t => t.name)
    );

    const unreachableCount = leadTagSets.filter(tags => tags.includes(unreachableTag)).length;
    const notSQLCount     = leadTagSets.filter(tags => tags.includes(notSqlTag)).length;
    const sqlIndices      = leadTagSets.map((tags, i) => tags.includes(sqlTagName) ? i : -1).filter(i => i >= 0);

    const sqlCount = sqlIndices.length;
    const baseCount = Math.max(0, totalLeads - unreachableCount - notSQLCount);
    const sqlRate  = baseCount > 0 ? sqlCount / baseCount : 0;

    // Use tasks data to estimate appointments:
    // Scheduled = all 'meeting' tasks created for SQL leads
    // Attended = those completed, missed = scheduled - completed
    const sqlLeadIds = sqlIndices.map(i => r.leads[i].id);
    const meetings = tasks.filter(t => t.task_type_id === 2 && t.entity_type  === 'leads' && sqlLeadIds.includes(Number(t.entity_id)) && t.created_by === uid);
    const appointmentsScheduled = meetings.length;
    const attendedDone = meetings.filter(t => t.is_completed).length;

    const appointmentRate = sqlCount > 0 ? appointmentsScheduled / sqlCount : 0;
    const attendanceRate  = appointmentsScheduled > 0 ? attendedDone / appointmentsScheduled : 0;
    const saleRate = attendedDone > 0 ? wonLeads / attendedDone : 0;
    const overallFunnelRate = totalLeads > 0 ? wonLeads / totalLeads : 0;

    // ── END METRICS CODE ──
    // Convert event lists to timelines
    r.leads.forEach(l => {
      const leadStart = l.created_at;
      const leadEnd = l.closed_at || null;
      const fullPipelineTime = leadEnd && leadStart
        ? (leadEnd - leadStart) / 86_400
        : null;
      const leadEvents = eventsByLead[l.id] || [];
      // Add the initial created_at event
      leadEvents.unshift({ status: 0, ts: leadStart});
      const transitions = leadEvents
        .sort((a,b) => a.ts - b.ts)
        .map(({ status, ts }) => ({ status, ts }))
        .filter((_, i, arr) => i === 0 || arr[i].status !== arr[i - 1].status);

      const stageTimes = {};
      for (let i = 1; i < transitions.length; i++) {
        const prev = transitions[i - 1], curr = transitions[i];
        stageTimes[prev.status] = (curr.ts - prev.ts) / 86_400; // days
      }

      l.leadTimeline = {
        created: leadStart,
        closed: l.closed_at,
        transitions,
        stageTimes,
        fullPipelineTime
      };
    });

    // Now aggregate higher‐order stats per rep
    const allFullTimes = r.leads
      .map(l => l.leadTimeline.fullPipelineTime)
      .filter(d => d != null);
    const avgPipelineTime = allFullTimes.length ? avg(allFullTimes) : null;
    const medianPipelineTime = allFullTimes.length ? median(allFullTimes) : null;

    // Also flatten stage durations across all reps into one map for median
    const stageIdToDurations = {};
    r.leads.forEach(l => {
      for (const [stageId, d] of Object.entries(l.leadTimeline.stageTimes)) {
        const stageName = getStageNameFromCache(stageCache, l.pipeline_id, stageId);
        stageIdToDurations[stageName] = stageIdToDurations[stageName] || [];
        stageIdToDurations[stageName].push(d);
      }
    });

    const avgStageTime = {};
    const medianStageTime = {};
    Object.entries(stageIdToDurations).forEach(([stageName, arr]) => {
      avgStageTime[stageName] = avg(arr);
      medianStageTime[stageName] = median(arr);
    });


    // Initialize counters first
    const repStats = {
      incomplete_leads_count: 0,
      incomplete_fields: 0, // to fill later
    };

    // Then, inside each rep's loop:
    r.leads.forEach(l => {
      const key = `${l.pipeline_id}@${l.status_id}`;
      const reqFields = requiredByKey[key] || [];
      if (!reqFields.length) return;

      // Gather the IDs of fields actually filled on this lead
      const filledIds = (l.custom_fields_values || []).map(x => x.field_id);

      const missing = reqFields.filter(fid => !filledIds.includes(fid));
      if (missing.length > 0) {
        repStats.incomplete_leads_count++;
        repStats.incomplete_fields += missing.length;
      }
    });


    return {
      user_id: uid,
      name: r.name,
      total_leads: totalLeads,
      won_leads: wonLeads,
      lost_leads: lostLeads,
      win_rate: winRate,
      avg_cycle_days: avgCycleDays,
      completed_tasks: r.tasks.completed,
      follow_up_ratio: followUpRatio,
      completion_rate: completion_rate,
      avg_deal_size: avgDealSize,
      leads_by_stage: byStage,
      conversion,
      notes_stats: {
        total: notesByUser[uid]?.count || 0,
        ratio: totalLeads > 0 ? (notesByUser[uid]?.count || 0) / totalLeads : 0
      },
      tasks: r.tasks, // existing object
      messages: {
        messages : messagesByUser[uid]?.messages || 0,
        emails: messagesByUser[uid]?.emails || 0,
        sms: messagesByUser[uid]?.sms || 0
      },
      calls: {
        incoming: callsByUser[uid]?.incoming || 0,
        outgoing: callsByUser[uid]?.outgoing || 0,
        total: callsByUser[uid]?.total || 0
      },
      events_count : heatMapUserData[uid] || 0,
      heatmap : heatmap[uid] || {},
      rep_fields_stats : {
        incomplete_leads_count: repStats.incomplete_leads_count,
        incomplete_fields: repStats.incomplete_fields
      },
      stage_time_stats: {
        average_days_per_stage: avgStageTime,
        median_days_per_stage: medianStageTime
      },
      full_pipeline_stats: {
        average_days: Number((avgPipelineTime || 0).toFixed(2)),
        median_days: Number((medianPipelineTime || 0).toFixed(2))
      },
      sales_funnel: {
        sql_leads: sqlCount,
        unreachable_leads: unreachableCount,
        not_sql_leads: notSQLCount,
        sql_rate: Number(sqlRate.toFixed(3)),
        appointments: appointmentsScheduled,
        appointment_rate: Number(appointmentRate.toFixed(3)),
        attended: attendedDone,
        attendance_rate: Number(attendanceRate.toFixed(3)),
        sale_rate: Number(saleRate.toFixed(3)),
        overall_funnel_rate: Number(overallFunnelRate.toFixed(3))
      },
      incoming_leads: incomingByUser[uid] || {}
    };
  });

  return { generated_at: new Date().toISOString(), reps: result };
}


const app = express();
// Add CORS debugging middleware
app.use((req, res, next) => {
  console.log('CORS Debug:', {
    origin: req.headers.origin,
    method: req.method,
    url: req.url,
    nodeEnv: process.env.NODE_ENV
  });
  next();
});

app.use(cors(corsOptions));

// Configure body parsing - raw for webhooks, JSON for everything else
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json()); // Add JSON parsing middleware for all other routes

// Authentication routes
app.use('/api/auth', authRoutes);

// Stripe payment routes
app.use('/api/stripe', stripeRoutes);

// Usage tracking routes
app.use('/api/usage', usageRoutes);

// Reports routes
app.use('/api/reports', reportsRoutes);

// Endpoint for Kommo OAuth callback
app.get('/kommo/callback', async (req, res) => {
  const { code, referer, state } = req.query;
  
  logger.info('OAuth callback received', { referer, hasCode: !!code, hasState: !!state });
  
  if (!code || !referer) {
    logger.error('OAuth callback missing required parameters', { code: !!code, referer: !!referer });
    return res.status(400).send('Missing code or referer');
  }

  try {
    logger.debug('Exchanging authorization code for tokens', { referer });
    
    const tokenRes = await axios.post(`https://${referer}/oauth2/access_token`, {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: CALLBACK_URL
    });
    
    const { access_token, refresh_token, expires_in } = tokenRes.data;
    
    logger.info('Tokens received successfully', { 
      referer, 
      expiresIn: expires_in,
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token 
    });

    const tokens = {
      access_token,
      refresh_token,
      expires_at: Date.now() + expires_in * 1000
    };

    // Save tokens to database
    try {
      await dbHelpers.saveKommoTokens(referer, tokens);
      logger.info('Tokens saved to database successfully', { referer });
    } catch (dbError) {
      logger.error('Failed to save tokens to database', { referer, error: dbError.message });
    }

    res.send('✅ Integration installed. You can now use the widget.');
  } catch (err) {
    logger.error('OAuth token exchange failed', { 
      referer, 
      error: err.message,
      response: err.response?.data 
    });
    res.status(500).send('Token exchange failed: ' + err.message);
  }
});




// API route for report, customized per account (now protected)
app.get('/api/report', 
  authenticate, 
  requireFeature('dashboard.metrics'),
  requireUsageLimit('api_calls_per_hour', 'api_call'),
  async (req, res) => {
    logger.info('API report request received', {
      query: req.query,
      userId: req.user?.id,
      userEmail: req.user?.email,
      subscriptionPlan: req.subscription?.plan_type,
      subscriptionStatus: req.subscription?.status
    });
    
    const account = req.query.account || req.user.kommo_account;
    if (!account) {
      logger.warn('Missing Kommo account parameter', { 
        userId: req.user?.id,
        queryAccount: req.query.account,
        userKommoAccount: req.user?.kommo_account 
      });
      return res.status(400).json({ 
        error: 'Missing account parameter',
        message: 'Please specify an account or update your profile with a default Kommo account'
      });
    }

    try {
      // Sync subscription status when user enters dashboardcls
      if (req.subscription && req.subscription.stripe_subscription_id) {
        logger.info('Syncing subscription status for dashboard access', { 
          subscriptionId: req.subscription.stripe_subscription_id 
        });
        try {
          const syncSuccess = await syncSubscriptionStatus(req.subscription.stripe_subscription_id);
          if (syncSuccess) {
            logger.info('Subscription synced successfully for dashboard access');
          } else {
            logger.warn('Subscription sync failed for dashboard access, continuing anyway');
          }
        } catch (syncError) {
          logger.error('Error syncing subscription for dashboard access', { error: syncError.message });
          // Continue with dashboard access even if sync fails
        }
      }

      // Try to get tokens from database
      let tokens = await dbHelpers.getKommoTokens(account);

      if (!tokens) {
        logger.warn('No Kommo tokens found for account', { account, userId: req.user?.id });
        return res.status(403).json({ 
          error: 'Account not authorized',
          message: 'Please connect your Kommo account first'
        });
      }

      // Check if token needs refresh and handle it with database update
      const bufferMs = 5 * 60 * 1000;
      if (Date.now() >= tokens.expires_at - bufferMs) {
        logger.info('Refreshing expired token', { account });
        try {
          const resp = await axios.post(`https://${account}/oauth2/access_token`, {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: tokens.refresh_token,
            redirect_uri: CALLBACK_URL
          });
          const { access_token, refresh_token, expires_in } = resp.data;
          
          // Update tokens
          tokens.access_token = access_token;
          tokens.refresh_token = refresh_token;
          tokens.expires_at = Date.now() + expires_in * 1000;
          
          // Save updated tokens to database
          await dbHelpers.saveKommoTokens(account, tokens);
          
          logger.info('Token refreshed and saved to database', { account });
        } catch (err) {
          logger.error('Token refresh failed', { 
            account, 
            error: err.message,
            response: err.response?.data 
          });
          throw new Error('refresh_failed');
        }
      }

      const data = await aggregate(account, tokens);
      
      logger.info('Report generated successfully', { 
        account, 
        repsCount: data.reps?.length || 0,
        userId: req.user?.id 
      });
      
      // Log successful usage
      await dbHelpers.logUsage(req.user.id, 'dashboard_view', 1, {
        account: account,
        data_points: data.reps?.length || 0
      });

      res.json(data);
    } catch (err) {
      logger.error('Report generation failed', { 
        account, 
        userId: req.user?.id,
        error: err.message,
        stack: err.stack 
      });
      res.status(500).json({ 
        error: 'Failed to generate report',
        message: err.message
      });
    }
  }
);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info('Server started successfully', { 
    port: PORT, 
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});
