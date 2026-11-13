import { computeEventDedupHash } from '../../utils/crypto.js';

export type NormalizedSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type NormalizedCategory =
  | 'Authentication'
  | 'Network'
  | 'Malware'
  | 'Web Application'
  | 'System'
  | 'Endpoint'
  | 'DNS and DHCP'
  | 'Other';

export interface RawWindowsEventInput {
  eventId: number;
  recordId?: number | string | null;
  channel?: string;
  providerName?: string;
  computerName?: string;
  timestamp?: string;
  username?: string;
  targetUsername?: string;
  subjectUsername?: string;
  domain?: string;
  sourceIp?: string;
  destinationIp?: string;
  logonType?: number | string | null;
  processName?: string;
  processId?: number | string | null;
  parentProcess?: string;
  parentProcessId?: number | string | null;
  commandLine?: string;
  serviceName?: string;
  taskName?: string;
  targetGroup?: string;
  statusCode?: string;
  subStatus?: string;
  message?: string;
  rawXml?: string;
  additionalFields?: Record<string, unknown>;
}

export interface NormalizedWindowsEvent {
  securityEventId: string;
  dedupHash: string;
  timestamp: string;
  windowsEventId: number;
  recordId: number | null;
  channel: string;
  providerName: string;
  hostname: string;
  username: string | null;
  targetUsername: string | null;
  subjectUsername: string | null;
  domain: string | null;
  srcIp: string | null;
  destIp: string | null;
  logonType: number | null;
  processName: string | null;
  processId: number | null;
  parentProcessName: string | null;
  parentProcessId: number | null;
  commandLine: string | null;
  serviceName: string | null;
  taskName: string | null;
  targetGroup: string | null;
  statusCode: string | null;
  subStatus: string | null;
  category: NormalizedCategory;
  severity: NormalizedSeverity;
  originalMessage: string;
  rawXml: string | null;
  normalizedFields: Record<string, unknown>;
  structuredData: Record<string, unknown>;
}

export const SUPPORTED_WINDOWS_EVENT_IDS = new Set([
  4624, 4625, 4634, 4648, 4672, 4688, 4697, 4698, 4702, 4719, 4720,
  4722, 4724, 4728, 4732, 4740, 4768, 4769, 4771, 4776, 1102, 7045
]);

const EVENT_METADATA: Record<
  number,
  { title: string; category: NormalizedCategory; severity: NormalizedSeverity; action: string }
> = {
  4624: { title: 'Successful Windows Account Logon', category: 'Authentication', severity: 'info', action: 'LOGON_SUCCESS' },
  4625: { title: 'Failed Windows Account Logon', category: 'Authentication', severity: 'medium', action: 'LOGON_FAILURE' },
  4634: { title: 'Windows Account Logoff', category: 'Authentication', severity: 'info', action: 'LOGOFF' },
  4648: { title: 'Logon Attempt Using Explicit Credentials', category: 'Authentication', severity: 'medium', action: 'EXPLICIT_CREDENTIALS' },
  4672: { title: 'Special Privileges Assigned to New Logon', category: 'Authentication', severity: 'medium', action: 'PRIVILEGED_LOGON' },
  4688: { title: 'New Windows Process Created', category: 'Endpoint', severity: 'info', action: 'PROCESS_CREATE' },
  4697: { title: 'Service Installed in the System', category: 'System', severity: 'high', action: 'SERVICE_INSTALL' },
  4698: { title: 'Scheduled Task Created', category: 'Endpoint', severity: 'high', action: 'TASK_CREATE' },
  4702: { title: 'Scheduled Task Updated', category: 'Endpoint', severity: 'medium', action: 'TASK_UPDATE' },
  4719: { title: 'System Audit Policy Changed', category: 'System', severity: 'high', action: 'AUDIT_POLICY_CHANGE' },
  4720: { title: 'User Account Created', category: 'Authentication', severity: 'high', action: 'USER_CREATED' },
  4722: { title: 'User Account Enabled', category: 'Authentication', severity: 'medium', action: 'USER_ENABLED' },
  4724: { title: 'Attempt Made to Reset Account Password', category: 'Authentication', severity: 'medium', action: 'PASSWORD_RESET' },
  4728: { title: 'Member Added to Security-Enabled Global Group', category: 'Authentication', severity: 'high', action: 'GROUP_MEMBER_ADDED' },
  4732: { title: 'Member Added to Security-Enabled Local Group', category: 'Authentication', severity: 'high', action: 'LOCAL_GROUP_MEMBER_ADDED' },
  4740: { title: 'User Account Locked Out', category: 'Authentication', severity: 'medium', action: 'ACCOUNT_LOCKOUT' },
  4768: { title: 'Kerberos Authentication Ticket (TGT) Requested', category: 'Authentication', severity: 'info', action: 'KERBEROS_TGT' },
  4769: { title: 'Kerberos Service Ticket Requested', category: 'Authentication', severity: 'info', action: 'KERBEROS_TGS' },
  4771: { title: 'Kerberos Pre-Authentication Failed', category: 'Authentication', severity: 'medium', action: 'KERBEROS_PREAUTH_FAILED' },
  4776: { title: 'Domain Controller Attempted Credential Validation', category: 'Authentication', severity: 'low', action: 'NTLM_VALIDATION' },
  1102: { title: 'Windows Security Audit Log Was Cleared', category: 'System', severity: 'critical', action: 'AUDIT_LOG_CLEARED' },
  7045: { title: 'New Windows Service Installed (SCM)', category: 'System', severity: 'high', action: 'SERVICE_INSTALLED_SCM' }
};

function parseXmlEventData(xml?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!xml) return out;
  const dataRegex = /<Data\s+Name=['"]([^'"]+)['"]\s*>([\s\S]*?)<\/Data>/gi;
  let match: RegExpExecArray | null;
  while ((match = dataRegex.exec(xml)) !== null) {
    out[match[1]] = match[2].trim();
  }
  const tagPairs: [string, RegExp][] = [
    ['EventID', /<EventID[^>]*>(\d+)<\/EventID>/i],
    ['Computer', /<Computer>([^<]+)<\/Computer>/i],
    ['Channel', /<Channel>([^<]+)<\/Channel>/i],
    ['EventRecordID', /<EventRecordID>(\d+)<\/EventRecordID>/i],
    ['ProviderName', /<Provider[^>]*Name=['"]([^'"]+)['"]/i],
    ['TimeCreated', /<TimeCreated[^>]*SystemTime=['"]([^'"]+)['"]/i]
  ];
  for (const [key, rx] of tagPairs) {
    const m = rx.exec(xml);
    if (m && !out[key]) {
      out[key] = m[1].trim();
    }
  }
  return out;
}

function sanitizeIp(ip?: string | null): string | null {
  if (!ip) return null;
  const trimmed = ip.trim();
  if (!trimmed || trimmed === '-' || trimmed === '::' || trimmed.toLowerCase() === 'null') {
    return null;
  }
  // Strip IPv6-mapped IPv4 prefix if present
  const normalized = trimmed.startsWith('::ffff:') ? trimmed.slice(7) : trimmed;
  const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[0-9a-fA-F:]+$/;
  if (ipv4Regex.test(normalized) || (normalized.includes(':') && ipv6Regex.test(normalized))) {
    return normalized;
  }
  return null;
}

function toSafeInt(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null;
  const str = String(value).trim();
  if (str.startsWith('0x') || str.startsWith('0X')) {
    const parsedHex = Number.parseInt(str, 16);
    return Number.isFinite(parsedHex) ? parsedHex : null;
  }
  const parsed = Number.parseInt(str, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTimestamp(ts?: string): string {
  if (!ts) return new Date().toISOString();
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function normalizeWindowsEvent(
  raw: RawWindowsEventInput,
  agent: { id: string; hostname: string; ipAddress: string | null }
): NormalizedWindowsEvent {
  const xmlData = parseXmlEventData(raw.rawXml);
  const windowsEventId = raw.eventId;
  const meta = EVENT_METADATA[windowsEventId] || {
    title: `Windows Event ID ${windowsEventId}`,
    category: 'System' as NormalizedCategory,
    severity: 'info' as NormalizedSeverity,
    action: `WIN_EVENT_${windowsEventId}`
  };

  const hostname = (raw.computerName || xmlData.Computer || agent.hostname).trim();
  const channel = (raw.channel || xmlData.Channel || (windowsEventId === 7045 ? 'System' : 'Security')).trim();
  const providerName = (
    raw.providerName ||
    xmlData.ProviderName ||
    (windowsEventId === 7045 ? 'Service Control Manager' : 'Microsoft-Windows-Security-Auditing')
  ).trim();

  const timestamp = parseTimestamp(raw.timestamp || xmlData.TimeCreated);
  const recordId = toSafeInt(raw.recordId ?? xmlData.EventRecordID);

  const targetUsername =
    (raw.targetUsername || raw.username || xmlData.TargetUserName || null)?.trim() || null;
  const subjectUsername =
    (raw.subjectUsername || xmlData.SubjectUserName || null)?.trim() || null;
  const username =
    targetUsername && targetUsername !== '-'
      ? targetUsername
      : subjectUsername && subjectUsername !== '-'
      ? subjectUsername
      : null;

  const domain =
    (raw.domain || xmlData.TargetDomainName || xmlData.SubjectDomainName || null)?.trim() || null;

  const srcIp = sanitizeIp(raw.sourceIp || xmlData.IpAddress || xmlData.Workstation || null);
  const destIp = sanitizeIp(raw.destinationIp || agent.ipAddress || null);

  const logonType = toSafeInt(raw.logonType ?? xmlData.LogonType);
  const processName =
    (raw.processName || xmlData.NewProcessName || xmlData.ProcessName || null)?.trim() || null;
  const processId = toSafeInt(raw.processId ?? xmlData.NewProcessId ?? xmlData.ProcessId);
  const parentProcessName =
    (raw.parentProcess || xmlData.ParentProcessName || null)?.trim() || null;
  const parentProcessId = toSafeInt(raw.parentProcessId ?? xmlData.ParentProcessId);
  const commandLine = (raw.commandLine || xmlData.CommandLine || null)?.trim() || null;
  const serviceName = (raw.serviceName || xmlData.ServiceName || null)?.trim() || null;
  const taskName = (raw.taskName || xmlData.TaskName || null)?.trim() || null;
  const targetGroup =
    (raw.targetGroup || xmlData.TargetUserName || xmlData.GroupName || null)?.trim() || null;
  const statusCode = (raw.statusCode || xmlData.Status || null)?.trim() || null;
  const subStatus = (raw.subStatus || xmlData.SubStatus || null)?.trim() || null;

  let severity = meta.severity;
  // Elevate severity dynamically for suspicious command lines or sensitive 4688 / 7045 contexts
  if (windowsEventId === 4688 && commandLine) {
    const lowerCmd = commandLine.toLowerCase();
    const lowerProc = (processName || '').toLowerCase();
    if (
      (lowerProc.includes('powershell') || lowerProc.includes('pwsh')) &&
      (lowerCmd.includes('-enc') ||
        lowerCmd.includes('encodedcommand') ||
        lowerCmd.includes('bypass') ||
        lowerCmd.includes('downloadstring') ||
        lowerCmd.includes('iex'))
    ) {
      severity = 'critical';
    } else if (
      lowerCmd.includes('vssadmin') ||
      lowerCmd.includes('mimikatz') ||
      lowerCmd.includes('certutil') ||
      lowerCmd.includes('mshta')
    ) {
      severity = 'high';
    }
  }
  if (windowsEventId === 4776 && statusCode && statusCode !== '0x0') {
    severity = 'medium';
  }

  const originalMessage =
    raw.message?.trim() ||
    `${meta.title} (EventID ${windowsEventId}) on ${hostname}${username ? ` for user ${username}` : ''}${
      processName ? ` via process ${processName}` : ''
    }${srcIp ? ` from ${srcIp}` : ''}`;

  const dedupHash = computeEventDedupHash({
    agentId: agent.id,
    windowsEventId,
    recordId,
    timestamp,
    computerName: hostname,
    channel,
    originalMessage
  });

  const securityEventId = `EVT-WIN-${dedupHash.slice(0, 16).toUpperCase()}`;

  const normalizedFields: Record<string, unknown> = {
    action: meta.action,
    windowsEventId,
    channel,
    providerName,
    ...(domain ? { domain } : {}),
    ...(logonType !== null ? { logonType, authMethod: logonTypeToLabel(logonType) } : {}),
    ...(processName ? { processName } : {}),
    ...(processId !== null ? { processId } : {}),
    ...(parentProcessName ? { parentProcessName } : {}),
    ...(commandLine ? { commandLine } : {}),
    ...(serviceName ? { targetResource: serviceName, serviceName } : {}),
    ...(taskName ? { targetResource: taskName, taskName } : {}),
    ...(targetGroup ? { targetGroup } : {}),
    ...(statusCode ? { statusCode } : {}),
    ...(subStatus ? { subStatus } : {}),
    ...(raw.additionalFields || {})
  };

  return {
    securityEventId,
    dedupHash,
    timestamp,
    windowsEventId,
    recordId,
    channel,
    providerName,
    hostname,
    username,
    targetUsername,
    subjectUsername,
    domain,
    srcIp,
    destIp,
    logonType,
    processName,
    processId,
    parentProcessName,
    parentProcessId,
    commandLine,
    serviceName,
    taskName,
    targetGroup,
    statusCode,
    subStatus,
    category: meta.category,
    severity,
    originalMessage,
    rawXml: raw.rawXml || null,
    normalizedFields,
    structuredData: {
      ...xmlData,
      ...(raw.additionalFields || {})
    }
  };
}

function logonTypeToLabel(logonType: number): string {
  switch (logonType) {
    case 2:
      return 'Interactive';
    case 3:
      return 'Network';
    case 4:
      return 'Batch';
    case 5:
      return 'Service';
    case 7:
      return 'Unlock';
    case 8:
      return 'NetworkCleartext';
    case 9:
      return 'NewCredentials';
    case 10:
      return 'RemoteInteractive (RDP)';
    case 11:
      return 'CachedInteractive';
    default:
      return `LogonType-${logonType}`;
  }
}
