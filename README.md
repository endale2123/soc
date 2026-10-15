# Ministry of Revenue — Centralized Security Event Monitoring and Incident Detection System

A professional, full-scale Security Operations Center (SOC) web application engineered for the **Ministry of Revenue**. This system provides centralized security event visibility, automated threat detection, deep incident investigation workflows, log collector infrastructure telemetry, and executive briefing dossiers.

---

## 1. System Architecture & High-Level Overview

The platform is designed to aggregate, parse, normalize, and correlate security logs across diverse Ministry IT assets:
- **Core Tax Systems**: SIGTAS Database Cluster (`DB-TAX-01`), e-Tax Public Portal (`WEB-ETAX-PRD01`), ASYCUDA Customs Transit Gateway.
- **Enterprise Identity & Messaging**: Windows Active Directory Domain Controllers (`DC01-HQ.revenue.gov.et`), Microsoft Exchange cluster.
- **Perimeter & Remote Access**: Palo Alto Next-Generation Firewall HA clusters, Fortinet SSL-VPN gateways.
- **Network & Infrastructure**: BIND/Unbound DNS authority resolvers, Cisco Nexus distribution switches, and Windows/Linux endpoints across regional revenue offices (Addis Ababa, Hawassa, Mekelle, Dire Dawa, Moyale).

```
                      +------------------------------------------+
                      |         Ministry Log Sources             |
                      |  Active Directory, Firewalls, Endpoints, |
                      |    Databases, ASYCUDA, e-Tax Portal      |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |       Centralized Collector Layer        |
                      |   (Syslog RFC 5424, WEF, WinRM, Agents)  |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |   Parsing, Normalization & Correlator    |
                      |  10 Detection Rules, Threat Feed Matching|
                      +--------------------+---------------------+
                                           |
                   +-----------------------+-----------------------+
                   |                                               |
                   v                                               v
    +------------------------------+               +-------------------------------+
    |   Automated Security Alerts   |               |   Formal Incident Lifecycle   |
    |  (Acknowledge, FP, Escalate) |               | (7-Tab Deep Forensic Dockets) |
    +------------------------------+               +-------------------------------+
```

---

## 2. Technology Stack

- **Frontend Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 (dark navy SOC cybersecurity palette: `#020617`, `#0F172A`, `#1E293B`, `#3B82F6`, `#EF4444`)
- **Data Visualization**: Recharts (interactive time-series, donut distribution charts, horizontal bar charts) & custom SVG equirectangular attack origin projection
- **Icons**: Lucide Icons
- **Typography**: Plus Jakarta Sans (UI headlines & body), JetBrains Mono (data tables, timestamps, and normalized telemetry)
- **State & Storage**: Centralized `SOCProvider` React context with persistent browser storage (`localStorage`) and instant demo-reset capabilities
- **Relational Schema**: PostgreSQL 14+ schema definitions provided in `schema.sql`

---

## 3. Implemented Navigation & Features

### 1. Dashboard
- **Exact Four Time Ranges**: `Last 24 Hours` (Default), `Last 15 Days`, `Last Month`, `Last 3 Months`. Dynamically recalculates all KPI cards, trends, event types, and sources.
- **Four KPI Cards**:
  1. *Total Events*: Ingestion count with percentage delta compared to previous period.
  2. *Critical Events*: Immediate-action events classified by rules.
  3. *High Events*: High-severity anomalies.
  4. *Security Incidents*: Distinct investigation cases opened with change percentage.
- **Events Over Time**: Multi-line time series chart with click-to-hide series toggles.
- **Event Types**: Donut chart with category breakdown and click-to-filter navigation.
- **Top Threat Categories**: Ranked horizontal bar chart displaying volume and percentages.
- **Security Events by Source**: Table with source names, counts, percentages, and health statuses.
- **Incidents by Severity**: Donut chart with click-to-filter drill-down.
- **Attack Sources / Geographic Overview**: Interactive world map with hover tooltips, attack origins, and attribution disclaimers.
- **Recent Incidents & Alerts Tables**: With live links to investigation dockets.
- **System Health Footer**: 6 compact telemetry cards for collectors, agents, ingestion EPS, and storage retention.

### 2. Security Events Explorer
- Full-text search across raw messages, event IDs, hostnames, usernames, source IPs, and destination IPs.
- Multi-dimensional filters: Severity, Category, and Source system tags.
- Column sorting and pagination.
- **Export to CSV**: Working client-side CSV generator.
- **Inspect Record Drawer**: Displays original raw log string alongside structured normalized fields.

### 3. Security Incident Management
- Full lifecycle status tracking: `New` -> `Investigating` -> `Contained` -> `Resolved` -> `Closed`.
- **Exact 7 Investigation Tabs**:
  1. *Overview*: Technical description, summaries, and authorized severity reclassification.
  2. *Related Events*: Correlated security events tied to the incident case.
  3. *Timeline*: Timestamped history of all actions, reassignments, and notes.
  4. *Investigation Notes*: Markdown-style analyst note entry form.
  5. *Affected Assets*: Host information with one-click **Quarantine Host** and **Memory Dump** actions.
  6. *Response Actions*: Containment actions with confirmation dialogs.
  7. *Audit History*: Immutable chronological history of all incident updates.
- **Documented Resolution Modal**: Enforces entry of Root Cause, Resolution Summary, and Preventative Action before closing.

### 4. Security Alerts & Detection Rules
- Real-time alerts queue with detection rule names, first/last seen timestamps, and evidence cards.
- **Alert Triage**: Acknowledge, assign to analyst, link to existing incident, or escalate to a new incident.
- **False Positive Handling**: Modal requiring documented rationale; recorded in audit logs.

### 5. Threat Intelligence & IoC Correlation Engine
- Database of IP, Domain, URL, and SHA-256 hash indicators with risk ratings and confidence scores.
- **IoC Event Scanner**: Search bar allowing analysts to paste any IP or hash to instantly scan all internal logs.
- Add custom threat indicator modal.

### 6. Log Source & Collector Management
- Monitor health (`Healthy`, `Delayed`, `Offline`, `Parsing Error`) for 14 log sources.
- Events per minute (EPM) and parsing success rate metrics.
- **Simulated Connection Probe**: Tests TLS handshake latency (e.g. 14ms) with diagnostic output.
- Diagnostic error modal for parsing/collector failures.
- Add new log source modal.

### 7. Monitored Assets & Endpoints
- Hardware and server inventory with OS, IP addresses, criticality tiers, and assigned administrators.
- Host telemetry drawer showing linked incidents and recent events.

### 8. Network Traffic Monitoring
- Network session flows table with source/destination addresses, protocols, ports, and action flags (`ALLOW` / `BLOCK`).
- Protocol volume breakdown (TLS 443, DNS 53, PostgreSQL 5432, Kerberos 88).
- Monitored appliance throughput and drop rate metrics.

### 9. Reports & Executive Dossiers
- 8 report templates covering Executive Briefings, Incident Summaries, Log Source Coverage, and Response Performance (MTTD/MTTR).
- Filterable by date range, severity, and telemetry sources.
- **Instant CSV Export** and **Formal Print/PDF view** (`window.print()`).

### 10. Settings & Administration
- **User Management**: Profile list with current session details.
- **RBAC Matrix**: Enforced permissions across 5 roles (Security Administrator, SOC Analyst, Incident Responder, Auditor, Management Viewer).
- **Detection Rules Sandbox**: Test detection logic regex against custom sample log strings.
- **Immutable Audit Logs**: Filterable system ledger of every operator action.

---

## 4. Fully Implemented vs Simulated Telemetry

| Feature Component | Implementation Status | Notes |
| :--- | :--- | :--- |
| **Frontend UI / UX Shell** | **Fully Implemented** | Responsive dark navy theme, navigation, modals, and tables. |
| **Incident Investigation Lifecycle** | **Fully Implemented** | Full 7-tab docket, status transitions, response actions, notes. |
| **Detection Rules Sandbox** | **Fully Implemented** | Regex and threshold evaluation against test payloads. |
| **CSV & Print / PDF Reporting** | **Fully Implemented** | Generates real downloadable CSVs and styled print views. |
| **RBAC Role Impersonation** | **Fully Implemented** | Switch active user in header to test role perspectives. |
| **Audit Logging Engine** | **Fully Implemented** | Records user, timestamp, target, and result on state updates. |
| **Log Ingestion Telemetry** | *Simulated Demonstration Data* | Realistic synthetic telemetry modeled on Ministry IT infrastructure. |
| **Geolocation IP Attribution** | *Simulated Demonstration Data* | Labeled geolocation estimate; clearly disclaimed in UI. |
| **Network Packet Capture (PCAP)**| *Simulated Integration* | Flow metadata rendered; physical tap required for deep PCAP. |

---

## 5. Local Setup & Startup Instructions

1. Clone or navigate to the repository directory:
   ```bash
   cd /path/to/project
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`.
5. Run automated lint checks:
   ```bash
   npm run lint
   ```
6. Build for production:
   ```bash
   npm run build
   ```

---

## 6. Future Integration Roadmap

When transitioning from the demonstration prototype to production within the Ministry of Revenue datacenter:
1. **Log Shippers**: Deploy `Winlogbeat` and `Syslog-ng` forwarders on domain controllers and perimeter firewalls directing RFC 5424 syslog streams to port `6514` (TLS).
2. **Backend Correlator**: Mount Express/Node.js or Python FastAPI microservice against the provisioned `schema.sql` database schema.
3. **External Threat Feeds**: Connect MISP / TAXII connectors for CERT-ET and national cyber intelligence feeds.
4. **Hardware Tap**: Deploy network packet brokers for DPI on internal database server connections.
