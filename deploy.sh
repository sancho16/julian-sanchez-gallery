#!/bin/bash

echo "🚀 Video Gallery Deployment Script"
echo "=================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo ""
fi

# Add all files
echo "📝 Adding files to Git..."
git add .
echo ""

# Commit
echo "💾 Creating commit..."
read -p "Enter commit message (default: 'Deploy video gallery'): " commit_msg
commit_msg=${commit_msg:-"Deploy video gallery"}
git commit -m "$commit_msg"
echo ""

# Check if remote exists
if ! git remote | grep -q origin; then
    echo "🔗 Setting up GitHub remote..."
    read -p "Enter your GitHub repository URL: " repo_url
    git remote add origin "$repo_url"
    echo ""
fi

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git branch -M main
git push -u origin main
echo ""

echo "✅ Code pushed to GitHub!"
echo ""
echo "📱 Next steps:"
echo "1. Go to https://vercel.com"
echo "2. Sign in with GitHub"
echo "3. Click 'Add New Project'"
echo "4. Import your repository"
echo "5. Deploy!"
echo ""
echo "⚠️  Note: For production use, consider deploying the backend separately"
echo "   to a service like Railway or Render for persistent video storage."
