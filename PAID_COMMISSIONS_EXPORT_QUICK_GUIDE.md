# Quick Guide: Export Selected Paid Commissions

## How to Use

### Step 1: Select Commissions
Navigate to **Commissions** page and scroll to the **Paid Commissions** section.

**Option A: Select Individual Commissions**
- Click the checkbox next to each commission you want to export
- Selected items will highlight with a green border

**Option B: Select All**
- Click the **"Select All"** button to select all visible commissions
- Works with search filters (only selects filtered results)

### Step 2: Export
Once you've selected commissions:
1. Click the **"Export X Selected"** button (green button)
2. File will automatically download as Excel (.xlsx)
3. Filename format: `paid_commissions_selected_YYYY-MM-DD.xlsx`

### Step 3: Manage Selection
- **Clear Selection**: Click to deselect all commissions
- **Add More**: Click additional checkboxes to add to selection
- **Remove**: Click selected checkboxes to remove from selection

## Visual Guide

```
┌────────────────────────────────────────────────────────┐
│ Paid Commissions                     [Select All (10)] │
│ Recently approved commissions  [Clear] [Export 3 ✓]   │
├────────────────────────────────────────────────────────┤
│ [Search box]                                           │
├────────────────────────────────────────────────────────┤
│ ☑ Commission #123                    ₹1,500      PAID │
│   Referrer: John → Referred: Jane                     │
│   Level 2 • 10% • Oct 29, 2025                        │
├────────────────────────────────────────────────────────┤
│ ☐ Commission #124                    ₹2,000      PAID │
│   Referrer: Mike → Referred: Sara                     │
│   Level 1 • 15% • Oct 28, 2025                        │
└────────────────────────────────────────────────────────┘
```

## Export File Contents

The Excel file includes:
- ✅ Commission ID
- ✅ Referrer & Referred User IDs and Names
- ✅ Commission Amount
- ✅ Referral Level & Percentage
- ✅ Status
- ✅ Order Number & Amount
- ✅ Created & Updated Timestamps (IST)

## Tips

💡 **Search First, Then Select**
- Use the search box to filter commissions
- Then use "Select All" to select all filtered results

💡 **Pagination**
- Selection works across pages
- You can select from page 1, go to page 2, and select more

💡 **Quick Export**
- For all commissions, use the main export button at the top
- For specific ones, use the checkbox method

💡 **Validation**
- Can't export with 0 selected (will show an alert)
- Success message shows count of exported items

## Common Use Cases

### Monthly Reports
1. Search by date range (if needed)
2. Select All
3. Export to Excel
4. Share with accounting team

### Specific User Analysis
1. Search for user ID or name
2. Select relevant commissions
3. Export for analysis

### Audit Trail
1. Select specific commissions for audit
2. Export with full details
3. Include timestamps and order info

## Keyboard Shortcuts

- `Space` or `Enter`: Toggle checkbox when focused
- `Tab`: Navigate between checkboxes
- `Shift + Click`: (Future) Range selection

## Troubleshooting

**"Please select at least one commission to export"**
- You haven't selected any commissions
- Click at least one checkbox before exporting

**Nothing downloads**
- Check browser's download settings
- Allow pop-ups for this site
- Check downloads folder

**Missing data in export**
- Some fields may show "N/A" if data is not available
- This is normal for commissions without orders

---

**Quick Access**: Commissions → Paid Commissions → Select → Export

