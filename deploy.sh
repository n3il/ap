#!/bin/bash

# Alpha Arena - Quick Deployment Script
# This script helps deploy Edge Functions to Supabase

set -e

echo "🚀 Alpha Arena Deployment Script"
echo "================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✓ Supabase CLI found"
echo ""

# Check if project is linked
if [ ! -f "./supabase/config.toml" ]; then
    echo "⚠️  Project not linked to Supabase"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "✓ Project linked to Supabase"
echo ""

# Deploy Edge Functions
echo "📦 Deploying Edge Functions..."
echo ""

echo "Deploying create_agent..."
supabase functions deploy create_agent --no-verify-jwt

echo "Deploying run_agent_assessment..."
supabase functions deploy run_agent_assessment --no-verify-jwt

echo "Deploying execute_hyperliquid_trade..."
supabase functions deploy execute_hyperliquid_trade --no-verify-jwt

echo "Deploying agent_scheduler..."
supabase functions deploy agent_scheduler --no-verify-jwt

echo ""
echo "✅ All Edge Functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Set environment variables:"
echo "   supabase secrets set GOOGLE_GEMINI_API_KEY=your_key"
echo "   supabase secrets set HYPERLIQUID_API_URL=https://api.hyperliquid.xyz"
echo ""
echo "2. Run database migrations (if not done yet):"
echo "   supabase db push"
echo ""
echo "3. Set up the cron job in Supabase Dashboard"
echo ""
echo "4. Test the system with:"
echo "   curl -X POST YOUR_SUPABASE_URL/functions/v1/agent_scheduler"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
