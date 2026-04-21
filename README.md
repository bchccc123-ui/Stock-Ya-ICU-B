# ICU MedSave Enhanced - Installation & Deployment Guide

## 📦 What's Included

This package contains enhanced versions of both ICU-A and ICU-B applications with the following new features:

### ✨ New Features
1. **Smart Timestamp Modal** - Emergency drug withdrawal with large bed buttons
2. **Pending Sync System** - Track timestamp records awaiting reconciliation
3. **Pending View Tab** - Display pending items with aging alerts (4hr/6hr warnings)
4. **Replace Modal** - One-step drug replacement to close pending records
5. **Enhanced KPIs** - Calculate 5 research metrics with usage type classification
6. **Aging Alerts** - Visual warnings for pending items
7. **Navigation Badge** - Pulsing indicator when pending items exist

### 📊 New KPI Calculations
- **Compliance Rate**: (Normal + Emergency) / Total Usage
- **Reconciliation Time**: Average time to complete pending items
- **Traceability Rate**: (Normal + Emergency + Missing_Tracked) / Total
- **Untraced Loss Rate**: Missing_Unknown / Total
- **Stock Deficiency Rate**: Items below par level

---

## 🗄️ Database Changes

### New Collection: `pending_syncs`
The system will automatically create this collection when you first use Smart Timestamp.

**Fields:**
```
- bed_id: string
- nurse: string  
- timestamp: Timestamp
- source: 'emergency' | 'missing_tracked'
- status: 'pending' | 'completed'
- created_at: Timestamp
- completed_at: Timestamp | null
- completed_by: string | null
- drug_id: number | null
- drug_name: string | null
- qty: number | null
- reconciled_withdrawal_id: string | null
```

### Updated Collection: `withdrawals`
Existing withdrawals collection now includes:

**New Fields:**
```
- usage_type: 'Normal' | 'Emergency' | 'Missing_Tracked' | 'Missing_Unknown'
- pending_sync_id: string | null
- reconciliation_time_minutes: number | null
```

---

## 🚀 Installation Steps

### For ICU-A

1. **Navigate to project folder:**
   ```bash
   cd ICU_A_Enhanced
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   - Make sure `src/firebase.js` has correct ICU-A Firebase credentials
   - Verify firebaseConfig matches your ICU-A project

4. **Run locally to test:**
   ```bash
   npm run dev
   ```
   - Open browser to `http://localhost:5173`
   - Test Smart Timestamp modal
   - Test Pending tab
   - Test Replace workflow

5. **Deploy to production:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### For ICU-B

Follow the same steps as ICU-A, but in the `ICU_B_Enhanced` folder.

**Important:** ICU-B has different bed configurations (ICU-B1 through ICU-B11, plus Code8 drugs), so make sure to test thoroughly.

---

## 🔐 Firebase Security Rules

Add these rules to your Firebase console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Existing collections (keep these)
    match /drugs/{docId} {
      allow read, write: if true;
    }
    match /lots/{docId} {
      allow read, write: if true;
    }
    match /withdrawals/{docId} {
      allow read, write: if true;
    }
    match /checks/{docId} {
      allow read, write: if true;
    }
    match /nurses/{docId} {
      allow read, write: if true;
    }
    match /stock_removals/{docId} {
      allow read, write: if true;
    }
    match /expiry_snapshots/{docId} {
      allow read, write: if true;
    }
    
    // NEW: Pending syncs collection
    match /pending_syncs/{docId} {
      allow read, write: if true;
    }
  }
}
```

### Recommended: Create Composite Index

For better performance, create this index in Firebase Console:

**Collection:** `pending_syncs`
**Fields:**
- `status` (Ascending)
- `timestamp` (Descending)

---

## 📱 User Interface Changes

### New Bottom Navigation Tab

The app now has 8 tabs (was 7):
1. Dashboard - 🏠
2. Quick Use - ⚡
3. Stock Count - 📋
4. Restock - 📦
5. **Pending - ⏱ (NEW)**
6. Remove - 🗑️
7. Export - 📊

### Smart Timestamp Workflow

**Dashboard → Smart Timestamp button**
1. Select nurse
2. Press large bed button (ICU-A1, ICU-A2, etc.)
3. System creates pending_sync record
4. Go to Pending tab later to complete

### Pending Tab Features

- Shows all pending items
- Orange warning: > 4 hours
- Red danger (blinking): > 6 hours
- Pulsing badge on nav when items pending
- One-click Replace button per item
- Delete option for mistakes

### Replace Workflow

**Pending Tab → Replace button**
1. System shows pending item details
2. Select nurse who's replacing
3. Select drug (or use scanner)
4. Enter quantity
5. System:
   - Deducts stock (FEFO)
   - Creates withdrawal record
   - Marks pending as completed
   - Calculates reconciliation time

---

## 🧪 Testing Checklist

### Before Deployment

- [ ] Smart Timestamp creates pending_sync
- [ ] Pending tab shows new items
- [ ] Aging timer works (shows hours)
- [ ] Replace deducts stock correctly (FEFO)
- [ ] Withdrawal created with usage_type='Emergency'
- [ ] Pending marked as completed
- [ ] reconciliation_time_minutes calculated
- [ ] Export KPIs calculate correctly
- [ ] Navigation badge appears/disappears

### Test Each Usage Type

1. **Normal** (existing Quick Use):
   - [ ] usage_type = 'Normal'
   - [ ] pending_sync_id = null

2. **Emergency** (Smart Timestamp → Replace):
   - [ ] usage_type = 'Emergency'
   - [ ] pending_sync_id = [pending docId]
   - [ ] reconciliation_time_minutes = [calculated]

3. **Missing_Tracked** (future feature):
   - Not yet implemented in current version
   - Reserved for Stock Count "Report Missing" feature

4. **Missing_Unknown** (future feature):
   - Not yet implemented
   - Reserved for unknown bed tracking

---

## 📊 KPI Export Format

The Export tab now includes research KPIs section. CSV export includes:

**Summary Sheet:**
- Compliance Rate (%)
- Average Reconciliation Time (minutes)
- Traceability Rate (%)
- Loss Rate (%)
- Stock Deficiency Rate (%)

**Detailed Usage Log:**
- Date/Time
- Nurse
- Drug
- Bed
- Quantity
- **Usage Type** (NEW)
- **Reconciliation Time** (NEW)

---

## 🎓 Training Guide

### For Nurses

**Using Smart Timestamp (ฉุกเฉิน):**
1. กด "⚡ Smart Timestamp" ที่หน้า Dashboard
2. เลือกชื่อพยาบาล
3. **กดปุ่มเตียงขนาดใหญ่** (เช่น ICU-A1)
4. ระบบบันทึก timestamp ทันที
5. ⚠️ ต้องเติมยาคืนภายใน 4 ชั่วโมง

**เติมยาคืน (Replace):**
1. ไปที่แท็บ "⏱ Pending"
2. จะเห็นรายการที่ค้าง
   - สีส้ม = เกิน 4 ชั่วโมง
   - สีแดง = เกิน 6 ชั่วโมง (กะพริบ)
3. กด "✓ Replace"
4. เลือกพยาบาลที่เติม
5. เลือกยาที่นำมาเติม
6. กด "✓ Replace & ปิดรายการ"
7. ✓ เสร็จสิ้น - ระบบตัดสต็อกและปิดรายการอัตโนมัติ

### For Researchers

**Accessing KPIs:**
1. Go to Export tab
2. Select month or "All Time"
3. View KPI cards:
   - Compliance Rate
   - Reconciliation Time
   - Traceability Rate
   - Loss Rate
   - Deficiency Rate
4. Click "Export CSV" for detailed data

**Understanding Usage Types:**
- **Normal**: Standard Quick Use (baseline)
- **Emergency**: From Smart Timestamp (intervention)
- **Missing_Tracked**: Drug missing but bed known (traceability)
- **Missing_Unknown**: Drug missing, bed unknown (loss)

---

## 🔧 Troubleshooting

### "pending_syncs is not defined"
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors

### Pending items not showing
- Verify Firebase listener is active
- Check Firebase console for data
- Ensure status='pending' (not 'completed')

### Replace not working
- Check if enough stock available
- Verify FEFO lots exist
- Check browser console for errors
- Ensure nurse and drug are selected

### KPIs showing 0% or NaN
- Need at least one withdrawal with usage_type
- Ensure date range has data
- Check that usage_type field exists on withdrawals

---

## 📞 Support

### For Technical Issues:
- Check browser console (F12)
- Verify Firebase connectivity
- Ensure all dependencies installed (`npm install`)

### For Data Issues:
- Check Firebase console
- Verify collection exists
- Ensure fields are correct type (Timestamp, string, number)

### For Research Questions:
- Refer to ENHANCEMENT_GUIDE.md
- Check KPI calculation formulas
- Review usage_type classifications

---

## 🔄 Migration from Old Version

### Existing Data Compatibility

Good news! The enhanced version is **backward compatible**:

✓ **Existing withdrawals** work fine (usage_type defaults to null → shown as "Normal")
✓ **Existing lots, checks, drugs** unchanged
✓ **Existing Quick Use** flow works exactly as before

### Migration Steps

1. **Backup Firebase data** (Export from Firebase Console)
2. **Deploy enhanced version**
3. **Test with sample data**
4. **Train users on new features**
5. **Monitor first week**

### Data Cleanup (Optional)

To classify old withdrawals as 'Normal':

```javascript
// Run once in Firebase Console or script
const updateOldWithdrawals = async () => {
  const snapshot = await db.collection('withdrawals')
    .where('usage_type', '==', null)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { 
      usage_type: 'Normal',
      pending_sync_id: null,
      reconciliation_time_minutes: null
    });
  });
  
  await batch.commit();
  console.log(`Updated ${snapshot.size} withdrawals`);
}
```

---

## 📅 Deployment Schedule (Recommended)

### Week 1: ICU-B Pilot
- Deploy to ICU-B only
- Train 3-5 champion nurses
- Monitor usage daily
- Collect feedback

### Week 2: ICU-B Full Rollout
- Train all ICU-B nurses
- Monitor KPIs
- Fix any issues
- Document lessons learned

### Week 3-4: ICU-A Preparation
- Share ICU-B results
- Train ICU-A champions
- Prepare materials

### Week 5: ICU-A Deployment
- Deploy to ICU-A
- Train all ICU-A nurses
- Monitor both units

### Week 6+: Research Phase
- Collect baseline data (manual system)
- Run intervention (app with Smart Timestamp)
- Compare KPIs
- Analyze results

---

## ✅ Success Criteria

### Technical Success
- [ ] Zero critical bugs
- [ ] < 5% error rate in pending reconciliation
- [ ] All KPIs calculate correctly
- [ ] Export CSV works

### User Success
- [ ] > 80% of nurses use Smart Timestamp correctly
- [ ] < 10% of pending items exceed 6 hours
- [ ] > 90% nurse satisfaction score

### Research Success
- [ ] Compliance Rate > 95%
- [ ] Traceability Rate > 98%
- [ ] Loss Rate < 2%
- [ ] Reconciliation Time < 120 minutes

---

## 📝 Version History

### v2.0.0 - Enhanced Version
- ✨ Smart Timestamp modal
- ✨ Pending sync system
- ✨ Replace modal
- ✨ Aging alerts
- ✨ 5 research KPIs
- ✨ Usage type classification

### v1.x - Original Version
- Quick Use
- Stock Count
- Restock
- FEFO system
- Basic KPIs

---

## 🙏 Credits

Developed for Bangkok Hospital Chanthaburi ICU research study.

**Research Team:**
- Fern (Head Nurse, Principal Investigator)
- ICU-A Nursing Team
- ICU-B Nursing Team

**Framework:**
- FOCUS-PDSA (R2R Study)
- TAM (Technology Acceptance Model)
- DeLone & McLean IS Success Model

---

**Last Updated:** April 19, 2026
**Version:** 2.0.0 Enhanced
