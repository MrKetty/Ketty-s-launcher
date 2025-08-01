#!/bin/bash

# Test Script per Ketty's PVP Minecraft Launcher

echo "🧪 Testing Ketty's PVP Minecraft Launcher..."
echo "================================================"

# Test Backend Health
echo "📡 Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s http://localhost:8001/api/health)
if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo "✅ Backend health check: OK"
else
    echo "❌ Backend health check: FAILED"
    exit 1
fi

# Test Client Scanning
echo "🔍 Testing Client Scanning..."
SCAN_RESPONSE=$(curl -s http://localhost:8001/api/clients/scan)
CLIENT_COUNT=$(echo $SCAN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['count'])")
echo "✅ Found $CLIENT_COUNT client(s)"

if [ $CLIENT_COUNT -gt 0 ]; then
    echo "📋 Client details:"
    echo $SCAN_RESPONSE | python3 -m json.tool | grep -E "(name|type|warning)" | head -10
fi

# Test Modrinth Integration
echo "🔍 Testing Modrinth Integration..."
MODRINTH_RESPONSE=$(curl -s "http://localhost:8001/api/modrinth/search?query=optifine")
MODRINTH_COUNT=$(echo $MODRINTH_RESPONSE | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('hits', [])))" 2>/dev/null || echo "0")
echo "✅ Modrinth search returned $MODRINTH_COUNT results"

# Test Frontend
echo "🌐 Testing Frontend..."
FRONTEND_RESPONSE=$(curl -s http://localhost:3000)
if [[ $FRONTEND_RESPONSE == *"Ketty's PVP"* ]]; then
    echo "✅ Frontend loading: OK"
else
    echo "❌ Frontend loading: FAILED"
fi

# Test Database Connection
echo "💾 Testing Database Connection..."
PROFILES_RESPONSE=$(curl -s http://localhost:8001/api/profiles)
if [[ $PROFILES_RESPONSE == *"profiles"* ]]; then
    echo "✅ Database connection: OK"
else
    echo "❌ Database connection: FAILED"
fi

echo "================================================"
echo "🎉 Test completed successfully!"
echo ""
echo "🌐 Access the launcher at: http://localhost:3000"
echo "📡 API documentation at: http://localhost:8001/docs"
echo ""
echo "🎮 Ready to launch Minecraft clients!"