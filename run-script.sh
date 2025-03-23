#!/bin/bash

# Create project directories
mkdir -p data-breach-dashboard/backend
mkdir -p data-breach-dashboard/frontend
mkdir -p data-breach-dashboard/frontend/public
mkdir -p data-breach-dashboard/frontend/src

# Copy backend files
cp server.js data-breach-dashboard/backend/
cp backend-package.json data-breach-dashboard/backend/package.json
cp backend-dockerfile data-breach-dashboard/backend/Dockerfile

# Copy frontend files
cp App.js data-breach-dashboard/frontend/src/
cp frontend-package.json data-breach-dashboard/frontend/package.json
cp frontend-dockerfile data-breach-dashboard/frontend/Dockerfile
cp nginx.conf data-breach-dashboard/frontend/

# Create frontend index files
cat > data-breach-dashboard/frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > data-breach-dashboard/frontend/src/App.css << 'EOF'
.App {
  text-align: center;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
EOF

cat > data-breach-dashboard/frontend/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="Data Breach Reports Dashboard"
    />
    <title>Data Breach Reports Dashboard</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# Copy docker-compose file
cp docker-compose.yml data-breach-dashboard/

# Copy README
cp README.md data-breach-dashboard/

# Navigate to project directory
cd data-breach-dashboard

# Start the application
echo "Starting Data Breach Dashboard..."
docker-compose up -d

echo ""
echo "Application started!"
echo "Frontend is available at: http://localhost:3000"
echo "Backend API is available at: http://localhost:5000"
