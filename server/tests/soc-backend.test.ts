import { PGlite } from '@electric-sql/pglite';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { runMigrations } from '../src/database/migrate.js';
import { createDbPool, DbPool } from '../src/database/pool.js';
import { seedDefaults } from '../src/database/seed.js';

describe('MoR SOC Backend End-to-End API & Detection Engine', () => {
  let pool: DbPool;
  let app: ReturnType<typeof createApp>;

  let adminCookie = '';
  let analystCookie = '';
  let auditorCookie = '';
  let enrollmentToken = '';
  let agentId = '';
  let agentSecret = '';
  let escalatedAlertId = '';
  let createdIncidentId = '';
  let windowsEventId = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const pglite = new PGlite('memory://');
    await pglite.waitReady;
    pool = await createDbPool(pglite);
    await runMigrations(pool);
    await seedDefaults(pool);
    app = createApp();
  });

  afterAll(async () => {
    await pool.close();
  });

  it('reports healthy database and zero fake endpoints initially', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');
    expect(health.body.database).toBe('connected');
  });

  it('enforces real authentication and rejects unauthenticated requests', async () => {
    const unauth = await request(app).get('/api/endpoints');
    expect(unauth.status).toBe(401);

    const badLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: env.bootstrapAdminEmail, password: 'wrong-password' });
    expect(badLogin.status).toBe(401);

    // Login as Security Administrator
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: env.bootstrapAdminEmail, password: env.bootstrapAdminPassword });
    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.user.role).toBe('Security Administrator');
    expect(adminLogin.body.permissions.canManageAgents).toBe(true);
    adminCookie = adminLogin.headers['set-cookie'][0];

    // Login as SOC Analyst
    const analystLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'biks.b@revenue.gov.et', password: env.bootstrapAdminPassword });
    expect(analystLogin.status).toBe(200);
    expect(analystLogin.body.user.role).toBe('SOC Analyst');
    analystCookie = analystLogin.headers['set-cookie'][0];

    // Login as Auditor
    const auditorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mekonnen.w@revenue.gov.et', password: env.bootstrapAdminPassword });
    expect(auditorLogin.status).toBe(200);
    expect(auditorLogin.body.user.role).toBe('Auditor');
    auditorCookie = auditorLogin.headers['set-cookie'][0];
  });

  it('enforces strict backend RBAC permissions across roles', async () => {
    // Non-admin cannot create enrollment tokens
    const forbiddenToken = await request(app)
      .post('/api/enrollment-tokens')
      .set('Cookie', analystCookie)
      .send({ label: 'Unauthorized Attempt' });
    expect(forbiddenToken.status).toBe(403);

    // Auditor cannot view/mutate admin endpoints
    const forbiddenUserCreate = await request(app)
      .post('/api/users')
      .set('Cookie', auditorCookie)
      .send({
        name: 'Test',
        email: 'test@revenue.gov.et',
        password: 'Password123!',
        role: 'SOC Analyst',
        department: 'SOC'
      });
    expect(forbiddenUserCreate.status).toBe(403);

    // Initially 0 endpoints
    const statsRes = await request(app).get('/api/agent-statistics').set('Cookie', adminCookie);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.totalEndpoints).toBe(0);
    expect(statsRes.body.onlineEndpoints).toBe(0);
  });

  it('supports one-time enrollment token generation, agent enrollment, and credential isolation', async () => {
    const tokenRes = await request(app)
      .post('/api/enrollment-tokens')
      .set('Cookie', adminCookie)
      .send({ label: 'HQ Finance Workstation Rollout', expiresInHours: 12, maxUses: 1 });
    expect(tokenRes.status).toBe(201);
    expect(tokenRes.body.enrollmentToken).toMatch(/^mor_enr_/);
    enrollmentToken = tokenRes.body.enrollmentToken;

    // Token listing never exposes plaintext token
    const listTokensRes = await request(app)
      .get('/api/enrollment-tokens')
      .set('Cookie', adminCookie);
    expect(listTokensRes.status).toBe(200);
    expect(JSON.stringify(listTokensRes.body)).not.toContain(enrollmentToken);

    // Enroll Windows endpoint agent
    const enrollRes = await request(app).post('/api/agents/enroll').send({
      enrollmentToken,
      hostname: 'WS-FIN-042.revenue.gov.et',
      fqdn: 'WS-FIN-042.revenue.gov.et',
      ipAddress: '10.100.42.19',
      macAddress: '00:50:56:AA:BB:42',
      os: 'Windows 11 Enterprise',
      osVersion: '23H2',
      osBuild: '22631.4169',
      domainName: 'REVENUE.GOV.ET',
      architecture: 'x64',
      agentVersion: '1.0.0',
      cpuModel: 'Intel Core i7-13700',
      cpuCores: 16,
      totalMemoryMb: 32768,
      diskTotalGb: 512,
      hardwareVendor: 'Dell Inc.',
      hardwareModel: 'OptiPlex 7010'
    });
    expect(enrollRes.status).toBe(201);
    expect(enrollRes.body.agentId).toMatch(/^AGT-/);
    expect(enrollRes.body.agentSecret).toMatch(/^mor_agt_/);
    expect(enrollRes.body.configuration.monitoredEventIds).toContain(4625);

    agentId = enrollRes.body.agentId;
    agentSecret = enrollRes.body.agentSecret;

    // One-time token reuse must fail
    const reuseRes = await request(app).post('/api/agents/enroll').send({
      enrollmentToken,
      hostname: 'ROGUE-HOST',
      ipAddress: '10.100.42.99'
    });
    expect(reuseRes.status).toBe(409);
  });

  it('processes agent heartbeats, configuration sync, and health state transitions', async () => {
    const cfgRes = await request(app)
      .get('/api/agents/configuration')
      .set('X-Agent-Key', agentSecret);
    expect(cfgRes.status).toBe(200);
    expect(cfgRes.body.agentId).toBe(agentId);

    const hbOk = await request(app)
      .post('/api/agents/heartbeat')
      .set('X-Agent-Key', agentSecret)
      .send({
        agentVersion: '1.0.1',
        cpuUsagePct: 24.5,
        memoryUsagePct: 58.2,
        diskFreeMb: 120400,
        queueDepth: 0,
        bufferOverflow: false,
        ingestionErrors: 0
      });
    expect(hbOk.status).toBe(200);
    expect(hbOk.body.status).toBe('Online');

    // Buffer overflow triggers Unhealthy status
    const hbOverflow = await request(app)
      .post('/api/agents/heartbeat')
      .set('X-Agent-Key', agentSecret)
      .send({
        agentVersion: '1.0.1',
        queueDepth: 1000,
        bufferOverflow: true,
        errorMessage: 'Local event ring buffer full'
      });
    expect(hbOverflow.status).toBe(200);
    expect(hbOverflow.body.status).toBe('Unhealthy');

    // Recover back to Online
    const hbRecover = await request(app)
      .post('/api/agents/heartbeat')
      .set('X-Agent-Key', agentSecret)
      .send({ agentVersion: '1.0.1', bufferOverflow: false, ingestionErrors: 0 });
    expect(hbRecover.status).toBe(200);
    expect(hbRecover.body.status).toBe('Online');
  });

  it('ingests, normalizes, deduplicates Windows security events and triggers detection rules', async () => {
    const now = Date.now();
    const syntheticBatch = [
      // 5 failed logins (4625) to trigger RULE-WIN-001
      ...[1, 2, 3, 4, 5].map((i) => ({
        eventId: 4625,
        recordId: 1000 + i,
        channel: 'Security',
        computerName: 'WS-FIN-042.revenue.gov.et',
        timestamp: new Date(now - (10 - i) * 1000).toISOString(),
        targetUsername: 'abebe.k',
        domain: 'REVENUE',
        sourceIp: '198.51.100.77',
        logonType: 10,
        statusCode: '0xC000006D'
      })),
      // Followed by a successful login (4624) -> triggers RULE-WIN-002
      {
        eventId: 4624,
        recordId: 1006,
        channel: 'Security',
        computerName: 'WS-FIN-042.revenue.gov.et',
        timestamp: new Date(now - 2000).toISOString(),
        targetUsername: 'abebe.k',
        domain: 'REVENUE',
        sourceIp: '198.51.100.77',
        logonType: 10
      },
      // Suspicious PowerShell (4688) -> triggers RULE-WIN-006
      {
        eventId: 4688,
        recordId: 1007,
        channel: 'Security',
        computerName: 'WS-FIN-042.revenue.gov.et',
        timestamp: new Date(now - 1000).toISOString(),
        username: 'abebe.k',
        processName: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        processId: '0x1a2c',
        parentProcess: 'C:\\Windows\\System32\\cmd.exe',
        commandLine: 'powershell.exe -NoP -w hidden -EncodedCommand SQBFAFgA',
        rawXml:
          '<Event><System><EventID>4688</EventID><Channel>Security</Channel></System><EventData><Data Name="NewProcessName">powershell.exe</Data></EventData></Event>'
      },
      // Security Audit Log cleared (1102) -> triggers RULE-WIN-008
      {
        eventId: 1102,
        recordId: 1008,
        channel: 'Security',
        computerName: 'WS-FIN-042.revenue.gov.et',
        timestamp: new Date(now).toISOString(),
        subjectUsername: 'abebe.k'
      }
    ];

    const ingestRes = await request(app)
      .post('/api/agents/events')
      .set('X-Agent-Key', agentSecret)
      .send({ events: syntheticBatch });
    expect(ingestRes.status).toBe(202);
    expect(ingestRes.body.received).toBe(8);
    expect(ingestRes.body.inserted).toBe(8);
    expect(ingestRes.body.deduplicated).toBe(0);
    expect(ingestRes.body.alertsTriggered).toBeGreaterThanOrEqual(4);
    windowsEventId = ingestRes.body.insertedEventIds[6];

    // Duplicate batch submission must be deduplicated cleanly
    const dupRes = await request(app)
      .post('/api/agents/events')
      .set('X-Agent-Key', agentSecret)
      .send({ events: syntheticBatch });
    expect(dupRes.status).toBe(202);
    expect(dupRes.body.inserted).toBe(0);
    expect(dupRes.body.deduplicated).toBe(8);
  });

  it('queries endpoints, windows events XML, statistics, alerts, and incident escalation', async () => {
    // Endpoint list & details
    const epList = await request(app)
      .get('/api/endpoints?search=WS-FIN-042')
      .set('Cookie', analystCookie);
    expect(epList.status).toBe(200);
    expect(epList.body.items.length).toBe(1);
    expect(epList.body.items[0].totalEventsCollected).toBe(8);

    const epDetail = await request(app)
      .get(`/api/endpoints/${agentId}`)
      .set('Cookie', analystCookie);
    expect(epDetail.status).toBe(200);
    expect(epDetail.body.inventory.cpuModel).toBe('Intel Core i7-13700');
    expect(epDetail.body.recentHeartbeats.length).toBeGreaterThanOrEqual(3);

    // Windows Events Explorer filtering + XML inspection
    const winList = await request(app)
      .get('/api/windows-events?eventId=4688')
      .set('Cookie', analystCookie);
    expect(winList.status).toBe(200);
    expect(winList.body.items.length).toBe(1);

    const winDetail = await request(app)
      .get(`/api/windows-events/${windowsEventId}`)
      .set('Cookie', analystCookie);
    expect(winDetail.status).toBe(200);
    expect(winDetail.body.event.rawXml).toContain('<EventID>4688</EventID>');

    // Alert triage + escalation to incident
    const alertsRes = await request(app).get('/api/alerts').set('Cookie', analystCookie);
    expect(alertsRes.status).toBe(200);
    expect(alertsRes.body.alerts.length).toBeGreaterThanOrEqual(4);
    escalatedAlertId = alertsRes.body.alerts[0].id;

    // Auditor cannot acknowledge alerts
    const auditorAck = await request(app)
      .post(`/api/alerts/${escalatedAlertId}/acknowledge`)
      .set('Cookie', auditorCookie);
    expect(auditorAck.status).toBe(403);

    // Analyst acknowledges & escalates to incident
    const ackRes = await request(app)
      .post(`/api/alerts/${escalatedAlertId}/acknowledge`)
      .set('Cookie', analystCookie);
    expect(ackRes.status).toBe(200);
    expect(ackRes.body.alert.status).toBe('acknowledged');

    const escRes = await request(app)
      .post(`/api/alerts/${escalatedAlertId}/escalate`)
      .set('Cookie', analystCookie);
    expect(escRes.status).toBe(201);
    createdIncidentId = escRes.body.incident.id;

    // Update incident status and add note
    const incStatusRes = await request(app)
      .patch(`/api/incidents/${createdIncidentId}/status`)
      .set('Cookie', analystCookie)
      .send({ status: 'investigating', note: 'Triaging PowerShell telemetry' });
    expect(incStatusRes.status).toBe(200);
    expect(incStatusRes.body.incident.status).toBe('investigating');

    // Dashboard statistics reflect real database records
    const dashStats = await request(app)
      .get('/api/statistics/dashboard?timeRange=Last+24+Hours')
      .set('Cookie', adminCookie);
    expect(dashStats.status).toBe(200);
    expect(dashStats.body.kpis.totalEvents).toBe(8);
    expect(dashStats.body.kpis.totalEndpoints).toBe(1);
    expect(dashStats.body.kpis.onlineAgents).toBe(1);
    expect(dashStats.body.kpis.windowsSecurityEvents).toBe(8);
    expect(dashStats.body.kpis.failedLoginAttempts).toBe(5);
  });

  it('deactivates endpoint agent and revokes its credentials immediately', async () => {
    const deactRes = await request(app)
      .post(`/api/agents/${agentId}/deactivate`)
      .set('Cookie', adminCookie);
    expect(deactRes.status).toBe(200);
    expect(deactRes.body.status).toBe('Disabled');
    expect(deactRes.body.credentialsRevoked).toBe(true);

    // Deactivated agent's key must be rejected
    const blockedHb = await request(app)
      .post('/api/agents/heartbeat')
      .set('X-Agent-Key', agentSecret)
      .send({ agentVersion: '1.0.1' });
    expect(blockedHb.status).toBe(401);
  });
});
