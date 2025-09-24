# How to Access Organization Management Features

## 🎯 **Where to Find These Features**

### 1. **Organization Admin Management** 
**For users with `org_admin` role:**

1. Go to **Settings** page (click your profile in top right, then "Settings")
2. Look for the **"My Organization"** tab (it will only appear if you're an org admin)
3. Click on the tab to access:
   - Complete organization overview (members, join token, stats)
   - Member management and user list
   - Email whitelist management
   - Invite users functionality

### 2. **Join Organization** 
**For regular users (org members or users without organization):**

1. Go to **Settings** page 
2. Look for the **"Join Organization"** tab (appears for non-admin users)
3. Enter your email and the organization's join token
4. Click "Join Organization" to become a member

## 🔧 **How It Works**

### Organization Admin Features:
- **View Organization Details**: See all info about your organization
- **Manage Members**: View all users in your organization
- **Invite Users**: Add emails to whitelist so users can join
- **Join Token Management**: Copy or regenerate the organization join token
- **Whitelist Control**: Manage which emails are allowed to join

### Join Organization Process:
1. User gets join token from organization admin
2. User goes to Settings > Join Organization tab
3. Enters their email and the join token
4. System validates and adds user to organization
5. User gets organization member access

## 🚦 **Role-Based Access**

| Role | Can See | Features Available |
|------|---------|-------------------|
| **Super Admin** | Tenant Management tab | Full tenant and organization management |
| **Tenant Admin** | Organization Management tab | Create/manage organizations in their tenant |
| **Org Admin** | My Organization tab | Manage their specific organization |
| **Regular User** | Join Organization tab | Join organizations with tokens |

## 🔍 **Troubleshooting**

### "I can't see the tabs"
- Make sure you're logged in with the correct role
- Organization admins need to have an `organization_id` in their profile
- Regular users won't see admin tabs (this is intentional)

### "Invalid time value" error
- This has been fixed with proper date validation
- Dates now show "N/A" if invalid instead of crashing

### "Join organization not working"
- Make sure your email is in the organization's whitelist
- Verify the join token is correct and not expired
- Contact the organization admin to add your email to whitelist

## 📍 **Navigation Path**
```
Dashboard → Profile Menu (top right) → Settings → [Role-specific tab]
```

The features are fully integrated into the existing settings page and will show different tabs based on your user role and permissions.
