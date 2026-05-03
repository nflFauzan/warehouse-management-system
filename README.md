# TAKKA STEEL Warehouse Inventory Management System

A production-grade, web-based warehouse and inventory management system built for TAKKA STEEL. This system is designed with **Clean Architecture** principles to ensure scalability, maintainability, and data integrity. It manages master data, tracks inventory transactions, provides comprehensive reporting, and includes secure role-based access control.

## 🚀 Features

- **Dashboard:** Real-time overview of inventory status, low stock alerts, and recent activities.
- **Master Data Management:** Centralized management for items, categories, units, suppliers, and customers.
- **Transaction Workflows:**
  - **Stock In (Receiving):** Track incoming shipments with detailed audit logs.
  - **Stock Out (Shipping):** Manage outgoing orders and adjust inventory levels.
- **Reporting:** Generate detailed inventory, transaction, and mutation reports.
- **User Management:** Secure authentication and role-based access control (RBAC).
- **Responsive Design:** Modern UI built with Tailwind CSS, optimized for all devices.

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Architecture:** Clean Architecture (Controllers, Services, Repositories)
- **Frontend:** EJS (Embedded JavaScript), Tailwind CSS
- **Authentication:** `express-session`, `bcryptjs`, `connect-session-sequelize`
- **Validation:** `express-validator`
- **File Uploads:** `multer`

## 🏗️ Architecture Overview

The project follows **Clean Architecture** patterns to decouple business logic from framework-specific details:

1.  **Repositories:** Handle direct database interactions using Sequelize models.
2.  **Services:** Contain the core business logic and orchestrate repository calls.
3.  **Controllers:** Manage HTTP requests, validate input, and call appropriate services.
4.  **Routes:** Define the API and web endpoints.
5.  **Models:** Define the database schema and associations.

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Optional, for running database via Docker)

## 📦 Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/nflFauzan/warehouse-management-system.git
    cd warehouse-management-system
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Create a `.env` file in the root directory:
    ```env
    PORT=3000
    SESSION_SECRET=your_secure_secret_key

    # Database Configuration
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=wms_db
    DB_USER=postgres
    DB_PASSWORD=wms_takka
    ```

4.  **Database Setup (using Docker)**:
    If you have Docker installed, you can start the PostgreSQL database easily:
    ```bash
    docker-compose up -d
    ```

5.  **Initialize & Seed Data**:
    Sync the database schema and seed initial administrative data:
    ```bash
    npm run seed
    ```

## 🚀 Running the Application

**Development Mode** (with auto-reload and Tailwind CSS watch):
```bash
npm run dev
```

**Production Mode**:
Build the CSS for production:
```bash
npm run build:css
```
Start the application:
```bash
npm start
```

The application will be accessible at `http://localhost:3000`.

## 📁 Project Structure

- `app.js`: Application entry point and middleware configuration.
- `/controllers`: HTTP request handlers and response logic.
- `/services`: Core business logic layer.
- `/repositories`: Data access layer (Sequelize interactions).
- `/models`: Sequelize schema definitions.
- `/routes`: Endpoint definitions.
- `/views`: EJS templates and layouts.
- `/public`: Static assets (compiled CSS, images, JS).
- `/middleware`: Authentication and validation middlewares.
- `/helpers`: Utility functions and formatting helpers.
- `/seeders`: Initial data population scripts.
- `/src`: Source files for Tailwind CSS (`input.css`).

---
Built with ❤️ for TAKKA STEEL.