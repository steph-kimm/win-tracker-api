#!/bin/sh

API="http://localhost:4741"
URL_PATH="/wins"
ID="62597ebef594abf2d2ee0168"
TOKEN="18fc9bb96055b02f83244b2e0b5960b0"
curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request GET \
  --header "Authorization: Bearer ${TOKEN}"

echo
