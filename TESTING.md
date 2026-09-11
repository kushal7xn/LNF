# Manual Testing Guide

This guide walks through testing all features of the Lost & Found website.

## Prerequisites

1. Start the application:
   ```bash
   npm run dev
   ```

2. Open browser to http://localhost:3000

3. Have these test accounts ready:
   - **Admin**: admin@lostandfound.com / admin123
   - **Test User**: test@example.com / test123

## Test Scenarios

### 1. User Registration & Authentication

#### Test 1.1: Register New User
1. Go to `/register`
2. Fill form with unique email and username
3. Use password with 6+ characters
4. **Expected**: Success → Redirected to home page, logged in

#### Test 1.2: Login with Valid Credentials
1. Go to `/login`
2. Use test@example.com / test123
3. **Expected**: Success → Redirected to home page, see user menu

#### Test 1.3: Invalid Login
1. Go to `/login`
2. Use wrong password
3. **Expected**: Error message displayed

### 2. Post Found Item (Requires Login)

#### Test 2.1: Post Valid Item
1. Login as regular user
2. Go to `/post`
3. Fill all required fields:
   - Category: "iPhone"
   - Color: "Black" 
   - Location: "Central Park Bench"
   - Date: Recent date
   - Secret Detail: "Has cracked screen on bottom left corner"
   - Optional: Upload image
4. Click "Post Found Item"
5. **Expected**: Success message → Redirected to "My Items"

#### Test 2.2: Validation Errors
1. Try posting with missing required fields
2. **Expected**: Form validation errors shown

### 3. Admin Moderation

#### Test 3.1: Admin Dashboard Access
1. Login as admin (admin@lostandfound.com / admin123)
2. Go to `/admin` 
3. **Expected**: Dashboard with statistics and tabs visible

#### Test 3.2: Approve Item
1. As admin, go to "Pending Items" tab
2. Find the item posted in Test 2.1
3. **Verify**: Secret detail is visible to admin
4. Click "✅ Approve"
5. **Expected**: Item disappears from pending list

#### Test 3.3: Reject Item
1. Post another item as regular user
2. As admin, click "❌ Reject" 
3. Enter reason: "Insufficient details"
4. **Expected**: Item marked as rejected with reason

### 4. Public Search (No Login Required)

#### Test 4.1: Search Approved Items
1. Logout or use incognito window
2. Go to home page `/`
3. **Verify**: Only approved items visible
4. **Verify**: Secret details NOT shown anywhere
5. Try filtering by category/location
6. **Expected**: Search works, no secret info exposed

### 5. Claim Process

#### Test 5.1: Valid Claim
1. As regular user (not admin, not finder)
2. Go to item details of approved item
3. Click item from search results  
4. Enter correct secret detail answer
5. Click "Submit Claim"
6. **Expected**: "Claim submitted for admin verification" message

#### Test 5.2: Attempt Limit
1. Submit 5 incorrect answers for same item
2. Try submitting 6th attempt
3. **Expected**: "Maximum attempts reached" error

### 6. Admin Claim Verification

#### Test 6.1: Verify Correct Claim
1. Login as admin
2. Go to "Pending Claims" tab
3. See side-by-side comparison:
   - Claimant answer vs. Finder's secret detail
4. If they match, click "✅ CORRECT - Approve Claim"
5. **Expected**: Claim approved, item status updated

#### Test 6.2: Verify Incorrect Claim  
1. For incorrect answer, click "❌ INCORRECT - Reject Claim"
2. **Expected**: Claimant can see remaining attempts

### 7. Handover Communication

#### Test 7.1: Message Exchange
1. After claim is verified correct:
2. Both finder and claimant can access `/handovers`
3. Click "💬 Open Chat" 
4. Send messages back and forth
5. **Expected**: Real-time messaging between parties only

#### Test 7.2: Mark as Returned
1. As the finder, go to handover chat
2. Click "✅ Mark as Returned"
3. Confirm action
4. **Expected**: Item marked as completed, removed from public search

### 8. Security Tests

#### Test 8.1: Secret Detail Protection
1. Check all public pages and API responses
2. Use browser dev tools to inspect network requests
3. **Verify**: Secret details never appear in:
   - Search results
   - Item detail pages
   - Public API responses

#### Test 8.2: Admin Route Protection
1. Logout
2. Try accessing `/admin` directly
3. **Expected**: Redirected to login

#### Test 8.3: Role-Based Access
1. Login as regular user
2. Try accessing `/admin`
3. **Expected**: Redirected to home page (access denied)

### 9. Edge Cases

#### Test 9.1: Multiple Correct Claims
1. Have admin approve multiple claims as "correct" for same item
2. **Expected**: System flags for manual resolution

#### Test 9.2: Finder Claims Own Item
1. As finder, try claiming your own posted item
2. **Expected**: Error "You cannot claim your own item"

#### Test 9.3: Message Access Control
1. Try accessing `/messages/[item_id]` for item you're not involved with
2. **Expected**: Access denied

## Expected User Flows

### Happy Path: Complete Item Recovery
1. User finds item → Posts with secret detail → Item pending
2. Admin reviews → Approves item → Item public  
3. Owner searches → Finds item → Claims with correct secret
4. Admin verifies → Approves claim → Enables messaging
5. Parties coordinate → Meet up → Finder marks returned

### Admin Workflow  
1. Review pending items → Approve/reject based on quality
2. Review claim attempts → Compare answers to secrets
3. Make binary decisions → No ambiguity allowed
4. Handle conflicts → Manual resolution for edge cases

## Performance & Usability

- **Response Time**: All pages should load < 2 seconds
- **Mobile Friendly**: Test on phone/tablet - should be responsive
- **Image Upload**: Should handle photos up to 5MB
- **Error Handling**: Clear error messages for all failure cases
- **Navigation**: Intuitive flow between all pages

## Success Criteria

✅ All secret details properly protected from public exposure
✅ Binary claim verification working correctly  
✅ Admin moderation workflow complete
✅ Secure authentication and authorization
✅ Messaging only between verified parties
✅ Attempt limiting prevents abuse
✅ Mobile responsive design
✅ Clear error messages and user feedback

## Common Issues & Troubleshooting

- **Database not initialized**: Run `node server/init-db.js`
- **Port conflicts**: Change PORT in .env file
- **Image upload fails**: Check server/uploads directory exists
- **JWT errors**: Check JWT_SECRET in .env file
- **Database locked**: Close other processes using the database