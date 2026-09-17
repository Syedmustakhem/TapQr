# TapQR

<p align="center">
  <strong>TapQR — QR-powered restaurant and business management platform.</strong>
</p>

<p align="center">
  Create digital menus, manage staff, process orders, generate QR codes,
  and monitor business analytics through a scalable SaaS architecture.
</p>

---

## 🚀 About TapQR

TapQR is a production-ready QR-based platform designed for restaurants
and businesses.

The platform combines QR technology with digital menus, ordering,
business management, staff management, and analytics into a unified
SaaS architecture.

### Core capabilities

- 📱 Digital menus
- 🔳 QR code generation and management
- 🛒 Customer ordering
- 👥 Staff management
- 📊 Business analytics
- 🏢 Business management
- ⚡ Scalable backend architecture
- 🔐 Secure application architecture
- ☁️ Cloud-ready infrastructure

---

## 🏗️ Architecture

TapQR follows a modular application architecture designed to separate
frontend applications, backend services, shared packages, infrastructure,
and documentation.

```text
TapQR
│
├── apps/
│   ├── backend/       # Node.js + Express API
│   ├── mobile/        # React Native + Expo application
│   └── web/           # Next.js web application
│
├── packages/          # Shared packages and modules
│
├── docker/            # Docker and container configuration
│
└── docs/              # Project documentation