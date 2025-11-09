# 🚀 NPC Therapy Deployment Guide

## The Problem
Your NPC Therapy game is on GitHub, but just having the code doesn't make it accessible via web browser. GitHub only **stores** code - it doesn't **run** Node.js applications.

## 🎯 Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest & Fastest)

**Steps:**
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository: `https://github.com/12Matt3r/Nice`
4. Deploy! Vercel will automatically detect it's a Node.js app
5. **Done!** You'll get a live URL like `https://npc-therapy-xxxxx.vercel.app`

**Why Vercel?**
- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ Custom domain support
- ✅ Global CDN
- ✅ Zero configuration needed

### Option 2: Netlify

**Steps:**
1. Go to [netlify.com](https://netlify.com) and sign up
2. Click "New site from Git"
3. Connect to GitHub and select your repository
4. Build command: `npm start`
5. Publish directory: `/` (root)
6. Deploy

**Note:** May need additional configuration for Node.js apps

### Option 3: Railway

**Steps:**
1. Go to [railway.app](https://railway.app) and sign up
2. Create new project
3. Deploy from GitHub repo
4. Railway will auto-detect Node.js and deploy

### Option 4: Local Testing First

Before deploying, test locally:

```bash
# Clone your repository
git clone https://github.com/12Matt3r/Nice.git
cd Nice

# Install dependencies
npm install

# Start the game
npm start

# Open browser to http://localhost:3000
```

## 🛠️ What I Added for Deployment

### Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "builds": [{"src": "server.js", "use": "@vercel/node"}],
  "routes": [{"src": "/(.*)", "dest": "/server.js"}],
  "env": {"PORT": "3000"}
}
```

### Production Server (`server-production.js`)
- Health check endpoint: `/health`
- Better logging and error handling
- Environment-specific configuration

## 📱 Accessing Your Game

Once deployed, your game will be accessible at:
- **Vercel:** `https://your-project-name.vercel.app`
- **Netlify:** `https://random-name.netlify.app`
- **Railway:** `https://your-project.railway.app`
- **Local:** `http://localhost:3000`

## 🔧 Troubleshooting

### If deployment fails:
1. **Check Node.js version:** Make sure it's 14+ in `package.json`
2. **Verify dependencies:** Ensure all required packages are listed
3. **Check build logs:** Most platforms show detailed error logs
4. **Test locally first:** Run `npm start` locally to verify everything works

### If game doesn't load:
1. **Check console errors:** Press F12 in browser, look for errors
2. **Verify file paths:** Make sure all image/audio file paths are correct
3. **Check CORS:** Ensure server allows cross-origin requests

## 🎮 Testing the Deployment

Once your game is live:
1. **Load the main menu** - Should see patient roster
2. **Start a therapy session** - Click any NPC
3. **Test audio** - Check if sound effects work
4. **Try save/load** - Verify game progress saves
5. **Check mobile** - Test on different devices

## 🔄 Continuous Deployment

**Automatic Updates:**
- Vercel automatically deploys when you push to GitHub
- Simply update your code and push to see changes live
- Perfect for ongoing development and improvements

## 📞 Support

If you encounter issues:
1. **Vercel:** Check their docs and community forum
2. **Netlify:** Visit their support center
3. **Local issues:** Check the browser console for JavaScript errors
4. **GitHub issues:** Report problems in your repository

## 🎉 Next Steps

After successful deployment:
1. **Share your game** with friends and colleagues
2. **Gather feedback** from users
3. **Continue development** with new features
4. **Set up analytics** to track usage
5. **Consider custom domain** for professional branding

---

**Remember:** The repository has been updated with deployment configurations. Simply push any changes and they'll be automatically deployed!