# Harir International — Production & Warehouse Management System

<p align="center">
  <strong>A modern, full-stack production and warehouse management platform</strong> built with Next.js, TypeScript, Prisma, and Tailwind CSS — purpose-built to manage fresh-produce intake, quality control, cold room operations, shipments, HR, and user access across the entire supply chain.
</p>

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Module Guide](#module-guide)
- [Role-Based Access Control](#role-based-access-control-rbac)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [Docker Deployment](#docker-deployment)
- [Available Scripts](#available-scripts)
- [Security](#security)
- [Roadmap](#roadmap)

---

## Overview

Harir International is a complete internal operations system for a fresh-produce exporter. It manages the day-to-day workflow from **supplier intake and weighing**, through **quality control and counting**, into **cold room storage**, and finally **shipment loading and dispatch** — all while handling employee (casual) management, security access control, utility tracking, and detailed reporting.

Built on a clean, modular architecture, the system is permission-driven: every route and API endpoint is protected by a granular permissions model, giving administrators precise control over what each role can view and do.

---

## Screenshots

### Login

<p align="center">
  <img src="./public/images/login.png" alt="Login" width="640" />
</p>

### Dashboard

The command center — live KPIs across intake, quality, cold room, inventory, and analytics.

<p align="center">
  <img src="./public/images/dashboard.png" alt="Dashboard" width="720" />
</p>

### Employees (Casuals)

HR module for casual-worker management: gate check-in/out, designations, employee records, and attendance.

<p align="center">
  <img src="./public/images/employee.png" alt="Employees" width="720" />
</p>

### Reports

Centralized reporting with PDF and Excel export across every module.

<p align="center">
  <img src="./public/images/reports.png" alt="Reports" width="720" />
</p>

### User Roles

Role and permission management — create custom roles, assign permissions by category, and manage user–role assignments.

<p align="center">
  <img src="./public/images/user%20roles.png" alt="User Roles" width="720" />
</p>

---

## Key Features

- **Intake & Weighing** — Gate-in capture, gross/tare/net weights, per-variety weights (Fuerte/Hass), declared vs. actual variance tracking, reject handling, and driver/vehicle registration.
- **Quality Control** — QC checks per pallet with class-based grading (Class 1/2/overall), temperature at arrival, packaging/freshness/seal status, and pass/reject decisions.
- **Counting & Cold Room** — Box counting by variety/size/grade, pallet building, cold room zones (fruit/vegetable/flower), temperature logging, and dwell-time analysis.
- **Citrus Module** — Oranges, lemons, and tangerines intake, grading, and carry/return tracking for sales personnel.
- **Shipments & Carriers** — Shipment lifecycle (awaiting QC → dispatched → in transit → delivered), carrier registration and assignment, container tracking with temperature/location updates.
- **Loading (Outbound)** — Loading sheets with container, seal numbers, vessel/ETA/ETD details, pallet-level trace codes, and per-size box breakdowns.
- **Inventory** — Live stock visibility, packaging materials and reorder levels, cold room inventory, and stock-take support.
- **HR / Casuals** — Casual worker gate check-in/out, shift designations, employee records (ID, contracts, salary), and daily attendance with clock-in/out.
- **Access Control** — Visitor pre-registration and check-in/out, vehicle logs, gate entry numbers, and re-check-in handling.
- **Utility Management** — Daily power/water/generator readings, area-level consumption, utility rates, and cost tracking.
- **Reports** — Supplier, visitor log, vehicle log, intake, counting, casuals attendance, and production reports with **PDF and Excel export**.
- **Role-Based Access Control** — Granular permission system enforced on both pages (middleware) and every API endpoint.
- **Audit & Activity Logs** — Full user activity and audit trails with status, IP, and metadata.
- **AI Integration** — Genkit-powered generative AI tooling (anomaly/insight tooling included).
- **Security Tooling** — Login throttling, account lockout, two-factor authentication support, CSRF protection, and API rate limiting.
- **WhatsApp Notifications** — Sends GRN documents directly to suppliers via the WhatsApp Business Cloud API.
- **PWA Ready** — Service worker registration for offline caching and installability.

---

## Tech Stack

| Layer       | Technology                                                            |
| ----------- | --------------------------------------------------------------------- |
| Frontend    | Next.js 15 (App Router), React 18, TypeScript                         |
| Styling     | Tailwind CSS, shadcn/ui (Radix UI primitives), lucide-react icons     |
| Backend     | Next.js API Routes, Route Handlers                                    |
| Database    | MySQL / MariaDB via Prisma ORM                                        |
| Auth        | NextAuth.js (credentials) with JWT + permission claims                |
| AI          | Google Genkit (`@genkit-ai/google-genai`)                             |
| PDF / Excel | jsPDF, jsPDF-autotable, pdfkit, xlsx, html2canvas, react-to-print    |
| Maps / QR   | Leaflet, react-leaflet, html5-qrcode                                 |
| Charts      | Recharts                                                             |
| Forms       | React Hook Form + Zod                                                |
| Runtime     | Node.js                                                              |
| Package Mgr | npm                                                                  |
| Deployment  | Docker + docker-compose (standalone build)                           |

---

## Module Guide

The sidebar organizes modules into **Main**, **HR**, **Access Control**, **Operations**, and **Administration**.

### Main
- **Dashboard** `/dashboard` — KPIs, operations overview, cold-chain status, and analytics. Logged-in users are automatically redirected to the first module they have permission for.

### HR
- **Employees / Casuals** `/employees` — Gate-in → assign designation → gate-out workflow for casual workers, plus employee records and attendance tracking.

### Access Control
- **Visitor Log** `/visitor-management` — Pre-register visitors, record ID/vehicle details, check-in/out.
- **Vehicle Log** `/vehicle-management` — Vehicle/driver registration, gate entries, and status tracking.

### Operations
- **Intake** `/weight-capture` — Weighbridge entries with gross/tare/net, per-variety weights, rejections, and supplier/driver capture.
- **Quality Control** `/quality-control` — Pallet-level QC grading and approvals.
- **Counting** `/warehouse` — Box counting by class/size and loading to cold room.
- **Citrus** `/oranges` — Citrus intake and sales carry/return tracking.
- **Cold Room** `/cold-room` — Zone management, temperature logs, cold room inventory, and dwell times.
- **Shipments** `/shipments` — Full shipment lifecycle and container/transit tracking.
- **Carriers** `/carriers` — Carrier management and assignment to loading sheets with transit history.
- **Loading** `/outbound` — Outbound loading sheets with pallet trace codes and container details.
- **Inventory** `/inventory` — Stock, packaging materials, and cold room inventory views.
- **Utility Management** `/utility` — Power, water, and generator readings and analysis.

### Administration
- **Reports** `/reports` — Cross-module reports with PDF/Excel export.
- **Standard Procedures** `/sop` — Standard operating procedure documentation.
- **User Roles** `/user-roles` — Role creation, permission categorization (Administrative / Operational / Custom), and user assignment.
- **Security Center** `/security` — Account security, activity logs, and audit trail.
- **Settings** `/settings` — System configuration.

---

## Role-Based Access Control (RBAC)

Every page and API route is guarded by a permissions model:

- Routes are protected in `middleware.ts` via `routePermissions` (page-level) and `apiRoutePermissions` (per-method API authorization).
- Permissions follow dot notation, e.g. `suppliers.weigh`, `qc.perform`, `employees.attendance.view`, `admin.roles`, `cold_room.temperature`.
- Users with the **Administrator** role (or `admin.all`) bypass all permission checks.
- After login, the application redirects users to the first module they can access based on their permissions.
- The **User Roles** module lets administrators create custom roles and assign granular permissions by category.

---

## Project Structure

```text
Harir-International/
├── src/
│   ├── app/                  # Application routes, pages & API handlers
│   │   ├── dashboard/        # Dashboard page
│   │   ├── employees/        # HR / Casuals module
│   │   ├── reports/          # Reports module
│   │   ├── user-roles/       # Role & permission management
│   │   ├── suppliers/
│   │   ├── weight-capture/   # Intake / weighing
│   │   ├── quality-control/  # QC module
│   │   ├── warehouse/        # Counting module
│   │   ├── cold-room/
│   │   ├── shipments/
│   │   ├── carriers/
│   │   ├── outbound/         # Loading
│   │   ├── inventory/
│   │   ├── utility/
│   │   ├── security/
│   │   ├── settings/
│   │   └── api/              # API route handlers
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── layout/           # App shell, sidebar, header
│   │   ├── dashboard/        # Dashboard widgets
│   │   └── modules/          # Feature components
│   ├── hooks/                # React hooks (auth user, sessions)
│   ├── lib/                  # Utilities, DB client, auth, exports
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── db.ts             # Prisma client
│   │   ├── security.ts       # CSRF & rate limiting
│   │   ├── activity-logger.ts
│   │   └── xlsx-export.ts / container-pdf.ts
│   └── ai/                   # Genkit AI tooling
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Migrations
├── public/
│   ├── images/               # Brand assets & screenshots
│   └── uploads/              # Uploaded files
├── middleware.ts             # Auth + permission enforcement
├── next.config.ts
├── package.json
├── Dockerfile
├── docker-compose.yaml
├── docker-entrypoint.sh
└── README.md
```

---

## Database Schema

The Prisma schema (`prisma/schema.prisma`) models the full operational domain, including:

- **Supply chain**: `suppliers`, `weight_entries`, `weight_entry_varieties`, `rejects`, `quality_checks`, `CountingRecord`, `citrus_intake`, `citrus_movements`
- **Cold chain**: `cold_rooms`, `cold_room_inventory`, `cold_room_boxes`, `cold_room_pallets`, `temperature_logs`, `dwell_times`, `products`
- **Shipping**: `shipments`, `carriers`, `loading_sheets`, `loading_pallets`, `carrier_assignments`, `transit_history`, `containers`, `container_updates`
- **Commerce**: `customers`, `customer_contacts`, `quotes`, `accounts_receivable`
- **Security**: `User`, `UserRole`, `audit_logs`, `activity_logs`
- **HR**: `Employee`, `Attendance`
- **Access**: `visitors`, `vehicle_visits`, `supplier_checkins`, `Driver`
- **Utilities**: `utility_readings`, `utility_rates`, `utility_area_consumption`, `generator_details`, `water_meters`, `internet_costs`
- **Packaging**: `packaging_materials`

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (development is on modern Node)
- **MySQL** or **MariaDB** (or Docker)
- **npm**

### Installation

```bash
git clone <your-repository-url>
cd Harir-International
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/harir_international"

# Auth (NextAuth.js)
NEXTAUTH_SECRET="generate-a-long-random-secret"
NEXTAUTH_URL="http://localhost:9002"

# Optional: WhatsApp Business Cloud API (auto-send GRN documents to suppliers)
WHATSAPP_ACCESS_TOKEN="your_whatsapp_permanent_access_token"
WHATSAPP_PHONE_NUMBER_ID="your_whatsapp_business_phone_number_id"
WHATSAPP_API_VERSION=v21.0
```

> Generate a secret with: `openssl rand -base64 32`

### Database Setup

```bash
# Generate the Prisma client
npx prisma generate

# Create/apply migrations
npx prisma migrate dev
```

### Running the App

```bash
npm run dev
```

The development server starts on **http://localhost:9002** (turbopack).

- **Build:** `npm run build`
- **Production server:** `npm run start`
- **Type check:** `npm run typecheck`
- **Lint:** `npm run lint`

---

## Docker Deployment

A complete production stack ships with the repository (`docker-compose.yaml`): the app plus a MariaDB database on a private network, with health checks, resource limits, and automatic migration-on-boot (`docker-entrypoint.sh` runs `prisma migrate deploy` before starting).

```bash
# Set environment variables
$env:DB_PASSWORD = "your-secure-password"
$env:DB_NAME     = "system_db"
$env:DB_USER     = "root"
$env:NEXTAUTH_SECRET = "your-secret"
$env:NEXTAUTH_URL    = "http://localhost:3000"

# Build & start
docker compose up -d --build
```

- The app is exposed on **http://localhost:3000**
- The database listens on host port **3307** (mapped to MariaDB's 3306)
- Migrations run automatically at container startup

---

## Available Scripts

| Script               | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `npm run dev`        | Start the dev server on port 9002 (Turbopack)            |
| `npm run build`      | Production build (cross-env)                             |
| `npm run start`      | Start the production server                              |
| `npm run lint`       | Run ESLint                                               |
| `npm run typecheck`  | Run TypeScript type checking (`tsc --noEmit`)            |
| `npm run dev:lan`    | Dev server bound to the LAN plus an ngrok tunnel         |
| `npm run genkit:dev` | Start the Genkit AI development server                   |
| `npm run genkit:watch` | Start Genkit with file watching                        |

---

## Security

- **CSRF protection** (same-origin enforcement) applied to all state-changing requests, including login.
- **Rate limiting** on API routes to mitigate brute-force and burst attacks.
- **Account lockout & throttling** via `loginAttempts`, `lockedUntil`, and two-factor authentication support on the `User` model.
- **Permission-gated pages & APIs** enforced in middleware, with per-method API authorization.
- **Audit trail** — every mutation is logged to `activity_logs` / `audit_logs` with user, IP, and metadata.

---

## Roadmap

- Advanced dashboard analytics and BI features
- Full API documentation
- Additional report types and scheduled exports
- Expanded cold-chain IoT integrations
- Multi-branch support

---

## Author

**Harir International** — Production & Warehouse Management System.

Built with Next.js, TypeScript, Prisma, and Tailwind CSS.

---

### Contact [Solomon Muturi]

- Phone : +24745945248