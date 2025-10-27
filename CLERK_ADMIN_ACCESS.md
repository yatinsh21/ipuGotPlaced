# How to Access Admin Panel with Clerk

## 🎯 Quick Solution

You need to set admin metadata in Clerk Dashboard for your user account.

---

## 📋 Step-by-Step Guide

### Step 1: Sign In to Your App
1. Go to https://igp-placement-app.preview.emergentagent.com
2. Click **"Sign in"** button
3. Sign in with Google (or create account if first time)
4. Complete the sign-in process

### Step 2: Get Your Clerk User ID
After signing in, open browser console (F12) and run:
```javascript
window.Clerk.user.id
```
Copy the User ID (looks like: `user_2abc123xyz...`)

### Step 3: Set Admin Metadata in Clerk Dashboard

#### Go to Clerk Dashboard:
1. Visit https://dashboard.clerk.com
2. Select your project: **"direct-turtle-7"**
3. Click **"Users"** in the left sidebar
4. Find your user account in the list
5. Click on your user

#### Add Admin Metadata:
1. Scroll down to the **"Metadata"** section
2. Click **"Edit"** next to **"Public Metadata"**
3. Add this JSON:
```json
{
  "isAdmin": true,
  "isPremium": true
}
```
4. Click **"Save"**

### Step 4: Refresh Your App
1. Go back to your app
2. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
3. You should now see the **"Admin"** button in the navbar!

---

## 🔍 Verification

After setting the metadata, verify it worked:

1. **Check Console:**
```javascript
console.log(window.Clerk.user.publicMetadata)
// Should show: { isAdmin: true, isPremium: true }
```

2. **Check Navbar:**
- You should see an "Admin" button (Shield icon) next to your user profile

3. **Access Admin Panel:**
- Click the "Admin" button, OR
- Go directly to: https://igp-placement-app.preview.emergentagent.com/admin

---

## 🎥 Visual Guide

### Where to find Public Metadata in Clerk:

```
Clerk Dashboard
  └─ Users
      └─ [Your User]
          └─ Metadata Section
              └─ Public Metadata [Edit] 👈 Click here
                  └─ Add JSON: {"isAdmin": true, "isPremium": true}
```

---

## 🚨 Troubleshooting

### Admin button still not showing?

**1. Clear cache and refresh:**
```bash
# In browser:
- Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- Clear "Cached images and files"
- Clear "Cookies and site data"
- Close and reopen browser
```

**2. Sign out and sign in again:**
- Click your profile picture
- Click "Sign out"
- Sign in again
- The metadata should now be loaded

**3. Check if metadata was saved:**
- Go back to Clerk Dashboard
- Open your user profile
- Verify the Public Metadata shows:
```json
{
  "isAdmin": true,
  "isPremium": true
}
```

**4. Check browser console for errors:**
```javascript
// Run in console:
console.log('Signed in?', window.Clerk.user ? 'Yes' : 'No')
console.log('User ID:', window.Clerk.user?.id)
console.log('Is Admin?:', window.Clerk.user?.publicMetadata?.isAdmin)
```

---

## 📱 Admin Button Location

### Desktop:
The Admin button appears in the navbar between the Bookmark button and your profile:
```
[Bookmarks] [Admin 🛡️] [User Profile Picture]
```

### Mobile:
Open the hamburger menu (☰), scroll down, and you'll see:
```
Questions
Goldmine  
Experiences
────────────
[Admin Panel 🛡️]  👈 Here
[Sign Out]
```

---

## ✅ What You'll See in Admin Panel

Once you access the admin panel, you'll have access to:

1. **Dashboard** - User and content statistics
2. **Topics** - Manage interview topics
3. **Questions** - Add/edit topic questions
4. **Companies** - Manage companies with logos
5. **Company Questions** - Company-specific questions
6. **Experiences** - Interview experiences management
7. **Users** - User management (grant/revoke admin)

---

## 🔑 Key Points

- ✅ **Clerk handles all authentication** - No Google OAuth setup needed
- ✅ **Metadata determines access** - Admin status is controlled by `publicMetadata.isAdmin`
- ✅ **You control access** - Update metadata in Clerk Dashboard anytime
- ✅ **Instant changes** - After saving metadata, just refresh the page

---

## 📞 Still Having Issues?

If you still can't see the admin button after following all steps:

1. **Verify your Clerk keys in `.env`:**
   ```
   REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_ZGlyZWN0LXR1cnRsZS03LmNsZXJrLmFjY291bnRzLmRldiQ
   ```

2. **Check if services are running:**
   - Frontend: https://igp-placement-app.preview.emergentagent.com
   - Backend: https://ipugotplaced-1.onrender.com/api/health

3. **Test the admin route directly:**
   - Go to: https://igp-placement-app.preview.emergentagent.com/admin
   - If you get redirected to `/`, it means metadata isn't set correctly

4. **Share screenshot** of your Clerk user's Public Metadata section

---

## 🎯 Quick Commands

```javascript
// Check if you're signed in
console.log(window.Clerk.user ? 'Signed in ✅' : 'Not signed in ❌')

// Check your admin status
console.log('Admin:', window.Clerk.user?.publicMetadata?.isAdmin ? '✅' : '❌')

// Check your premium status
console.log('Premium:', window.Clerk.user?.publicMetadata?.isPremium ? '✅' : '❌')

// Get your User ID (needed for Clerk Dashboard)
console.log('User ID:', window.Clerk.user?.id)
```

---

That's it! Follow these steps and you'll have admin access in no time! 🚀
