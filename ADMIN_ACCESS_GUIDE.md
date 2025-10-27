# Admin Panel Access Guide

## 🔐 How to Access Admin Panel

### Step 1: Sign In with Google
1. Go to your application: https://clerk-auth-igp.preview.emergentagent.com
2. Click the **"Sign in with Google"** button in the top-right navbar
3. Choose your Google account: **sharmayatin0882@gmail.com**
4. Complete the Google OAuth authorization

### Step 2: Access Admin Panel
After successful login, you have **two ways** to access the admin panel:

#### Option A: Direct URL
Navigate directly to: https://clerk-auth-igp.preview.emergentagent.com/admin

#### Option B: Via Navbar
1. Look for the **"Admin"** button in the navbar (top-right area)
2. Click on it to navigate to the admin panel

---

## 🔍 Troubleshooting

### Issue 1: "Admin" Button Not Showing
**Cause:** User not marked as admin in database

**Solution:**
Your email `sharmayatin0882@gmail.com` is whitelisted in the backend `.env` file:
```bash
ADMIN_EMAILS="sharmayatin0882@gmail.com"
```

When you sign in for the first time, the backend automatically sets `is_admin: true` for whitelisted emails.

**Manual Fix (if needed):**
If the admin button still doesn't appear, manually update your user in MongoDB:

```bash
# Connect to MongoDB and run:
db.users.updateOne(
  { email: "sharmayatin0882@gmail.com" },
  { $set: { is_admin: true, is_premium: true } }
)
```

### Issue 2: "Unauthorized" or "Admin access required"
**Cause:** Session expired or not logged in

**Solution:**
1. Sign out completely
2. Clear browser cookies
3. Sign in again with Google
4. Try accessing /admin again

### Issue 3: 404 or Page Not Found
**Cause:** Frontend routing issue

**Solution:**
The route is protected in `App.js`:
```javascript
<Route 
  path="/admin" 
  element={
    user?.is_admin ? <AdminPanel /> : <Navigate to="/" />
  } 
/>
```

Make sure you're signed in and have admin privileges.

---

## 📍 Admin Panel Features

Once you access the admin panel, you'll see these tabs:

### 1. **Dashboard**
- Total users count
- Premium users count
- Total questions
- Total companies
- Total experiences

### 2. **Topics Management**
- Create new topics
- Edit existing topics
- Delete topics
- View all topics with question counts

### 3. **Questions Management** (Topic-based)
- Add questions to topics
- Edit questions
- Delete questions
- Filter by topic and difficulty
- Tags: "just-read", "v.imp", "fav"

### 4. **Companies Management**
- Add new companies
- Upload company logos (Cloudinary)
- Edit company details
- Delete companies
- View question counts per company

### 5. **Company Questions Management**
- Add questions for specific companies
- Categories: "project", "HR", "technical", "coding"
- Difficulty levels: "easy", "medium", "hard"
- Edit and delete company questions

### 6. **Interview Experiences**
- Add interview experiences
- Round-wise experience input
- Status tags: "selected", "not selected", "pending"
- Edit and delete experiences

### 7. **Users Management**
- View all registered users
- Grant admin access to users
- Revoke admin access
- Toggle premium status
- View user details (email, join date, status)

---

## 🔑 Quick Access Checklist

✅ **Before accessing admin panel:**
- [ ] Signed in with Google account
- [ ] Using whitelisted email: `sharmayatin0882@gmail.com`
- [ ] Backend is running (check: https://ipugotplaced-1.onrender.com/api/health)
- [ ] Frontend is loaded (check: https://clerk-auth-igp.preview.emergentagent.com)
- [ ] No console errors in browser DevTools

✅ **To verify admin access:**
1. Open browser DevTools (F12)
2. Go to Application → Cookies
3. Check if `session_token` cookie exists
4. Go to Console tab
5. Type: `window.location.href = '/admin'`
6. You should be able to access the admin panel

---

## 🚨 Common Mistakes

❌ **Using wrong email** - Only `sharmayatin0882@gmail.com` is whitelisted
❌ **Not signed in** - Must complete Google OAuth first
❌ **Session expired** - Sign out and sign in again
❌ **Backend not running** - Check Render deployment status
❌ **CORS issues** - Backend must allow frontend origin

---

## 📞 Need Help?

If you still can't access the admin panel:

1. **Check backend logs** on Render dashboard
2. **Check browser console** for JavaScript errors
3. **Verify database** - Check if your user has `is_admin: true`
4. **Test API directly**: 
   ```bash
   # Check if you're authenticated
   curl https://ipugotplaced-1.onrender.com/api/auth/me \
     -H "Cookie: session_token=YOUR_SESSION_TOKEN"
   ```

---

## 🎯 Direct Links

- **Frontend**: https://clerk-auth-igp.preview.emergentagent.com
- **Admin Panel**: https://clerk-auth-igp.preview.emergentagent.com/admin
- **Backend API**: https://ipugotplaced-1.onrender.com/api
- **Health Check**: https://ipugotplaced-1.onrender.com/api/health
