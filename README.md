# TAKKA STEEL Warehouse Inventory Management System

A comprehensive web-based warehouse and inventory management system built for TAKKA STEEL. This system manages master data, tracks inventory transactions, provides reporting, and includes user authentication with a role-based dashboard.

## 🚀 Features

- **Dashboard:** Overview of inventory status and recent activities.
- **Master Data Management:** Manage items, categories, and warehouse locations.
- **Transaction Workflows:** Track incoming (receiving) and outgoing (shipping) inventory.
- **Reporting:** Generate inventory and transaction reports.
- **Settings:** Configure application settings and manage users.
- **Authentication:** Secure login and session management.

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite with Sequelize ORM
- **Frontend:** EJS (Embedded JavaScript templates), TailwindCSS
- **Authentication:** express-session, connect-session-sequelize, bcryptjs
- **Styling:** PostCSS, Autoprefixer

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## 📦 Installation & Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/nflFauzan/warehouse-management-system.git
   cd warehouse-management-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env` file in the root directory and configure your environment variables (example):
   ```env
   PORT=3000
   SESSION_SECRET=your_secret_key_here
   ```

4. **Initialize Database & Seed Data**:
   The application uses SQLite, so the database file (`database.sqlite`) will be created automatically. To seed initial data:
   ```bash
   npm run seed
   ```

## 🚀 Running the Application

**Development Mode** (with auto-reload for both server and TailwindCSS):
```bash
npm run dev
```

**Production Mode**:
First, build the CSS:
```bash
npm run build:css
```
Then start the server:
```bash
npm start
```

The application will be accessible at `http://localhost:3000` (or your configured port).

## 📁 Project Structure

- `/src`: Contains the input CSS for Tailwind (`input.css`).
- `/public`: Static assets (compiled CSS, images, client-side JS).
- `/models`: Sequelize database models.
- `/routes`: Express route definitions.
- `/views`: EJS templates for the frontend.
- `/seeders`: Initial data seed scripts.
- `/middleware`: Express middlewares (auth, validation).
- `/helpers`: Utility functions.