# Lost & Found — Setup Guide

## Prerequisites

Install these before starting:

- [Node.js 18 or later](https://nodejs.org/)
- Git

Check that both are available in PowerShell:

```powershell
node --version
npm --version
git --version
```

## 1. Clone the repository

Open PowerShell and run:

```powershell
git clone <YOUR-REPOSITORY-URL>
cd <YOUR-REPOSITORY-FOLDER>
```

For example:

```powershell
git clone https://github.com/your-account/lost-and-found.git
cd lost-and-found
```

## 2. Install dependencies

From the project folder, run:

```powershell
npm install
cd client
npm install
cd ..
```

## 3. Create the environment file

In PowerShell, run:

```powershell
@"
PORT=5000
JWT_SECRET=replace-this-with-a-long-random-secret
NODE_ENV=development
"@ | Set-Content .env
```

## 4. Start the application

Run this command from the project folder:

```powershell
npm run dev
```

The application starts at:

```text
Website: http://localhost:3000
API:     http://localhost:5000
```

Keep the PowerShell window open while using the application. Press `Ctrl + C` to stop both servers.

## 5. Sign in as administrator

Open `http://localhost:3000/admin/login` and use:

```text
Email:    admin@lostandfound.com
Password: admin123
```

Change these credentials before deploying the application.

## Run the services separately

Open two PowerShell windows in the project folder.

In the first window, start the API:

```powershell
npm run server
```

In the second window, start the React website:

```powershell
npm run client
```

## Verify the installation

Run the automated tests:

```powershell
npm test -- --runInBand
```

Build the production website:

```powershell
npm run build
```

## Production start

Build the client and then start the server:

```powershell
npm run build
$env:NODE_ENV = "production"
npm start
```

The production server serves the website and API on `http://localhost:5000`.
