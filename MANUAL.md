# Spoke Calculator - User Manual
## Scenic Routes Community Bicycle Center

---

## Getting Started

### Logging In
1. Go to spokecalc.i.scenicroutes.fm
2. Enter your email and password
3. If you don't have an account, click "Create an account" to register

### Navigation
The main navigation bar includes:
- **Calculator** - Calculate spoke lengths for a wheel build
- **Rims** - Manage the rim database
- **Hubs** - Manage the hub database
- **Builds** - View past wheel builds
- **Users** (admin only) - Manage user accounts

---

## Calculating Spoke Lengths

### Step 1: Select a Rim
1. Use the search box to find your rim by manufacturer or model name
2. Click on the rim to select it
3. The rim's specifications will appear below (ERD, ISO size, drilling offset, inner width)

#### Adjusting ERD
If you've measured the rim and the ERD differs from the database:
1. Click "adjust" next to the ERD value
2. Enter your measured ERD
3. Click "Save" to create a new rim variant
4. The new rim will be named like "Model Name (587 - Your Name, Jan 2026)"
5. This preserves the original rim data while using your measurement

### Step 2: Select a Hub
1. Use the search box to find your hub
2. Click on the hub to select it
3. The spoke count will auto-fill if the hub has a specified hole count

### Step 3: Set Build Parameters
- **Spoke Count** - Number of spokes (16, 20, 24, 28, 32, 36, 40, 48)
- **Cross Pattern (Left/NDS)** - Lacing pattern for non-drive side (Radial, 1x, 2x, 3x, 4x)
- **Cross Pattern (Right/DS)** - Lacing pattern for drive side

### Step 4: Calculate
Click "Calculate Spoke Lengths" to see results.

### Understanding the Results

#### Spoke Lengths
- **Left / Non-Drive Side** - Spoke length in mm (rounded to nearest 0.5mm)
- **Right / Drive Side** - Spoke length in mm (rounded to nearest 0.5mm)
- Exact lengths shown below for reference

#### Build Analysis
- **Tension Distribution** - Percentage of total tension on each side (ideally close to 50/50)
- **Bracing Angle** - Angle from hub flange to rim (larger = stronger wheel)
- **Wrap Angle** - How much the spoke wraps around the hub flange
- **Total Angle at Rim** - Combined angle where spoke meets rim
- **Theta Angle** - Spoke angle in the tangential plane

### Step 5: Save & Print
1. Optionally enter a customer name and notes
2. Click "Save Build & Print"
3. You'll be taken to the printable build sheet

---

## Build Sheet

The build sheet is a printable document containing:
- Shop header with logo
- Customer name (if provided)
- Large, prominent spoke lengths
- Full build analysis table
- Rim and hub specifications with measurements
- Notes sections

### Editing Notes
- **Notes** - Customer-facing notes (break-in instructions, etc.)
- **Internal Notes** - Shop notes (not typically shown to customer)
- Changes appear with a "Save Notes" button - click to save

### Printing
Click "Print Build Sheet" to open the browser print dialog.

### Deleting a Build
Click "Delete Build" in the top right to remove a build from history.

---

## Managing Rims

### Viewing Rims
The Rims page shows all rims in the database with:
- Manufacturer and model
- ERD (Effective Rim Diameter)
- ISO size
- Who measured it and when

### Adding a Rim
1. Click "+ Add Rim" or fill in the form at the top
2. Required fields:
   - **Manufacturer** - Brand name
   - **Model** - Model name
   - **ERD** - Effective Rim Diameter in mm
3. Optional fields:
   - **ISO Size** - Bead seat diameter (559, 622, etc.)
   - **Drilling Offset** - Offset from center (usually 0)
   - **Inner Width** - Internal rim width
   - **Outer Width** - External rim width

### Reference vs Measured Data
- **Reference data** - From manufacturer specs or online databases
- **Measured data** - Actually measured at the shop (shows who measured it)

---

## Managing Hubs

### Viewing Hubs
The Hubs page shows all hubs with their flange measurements.

### Adding a Hub
Required measurements:
- **Manufacturer** - Brand name
- **Model** - Model name
- **Center to Left Flange** - Distance from hub center to left flange
- **Center to Right Flange** - Distance from hub center to right flange
- **Left Flange PCD** - Pitch circle diameter of left flange spoke holes
- **Right Flange PCD** - Pitch circle diameter of right flange spoke holes

Optional:
- **Position** - Front, Rear, or Universal
- **Spoke Hole Diameter** - Usually 2.6mm
- **Spoke Count** - Number of holes (will auto-fill in calculator)

---

## Build History

The Builds page shows all saved wheel builds with:
- Rim and hub used
- Calculated spoke lengths
- Customer name (if provided)
- Who created the build and when

### Actions
- **View / Print** - Open the build sheet
- **Delete** - Remove from history

---

## User Management (Admin Only)

Admins can access the Users page to:

### View All Users
See all registered users with their status and role.

### Toggle User Status
- Click "Active" / "Disabled" to enable/disable accounts
- Disabled users cannot log in

### Toggle Admin Role
- Click "Admin" / "User" to grant or revoke admin privileges
- You cannot remove your own admin status

### Reset Passwords
1. Click "Reset Password" next to any user
2. Enter a new password
3. Click "Reset Password" to save
4. Tell the user their new temporary password

### Delete Users
Click "Delete" to permanently remove a user account.

---

## Tips

### For Accurate Spoke Lengths
- Always verify ERD by measuring the rim yourself when possible
- Use the "adjust" feature to create measured variants of reference rims
- Double-check hub measurements, especially flange offset (center to flange)

### Common ERD Measurement Method
1. Install two spokes 180° apart with nipples threaded on
2. Pull spokes tight against rim
3. Measure spoke-to-spoke distance at the hub
4. Add this to hub diameter to get ERD

### Spoke Length Rounding
- Lengths are rounded to nearest 0.5mm
- Exact lengths shown for reference
- When in doubt, go 1mm shorter rather than longer

---

## Troubleshooting

### Can't Log In
- Check email and password
- Contact an admin to reset your password
- Make sure your account is active

### Calculation Seems Wrong
- Verify rim ERD is correct
- Check hub flange measurements (center to flange, not total width)
- Confirm PCD is the spoke hole circle diameter, not flange outer diameter

### Page Not Loading
- Try refreshing the browser
- Clear browser cache
- Check internet connection

---

## Support

For technical issues with the calculator, contact the shop admin.

For wheel building questions, consult experienced builders at Scenic Routes.
