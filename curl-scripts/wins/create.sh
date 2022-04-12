#!/bin/bash

API="http://localhost:4741"
URL_PATH="/wins"
TOKEN="18fc9bb96055b02f83244b2e0b5960b0"
DATE="2003-12-30"
TITLE="My win"
TEXT="my text"


curl "${API}${URL_PATH}" \
  --include \
  --request POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${TOKEN}" \
  --data '{
    "win": {
      "title": "'"${TITLE}"'",
      "text": "'"${TEXT}"'",
      "date": "'"${DATE}"'"
    }
  }'

echo
