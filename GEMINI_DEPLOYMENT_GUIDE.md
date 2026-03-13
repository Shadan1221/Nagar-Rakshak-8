# Gemini API Integration - Deployment Guide

## ✅ What's Been Updated

Your Supabase Edge Function has been successfully configured to use **Gemini API** instead of NVIDIA. The function now uses:
- **Gemini 1.5 Flash** model (fast and cost-effective with your Pro subscription)
- Your API key from `.env`: `AIzaSyDaTx9tcFHxAd9oVDHfwjOEn1htOPhggYw`

## 📋 Deployment Steps

### 1. Install Supabase CLI (if not already installed)

```powershell
npm install -g supabase
```

### 2. Login to Supabase

```powershell
supabase login
```

### 3. Link Your Project

```powershell
cd "d:\Nagar Rakshak\nagar_rakshak_7-main (withlogin)\nagar_rakshak_7-main (withlogin)"
supabase link --project-ref aqzmlchcrpzmlfeqetzx
```

### 4. Set the Gemini API Key as a Secret

```powershell
supabase secrets set GEMINI_API_KEY=AIzaSyDaTx9tcFHxAd9oVDHfwjOEn1htOPhggYw
```

### 5. Deploy the Edge Function

```powershell
supabase functions deploy analyze-complaint-image
```

## 🧪 Test the Function

After deployment, test it with:

```powershell
curl -i --location --request POST 'https://aqzmlchcrpzmlfeqetzx.supabase.co/functions/v1/analyze-complaint-image' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "imageData": "base64_encoded_image_here",
    "issueType": "Road Maintenance"
  }'
```

## 📦 Files Updated

1. **`supabase/functions/analyze-complaint-image/index.ts`** - Complete rewrite to use Gemini API
2. **`supabase/functions/analyze-complaint-image/deno.json`** - Added Gemini SDK import
3. **`supabase/functions/analyze-complaint-image/.env`** - Already has your API key

## 🎯 Benefits of Gemini

- ✅ Faster image analysis
- ✅ Better accuracy with vision tasks
- ✅ Native JSON output support
- ✅ Your Pro subscription provides higher rate limits
- ✅ Multi-language support

## 🔍 Monitoring

View function logs:
```powershell
supabase functions logs analyze-complaint-image
```

## 💡 Model Options

Currently using **gemini-1.5-flash** for speed and cost-efficiency. 

If you want more accuracy, you can change to **gemini-1.5-pro** by updating line 89 in `index.ts`:
```typescript
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
```

## 🌐 Function URL

Your function is deployed at:
```
https://aqzmlchcrpzmlfeqetzx.supabase.co/functions/v1/analyze-complaint-image
```

## ⚠️ Troubleshooting

If you get authentication errors:
1. Make sure you've set the secret: `supabase secrets set GEMINI_API_KEY=...`
2. Verify your Gemini API key is active at: https://makersuite.google.com/app/apikey
3. Check function logs for detailed errors

## 🚀 Next Steps

After deployment:
1. Test with a real image upload in your app
2. Monitor the function logs for any errors
3. Adjust the model temperature or prompt if needed for better results
