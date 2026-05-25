#!/bin/sh
# Generate env-config.js at runtime
echo "window.ENV = {" > /usr/share/nginx/html/env-config.js
echo "  API_URL: '${NEXT_PUBLIC_API_URL:-http://localhost:5156/api}'," >> /usr/share/nginx/html/env-config.js
echo "  SIGNALR_URL: '${NEXT_PUBLIC_SIGNALR_URL:-http://localhost:5156/hubs/chat}'" >> /usr/share/nginx/html/env-config.js
echo "};" >> /usr/share/nginx/html/env-config.js

# Execute the passed command (nginx)
exec "$@"
