# Deployment Guide for Meeting Summarizer

## Backend Deployment

### 1. Environment Variables Required

Create a `.env` file in your backend root with these variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/meeting-summarizer

# Groq API Key
GROQ_API_KEY=your_groq_api_key_here

# Email Configuration (for nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration (for production)
FRONTEND_URL=https://your-frontend-domain.com
```

### 2. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Create a database user
5. Get your connection string
6. Replace `username`, `password`, and `cluster` in the MONGODB_URI

### 3. Deploy Backend to Render

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Go to [Render](https://render.com)**
   - Sign up with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the service:**
   - **Name**: `meeting-summarizer-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Add Environment Variables:**
   - Copy all variables from your `.env` file
   - Add them in the Render dashboard

5. **Deploy!**

### 4. Alternative: Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables
6. Deploy automatically

## Frontend Deployment

### 1. Prepare Frontend for Production

Make sure your frontend has:
- Environment variables for API endpoints
- Proper CORS configuration
- Build scripts

### 2. Deploy to Vercel (Recommended)

1. **Go to [Vercel](https://vercel.com)**
   - Sign up with GitHub
   - Click "New Project"
   - Import your frontend repository

2. **Configure:**
   - Framework Preset: Select your framework (React, Vue, etc.)
   - Root Directory: Leave as is (or specify if different)
   - Build Command: Usually `npm run build`
   - Output Directory: Usually `dist` or `build`

3. **Add Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   # or
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```

4. **Deploy!**

### 3. Alternative: Deploy to Netlify

1. Go to [Netlify](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Select your repository
5. Configure build settings
6. Deploy

## Post-Deployment Steps

### 1. Update CORS in Backend

After getting your frontend URL, update the CORS configuration in `server.js`:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 2. Test All Endpoints

Test these endpoints after deployment:
- `POST /api/summarize` - Text summarization
- `POST /api/upload` - File upload and summarization
- `PUT /api/summarize/:id` - Edit summaries
- `POST /api/email` - Send emails

### 3. Monitor Logs

- Check Render/Railway logs for errors
- Monitor MongoDB Atlas for database issues
- Test email functionality

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure frontend URL is correct in CORS config
2. **MongoDB Connection**: Check connection string and network access
3. **File Uploads**: Ensure uploads directory exists and has permissions
4. **Environment Variables**: Double-check all variables are set correctly

### Performance Tips:

1. **Enable MongoDB Atlas caching**
2. **Use CDN for file uploads** (consider AWS S3 for production)
3. **Implement rate limiting** for production use
4. **Add health check endpoints**

## Cost Estimation

### Free Tier Limits:
- **Render**: 750 hours/month free
- **Railway**: $5/month free credit
- **Vercel**: 100GB bandwidth/month free
- **MongoDB Atlas**: 512MB storage free

### Production Scaling:
- Consider paid plans for higher traffic
- Implement caching strategies
- Use CDN for file storage
- Monitor usage and costs

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Rotate keys regularly
3. **CORS**: Restrict to specific domains
4. **File Uploads**: Validate file types and sizes
5. **Rate Limiting**: Implement for production
6. **HTTPS**: Always use HTTPS in production 