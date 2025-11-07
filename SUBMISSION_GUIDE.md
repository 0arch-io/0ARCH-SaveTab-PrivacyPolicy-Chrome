# Chrome Web Store Submission Guide - SaveTab

Complete step-by-step guide to submit SaveTab to the Chrome Web Store.

---

## Prerequisites Checklist

Before you begin, make sure you have:

- [x] Chrome Web Store Developer account ($5 one-time fee)
- [ ] Privacy policy hosted on public URL (see HOSTING_GUIDE.md)
- [x] All required permission justifications (see CHROME_STORE_JUSTIFICATIONS.md)
- [ ] 5 screenshots taken (1280x800 resolution)
- [ ] Promotional tile created (440x280 - optional but recommended)
- [x] Extension tested and working

---

## Step 1: Host Your Privacy Policy

**Time Required**: 10 minutes

Follow the instructions in `HOSTING_GUIDE.md` to host PRIVACY.md on GitHub Pages or another public URL.

**Your Privacy Policy URL**: ___________________________________

---

## Step 2: Take Screenshots

**Time Required**: 20 minutes

Take 5 high-quality screenshots at **exactly 1280x800 resolution**:

### Screenshot 1: Collections Tab
- Open SaveTab side panel
- Save 3-4 different collections with different names
- Use custom colors on some collections
- Make sure collections have realistic names (e.g., "Research Project", "Shopping", "Work Docs")
- Screenshot should show the Collections tab with saved collections

### Screenshot 2: Workspaces Tab
- Switch to Workspaces tab
- Create 2-3 workspaces (e.g., "Work", "Personal", "Research")
- Add some collections to workspaces
- Screenshot should show workspace cards with collections

### Screenshot 3: AI Smart Grouping (if possible)
- Open several tabs with different topics
- Click "AI Smart Group" button
- Screenshot the result showing organized tab groups
- **Alternative**: If no API key, screenshot the Workspaces interface instead

### Screenshot 4: Customize Tab
- Switch to Customize tab
- Show the color pickers and customization options
- Screenshot the theme customization interface

### Screenshot 5: Settings Tab
- Switch to Settings tab
- Show the settings including tab suspender, API key section, etc.
- Screenshot the settings interface

**How to take screenshots at correct resolution:**
1. Set Chrome window to exactly 1280x800 (use a window resizer extension or manually)
2. Open SaveTab side panel
3. Use macOS: Cmd+Shift+4, then press Space, click window
4. Or use macOS: Cmd+Shift+5 for screenshot tool

**Save screenshots as:**
- `screenshot-1-collections.png`
- `screenshot-2-workspaces.png`
- `screenshot-3-ai-grouping.png`
- `screenshot-4-customize.png`
- `screenshot-5-settings.png`

---

## Step 3: Package Your Extension

**Time Required**: 2 minutes

### Create a clean distribution folder

```bash
cd /Users/josephrodriguez/Desktop/savetab-extension

# Create a temporary distribution folder
mkdir -p ../savetab-dist

# Copy only necessary files (exclude source/development files)
cp manifest.json ../savetab-dist/
cp *.html ../savetab-dist/
cp *.js ../savetab-dist/
cp *.css ../savetab-dist/
cp -r icons ../savetab-dist/

# DO NOT include:
# - *.md files (README, PRIVACY, etc.)
# - *.svg files (only PNG icons needed)
# - .git folder
# - CHROME_STORE_JUSTIFICATIONS.md
# - Development files

# Create ZIP file
cd ../savetab-dist
zip -r ../savetab-extension.zip .
cd ..

# The file savetab-extension.zip is ready for upload
```

**Alternatively**, Chrome Web Store can accept an unpacked folder. Just make sure to exclude development files.

---

## Step 4: Chrome Web Store Developer Dashboard

**Time Required**: 30 minutes

### 4.1 Create Developer Account (if needed)

1. Go to https://chrome.google.com/webstore/devconsole
2. Pay $5 one-time registration fee
3. Accept developer agreement

### 4.2 Create New Item

1. Click "New Item" button
2. Upload `savetab-extension.zip`
3. Wait for upload and processing

---

## Step 5: Fill Out Store Listing Tab

### Product Details

**Name**: SaveTab

**Summary** (132 characters max):
```
Save and restore tab collections with one click. Organize workspaces, suspend tabs, and use AI-powered smart grouping.
```

**Description**:
Copy from `STORE_DESCRIPTION.md` - "Detailed Description" section

**Category**: Productivity

**Language**: English (United States)

### Graphic Assets

**Icon**:
- Upload: `icons/icon-128.png`

**Screenshots** (upload all 5):
- screenshot-1-collections.png
- screenshot-2-workspaces.png
- screenshot-3-ai-grouping.png
- screenshot-4-customize.png
- screenshot-5-settings.png

**Promotional Tile** (optional but recommended):
- 440x280 PNG image
- Shows SaveTab logo and key features

**Marquee Promo Tile** (optional):
- 1400x560 PNG image
- Only needed if you want featured placement

### Additional Fields

**Official URL**: Your GitHub repository
```
https://github.com/yourusername/savetab-extension
```

**Homepage URL**: Same as official URL or your website

**Support URL**: GitHub issues page
```
https://github.com/yourusername/savetab-extension/issues
```

---

## Step 6: Privacy Practices Tab ⚠️ REQUIRED

This is what Chrome Web Store is complaining about. Fill this out carefully.

### Single Purpose

Paste from `CHROME_STORE_JUSTIFICATIONS.md`:
```
SaveTab is a tab management and organization extension that helps users
save, restore, and organize their browser tabs into collections and
workspaces. The extension provides features including tab collection
management, workspace organization, automatic tab suspension to save
memory, and optional AI-powered tab grouping.
```

### Permission Justifications

For **EACH** of these permissions, click "Add justification" and paste the corresponding text from `CHROME_STORE_JUSTIFICATIONS.md`:

1. **tabs** - Paste tabs justification
2. **storage** - Paste storage justification
3. **tabGroups** - Paste tabGroups justification
4. **alarms** - Paste alarms justification
5. **sidePanel** - Paste sidePanel justification

### Remote Code

**Question**: "Are you using remote code?"

**Answer**: No

**Justification** (if requested):
```
SaveTab does NOT use remote code. All JavaScript code is included in
the extension package and reviewed by Chrome Web Store. The only
external API calls are optional Google Gemini API calls (when user
explicitly enables AI features and provides their own API key). These
API calls only send tab URLs and titles for AI-powered grouping. No
remote code is downloaded or executed.
```

### Data Usage

**Question**: "Does this extension collect or transmit user data?"

**Answer**: Choose one:
- **No** - If you want to emphasize privacy
- **Yes** - If you want to disclose optional AI feature (more transparent)

**If "Yes", specify:**
- Data type: Browsing history
- Usage: Only when user explicitly uses AI Smart Group feature
- Purpose: To provide AI-powered tab organization
- Disclosure: Described in privacy policy
- Data handling: Sent to Google Gemini API, not stored by extension

### Privacy Policy

**Privacy Policy URL**: Your hosted privacy policy URL
```
https://yourusername.github.io/savetab-extension/PRIVACY
```

### Certification

Check all boxes:
- [x] I certify that my extension complies with Chrome Web Store policies
- [x] I certify that the information provided is accurate
- [x] I have read and agree to the Developer Program Policies

**Click "Save Draft"** after completing this tab!

---

## Step 7: Distribution Tab

### Visibility

**Select**: Public

**Regions**: All regions (or select specific countries)

### Pricing

**Select**: Free

---

## Step 8: Final Review

Before submitting, verify:

- [ ] All required fields filled in Store Listing tab
- [ ] All 5 permission justifications added in Privacy Practices tab
- [ ] Single purpose description added
- [ ] Remote code declaration completed
- [ ] Privacy policy URL added and working
- [ ] All certifications checked
- [ ] Screenshots uploaded (5 images)
- [ ] Icon uploaded (128x128 PNG)
- [ ] Description is clear and accurate
- [ ] All URLs tested and working

---

## Step 9: Submit for Review

1. **Click "Submit for Review"** button
2. Review the summary
3. **Confirm submission**
4. Wait for email confirmation

### What Happens Next

**Review Timeline**:
- Typically 1-3 business days
- Can take up to 2 weeks during busy periods
- You'll receive email updates

**Possible Outcomes**:

1. **Approved** ✅
   - Extension goes live immediately
   - You can publish to all users

2. **Rejected** ❌
   - You'll receive specific reasons
   - Fix the issues
   - Resubmit

3. **Needs Information** ℹ️
   - Reviewers may ask questions
   - Respond promptly
   - Provide requested information

---

## Step 10: After Approval

### When Approved:

1. **Publish the extension**
   - Click "Publish" button in dashboard
   - Extension will be live within minutes

2. **Share your extension**
   - URL will be: `https://chrome.google.com/webstore/detail/[extension-id]`
   - Get a short URL: `https://chromewebstore.google.com/detail/[your-extension-name]`

3. **Monitor reviews**
   - Respond to user reviews
   - Fix bugs reported by users
   - Plan updates

4. **Promote your extension**
   - Share on social media
   - Post on Reddit (r/chrome, r/productivity)
   - Create a Product Hunt launch
   - Write a blog post

---

## Common Rejection Reasons & How to Fix

### "Permission justifications unclear"
**Fix**: Make justifications more specific about WHY each permission is needed for core functionality

### "Privacy policy not accessible"
**Fix**: Ensure privacy policy URL is public and doesn't require login

### "Single purpose not clear"
**Fix**: Emphasize that ALL features support tab management/organization

### "Screenshots unclear"
**Fix**: Retake screenshots with realistic data and clear demonstration of features

### "Misleading description"
**Fix**: Make sure description accurately reflects what extension does

---

## Helpful Resources

- Chrome Web Store Developer Policies: https://developer.chrome.com/docs/webstore/program-policies/
- Publishing Guide: https://developer.chrome.com/docs/webstore/publish/
- Review Process: https://developer.chrome.com/docs/webstore/review-process/
- Best Practices: https://developer.chrome.com/docs/webstore/best_practices/

---

## Quick Reference

**Developer Dashboard**: https://chrome.google.com/webstore/devconsole
**Cost**: $5 one-time registration
**Review Time**: 1-3 days typically
**Required**: Privacy policy on public URL
**Required**: Justification for all 5 permissions
**Required**: Single purpose description
**Required**: 5 screenshots at 1280x800
**Recommended**: 440x280 promotional tile

---

## Emergency Contact

If you encounter issues during submission:

1. Check Chrome Web Store Developer Support
2. Visit: https://support.google.com/chrome_webstore/
3. Post in Chrome Extension Developer Community
4. Check your email for specific rejection reasons

---

## Congratulations!

You're ready to submit SaveTab to the Chrome Web Store!

Follow this guide step by step, and you'll have your extension published soon.

Good luck! 🚀
