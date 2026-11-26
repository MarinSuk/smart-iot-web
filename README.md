# SmartIoT-Web · Smart Device Cloud Admin Frontend

An IoT device-cloud admin frontend built with **Vue 3 + TypeScript + Vite**, designed as the companion to the **SmartIoT-Cloud Open Gateway & Device Cloud Platform** backend (JDK 17 + Spring Boot 3). Generated from the OpenAPI 3.0 specification exported by Knife4j, it covers the full operations loop: admin login, third-party open-platform quota management, and realtime monitoring of 4G remote-control commands.

## Core Features

* **OpenAPI-driven, type-safe API layer**: All request/response TypeScript interfaces (`LoginRequest`, `AdminOpenPlatform`, `AdminCommandLog`, `AuthContext`, etc.) are derived from the backend `openapi.json`. API functions provide end-to-end type hints and return business data directly after unwrapping `Result<T>`.
* **Dual-channel auth integration (admin side)**: The Axios request interceptor injects `Authorization: Bearer <token>` automatically; the response interceptor handles `code !== 200` with unified `ElMessage.error` toasts. Both HTTP 401 and business-code 401 are detected, stale credentials are cleared, and the user is redirected to the login page with a `redirect` query so they return to the original page after signing in.
* **Route-level access guard**: A `vue-router` `beforeEach` guard redirects unauthenticated visits to protected pages to the login page, and redirects authenticated visits to the login page back to the dashboard.
* **Open-platform quota management**: The platform table shows AppId, platform name, remaining quota (tiered color-coded progress bar: healthy / low / critical) and enabled status. The "Recharge Quota" dialog offers quick amounts and a live preview of the post-recharge quota; on success the row is updated optimistically and the list is re-synced.
* **Realtime 4G command monitoring**: The command-log table distinguishes states with `el-tag` (0 – Sending `warning`, 1 – Succeeded `success`, 2 – Expired `danger`). In-flight commands get a breathing dot and row highlight. Silent polling auto-refreshes every 10 seconds by default (toggleable), with search by device SN / command ID / type and status filtering; timers are cleaned up automatically on component unmount.
* **Operations overview stats**: Top stat cards aggregate connected platform count, total remaining quota, command success rate, and in-flight command count in real time.
* **Internationalization (English by default)**: A zero-dependency, lightweight reactive i18n module. The `EN / 中文` sliding switch takes effect instantly across the whole site, driving Element Plus built-in locales, form validation rules, `<html lang>` and the browser title in sync; the language choice persists to `localStorage`.
* **Themed design system**: A "deep-space navy × electric cyan" dark IoT monitoring theme with customized Element Plus dark variables, themed scrollbars, glassmorphism panels, aurora backgrounds, and a login page featuring an animated device-network graphic.

## Tech Stack

* **Core framework**: Vue 3.5 (`<script setup lang="ts">` Composition API), TypeScript 6.0
* **Build tooling**: Vite 5.4.11 (version pinned for compatibility with older Node environments), vue-tsc type checking
* **UI library**: Element Plus 2.14 (dark theme + English/Chinese locales), @element-plus/icons-vue
* **Routing & HTTP**: vue-router (History mode + navigation guards), Axios 1.x (unified interceptor wrapper)
* **i18n**: In-house lightweight reactive i18n module (no third-party dependencies)

## Directory Structure

```
smart-iot-web
├── public/ # Static assets (favicon, etc.) 
├── src 
│ ├── api 
│ │ └── iot.ts # OpenAPI-derived type definitions & API functions 
│ ├── components 
│ │ └── LangSwitch.vue # EN / 中文 language switch 
│ ├── i18n 
│ │ └── index.ts # Locale state, bilingual dictionaries, Element Plus locale sync 
│ ├── router 
│ │ └── index.ts # Route table & token-based navigation guard 
│ ├── utils 
│ │ ├── auth.ts # Unified localStorage access for token / nickname 
│ │ └── request.ts # Axios instance: auth injection, Result unwrapping, 401 handling 
│ ├── views 
│ │ ├── Login.vue # Login page: brand showcase + credential form 
│ │ └── Dashboard.vue # Console: platform quota table + realtime 4G command monitor 
│ ├── App.vue # Root component: ConfigProvider locale provider + router outlet 
│ ├── main.ts # App entry: Element Plus (dark) & router registration 
│ └── style.css # Global design system (dark variables, scrollbars, shared styles) 
├── openapi.json # OpenAPI 3.0 spec exported by the backend's Knife4j 
├── vite.config.ts # /api dev-proxy configuration 
└── package.json
```
## Requirements

* **Node.js**: 18+ (20 / 22 LTS recommended; Vite is pinned to `5.4.11` to avoid the `crypto.hash is not a function` error on older Node versions)
* **Package manager**: npm 9+
* **Companion backend**: The SmartIoT-Cloud gateway service running at `http://localhost:8081` (MySQL / Redis / RabbitMQ environments must be started first — see the backend README)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (defaults to http://localhost:5173)
npm run dev