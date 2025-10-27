# Admin Management Feature Guide

## Overview
Admins can now manage other admins and user premium status through the Admin Panel.

## Key Features

### 1. Grant Admin Access
- **Action**: Make any user an admin
- **Effect**: User gets both `is_admin = true` AND `is_premium = true`
- **Button**: "Make Admin" (visible for non-admin users)
- **Confirmation**: Shows popup before granting access

### 2. Remove Admin Access
- **Action**: Revoke admin privileges from a user
- **Effect**: User loses admin status but **keeps premium status**
- **Button**: "Remove Admin" (visible for admin users, except current user)
- **Protection**: Cannot remove your own admin access
- **Confirmation**: Shows popup before revoking access

### 3. Toggle Premium Status
- **Action**: Grant or revoke premium access for non-admin users
- **Effect**: Toggles `is_premium` between true and false
- **Button**: "Make Premium" or "Remove Premium"
- **Protection**: Cannot remove premium from admin users
- **Confirmation**: Shows popup before changing status

## Admin Panel - Users Tab

### Table Columns:
- **Name**: User's full name
- **Email**: User's email address
- **Status**: Badges showing Admin/Premium/Free status
- **Bookmarks**: Count of bookmarked questions
- **Joined**: User registration date
- **Actions**: Management buttons

### Status Badges:
- 🟢 **Admin** (Black badge): Full admin privileges
- 🟡 **Premium** (Yellow badge): Premium access
- ⚪ **Free** (Outline badge): Free user

## Business Rules

1. **All admins are premium users**: When granting admin access, premium is automatically enabled
2. **Premium preserved on admin removal**: When revoking admin status, user keeps premium access
3. **Self-protection**: Admins cannot revoke their own admin access
4. **Admin-premium link**: Cannot remove premium status from admin users

## API Endpoints

### Grant Admin Access
```
POST /api/admin/users/{user_id}/grant-admin
Authorization: Required (Admin only)
Response: {"success": true, "message": "Admin access granted to {email}"}
```

### Revoke Admin Access
```
POST /api/admin/users/{user_id}/revoke-admin
Authorization: Required (Admin only)
Restriction: Cannot revoke own access
Response: {"success": true, "message": "Admin access revoked from {email}"}
```

### Toggle Premium Status
```
POST /api/admin/users/{user_id}/toggle-premium
Authorization: Required (Admin only)
Restriction: Cannot remove premium from admins
Response: {"success": true, "message": "Premium access {granted|revoked} for {email}"}
```

### Get All Users
```
GET /api/admin/users
Authorization: Required (Admin only)
Response: Array of user objects with all fields
```

## Testing Results

All endpoints have been thoroughly tested and verified:
- ✅ Grant admin access: Working correctly
- ✅ Revoke admin access: Working correctly
- ✅ Toggle premium status: Working correctly
- ✅ Self-revocation prevention: Working correctly
- ✅ Admin-premium protection: Working correctly
- ✅ Error handling: All edge cases covered

## Usage Instructions

1. **Sign in as admin** using the "Sign in" button
2. **Navigate to Admin Panel** (link appears in navbar for admins)
3. **Click on "Users" tab** to see all users
4. **Use action buttons** to manage admin/premium status
5. **Confirm actions** when prompted

## Security

- All endpoints require admin authentication
- Session-based authentication with secure cookies
- Authorization checks on every request
- Protected against self-revocation
- Prevents breaking admin-premium relationship

## Notes

- Changes take effect immediately
- User list refreshes automatically after actions
- Success/error messages displayed via toast notifications
- All actions are logged in the backend
