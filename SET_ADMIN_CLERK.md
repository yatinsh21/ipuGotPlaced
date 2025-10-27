# URGENT: Set Admin in Clerk Dashboard

## YOUR CLERK USER ID
```
user_34eyz4j7bYxYsFsg68Hh54Lftxl
```

## STEP-BY-STEP INSTRUCTIONS

### Step 1: Go to Clerk Dashboard
Open this link: https://dashboard.clerk.com

### Step 2: Sign in
Sign in with your Clerk account

### Step 3: Find Your User
1. Click **"Users"** in the left sidebar
2. You should see your user: sharmayatin0882@gmail.com
3. **Click on your user**

### Step 4: Edit Public Metadata
1. Scroll down to the **"Metadata"** section
2. You'll see three metadata types:
   - Public Metadata
   - Private Metadata  
   - Unsafe Metadata
3. Click the **"Edit"** button next to **"Public Metadata"**

### Step 5: Add This Exact JSON
**COPY THIS EXACTLY:**
```json
{
  "isAdmin": true,
  "isPremium": true
}
```

**IMPORTANT:**
- Use double quotes ("), not single quotes (')
- Use lowercase "true" not "True"
- No trailing commas
- Exact spelling: isAdmin and isPremium (case sensitive!)

### Step 6: Save
Click the **"Save"** button (usually blue button)

### Step 7: Refresh Your App
1. Go back to your app: https://clerk-auth-igp.preview.emergentagent.com
2. Press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac) for hard refresh
3. The admin button should appear!

---

## VERIFICATION

After setting the metadata, open browser console (F12) and run:
```javascript
console.log('Admin?', window.Clerk.user?.publicMetadata?.isAdmin)
```

Should return: `Admin? true`

If it returns `false` or `undefined`, the metadata wasn't saved correctly.

---

## ALTERNATIVE: Use Clerk CLI (If Dashboard Doesn't Work)

If you have Clerk CLI installed:
```bash
clerk users update user_34eyz4j7bYxYsFsg68Hh54Lftxl \
  --public-metadata='{"isAdmin":true,"isPremium":true}'
```

---

## WHY THIS IS NEEDED

The **frontend checks** `user.publicMetadata.isAdmin` directly from Clerk.
The database value doesn't matter - Clerk is the source of truth.

**Flow:**
1. Clerk stores metadata
2. Frontend reads from Clerk
3. Backend syncs TO database FROM Clerk
4. Frontend shows admin button based on Clerk metadata

---

## TROUBLESHOOTING

**If it still shows "Access Denied" after setting metadata:**

1. **Sign out and sign in again** - This refreshes the Clerk session
2. **Clear browser cache**
3. **Check metadata was actually saved:**
   - Go back to Clerk Dashboard
   - Open your user
   - Verify Public Metadata shows the JSON

4. **Check console:**
```javascript
// Should show your full metadata
console.log(window.Clerk.user.publicMetadata)
```

---

## CONTACT ME IF STUCK

If after following ALL these steps it still doesn't work:
1. Take a screenshot of your Clerk user's Public Metadata section
2. Take a screenshot of browser console showing the metadata
3. Share them and I'll debug further
