// DEBUG ADMIN BUTTON - Paste this in browser console (F12)

console.log('=== ADMIN BUTTON DEBUG ===');

// Check if Clerk is loaded
if (typeof window.Clerk === 'undefined') {
    console.error('❌ Clerk is not loaded! Check if Clerk script is running.');
} else {
    console.log('✅ Clerk is loaded');
}

// Check if user is signed in
if (!window.Clerk.user) {
    console.error('❌ You are NOT signed in!');
    console.log('👉 Click "Sign in" button and sign in with Google first');
} else {
    console.log('✅ You are signed in');
    
    // Show user info
    console.log('📧 Email:', window.Clerk.user.primaryEmailAddress?.emailAddress);
    console.log('🆔 User ID:', window.Clerk.user.id);
    console.log('👤 Name:', window.Clerk.user.fullName);
    
    // Check metadata
    console.log('\n📋 Public Metadata:', window.Clerk.user.publicMetadata);
    
    // Check admin status
    const isAdmin = window.Clerk.user.publicMetadata?.isAdmin;
    const isPremium = window.Clerk.user.publicMetadata?.isPremium;
    
    console.log('\n🛡️  isAdmin:', isAdmin || false);
    console.log('👑 isPremium:', isPremium || false);
    
    // Tell user what to do
    if (!isAdmin) {
        console.error('\n❌ PROBLEM FOUND: isAdmin is NOT set to true!');
        console.log('\n✅ SOLUTION:');
        console.log('1. Go to: https://dashboard.clerk.com');
        console.log('2. Click: Users → Find your user → Click on it');
        console.log('3. Scroll to "Metadata" section');
        console.log('4. Click "Edit" next to "Public Metadata"');
        console.log('5. Add this JSON:');
        console.log(JSON.stringify({
            isAdmin: true,
            isPremium: true
        }, null, 2));
        console.log('6. Click Save');
        console.log('7. Come back here and refresh the page (Ctrl+Shift+R)');
    } else {
        console.log('\n✅ Admin is set correctly!');
        console.log('👉 Admin button should be visible in navbar');
        console.log('👉 If not visible, try:');
        console.log('   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
        console.log('   - Clear cache and reload');
        console.log('   - Sign out and sign in again');
    }
}

console.log('\n=========================');
