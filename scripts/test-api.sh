#!/bin/bash

# API Testing Script - Manual Test Execution
# Usage: ./test-api.sh <action>
# Actions: auth, pagination, validation, rate-limit, cors, all

API_BASE="http://localhost:3000/api"
TOKEN=""
STUDENT_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper function to run test
run_test() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5
  local headers=$6

  echo -e "${YELLOW}Testing: $test_name${NC}"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      $headers)
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      $headers)
  fi

  status=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -1)

  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $status)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "$body" | jq . 2>/dev/null || echo "$body"
  else
    echo -e "${RED}✗ FAILED${NC} (Expected $expected_status, got $status)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "$body" | jq . 2>/dev/null || echo "$body"
  fi
  echo ""
}

# Authentication Test
test_auth() {
  echo -e "${YELLOW}========== AUTHENTICATION TESTS ==========${NC}\n"

  # Test missing token
  echo -e "${YELLOW}Testing: Missing Auth Token${NC}"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE/students")
  if [ "$status" = "401" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP 401)\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAILED${NC} (Expected 401, got $status)\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi

  # Test invalid token
  echo -e "${YELLOW}Testing: Invalid Auth Token${NC}"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE/students" \
    -H "Authorization: Bearer invalid.token.here")
  if [ "$status" = "401" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP 401)\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAILED${NC} (Expected 401, got $status)\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

# Pagination Test
test_pagination() {
  echo -e "${YELLOW}========== PAGINATION TESTS ==========${NC}\n"

  run_test "Pagination - Default" "GET" "/students" "" "200"
  
  run_test "Pagination - Custom PageSize" "GET" "/students?pageSize=50&page=2" "" "200"
  
  run_test "Pagination - Exceeds Max" "GET" "/students?pageSize=500" "" "200"
}

# Validation Test
test_validation() {
  echo -e "${YELLOW}========== VALIDATION TESTS ==========${NC}\n"

  # Invalid email
  run_test "Validation - Invalid Email" "POST" "/students" \
    '{
      "firstName": "John",
      "lastName": "Doe",
      "email": "invalid-email",
      "groupId": "550e8400-e29b-41d4-a716-446655440001"
    }' \
    "422"

  # Missing required fields
  run_test "Validation - Missing Required Fields" "POST" "/students" \
    '{
      "firstName": "John"
    }' \
    "422"

  # Invalid UUID
  run_test "Validation - Invalid UUID" "GET" "/students/not-a-uuid" "" "400"

  # Weak password
  run_test "Validation - Weak Password" "POST" "/auth/register" \
    '{
      "email": "test@example.com",
      "password": "weak"
    }' \
    "422"
}

# Rate Limiting Test
test_rate_limit() {
  echo -e "${YELLOW}========== RATE LIMITING TESTS ==========${NC}\n"

  echo -e "${YELLOW}Testing: General API Rate Limit (30/min)${NC}"
  echo "Sending 31 requests..."
  
  passed_count=0
  failed_count=0

  for i in {1..31}; do
    status=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
      "$API_BASE/students")
    
    if [ $i -le 30 ] && [ "$status" = "200" ]; then
      passed_count=$((passed_count + 1))
    elif [ $i -eq 31 ] && [ "$status" = "429" ]; then
      passed_count=$((passed_count + 1))
    else
      failed_count=$((failed_count + 1))
    fi
    
    echo -ne "\rRequest $i/31: $status       "
    sleep 0.01
  done
  
  echo ""
  if [ $failed_count -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Rate limiting working correctly)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAILED${NC} (Some requests had unexpected status)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo ""
}

# CORS Test
test_cors() {
  echo -e "${YELLOW}========== CORS TESTS ==========${NC}\n"

  echo -e "${YELLOW}Testing: CORS Preflight${NC}"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  response=$(curl -s -i -X OPTIONS "$API_BASE/students" \
    -H "Origin: http://localhost:3001" \
    -H "Access-Control-Request-Method: GET")
  
  if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓ PASSED${NC} (CORS headers present)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAILED${NC} (CORS headers missing)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
}

# Security Headers Test
test_security_headers() {
  echo -e "${YELLOW}========== SECURITY HEADERS TESTS ==========${NC}\n"

  echo -e "${YELLOW}Testing: Security Headers Present${NC}"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  response=$(curl -s -i -H "Authorization: Bearer $TOKEN" "$API_BASE/students")
  
  headers_ok=true
  
  echo "Checking headers:"
  
  if echo "$response" | grep -q "X-Frame-Options"; then
    echo -e "${GREEN}✓${NC} X-Frame-Options"
  else
    echo -e "${RED}✗${NC} X-Frame-Options"
    headers_ok=false
  fi
  
  if echo "$response" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✓${NC} X-Content-Type-Options"
  else
    echo -e "${RED}✗${NC} X-Content-Type-Options"
    headers_ok=false
  fi
  
  if echo "$response" | grep -q "Strict-Transport-Security"; then
    echo -e "${GREEN}✓${NC} Strict-Transport-Security"
  else
    echo -e "${RED}✗${NC} Strict-Transport-Security"
    headers_ok=false
  fi
  
  if echo "$response" | grep -q "Content-Security-Policy"; then
    echo -e "${GREEN}✓${NC} Content-Security-Policy"
  else
    echo -e "${RED}✗${NC} Content-Security-Policy"
    headers_ok=false
  fi
  
  if [ "$headers_ok" = true ]; then
    echo -e "\n${GREEN}✓ PASSED${NC} (All security headers present)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "\n${RED}✗ FAILED${NC} (Some headers missing)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
}

# HTTP Status Codes Test
test_status_codes() {
  echo -e "${YELLOW}========== HTTP STATUS CODE TESTS ==========${NC}\n"

  # 200 OK
  run_test "Status 200 - GET Success" "GET" "/students" "" "200"
  
  # 404 Not Found
  run_test "Status 404 - Not Found" "GET" "/students/00000000-0000-0000-0000-000000000000" "" "404"
  
  # 409 Conflict (if student exists)
  run_test "Status 409 - Duplicate" "POST" "/students" \
    '{
      "firstName": "Duplicate",
      "lastName": "Student",
      "email": "duplicate@example.com",
      "studentId": "DUP001",
      "groupId": "550e8400-e29b-41d4-a716-446655440001"
    }' \
    "409"
}

# Response Format Test
test_response_format() {
  echo -e "${YELLOW}========== RESPONSE FORMAT TESTS ==========${NC}\n"

  echo -e "${YELLOW}Testing: Response Format Structure${NC}"
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  response=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/students")
  
  if echo "$response" | jq -e '.success and .data and .pagination and .timestamp' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC} (Response format correct)"
    echo "Response fields present: success, data, pagination, timestamp"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAILED${NC} (Response format incorrect)"
    echo "Response: $(echo $response | jq .)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
}

# Authenticate first
authenticate() {
  echo -e "${YELLOW}Authenticating...${NC}"
  
  # This assumes you have a test user in your system
  # Modify credentials as needed
  response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@example.com",
      "password": "AdminPassword123"
    }')
  
  TOKEN=$(echo "$response" | jq -r '.data.token' 2>/dev/null)
  
  if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}Authentication failed!${NC}"
    echo "Try creating a test user first or adjusting credentials in the script"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Authenticated (Token: ${TOKEN:0:20}...)${NC}\n"
}

# Print summary
print_summary() {
  echo -e "${YELLOW}========== TEST SUMMARY ==========${NC}"
  echo "Total Tests:  $TOTAL_TESTS"
  echo -e "Passed:      ${GREEN}$PASSED_TESTS${NC}"
  echo -e "Failed:      ${RED}$FAILED_TESTS${NC}"
  
  if [ $TOTAL_TESTS -gt 0 ]; then
    pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "Pass Rate:   $pass_rate%"
  fi
  echo ""
}

# Main execution
main() {
  local action=${1:-all}

  # Check if server is running
  if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}Error: Server not running on http://localhost:3000${NC}"
    echo "Start the server with: npm run dev"
    exit 1
  fi

  # Authenticate
  authenticate

  # Run tests based on action
  case $action in
    auth)
      test_auth
      ;;
    pagination)
      test_pagination
      ;;
    validation)
      test_validation
      ;;
    rate-limit)
      test_rate_limit
      ;;
    cors)
      test_cors
      ;;
    headers)
      test_security_headers
      ;;
    status)
      test_status_codes
      ;;
    response)
      test_response_format
      ;;
    all)
      test_auth
      test_pagination
      test_validation
      test_rate_limit
      test_cors
      test_security_headers
      test_status_codes
      test_response_format
      ;;
    *)
      echo "Unknown action: $action"
      echo "Available actions: auth, pagination, validation, rate-limit, cors, headers, status, response, all"
      exit 1
      ;;
  esac

  # Print summary
  print_summary
}

# Run main
main "$@"
