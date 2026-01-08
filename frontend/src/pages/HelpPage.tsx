export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto prose prose-scenic dark:prose-invert">
      <h1>Spoke Calculator - User Manual</h1>

      <hr />

      <h2>Getting Started</h2>

      <h3>Logging In</h3>
      <ol>
        <li>Go to spokecalc.i.scenicroutes.fm</li>
        <li>Enter your email and password</li>
        <li>If you don't have an account, click "Create an account" to register</li>
      </ol>

      <h3>Navigation</h3>
      <p>The main navigation bar includes:</p>
      <ul>
        <li><strong>Calculator</strong> - Calculate spoke lengths for a wheel build</li>
        <li><strong>Rims</strong> - Manage the rim database</li>
        <li><strong>Hubs</strong> - Manage the hub database</li>
        <li><strong>Builds</strong> - View past wheel builds</li>
        <li><strong>Users</strong> (admin only) - Manage user accounts</li>
      </ul>

      <hr />

      <h2>Calculating Spoke Lengths</h2>

      <h3>Step 1: Select a Rim</h3>
      <ol>
        <li>Use the search box to find your rim by manufacturer or model name</li>
        <li>Click on the rim to select it</li>
        <li>The rim's specifications will appear below (ERD, ISO size, drilling offset, inner width)</li>
      </ol>

      <h4>Adjusting ERD</h4>
      <p>If you've measured the rim and the ERD differs from the database:</p>
      <ol>
        <li>Click "adjust" next to the ERD value</li>
        <li>Enter your measured ERD</li>
        <li>Click "Save" to create a new rim variant</li>
        <li>The new rim will be named like "Model Name (587 - Your Name, Jan 2026)"</li>
        <li>This preserves the original rim data while using your measurement</li>
      </ol>

      <h3>Step 2: Select a Hub</h3>
      <ol>
        <li>Use the search box to find your hub</li>
        <li>Click on the hub to select it</li>
        <li>The spoke count will auto-fill if the hub has a specified hole count</li>
      </ol>

      <h3>Step 3: Set Build Parameters</h3>
      <ul>
        <li><strong>Spoke Count</strong> - Number of spokes (16, 20, 24, 28, 32, 36, 40, 48)</li>
        <li><strong>Cross Pattern (Left/NDS)</strong> - Lacing pattern for non-drive side (Radial, 1x, 2x, 3x, 4x)</li>
        <li><strong>Cross Pattern (Right/DS)</strong> - Lacing pattern for drive side</li>
      </ul>

      <h3>Step 4: Calculate</h3>
      <p>Click "Calculate Spoke Lengths" to see results.</p>

      <h3>Understanding the Results</h3>

      <h4>Spoke Lengths</h4>
      <ul>
        <li><strong>Left / Non-Drive Side</strong> - Spoke length in mm (rounded to nearest 0.5mm)</li>
        <li><strong>Right / Drive Side</strong> - Spoke length in mm (rounded to nearest 0.5mm)</li>
        <li>Exact lengths shown below for reference</li>
      </ul>

      <h4>Build Analysis</h4>
      <ul>
        <li><strong>Tension Distribution</strong> - Percentage of total tension on each side (ideally close to 50/50)</li>
        <li><strong>Bracing Angle</strong> - Angle from hub flange to rim (larger = stronger wheel)</li>
        <li><strong>Wrap Angle</strong> - How much the spoke wraps around the hub flange</li>
        <li><strong>Total Angle at Rim</strong> - Combined angle where spoke meets rim</li>
        <li><strong>Theta Angle</strong> - Spoke angle in the tangential plane</li>
      </ul>

      <h3>Step 5: Save & Print</h3>
      <ol>
        <li>Optionally enter a customer name and notes</li>
        <li>Click "Save Build & Print"</li>
        <li>You'll be taken to the printable build sheet</li>
      </ol>

      <hr />

      <h2>Build Sheet</h2>

      <p>The build sheet is a printable document containing:</p>
      <ul>
        <li>Shop header with logo</li>
        <li>Customer name (if provided)</li>
        <li>Large, prominent spoke lengths</li>
        <li>Full build analysis table</li>
        <li>Rim and hub specifications with measurements</li>
        <li>Notes sections</li>
      </ul>

      <h3>Editing Notes</h3>
      <ul>
        <li><strong>Notes</strong> - Customer-facing notes (break-in instructions, etc.)</li>
        <li><strong>Internal Notes</strong> - Shop notes (not typically shown to customer)</li>
        <li>Changes appear with a "Save Notes" button - click to save</li>
      </ul>

      <h3>Printing</h3>
      <p>Click "Print Build Sheet" to open the browser print dialog.</p>

      <h3>Deleting a Build</h3>
      <p>Click "Delete Build" in the top right to remove a build from history.</p>

      <hr />

      <h2>Managing Rims</h2>

      <h3>Viewing Rims</h3>
      <p>The Rims page shows all rims in the database with:</p>
      <ul>
        <li>Manufacturer and model</li>
        <li>ERD (Effective Rim Diameter)</li>
        <li>ISO size</li>
        <li>Who measured it and when</li>
      </ul>

      <h3>Adding a Rim</h3>
      <ol>
        <li>Click "+ Add Rim" or fill in the form at the top</li>
        <li>Required fields:
          <ul>
            <li><strong>Manufacturer</strong> - Brand name</li>
            <li><strong>Model</strong> - Model name</li>
            <li><strong>ERD</strong> - Effective Rim Diameter in mm</li>
          </ul>
        </li>
        <li>Optional fields:
          <ul>
            <li><strong>ISO Size</strong> - Bead seat diameter (559, 622, etc.)</li>
            <li><strong>Drilling Offset</strong> - Offset from center (usually 0)</li>
            <li><strong>Inner Width</strong> - Internal rim width</li>
            <li><strong>Outer Width</strong> - External rim width</li>
          </ul>
        </li>
      </ol>

      <h3>Reference vs Measured Data</h3>
      <ul>
        <li><strong>Reference data</strong> - From manufacturer specs or online databases</li>
        <li><strong>Measured data</strong> - Actually measured at the shop (shows who measured it)</li>
      </ul>

      <hr />

      <h2>Managing Hubs</h2>

      <h3>Viewing Hubs</h3>
      <p>The Hubs page shows all hubs with their flange measurements.</p>

      <h3>Adding a Hub</h3>
      <p>Required measurements:</p>
      <ul>
        <li><strong>Manufacturer</strong> - Brand name</li>
        <li><strong>Model</strong> - Model name</li>
        <li><strong>Center to Left Flange</strong> - Distance from hub center to left flange</li>
        <li><strong>Center to Right Flange</strong> - Distance from hub center to right flange</li>
        <li><strong>Left Flange PCD</strong> - Pitch circle diameter of left flange spoke holes</li>
        <li><strong>Right Flange PCD</strong> - Pitch circle diameter of right flange spoke holes</li>
      </ul>

      <p>Optional:</p>
      <ul>
        <li><strong>Position</strong> - Front, Rear, or Universal</li>
        <li><strong>Spoke Hole Diameter</strong> - Usually 2.6mm</li>
        <li><strong>Spoke Count</strong> - Number of holes (will auto-fill in calculator)</li>
      </ul>

      <hr />

      <h2>Build History</h2>

      <p>The Builds page shows all saved wheel builds with:</p>
      <ul>
        <li>Rim and hub used</li>
        <li>Calculated spoke lengths</li>
        <li>Customer name (if provided)</li>
        <li>Who created the build and when</li>
      </ul>

      <h3>Actions</h3>
      <ul>
        <li><strong>View / Print</strong> - Open the build sheet</li>
        <li><strong>Delete</strong> - Remove from history</li>
      </ul>

      <hr />

      <h2>User Management (Admin Only)</h2>

      <p>Admins can access the Users page to:</p>

      <h3>View All Users</h3>
      <p>See all registered users with their status and role.</p>

      <h3>Toggle User Status</h3>
      <ul>
        <li>Click "Active" / "Disabled" to enable/disable accounts</li>
        <li>Disabled users cannot log in</li>
      </ul>

      <h3>Toggle Admin Role</h3>
      <ul>
        <li>Click "Admin" / "User" to grant or revoke admin privileges</li>
        <li>You cannot remove your own admin status</li>
      </ul>

      <h3>Reset Passwords</h3>
      <ol>
        <li>Click "Reset Password" next to any user</li>
        <li>Enter a new password</li>
        <li>Click "Reset Password" to save</li>
        <li>Tell the user their new temporary password</li>
      </ol>

      <h3>Delete Users</h3>
      <p>Click "Delete" to permanently remove a user account.</p>

      <hr />

      <h2>Tips</h2>

      <h3>For Accurate Spoke Lengths</h3>
      <ul>
        <li>Always verify ERD by measuring the rim yourself when possible</li>
        <li>Use the "adjust" feature to create measured variants of reference rims</li>
        <li>Double-check hub measurements, especially flange offset (center to flange)</li>
      </ul>

      <h3>Common ERD Measurement Method</h3>
      <ol>
        <li>Install two spokes 180° apart with nipples threaded on</li>
        <li>Pull spokes tight against rim</li>
        <li>Measure spoke-to-spoke distance at the hub</li>
        <li>Add this to hub diameter to get ERD</li>
      </ol>

      <h3>Spoke Length Rounding</h3>
      <ul>
        <li>Lengths are rounded to nearest 0.5mm</li>
        <li>Exact lengths shown for reference</li>
        <li>When in doubt, go 1mm shorter rather than longer</li>
      </ul>

      <hr />

      <h2>Troubleshooting</h2>

      <h3>Can't Log In</h3>
      <ul>
        <li>Check email and password</li>
        <li>Contact an admin to reset your password</li>
        <li>Make sure your account is active</li>
      </ul>

      <h3>Calculation Seems Wrong</h3>
      <ul>
        <li>Verify rim ERD is correct</li>
        <li>Check hub flange measurements (center to flange, not total width)</li>
        <li>Confirm PCD is the spoke hole circle diameter, not flange outer diameter</li>
      </ul>

      <h3>Page Not Loading</h3>
      <ul>
        <li>Try refreshing the browser</li>
        <li>Clear browser cache</li>
        <li>Check internet connection</li>
      </ul>

      <hr />

      <h2>Support</h2>

      <p>For technical issues with the calculator, contact the shop admin.</p>

      <p>For wheel building questions, consult experienced builders at Scenic Routes.</p>
    </div>
  )
}
