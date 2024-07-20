#!/bin/sh
# entrypoint.sh

# Wait for 1 second
sleep 1

# Execute the command passed as arguments
exec "$@"
