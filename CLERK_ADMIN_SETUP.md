# Clerk Admin & Payment Setup Guide

## 🔐 Setting Up Admin Access

### Step 1: Sign in to Your Application
1. Go to https://igp-placement-app.preview.emergentagent.com
2. Click "Sign in" button in the top-right corner
3. Choose "Continue with Google"
4. Complete the Google OAuth sign-in process

### Step 2: Get Your Clerk User ID
After signing in, you need your Clerk User ID to grant yourself admin access.

**Option A: From Clerk Dashboard**
1. Go to https://dashboard.clerk.com
2. Select your project: "direct-turtle-7"
3. Navigate to **Users** in the left sidebar
4. Find your email in the user list
5. Click on your user
6. Copy the **User ID** (starts with `user_...`)

**Option B: From Browser Console**
1. While signed in to your app, open browser console (F12)
2. Type: `window.Clerk.user.id`
3. Copy the User ID

### Step 3: Set Admin Metadata in Clerk Dashboard
1. In Clerk Dashboard → Users → Your User
2. Scroll down to **Metadata** section
3. Click **Edit** next to "Public Metadata"
4. Add this JSON:
```json
{
  "isAdmin": true,
  "isPremium": true
}
```
5. Click **Save**

### Step 4: Access Admin Panel
1. Refresh your application page
2. Click on your profile picture (User Button) in the navbar
3. You should now see admin-related options
4. Navigate to: https://igp-placement-app.preview.emergentagent.com/admin
5. Or you should see "Admin" button in the navbar

---

## 💳 Testing Payment Flow

### Prerequisites
- You must be signed in (not need to be admin for this)
- Have Razorpay test/live keys configured

### Payment Test Steps

1. **Navigate to Goldmine Page**
   - Click "Goldmine" in navigation
   - You'll see companies with lock icons

2. **Click "Unlock All for ₹1" Button**
   - This opens the payment comparison modal
   - Click "Upgrade to Premium for ₹1"

3. **Complete Razorpay Payment**
   - Razorpay checkout modal will open
   - For **TEST MODE**, use these test card details:
     - Card Number: `4111 1111 1111 1111`
     - CVV: `123`
     - Expiry: Any future date
     - Name: Any name
   
4. **Verify Premium Access**
   - After successful payment, page will reload
   - Lock icons should disappear from companies
   - You should be able to view all company questions
   - Bookmark feature should be enabled

### Alternative: Manual Premium Grant (For Testing)
If you want to test premium features without payment:

1. Go to Clerk Dashboard → Your User → Metadata
2. Update Public Metadata:
```json
{
  "isPremium": true
}
```
3. Refresh the app - you'll have premium access

---

## 🧪 Verification Checklist

### After Setting Admin Access:
- [ ] Can access `/admin` route
- [ ] See "Admin" button in navbar
- [ ] Admin Panel shows all management tabs
- [ ] Can perform CRUD operations on topics, questions, companies, experiences
- [ ] Can manage users (grant/revoke admin and premium)

### After Premium Access:
- [ ] No lock icons on Goldmine companies
- [ ] Can view all company questions (not just first 3)
- [ ] Can bookmark questions
- [ ] Can access `/bookmarks` page
- [ ] Premium badge shows in user menu

---

## 🐛 Troubleshooting

### Admin Panel Not Accessible
1. Check if `isAdmin: true` is set in Clerk Public Metadata
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for any errors
4. Verify you're signed in with the correct account

### Payment Not Working
1. Check Razorpay keys are configured in `backend/.env`
2. Verify backend is running: `sudo supervisorctl status backend`
3. Check browser console for payment errors
4. Ensure you're using test card credentials if in test mode

### Changes Not Reflecting
1. Clear browser cache and hard refresh
2. Check if metadata was saved in Clerk Dashboard
3. Try signing out and signing back in
4. Verify Clerk Secret Key is correct in backend `.env`

---

## 📍 Quick Links

- **Application**: https://igp-placement-app.preview.emergentagent.com
- **Admin Panel**: https://igp-placement-app.preview.emergentagent.com/admin
- **Clerk Dashboard**: https://dashboard.clerk.com
- **Razorpay Dashboard**: https://dashboard.razorpay.com

---

## 🔑 Current Configuration

**Clerk Keys:**
- Publishable Key: `pk_test_ZGlyZWN0LXR1cnRsZS03LmNsZXJrLmFjY291bnRzLmRldiQ`
- Secret Key: ✅ Configured in backend

**Razorpay Keys:**
- Key ID: `rzp_live_RVGaTvsyo82E4p`
- Secret: ✅ Configured in backend

**Admin Email (Whitelisted):**
- `sharmayatin0882@gmail.com`
