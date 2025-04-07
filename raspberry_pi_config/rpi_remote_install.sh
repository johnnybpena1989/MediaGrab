
#!/bin/bash

# Remote Installation Script for MediaGrab
# This script securely installs MediaGrab on a remote Raspberry Pi

set -e  # Exit on any error

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print messages
print_message() { echo -e "${GREEN}${BOLD}$1${NC}"; }
print_warning() { echo -e "${YELLOW}${BOLD}$1${NC}"; }
print_error() { echo -e "${RED}${BOLD}$1${NC}"; }

# Welcome message
clear
echo -e "${BOLD}================================================${NC}"
echo -e "${GREEN}${BOLD}   MediaGrab Remote Installation Script   ${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""

# Get SSH connection details
read -p "Enter gateway IP address: " GATEWAY_IP
read -p "Enter gateway username: " GATEWAY_USER
read -p "Enter local network Raspberry Pi IP: " RPI_IP
read -p "Enter Raspberry Pi username: " RPI_USER

# Create a temporary directory for the files
TEMP_DIR=$(mktemp -d)
print_message "Creating temporary directory at $TEMP_DIR"

# Copy the installation files to the temporary directory
cp "$(dirname "$0")/setup_mediagrab.sh" "$TEMP_DIR/"

# First SCP the files to the gateway
print_message "Copying installation files to gateway..."
scp "$TEMP_DIR/setup_mediagrab.sh" "$GATEWAY_USER@$GATEWAY_IP:~/"

# SSH to gateway, then to Raspberry Pi to run installation
print_message "Connecting to Raspberry Pi through gateway and installing MediaGrab..."
ssh -t "$GATEWAY_USER@$GATEWAY_IP" "scp ~/setup_mediagrab.sh $RPI_USER@$RPI_IP:~/ && ssh -t $RPI_USER@$RPI_IP 'bash ~/setup_mediagrab.sh'"

# Clean up
print_message "Cleaning up temporary files..."
rm -rf "$TEMP_DIR"
ssh -t "$GATEWAY_USER@$GATEWAY_IP" "rm ~/setup_mediagrab.sh"

print_message "Remote installation process completed!"
echo ""
echo "To access MediaGrab, you may need to set up port forwarding on your gateway to access port 5050 on the Raspberry Pi."
echo ""
echo -e "${BOLD}================================================${NC}"
