#!/bin/sh
####################################################################################################
# This script is used to replace template variables in the built JavaScript files
# with the values from Docker environment variables
# 
# Template variable that will be replaced:
# TEMPLATE_VITE_CONFIG_SERVICE_URL -> VITE_CONFIG_SERVICE_URL
#
# Example environment variable:
# VITE_CONFIG_SERVICE_URL='http://config-service:3001'
####################################################################################################
# Check if the environment variable is set
if [ -z "$VITE_CONFIG_SERVICE_URL" ]; then
  echo "VITE_CONFIG_SERVICE_URL is not set"
  exit 1
fi

echo "Looking for JavaScript files in the build output..."

# Find ALL JS files that contain the template variable and replace in each
FILES_WITH_TEMPLATE=$(grep -l "TEMPLATE_VITE_CONFIG_SERVICE_URL" /usr/share/nginx/html/assets/*.js 2>/dev/null)

if [ -z "$FILES_WITH_TEMPLATE" ]; then
  echo "No files found containing TEMPLATE_VITE_CONFIG_SERVICE_URL"
else
  echo "VITE_CONFIG_SERVICE_URL=$VITE_CONFIG_SERVICE_URL"
  
  for FILE in $FILES_WITH_TEMPLATE; do
    echo "Replacing in: $FILE"
    sed -i "s|TEMPLATE_VITE_CONFIG_SERVICE_URL|$VITE_CONFIG_SERVICE_URL|g" "$FILE"
  done
fi

# Verify no templates remain
REMAINING=$(grep -l "TEMPLATE_" /usr/share/nginx/html/assets/*.js 2>/dev/null)
if [ -n "$REMAINING" ]; then
  echo "WARNING: Some TEMPLATE_ variables not replaced in:"
  echo "$REMAINING"
  exit 1
else
  echo "All variables are replaced successfully"
fi

echo "Startup script finished successfully"
echo "Start Nginx"
nginx -g 'daemon off;'