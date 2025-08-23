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
    // Only log debug info in development
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
      ? [process.env.FRONTEND_URL, 'https://frontend-production-fd49.up.railway.app']
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
const { validateUserId, validateQuery } = require('./middleware/validation');
const {
  saveKommoTokens,
  getKommoTokens,
  logUsage
} = require('./database-pg');
const { syncSubscriptionStatus } = require('./services/webhooks');
const { kommoCallbackQuerySchema } = require('./validation/schemas');

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

// Rate limiting - very conservative to avoid 429 errors
const RATE_LIMIT_RPS = 7; // 7 requests per second
let callsThisSecond = 0;
setInterval(() => { callsThisSecond = 0; }, 1000);






// Request wrapper with per-user tokens
async function kommoGet(accountId, token, endpoint, params = {}) {
  const startTime = Date.now();
  
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
    const duration = Date.now() - startTime;
    logger.debug('Kommo API request successful', { 
      endpoint, 
      status: res.status, 
      duration: `${duration}ms`,
      dataCount: res.data._embedded?.[endpoint.split('/').pop()]?.length || 0
    });
    return res.data;
  } catch (error) {
    logger.error('Kommo API request failed', { 
      accountId, 
      endpoint, 
      status: error.response?.status,
      message: error.message 
    });
    
    // Handle 429 rate limit errors with retry
    if (error.response?.status === 429) {
      logger.warn('Rate limit hit, waiting before retry', { accountId, endpoint });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      // Retry once
      try {
        const retryRes = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 250, ...params }
        });
        logger.debug('Kommo API retry successful', { endpoint, status: retryRes.status });
        return retryRes.data;
      } catch (retryError) {
        logger.error('Kommo API retry failed', { 
          accountId, 
          endpoint, 
          status: retryError.response?.status,
          message: retryError.message 
        });
        throw retryError;
      }
    }
    
    throw error;
  }
}

// Pagination
async function paginate(accountId, token, entity, params = {}) {
  let page = 1;
  let all = [];
  const startTime = Date.now();
  
  logger.debug('Starting pagination', { accountId, entity, params });
  
  while (true) {
    const pageStartTime = Date.now();
    const data = await kommoGet(accountId, token, `/${entity}`, { page, ...params });
    const pageDuration = Date.now() - pageStartTime;
    
    if (!data._embedded || data._embedded[entity].length === 0) break;
    all.push(...data._embedded[entity]);
    
    logger.debug(`Page ${page} completed`, { 
      entity, 
      itemsInPage: data._embedded[entity].length, 
      totalSoFar: all.length,
      pageDuration: `${pageDuration}ms`
    });
    
    if (!data._links.next) break;
    page++;
  }

  const totalDuration = Date.now() - startTime;
  logger.debug('Pagination completed', { 
    entity, 
    totalItems: all.length, 
    pages: page - 1,
    totalDuration: `${totalDuration}ms`,
    avgTimePerPage: `${Math.round(totalDuration / (page - 1))}ms`
  });
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
  
  logger.info('Pipeline stages fetched', { 
    accountId, 
    pipelinesCount: pipelines._embedded?.pipelines?.length || 0,
    stagesCount: Object.keys(stageCache).length,
    sampleStages: Object.entries(stageCache).slice(0, 10).map(([key, name]) => ({ key, name }))
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
async function aggregate(accountId, token, useCache = true) {
  logger.info('Starting data aggregation', { accountId, useCache });
  
  const domain = accountId.includes('.') ? accountId : `${accountId}.kommo.com`;
  const refreshedToken = token.access_token;
  
  // Define the time range for the heatmap (30 days - 1 month)
  const edges = 30 * 24 * 3600 * 1000;
  const since = Date.now() - edges;
  const sinceTimestamp = Math.floor(since / 1000);

  // Fetch data sequentially to avoid overwhelming the API
  logger.info('Fetching users...');
  const all_users = await paginate(accountId, refreshedToken, 'users');
  //keep only active users
  const users = all_users.filter(u => u.rights.is_active);
  
  logger.info('Fetching leads (last 1 month)...');
  const oneMonthAgo = Math.floor((Date.now() - 30 * 24 * 3600 * 1000) / 1000);
  const leads = await paginate(accountId, refreshedToken, 'leads', { 
    with: ['source'],
    'filter[created_at][from]': oneMonthAgo
  });
  
  logger.info('Fetching tasks (last 1 month only)...');
  const tasks = await paginate(accountId, refreshedToken, 'tasks', {
    'filter[created_at][from]': oneMonthAgo,
    'filter[is_completed]': false // Only fetch incomplete tasks to reduce data
  });
  
  logger.info('Fetching lead status events (last 1 month)...');
  const events = await paginate(accountId, refreshedToken, 'events', { 
    'filter[type]': 'lead_status_changed',
    'filter[created_at][from]': oneMonthAgo
  });
  
  logger.info('Fetching note events (last 1 month)...');
  const noteEvents = await paginate(accountId, refreshedToken, 'events', {
    'filter[type]': 'common_note_added',
    'filter[created_at][from]': oneMonthAgo
  });
  
  logger.info('Fetching message events (last 1 month)...');
  
  // Get valid user IDs for filtering at API level
  const validUserIds = users.map(u => u.id);
  logger.info('Filtering messages for valid users at API level', { 
    validUserCount: validUserIds.length,
    validUserIds: validUserIds.slice(0, 5) // Log first 5 for debugging
  });
  
  const messageEvents = await paginate(accountId, refreshedToken, 'events', {
    'filter[type]': ['outgoing_mail', 'outgoing_chat_message', 'outgoing_sms'],
    'filter[created_at][from]': oneMonthAgo,
    'filter[created_by]': validUserIds, // Only fetch messages from our reps at API level
    'limit': 500 // Limit to 500 messages per page for performance
  });
  
  logger.info('Fetching activity events (last 7 days only for performance)...');
  let activityEvents = [];
  try {
    // Only fetch last 7 days of activity events to dramatically reduce data volume
    const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 3600 * 1000) / 1000);
    
    // Use the same validUserIds we already have for API-level filtering
    logger.info('Filtering activity events for valid users at API level', { 
      validUserCount: validUserIds.length,
      validUserIds: validUserIds.slice(0, 5) // Log first 5 for debugging
    });
    
    activityEvents = await paginate(accountId, refreshedToken, 'events', {
      'filter[created_at][from]': sevenDaysAgo,
      'filter[created_by]': validUserIds, // Only fetch activity events from our reps at API level
      'limit': 100 // Limit to 100 events per page to reduce payload size
    });
    
  } catch (error) {
    logger.warn('Failed to fetch activity events, continuing with empty data', { 
      accountId, 
      error: error.message 
    });
    activityEvents = []; // Continue with empty data
  }
  
  logger.info('Fetching custom fields...');
  const customFields = await paginate_sol(accountId, refreshedToken, 'leads/','custom_fields');
  
  logger.info('Fetching call events (last 1 month)...');
  const callEvents = await paginate(accountId, refreshedToken, 'events', {
    'filter[type]': ['incoming_call', 'outgoing_call'],
    'filter[created_at][from]': oneMonthAgo
  });

  logger.info('Data fetched successfully', { 
    accountId,
    usersCount: users.length,
    leadsCount: leads.length,
    tasksCount: tasks.length,
    eventsCount: events.length,
    eventsByLeadCount: Object.keys(eventsByLead).length,
    sampleEventsByLead: Object.entries(eventsByLead).slice(0, 3).map(([leadId, events]) => ({
      leadId,
      eventsCount: events.length,
      sampleEvent: events[0] || null
    }))
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
    map[id].push({ 
      status_before: e.value_before[0]?.lead_status?.id || 0, 
      status_after: e.value_after[0]?.lead_status?.id || 0, 
      ts: e.created_at 
    });
    return map;
  }, {});
  
  
  // Group messages by user
  const messagesByUser = {};
  let totalMessagesProcessed = 0;
  let messagesWithValidUsers = 0;
  let messagesWithInvalidUsers = 0;

  messageEvents.forEach(e => {
    totalMessagesProcessed++;
    const uid = e.created_by;  
    
    // Check if this user exists in our reps
    if (reps[uid]) {
      messagesWithValidUsers++;
      messagesByUser[uid] = messagesByUser[uid] || { messages: 0, emails: 0, sms: 0 };
      if (e.type === 'outgoing_chat_message')    messagesByUser[uid].messages++;
      else if (e.type === 'outgoing_mail')        messagesByUser[uid].emails++;
      else if (e.type === 'outgoing_sms')         messagesByUser[uid].sms++;
    } else {
      messagesWithInvalidUsers++;
    }
  });
  
  logger.info('Message processing summary', { 
    totalMessageEvents: messageEvents.length,
    totalMessagesProcessed,
    messagesWithValidUsers,
    messagesWithInvalidUsers,
    validUserIds: Object.keys(reps),
    messageUserIds: [...new Set(messageEvents.map(e => e.created_by))].slice(0, 10) // First 10 unique user IDs
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

  logger.info('Activity events processing summary (API-level filtered)', { 
    totalActivityEvents: activityEvents.length,
    activityUserIds: [...new Set(activityEvents.map(e => e.created_by))].slice(0, 10) // First 10 unique user IDs
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
    // Kommo API returns Unix timestamps (seconds), so we need to convert to milliseconds
    const cycleTimes = r.leads
      .filter(l => l.created_at && l.updated_at)
      .map(l => {
        // Convert Unix timestamps to milliseconds
        const createdMs = l.created_at * 1000;
        const updatedMs = l.updated_at * 1000;
        return updatedMs - createdMs;
      });
    
    // Debug cycle time calculation
    logger.debug('Cycle time calculation for rep', {
      repId: uid,
      repName: r.name,
      totalLeads: r.leads.length,
      leadsWithTimestamps: r.leads.filter(l => l.created_at && l.updated_at).length,
      cycleTimes: cycleTimes.slice(0, 5), // First 5 cycle times for debugging
      sampleLead: r.leads[0] ? {
        id: r.leads[0].id,
        created_at: r.leads[0].created_at,
        updated_at: r.leads[0].updated_at,
        createdDate: new Date(r.leads[0].created_at * 1000),
        updatedDate: new Date(r.leads[0].updated_at * 1000),
        cycleTimeMs: cycleTimes[0] || 0,
        cycleTimeDays: cycleTimes[0] ? cycleTimes[0] / (1000 * 60 * 60 * 24) : 0
      } : null
    });
    
    const avgCycleDays = cycleTimes.length
      ? cycleTimes.reduce((a, b) => a + b) / cycleTimes.length / 1000 / 60 / 60 / 24
      : null;

    const followUpRatio = totalLeads > 0 ? r.tasks.completed / totalLeads : 0;
    const completion_rate = r.tasks.created > 0 ? r.tasks.completed / r.tasks.created : 0;

    // Average deal size: use lead.price directly
    const totalValue = r.leads
      .filter(l => l.status_id === 142)
      .reduce((sum, l) => {
        return sum + (parseFloat(l.price) || 0);
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




    // ── SALES FUNNEL CONVERSION METRICS FROM EVENTS ──

    // Simple conversion tracking based on lead status change events
    // Track exactly 4 conversions: new lead to sql, sql to appointment, appointment to attended, attended to won
    
    // Define stage categories for simple matching
    const sqlStages = [
      'Qualified Lead', 'Qualified', 'Qualification', 'Initial Contact', 'Contacted', 'First Contact', 'INITIAL CONTACT', 'New Lead', 'New Leads', 'New.Lead', 'Nouveau leads', 'Incoming leads', 'incoming requests', 'unfiltered leqds',
      'Interested', 'Interested Lead', 'Interested in August', 'Interested No Appointment', 'Interested no apoointment', 'Interested 2026',
      'Follow Up', 'Follow-up', 'Follow Up Call', 'Follow Up Email', 'Follow Up SMS',
      'Proposal Sent', 'Proposal', 'Proposal Review', 'Quote Sent', 'Quote', 'Quote Review',
      'Contract Sent', 'Contract', 'Contract Review', 'Agreement Sent',
      'Negotiation', 'Negociation', 'In Discussion', 'Discussion', 'Negotiating',
      'Offer made', 'Offer Sent', 'Offer Review', 'Pitch', 'Awaiting Response', 'Awaiting Approaval', 'taking decision', 'Taking Decison Inntensives', 'taking decision SC', 'Argumente',
      'General Info SC', 'General Information', 'Information Gathering', 'Generaal information',
      'Graduated 2025', 'Temp Stage', 'SC 2024', 'Old Leads', 'Summer Camp', 'Lead Campaign', 'Online Classes', 'test', 'GE 2024', 'Good 2024 leads', 'IT BOT', 'old students', 'VP', 'VP1', 'VP2', 'VP3', 'Started Testing', 'Finished testing', 'daily', 'Game Design', 'Building Websites', 'Coding Knight'
    ];
    
    const appointmentStages = [
      'Appointment Scheduled', 'Appointment 24 Hours', 'Meeting Scheduled', 'Appointment Today', 'Appointment in 24h', 'Scheduled appointment',
      'Appointment', 'Meeting', 'Scheduled', 'Booked', 'Meeting Booked', 'Appointment Booked',
      'Call Scheduled', 'Call Booked', 'Demo Scheduled', 'Demo Booked',
      'Consultation Scheduled', 'Consultation Booked', 'Session Scheduled',
      'Ready for Meeting', 'Meeting Ready', 'Appointment Ready', 'Scheduling Confirmed',
      'Selects a Date and Site of the IL', 'Selects a Date and Site',
      'IL scheduled', 'Scheduled IL', 'IL 24h', 'IL today',
      'Rendez vous', 'Meeting today',
      'TIL Date&time', 'Agreed to meeting'
    ];
    
    const attendedStages = [
      'Agreed for IL', 'Agreed', 'Agreement Reached', 'Agreement Confirmed',
      'Offer Accepted',
      'Visited the IL', 'Visited IL',
      'Attended IL', 'Attended Appointment', 'Attended  Appointment', 'Appointment Attended', 'IL Attended', 'Rendez vous assiste',
      'Confirmed registration to the group',
      'Awaiting Payment', 'Payment Pending', 'Payment Awaiting', 'Payment Review', 'Awating PAYEMENT', 'attente de paiment',
      'Paid Full 2026', 'Payment Received', 'Payment Confirmed', 'Paid for the whole Course',
      'New student', 'Student Enrolled', 'Enrollment Confirmed', 'all students', 'Digital Literacy', 'Summer camp 1st Week', 'Summer Camp Second Week', 'Summer camp Third Week', 'Summer camp one month', 'Boot camp digital art', 'Bootcamp 1st period', 'bootcamp second period', 'bootcamp 1 month', 'UNITY', 'continué les séances',
      'Trimester', 'Semestriel', '1 part', '2 parts', 'Free', 'Finishing Course', 'Remboursement sc 2024', 'closed deals 2024', 'Certified', 'Transfered to training', 'finished training',
      'Won', 'Deal Won', 'Closed - won', 'Success', 'Completed', 'Finalized', 'Closed Won', 'Conversion Complete', 'Deal Closed'
    ];
    
    // Helper function to check if a stage matches any pattern in an array
    const stageMatches = (stageName, stageArray) => {
      const stageLower = stageName.toLowerCase();
      return stageArray.some(stage => {
        const patternLower = stage.toLowerCase();
        return stageLower === patternLower || stageLower.includes(patternLower) || patternLower.includes(stageLower);
      });
    };
    
    // Helper function to categorize a stage
    const categorizeStage = (stageName) => {
      if (stageMatches(stageName, sqlStages)) return 'SQL';
      if (stageMatches(stageName, appointmentStages)) return 'Appointment';
      if (stageMatches(stageName, attendedStages)) return 'Attended';
      if (stageName.toLowerCase().includes('won') || stageName.toLowerCase().includes('deal won') || stageName.toLowerCase().includes('closed - won')) return 'Won';
      return 'Other';
    };
    
    // Initialize conversion dictionary
    const conversions = {
      'new_lead_to_sql': 0,
      'sql_to_appointment': 0,
      'appointment_to_attended': 0,
      'attended_to_won': 0
    };
    
    // Track totals for denominator calculations
    const totals = {
      'new_leads': 0,
      'sql_leads': 0,
      'appointment_leads': 0,
      'attended_leads': 0
    };
    
    // Process each lead's events to track conversions
    r.leads.forEach(lead => {
      const leadEvents = eventsByLead[lead.id] || [];
      
      // Sort events by timestamp to process chronologically
      const sortedEvents = leadEvents.sort((a, b) => a.ts - b.ts);
      
      // Track what stages this lead has been through
      let hasBeenSql = false;
      let hasBeenAppointment = false;
      let hasBeenAttended = false;
      
      // Process each status change event
      sortedEvents.forEach(event => {
        const stageBeforeName = getStageNameFromCache(stageCache, lead.pipeline_id, event.status_before);
        const stageAfterName = getStageNameFromCache(stageCache, lead.pipeline_id, event.status_after);
        const stageBeforeCategory = categorizeStage(stageBeforeName);
        const stageAfterCategory = categorizeStage(stageAfterName);
        
        // Mark what stages this lead has been through
        if (stageAfterCategory === 'SQL') hasBeenSql = true;
        if (stageAfterCategory === 'Appointment') hasBeenAppointment = true;
        if (stageAfterCategory === 'Attended') hasBeenAttended = true;
        
        // Track conversions based on stage transitions using value_before and value_after
        if (stageBeforeCategory === 'Other' && stageAfterCategory === 'SQL') {
          conversions['new_lead_to_sql']++;
        }
        if (stageBeforeCategory === 'SQL' && stageAfterCategory === 'Appointment') {
          conversions['sql_to_appointment']++;
        }
        if (stageBeforeCategory === 'Appointment' && stageAfterCategory === 'Attended') {
          conversions['appointment_to_attended']++;
        }
        if (stageBeforeCategory === 'Attended' && stageAfterCategory === 'Won') {
          conversions['attended_to_won']++;
        }
      });
      
      // Count totals for denominator calculations
      if (hasBeenSql) totals['sql_leads']++;
      if (hasBeenAppointment) totals['appointment_leads']++;
      if (hasBeenAttended) totals['attended_leads']++;
      totals['new_leads']++; // All leads start as new
    });
    
    // Calculate conversion rates
    const newLeadToSqlRate = totals['new_leads'] > 0 ? conversions['new_lead_to_sql'] / totals['new_leads'] : 0;
    const sqlToAppointmentRate = totals['sql_leads'] > 0 ? conversions['sql_to_appointment'] / totals['sql_leads'] : 0;
    const appointmentToAttendedRate = totals['appointment_leads'] > 0 ? conversions['appointment_to_attended'] / totals['appointment_leads'] : 0;
    const attendedToWonRate = totals['attended_leads'] > 0 ? conversions['attended_to_won'] / totals['attended_leads'] : 0;
    
    // Debug: Log conversion tracking for this rep
    logger.info('Sales funnel conversion tracking for rep', {
      repId: uid,
      repName: r.name,
      totalLeads: totalLeads,
      conversions,
      totals,
      conversionRates: {
        newLeadToSqlRate: Number(newLeadToSqlRate.toFixed(3)),
        sqlToAppointmentRate: Number(sqlToAppointmentRate.toFixed(3)),
        appointmentToAttendedRate: Number(appointmentToAttendedRate.toFixed(3)),
        attendedToWonRate: Number(attendedToWonRate.toFixed(3))
      },
      // Add debugging for stage categorization
      sampleLeadEvents: r.leads.slice(0, 3).map(lead => {
        const leadEvents = eventsByLead[lead.id] || [];
        return {
          leadId: lead.id,
          currentStage: getStageNameFromCache(stageCache, lead.pipeline_id, lead.status_id),
          currentStageCategory: categorizeStage(getStageNameFromCache(stageCache, lead.pipeline_id, lead.status_id)),
          eventsCount: leadEvents.length,
          sampleEvents: leadEvents.slice(0, 2).map(event => ({
            statusBefore: getStageNameFromCache(stageCache, lead.pipeline_id, event.status_before),
            statusAfter: getStageNameFromCache(stageCache, lead.pipeline_id, event.status_after),
            beforeCategory: categorizeStage(getStageNameFromCache(stageCache, lead.pipeline_id, event.status_before)),
            afterCategory: categorizeStage(getStageNameFromCache(stageCache, lead.pipeline_id, event.status_after))
          }))
        };
      })
    });
    
    // Use the conversion rates for the sales funnel metrics
    const sqlRate = newLeadToSqlRate; // New Lead to SQL conversion rate
    const appointmentRate = sqlToAppointmentRate; // SQL to Appointment conversion rate
    const attendanceRate = appointmentToAttendedRate; // Appointment to Attended conversion rate
    const saleRate = attendedToWonRate; // Attended to Won conversion rate
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
      leadEvents.unshift({ status_before: 0, status_after: 0, ts: leadStart});
      const transitions = leadEvents
        .sort((a,b) => a.ts - b.ts)
        .map(({ status_after, ts }) => ({ status: status_after, ts }))
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
          sql_leads: totals['sql_leads'],
          unreachable_leads: 0, // Not tracked in event-based approach
          sql_rate: Number(sqlRate.toFixed(3)),
          appointments: totals['appointment_leads'],
          appointment_rate: Number(appointmentRate.toFixed(3)),
          attended: totals['attended_leads'],
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Endpoint for Kommo OAuth callback
app.get('/kommo/callback', validateQuery(kommoCallbackQuerySchema), async (req, res) => {
  const { code, referer, state } = req.query;
  
  logger.info('OAuth callback received', { referer, hasCode: !!code, hasState: !!state });

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
      await saveKommoTokens(referer, tokens);
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
  validateUserId,
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
      let tokens = await getKommoTokens(account);

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
          await saveKommoTokens(account, tokens);
          
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
      await logUsage(req.user.id, 'dashboard_view', 1, {
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

// Export the aggregate function for use in other modules
module.exports = {
  aggregate
};
