#!/bin/bash

# Test script for Pastebin backend running on port 3000

BASE_URL="http://localhost:3000"

echo "=================================="
echo "Testing Pastebin Backend API"
echo "=================================="
echo ""

# Test 1: Health check
echo "Test 1: Health Check"
echo "---"
curl -s "${BASE_URL}/api/healthz" | jq .
echo ""
echo ""

# Test 2: Create a paste (immortal - no TTL, no max views)
echo "Test 2: Create Immortal Paste"
echo "---"
PASTE1=$(curl -s -X POST "${BASE_URL}/api/pastes" \
  -H "Content-Type: application/json" \
  -d '{"content":"This is an immortal paste with no expiration"}')
echo "$PASTE1" | jq .
PASTE1_ID=$(echo "$PASTE1" | jq -r '.id')
echo ""
echo ""

# Test 3: Create a paste with TTL (30 seconds)
echo "Test 3: Create Paste with TTL (30 seconds)"
echo "---"
PASTE2=$(curl -s -X POST "${BASE_URL}/api/pastes" \
  -H "Content-Type: application/json" \
  -d '{"content":"This paste expires in 30 seconds","ttl_seconds":30}')
echo "$PASTE2" | jq .
PASTE2_ID=$(echo "$PASTE2" | jq -r '.id')
echo ""
echo ""

# Test 4: Create a paste with max views
echo "Test 4: Create Paste with Max Views (3)"
echo "---"
PASTE3=$(curl -s -X POST "${BASE_URL}/api/pastes" \
  -H "Content-Type: application/json" \
  -d '{"content":"This paste has max 3 views","max_views":3}')
echo "$PASTE3" | jq .
PASTE3_ID=$(echo "$PASTE3" | jq -r '.id')
echo ""
echo ""

# Test 5: Create a paste with both TTL and max views
echo "Test 5: Create Paste with TTL (60s) and Max Views (5)"
echo "---"
PASTE4=$(curl -s -X POST "${BASE_URL}/api/pastes" \
  -H "Content-Type: application/json" \
  -d '{"content":"This paste has both TTL (60s) and max views (5)","ttl_seconds":60,"max_views":5}')
echo "$PASTE4" | jq .
PASTE4_ID=$(echo "$PASTE4" | jq -r '.id')
echo ""
echo ""

# Test 6: List all pastes
echo "Test 6: List All Active Pastes"
echo "---"
curl -s "${BASE_URL}/api/pastes" | jq .
echo ""
echo ""

# Test 7: Fetch paste metadata (without incrementing views)
echo "Test 7: Fetch Paste Metadata for Paste 1 (no view increment)"
echo "---"
curl -s "${BASE_URL}/api/pastes/${PASTE1_ID}/meta" | jq .
echo ""
echo ""

# Test 8: Fetch paste (increments view count)
echo "Test 8: Fetch Paste 3 (increments view count)"
echo "---"
curl -s "${BASE_URL}/api/pastes/${PASTE3_ID}" | jq .
echo ""
echo ""

# Test 9: Check metadata after viewing
echo "Test 9: Check Paste 3 Metadata After View"
echo "---"
curl -s "${BASE_URL}/api/pastes/${PASTE3_ID}/meta" | jq .
echo ""
echo ""

# Test 10: View paste multiple times to test max_views
echo "Test 10: View Paste 3 Two More Times (should reach max views)"
echo "---"
echo "View 2:"
curl -s "${BASE_URL}/api/pastes/${PASTE3_ID}" | jq -c '{remaining_views}'
echo "View 3:"
curl -s "${BASE_URL}/api/pastes/${PASTE3_ID}" | jq -c '{remaining_views}'
echo ""
echo ""

# Test 11: Try to view paste after max views reached
echo "Test 11: Try to View Paste 3 After Max Views (should fail)"
echo "---"
curl -s "${BASE_URL}/api/pastes/${PASTE3_ID}" | jq .
echo ""
echo ""

# Test 12: Test invalid paste creation (empty content)
echo "Test 12: Test Invalid Paste (empty content)"
echo "---"
curl -s -X POST "${BASE_URL}/api/pastes" \
  -H "Content-Type: application/json" \
  -d '{"content":""}' | jq .
echo ""
echo ""

# Test 13: Test invalid paste creation (invalid TTL)
echo "Test 13: Test Invalid Paste (negative TTL)"
echo "---"
curl -s -X POST "${BASE_URL}/api/pastes" \
  -H "Content-Type: application/json" \
  -d '{"content":"test","ttl_seconds":-5}' | jq .
echo ""
echo ""

# Test 14: Fetch non-existent paste
echo "Test 14: Fetch Non-Existent Paste"
echo "---"
curl -s "${BASE_URL}/api/pastes/INVALID_ID" | jq .
echo ""
echo ""

# Test 15: List all pastes again (should show fewer after max views)
echo "Test 15: List All Active Pastes (after some expired/viewed)"
echo "---"
curl -s "${BASE_URL}/api/pastes" | jq .
echo ""
echo ""

echo "=================================="
echo "All Tests Complete!"
echo "=================================="
echo ""
echo "Created Paste IDs:"
echo "  Immortal: $PASTE1_ID"
echo "  TTL 30s: $PASTE2_ID"
echo "  Max Views 3: $PASTE3_ID (should be expired now)"
echo "  TTL 60s + Max Views 5: $PASTE4_ID"
echo ""
echo "To view pastes in browser:"
echo "  http://localhost:3000/p/$PASTE1_ID"
echo "  http://localhost:3000/p/$PASTE2_ID"
echo "  http://localhost:3000/p/$PASTE4_ID"