#!/bin/bash

# Simple script to update yt-dlp to the latest version
# This is important as video platforms frequently change their APIs

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Updating yt-dlp to the latest version...${NC}"

# Update yt-dlp using pip
if sudo pip3 install -U yt-dlp; then
    echo -e "${GREEN}yt-dlp has been successfully updated to the latest version!${NC}"
    echo -e "Current version: $(yt-dlp --version)"
else
    echo -e "Failed to update yt-dlp. Please check your internet connection and try again."
    exit 1
fi

echo ""
echo "yt-dlp is now up-to-date. This ensures the downloader can access the latest"
echo "platform APIs and bypass any restrictions that may have been introduced."