# ICU MedSave Enhancement Guide
## Smart Timestamp, Pending Sync, Missing Tracking & Updated KPIs

This document contains all new components and integration steps for both ICU-A and ICU-B.

---

## 📋 Overview of Changes

### New Features
1. **Smart Timestamp Modal** - Large bed buttons for emergency drug withdrawal
2. **Pending Sync System** - Track timestamp records waiting for reconciliation
3. **Missing Drug Tracking** - Report missing drugs with/without bed tracking
4. **Pending View Tab** - Display all pending items with aging alerts
5. **Replace Modal** - One-step drug replacement to close pending items
6. **Enhanced KPIs** - Calculate 5 research KPIs with usage type classification
7. **Aging Alerts** - Visual warnings for items pending > 4-6 hours

### New Database Collections
- `pending_syncs` - Stores timestamp records awaiting replacement
- Updated `withdrawals` - Added `usage_type` and `pending_sync_id` fields

---

## 🗄️ Database Schema Updates

### Collection: `pending_syncs`
```javascript
{
  bed_id: 'ICU-A1',                    // Bed number
  drug_id: 123,                        // Drug ID (optional for missing_report)
  drug_name: 'Adrenaline',             // Drug name (optional)
  qty: 1,                               // Quantity used
  nurse: 'ชื่อพยาบาล',                  // Nurse who pressed timestamp
  timestamp: Timestamp,                 // When the timestamp was created
  source: 'emergency' | 'missing_tracked',  // Type of timestamp
  status: 'pending' | 'completed',     // Reconciliation status
  created_at: Timestamp,                // Creation time
  completed_at: Timestamp | null,      // When it was reconciled
  completed_by: 'ชื่อพยาบาล' | null,   // Who completed it
  reconciled_withdrawal_id: 'doc_id' | null  // Link to withdrawal that closed it
}
```

### Updated Collection: `withdrawals`
```javascript
{
  // ... existing fields (nurse, drugId, drugName, bed, qty, note, returned, retExp, ts)
  
  // NEW FIELDS:
  usage_type: 'Normal' | 'Emergency' | 'Missing_Tracked' | 'Missing_Unknown',
  pending_sync_id: 'doc_id' | null,    // Links to pending_sync if from timestamp
  reconciliation_time_minutes: 120 | null  // Time taken to reconcile (for KPI)
}
```

### Usage Type Classification
- **Normal**: Regular Quick Use withdrawal
- **Emergency**: From Smart Timestamp (pressed bed button in emergency)
- **Missing_Tracked**: Missing drug but bed is known
- **Missing_Unknown**: Missing drug, bed unknown

---

## 🎨 New Components

### 1. Smart Timestamp Modal
Large bed button interface for emergency situations.

```javascript
/* ═══ SMART TIMESTAMP MODAL ═══ */
function SmartTimestampModal({ open, onClose, nurses, db }) {
  const [nurse, setNurse] = useState('')
  const [nurseQuery, setNurseQuery] = useState('')
  const [nurseOpen, setNurseOpen] = useState(false)
  const [selectedBed, setSelectedBed] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [countdown, setCountdown] = useState(2)

  const submit = async () => {
    if (!nurse || !selectedBed || saving) return
    setSaving(true)
    try {
      // Create pending_sync record
      await addDoc(collection(db, 'pending_syncs'), {
        bed_id: selectedBed,
        nurse,
        timestamp: Timestamp.now(),
        source: 'emergency',
        status: 'pending',
        created_at: Timestamp.now(),
        completed_at: null,
        completed_by: null,
        reconciled_withdrawal_id: null,
        drug_id: null,  // Unknown at timestamp moment
        drug_name: null,
        qty: null
      })
      
      setDone(true)
      let n = 2
      const timer = setInterval(() => {
        n -= 1
        setCountdown(n)
        if (n <= 0) {
          clearInterval(timer)
          doClose()
        }
      }, 1000)
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message)
    }
    setSaving(false)
  }

  const doClose = () => {
    setNurse('')
    setNurseQuery('')
    setSelectedBed('')
    setDone(false)
    setCountdown(2)
    onClose()
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid #E0EAE5' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#E65100' }}>⚡ Smart Timestamp (ฉุกเฉิน)</div>
          <button onClick={doClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#8BA898' }}>✕</button>
        </div>

        {!done ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            <div className="info" style={{ marginBottom: 12, fontSize: 11, borderLeftColor: '#E65100' }}>
              ✓ บันทึก [เตียง + เวลา + พยาบาล] ทันที<br/>
              ✓ เติมยาคืนภายหลังผ่าน "Pending" tab<br/>
              ✓ ระบบจะตัดสต็อกอัตโนมัติตอนเติมคืน
            </div>

            <div>
              <div className="lbl">พยาบาลผู้กด Timestamp</div>
              <NursePicker 
                value={nurse} 
                query={nurseQuery} 
                open={nurseOpen} 
                nurses={nurses}
                onChange={(v, o) => { setNurseQuery(v); setNurse(''); setNurseOpen(o !== undefined ? o : v.length > 0) }}
                onSelect={v => { setNurse(v); setNurseQuery(v); setNurseOpen(false) }}
                onClear={() => { setNurse(''); setNurseQuery(''); setNurseOpen(false) }}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="lbl">เลือกเตียงผู้ป่วย (กดปุ่มขนาดใหญ่)</div>
              <div className="bed-grid">
                {BEDS.map(bed => (
                  <button
                    key={bed}
                    className={`bed-btn ${selectedBed === bed ? 'selected' : ''}`}
                    onClick={() => setSelectedBed(bed)}
                  >
                    {bed}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, padding: '28px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#0F6E56', marginBottom: 4 }}>บันทึก Timestamp สำเร็จ</div>
            <div style={{ fontSize: 12, color: '#5F7A6A', marginBottom: 16 }}>
              {selectedBed} · {nurse}<br/>
              กรุณาเติมยาคืนใน "Pending" tab ภายใน 4 ชม.
            </div>
            <div style={{ background: '#E0EAE5', borderRadius: 4, height: 4, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', background: '#0F6E56', width: (countdown / 2 * 100) + '%', transition: 'width 1s linear' }} />
            </div>
            <div style={{ fontSize: 11, color: '#8BA898' }}>ปิดอัตโนมัติใน {countdown} วินาที...</div>
          </div>
        )}

        {!done && (
          <div style={{ padding: '10px 14px', borderTop: '0.5px solid #E0EAE5' }}>
            <button 
              className="btn primary full" 
              onClick={submit} 
              disabled={!nurse || !selectedBed || saving}
            >
              {saving ? 'กำลังบันทึก...' : selectedBed ? `⚡ บันทึก Timestamp: ${selectedBed}` : '⚡ บันทึก Timestamp'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 2. Pending View Tab Component

```javascript
/* ═══ PENDING VIEW TAB ═══ */
function PendingView({ pendingSyncs, drugs, nurses, db, setReplaceModal }) {
  const pending = pendingSyncs.filter(p => p.status === 'pending')
  
  const getAgingClass = (hours) => {
    if (hours >= 6) return 'danger'
    if (hours >= 4) return 'warning'
    return ''
  }

  const deletePending = async (docId) => {
    if (!confirm('ยืนยันการลบรายการนี้?')) return
    try {
      await deleteDoc(doc(db, 'pending_syncs', docId))
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message)
    }
  }

  return (
    <div className="scroll">
      <div className="card blue">
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>⏱ Pending Replacement</div>
        <div style={{ fontSize: 11, color: '#5F7A6A' }}>
          รายการที่รอเติมยาคืน ({pending.length} รายการ)
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="ok">
          ✓ ไม่มีรายการค้าง — ทุกอย่างเรียบร้อย
        </div>
      ) : (
        <>
          <div className="info">
            💡 <b>วิธีเติมยาคืน:</b> กดปุ่ม "Replace" แล้วสแกนยาที่เอามาเติม<br/>
            ระบบจะตัดสต็อกเก่า (FEFO) และปิดรายการ Pending อัตโนมัติ
          </div>

          {pending.map(p => {
            const hours = getHoursSince(p.timestamp)
            const agingClass = getAgingClass(hours)
            const drugName = p.drug_name || '(ยาไม่ระบุ)'
            
            return (
              <div key={p.docId} className={`pending-card ${agingClass}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E25', marginBottom: 2 }}>
                      {p.bed_id}
                      {p.source === 'missing_tracked' && <span className="b br" style={{ marginLeft: 6 }}>Missing</span>}
                      {p.source === 'emergency' && <span className="b bo" style={{ marginLeft: 6 }}>Emergency</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#5F7A6A' }}>
                      {drugName} · {p.nurse}
                    </div>
                    <div style={{ fontSize: 10, color: '#8BA898', marginTop: 2 }}>
                      {fmtDTsafe(p.timestamp)}
                    </div>
                  </div>
                  <div className={`aging ${agingClass}`}>
                    ⏱ {hours.toFixed(1)} ชม.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button 
                    className="btn primary full sm"
                    onClick={() => setReplaceModal(p)}
                  >
                    ✓ Replace
                  </button>
                  <button 
                    className="btn danger sm"
                    onClick={() => deletePending(p.docId)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
```

### 3. Replace Modal Component

```javascript
/* ═══ REPLACE MODAL (One-Step Replacement) ═══ */
function ReplaceModal({ open, onClose, pending, drugsWithStock, lots, nurses, db }) {
  const [nurse, setNurse] = useState('')
  const [nurseQuery, setNurseQuery] = useState('')
  const [nurseOpen, setNurseOpen] = useState(false)
  const [selectedDrugId, setSelectedDrugId] = useState(null)
  const [drugQuery, setDrugQuery] = useState('')
  const [drugOpen, setDrugOpen] = useState(false)
  const [qty, setQty] = useState(1)
  const [saving, setSaving] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)

  useEffect(() => {
    if (open && pending?.drug_id) {
      setSelectedDrugId(pending.drug_id)
    }
    if (open && pending?.qty) {
      setQty(pending.qty)
    }
  }, [open, pending])

  const submit = async () => {
    if (!nurse || !selectedDrugId || saving) return
    setSaving(true)
    try {
      const drug = drugsWithStock().find(d => d.id == selectedDrugId)
      if (!drug) throw new Error('ไม่พบยา')
      if (drug.stock < qty) throw new Error('สต็อกไม่พอ')

      // 1. Deduct stock (FEFO)
      const drugLots = lots.filter(l => l.drugId == selectedDrugId && l.qty > 0)
        .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
      let remaining = qty
      for (const lot of drugLots) {
        if (remaining <= 0) break
        const take = Math.min(lot.qty, remaining)
        await updateDoc(doc(db, 'lots', lot.docId), { qty: lot.qty - take })
        remaining -= take
      }

      // 2. Create withdrawal record with usage_type
      const withdrawalData = {
        nurse,
        drugId: drug.id,
        drugName: drug.name,
        bed: pending.bed_id,
        qty,
        note: `(Replace: ${pending.source === 'emergency' ? 'Emergency' : 'Missing'})`,
        returned: false,
        retExp: '',
        ts: Timestamp.now(),
        usage_type: pending.source === 'emergency' ? 'Emergency' : 'Missing_Tracked',
        pending_sync_id: pending.docId,
        reconciliation_time_minutes: Math.round(getHoursSince(pending.timestamp) * 60)
      }
      await addDoc(collection(db, 'withdrawals'), withdrawalData)

      // 3. Update pending_sync to completed
      await updateDoc(doc(db, 'pending_syncs', pending.docId), {
        status: 'completed',
        completed_at: Timestamp.now(),
        completed_by: nurse,
        drug_id: drug.id,
        drug_name: drug.name,
        qty
      })

      alert('✓ เติมยาคืนและปิดรายการสำเร็จ')
      onClose()
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message)
    }
    setSaving(false)
  }

  const doClose = () => {
    setNurse('')
    setNurseQuery('')
    setSelectedDrugId(null)
    setDrugQuery('')
    setQty(1)
    onClose()
  }

  if (!open || !pending) return null

  const dl = drugsWithStock()
  const canSubmit = nurse && selectedDrugId && qty > 0

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '14px 14px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid #E0EAE5' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#0F6E56' }}>✓ Replace & ปิดรายการ</div>
          <button onClick={doClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#8BA898' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {/* Pending Info */}
          <div className="card blue" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{pending.bed_id}</div>
            <div style={{ fontSize: 11, color: '#5F7A6A' }}>
              {pending.drug_name || '(ยาไม่ระบุ)'} · {pending.nurse}<br/>
              ⏱ {getHoursSince(pending.timestamp).toFixed(1)} ชม. ที่แล้ว
            </div>
          </div>

          {/* Nurse Picker */}
          <div>
            <div className="lbl">พยาบาลผู้เติมยาคืน</div>
            <NursePicker 
              value={nurse} 
              query={nurseQuery} 
              open={nurseOpen} 
              nurses={nurses}
              onChange={(v, o) => { setNurseQuery(v); setNurse(''); setNurseOpen(o !== undefined ? o : v.length > 0) }}
              onSelect={v => { setNurse(v); setNurseQuery(v); setNurseOpen(false) }}
              onClear={() => { setNurse(''); setNurseQuery(''); setNurseOpen(false) }}
            />
          </div>

          {/* Drug Picker */}
          <div style={{ marginTop: 12 }}>
            <div className="lbl">ยาที่นำมาเติม</div>
            <DrugPicker
              drugs={dl}
              selectedId={selectedDrugId}
              query={drugQuery}
              open={drugOpen}
              onChange={(v, o) => { setDrugQuery(v); setSelectedDrugId(null); setDrugOpen(o !== undefined ? o : v.length > 0) }}
              onSelect={id => { setSelectedDrugId(id); setDrugQuery(''); setDrugOpen(false) }}
              onClear={() => { setSelectedDrugId(null); setDrugQuery('') }}
            />
          </div>

          {/* Quantity */}
          <div style={{ marginTop: 12 }}>
            <div className="lbl">จำนวน</div>
            <input 
              type="number" 
              className="inp" 
              value={qty} 
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
            />
          </div>
        </div>

        <div style={{ padding: '10px 14px', borderTop: '0.5px solid #E0EAE5' }}>
          <button 
            className="btn primary full" 
            onClick={submit} 
            disabled={!canSubmit || saving}
          >
            {saving ? 'กำลังบันทึก...' : '✓ Replace & ปิดรายการ'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 4. Missing Drug Tracking in Stock Count

Add this button in the Stock Count component where drugs are displayed:

```javascript
// Inside StockCount component, add a "Report Missing" button for each drug

<button 
  className="btn danger sm"
  onClick={() => setMissingModal({ drugId: drug.id, drugName: drug.name })}
  style={{ marginLeft: 8 }}
>
  🚨 Report Missing
</button>

// Then add the Missing Drug Modal:

/* ═══ MISSING DRUG MODAL ═══ */
function MissingDrugModal({ open, onClose, drug, nurses, db }) {
  const [trackingType, setTrackingType] = useState('') // 'tracked' or 'unknown'
  const [nurse, setNurse] = useState('')
  const [nurseQuery, setNurseQuery] = useState('')
  const [nurseOpen, setNurseOpen] = useState(false)
  const [bed, setBed] = useState('')
  const [qty, setQty] = useState(1)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!nurse || !trackingType || saving) return
    if (trackingType === 'tracked' && !bed) return
    
    setSaving(true)
    try {
      if (trackingType === 'tracked') {
        // Create pending_sync for missing but trackable
        await addDoc(collection(db, 'pending_syncs'), {
          bed_id: bed,
          drug_id: drug.drugId,
          drug_name: drug.drugName,
          qty,
          nurse,
          timestamp: Timestamp.now(),
          source: 'missing_tracked',
          status: 'pending',
          created_at: Timestamp.now(),
          completed_at: null,
          completed_by: null,
          reconciled_withdrawal_id: null
        })
        alert('✓ บันทึกยาหายแล้ว — กรุณาเติมคืนใน Pending tab')
      } else {
        // Create direct withdrawal for missing unknown
        await addDoc(collection(db, 'withdrawals'), {
          nurse,
          drugId: drug.drugId,
          drugName: drug.drugName,
          bed: '(Unknown - Missing)',
          qty,
          note: '(Missing - Cannot Track)',
          returned: false,
          retExp: '',
          ts: Timestamp.now(),
          usage_type: 'Missing_Unknown',
          pending_sync_id: null,
          reconciliation_time_minutes: null
        })
        alert('✓ บันทึกยาหายแล้ว (ไม่สามารถระบุเตียง)')
      }
      onClose()
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message)
    }
    setSaving(false)
  }

  const doClose = () => {
    setTrackingType('')
    setNurse('')
    setNurseQuery('')
    setBed('')
    setQty(1)
    onClose()
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 400, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid #E0EAE5' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#A32D2D' }}>🚨 Report Missing Drug</div>
          <button onClick={doClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#8BA898' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          <div className="card red" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{drug?.drugName}</div>
            <div style={{ fontSize: 11, color: '#A32D2D' }}>พบยาหายจากตู้</div>
          </div>

          <div className="info" style={{ marginBottom: 12, borderLeftColor: '#A32D2D' }}>
            💡 <b>เลือกประเภท:</b><br/>
            • <b>Know Bed</b> = จำได้ว่าเตียงไหนใช้ (สามารถตามยาได้)<br/>
            • <b>Unknown</b> = ไม่รู้ว่าใครใช้ (ไม่สามารถตามยาได้)
          </div>

          {/* Tracking Type */}
          <div>
            <div className="lbl">ประเภทการรายงาน</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`btn full ${trackingType === 'tracked' ? 'warning' : ''}`}
                onClick={() => setTrackingType('tracked')}
              >
                Know Bed
              </button>
              <button
                className={`btn full ${trackingType === 'unknown' ? 'danger' : ''}`}
                onClick={() => setTrackingType('unknown')}
              >
                Unknown
              </button>
            </div>
          </div>

          {/* Nurse */}
          <div style={{ marginTop: 12 }}>
            <div className="lbl">พยาบาลผู้รายงาน</div>
            <NursePicker 
              value={nurse} 
              query={nurseQuery} 
              open={nurseOpen} 
              nurses={nurses}
              onChange={(v, o) => { setNurseQuery(v); setNurse(''); setNurseOpen(o !== undefined ? o : v.length > 0) }}
              onSelect={v => { setNurse(v); setNurseQuery(v); setNurseOpen(false) }}
              onClear={() => { setNurse(''); setNurseQuery(''); setNurseOpen(false) }}
            />
          </div>

          {/* Bed (only if trackable) */}
          {trackingType === 'tracked' && (
            <div style={{ marginTop: 12 }}>
              <div className="lbl">เตียงที่ใช้ยา</div>
              <select className="inp" value={bed} onChange={e => setBed(e.target.value)}>
                <option value="">-- เลือกเตียง --</option>
                {BEDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div style={{ marginTop: 12 }}>
            <div className="lbl">จำนวนที่หาย</div>
            <input 
              type="number" 
              className="inp" 
              value={qty} 
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
            />
          </div>
        </div>

        <div style={{ padding: '10px 14px', borderTop: '0.5px solid #E0EAE5' }}>
          <button 
            className="btn danger full" 
            onClick={submit} 
            disabled={!nurse || !trackingType || (trackingType === 'tracked' && !bed) || saving}
          >
            {saving ? 'กำลังบันทึก...' : '🚨 Report Missing'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 Updated Export KPI Calculations

Add these KPI calculations to the Export component:

```javascript
// Inside Export component, add new KPI calculations

const calculateResearchKPIs = () => {
  // Filter by selected month
  const monthWithdrawals = selectedMonth === 'all' 
    ? withdrawals 
    : withdrawals.filter(w => {
        const wDate = w.ts?.toDate ? w.ts.toDate() : new Date(w.ts)
        const wMonth = `${wDate.getFullYear()}-${String(wDate.getMonth()+1).padStart(2,'0')}`
        return wMonth === selectedMonth
      })

  // 1. Compliance Rate
  const totalWithdrawals = monthWithdrawals.length
  const recordedWithdrawals = monthWithdrawals.filter(w => 
    w.usage_type === 'Normal' || w.usage_type === 'Emergency'
  ).length
  const complianceRate = totalWithdrawals > 0 
    ? (recordedWithdrawals / totalWithdrawals * 100).toFixed(1)
    : 0

  // 2. Reconciliation Time
  const reconciledItems = monthWithdrawals.filter(w => 
    w.reconciliation_time_minutes !== null && w.reconciliation_time_minutes !== undefined
  )
  const avgReconciliationTime = reconciledItems.length > 0
    ? (reconciledItems.reduce((sum, w) => sum + w.reconciliation_time_minutes, 0) / reconciledItems.length).toFixed(0)
    : 0

  // 3. Traceability Rate
  const traceableWithdrawals = monthWithdrawals.filter(w =>
    w.usage_type === 'Normal' || 
    w.usage_type === 'Emergency' || 
    w.usage_type === 'Missing_Tracked'
  ).length
  const traceabilityRate = totalWithdrawals > 0
    ? (traceableWithdrawals / totalWithdrawals * 100).toFixed(1)
    : 0

  // 4. Untraced Drug Loss Rate
  const untracedLosses = monthWithdrawals.filter(w => w.usage_type === 'Missing_Unknown').length
  const lossRate = totalWithdrawals > 0
    ? (untracedLosses / totalWithdrawals * 100).toFixed(1)
    : 0

  // 5. Stock Deficiency Rate
  const monthChecks = selectedMonth === 'all'
    ? checks
    : checks.filter(c => {
        const cDate = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
        const cMonth = `${cDate.getFullYear()}-${String(cDate.getMonth()+1).padStart(2,'0')}`
        return cMonth === selectedMonth
      })
  
  const totalStockItems = monthChecks.reduce((sum, c) => sum + (c.actual || 0), 0)
  const deficientItems = monthChecks.reduce((sum, c) => {
    const drug = drugs.find(d => String(d.id) === String(c.drugId))
    if (!drug) return sum
    return sum + (c.actual < drug.par ? 1 : 0)
  }, 0)
  const deficiencyRate = monthChecks.length > 0
    ? (deficientItems / monthChecks.length * 100).toFixed(1)
    : 0

  return {
    complianceRate,
    avgReconciliationTime,
    traceabilityRate,
    lossRate,
    deficiencyRate,
    totalWithdrawals,
    recordedWithdrawals,
    traceableWithdrawals,
    untracedLosses,
    totalStockItems,
    deficientItems
  }
}

const kpis = calculateResearchKPIs()

// Then render KPI cards:
<div className="card">
  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📊 Research KPIs</div>
  
  <div className="sg" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
    <div className="sc" style={{ background: '#E1F5EE', borderColor: '#9FE1CB' }}>
      <div className="sc-n" style={{ color: '#0F6E56' }}>{kpis.complianceRate}%</div>
      <div className="sc-l">Compliance Rate</div>
      <div style={{ fontSize: 9, color: '#5F7A6A', marginTop: 2 }}>
        {kpis.recordedWithdrawals}/{kpis.totalWithdrawals}
      </div>
    </div>

    <div className="sc" style={{ background: '#E6F1FB', borderColor: '#B5D4F4' }}>
      <div className="sc-n" style={{ color: '#185FA5' }}>{kpis.avgReconciliationTime}</div>
      <div className="sc-l">Avg Recon Time (min)</div>
      <div style={{ fontSize: 9, color: '#5F7A6A', marginTop: 2 }}>
        Target: &lt; 120
      </div>
    </div>

    <div className="sc" style={{ background: '#EEEDFE', borderColor: '#CECBF6' }}>
      <div className="sc-n" style={{ color: '#534AB7' }}>{kpis.traceabilityRate}%</div>
      <div className="sc-l">Traceability Rate</div>
      <div style={{ fontSize: 9, color: '#5F7A6A', marginTop: 2 }}>
        {kpis.traceableWithdrawals}/{kpis.totalWithdrawals}
      </div>
    </div>

    <div className="sc" style={{ background: '#FCEBEB', borderColor: '#F7C1C1' }}>
      <div className="sc-n" style={{ color: '#A32D2D' }}>{kpis.lossRate}%</div>
      <div className="sc-l">Loss Rate</div>
      <div style={{ fontSize: 9, color: '#5F7A6A', marginTop: 2 }}>
        {kpis.untracedLosses} untraced
      </div>
    </div>
  </div>

  <div className="info">
    💡 <b>KPI Definitions:</b><br/>
    • Compliance = (Normal + Emergency) / Total<br/>
    • Traceability = (Normal + Emergency + Missing_Tracked) / Total<br/>
    • Loss Rate = Missing_Unknown / Total
  </div>
</div>
```

---

## 🔧 Integration Steps

### Step 1: Update Main App Component State

In the main `App()` function, add:

```javascript
// Add to state declarations
const [pendingSyncs, setPendingSyncs] = useState([])
const [smartTimestampModal, setSmartTimestampModal] = useState(false)
const [replaceModal, setReplaceModal] = useState(false)
const [replacePending, setReplacePending] = useState(null)
const [missingModal, setMissingModal] = useState(null)

// Add listener in useEffect (with other listeners)
unsubs.push(onSnapshot(query(collection(db, 'pending_syncs'), orderBy('timestamp', 'desc')), s => {
  setPendingSyncs(s.docs.map(d => ({ docId: d.id, ...d.data() })))
}))
```

### Step 2: Update Bottom Navigation

Add the Pending tab button:

```javascript
<button className={`bni ${curTab === 'pending' ? 'on' : ''}`} onClick={() => setCurTab('pending')}>
  <div className="bni-icon">⏱</div>
  <div className="bni-label">Pending</div>
  {pendingSyncs.filter(p => p.status === 'pending').length > 0 && <div className="nav-dot pulse" />}
</button>
```

### Step 3: Update Quick Use Modal

In QuickUseModal, change the withdrawal creation to include usage_type:

```javascript
await addDoc(collection(db, 'withdrawals'), {
  nurse: qNurse, 
  drugId: drug.id, 
  drugName: drug.name, 
  bed: bedVal,
  qty, 
  note: '(Multi Quick Use)', 
  returned: false, 
  retExp: '', 
  ts: Timestamp.now(),
  usage_type: 'Normal',           // NEW
  pending_sync_id: null,          // NEW
  reconciliation_time_minutes: null  // NEW
})
```

### Step 4: Add Tab Rendering

In the main render section, add:

```javascript
{curTab === 'pending' && (
  <PendingView 
    pendingSyncs={pendingSyncs}
    drugs={drugs}
    nurses={nurses}
    db={db}
    setReplaceModal={(p) => { setReplacePending(p); setReplaceModal(true) }}
  />
)}
```

### Step 5: Add Modals at End of Component

Before the closing `</div>` of the app:

```javascript
{smartTimestampModal && (
  <SmartTimestampModal 
    open={smartTimestampModal}
    onClose={() => setSmartTimestampModal(false)}
    nurses={nurses}
    db={db}
  />
)}

{replaceModal && (
  <ReplaceModal
    open={replaceModal}
    onClose={() => { setReplaceModal(false); setReplacePending(null) }}
    pending={replacePending}
    drugsWithStock={drugsWithStock}
    lots={lots}
    nurses={nurses}
    db={db}
  />
)}

{missingModal && (
  <MissingDrugModal
    open={!!missingModal}
    onClose={() => setMissingModal(null)}
    drug={missingModal}
    nurses={nurses}
    db={db}
  />
)}
```

### Step 6: Add Smart Timestamp Button in Dashboard

In Dashboard component, add a prominent button:

```javascript
<button 
  className="btn warning full"
  onClick={() => setSmartTimestampModal(true)}
  style={{ marginTop: 12 }}
>
  ⚡ Smart Timestamp (Emergency)
</button>
```

---

## ✅ Testing Checklist

### Smart Timestamp Flow
- [ ] Open Smart Timestamp modal
- [ ] Select nurse
- [ ] Press large bed button
- [ ] Verify pending_sync record created
- [ ] Check Pending tab shows new item
- [ ] Verify aging timer works (shows hours)

### Replace Flow
- [ ] Open Pending tab
- [ ] See pending item with aging indicator
- [ ] Click "Replace" button
- [ ] Select nurse and drug
- [ ] Verify stock deducted (FEFO)
- [ ] Verify withdrawal created with correct usage_type
- [ ] Verify pending_sync marked as completed
- [ ] Verify reconciliation_time_minutes calculated

### Missing Drug Flow
- [ ] In Stock Count, click "Report Missing"
- [ ] Test "Know Bed" option
  - [ ] Verify pending_sync created with source='missing_tracked'
  - [ ] Verify appears in Pending tab
- [ ] Test "Unknown" option
  - [ ] Verify withdrawal created with usage_type='Missing_Unknown'
  - [ ] Verify does NOT appear in Pending tab

### KPI Calculations
- [ ] Export tab shows all 5 KPIs
- [ ] Compliance Rate calculates correctly
- [ ] Reconciliation Time shows average
- [ ] Traceability Rate includes Normal+Emergency+Missing_Tracked
- [ ] Loss Rate shows Missing_Unknown percentage
- [ ] Monthly filter works for all KPIs

### Aging Alerts
- [ ] Items < 4 hours: no warning
- [ ] Items 4-6 hours: orange warning
- [ ] Items > 6 hours: red danger + blink
- [ ] Nav badge shows when pending items exist
- [ ] Badge pulses for visibility

---

## 📦 Deployment Notes

### Firebase Security Rules
Add these rules for the new collection:

```javascript
match /pending_syncs/{docId} {
  allow read, write: if true; // Adjust based on your auth setup
}
```

### Database Indexing
Create composite index for efficient queries:
- Collection: `pending_syncs`
- Fields: `status` (Ascending), `timestamp` (Descending)

### Migration Strategy
1. Deploy to ICU-B first (pilot)
2. Train champion nurses
3. Monitor for 2 weeks
4. Collect feedback
5. Deploy to ICU-A

---

## 🎓 Training Talking Points

1. **Smart Timestamp**: "ใช้ในภาวะฉุกเฉิน กดปุ่มเตียงขนาดใหญ่ เติมยาคืนภายหลัง"
2. **Pending Tab**: "ดูรายการที่ค้าง ถ้าเกิน 4 ชม. จะเตือนสีส้ม เกิน 6 ชม. สีแดง"
3. **Replace**: "กดปุ่ม Replace สแกนยา ระบบตัดสต็อกและปิดรายการอัตโนมัติ"
4. **Missing**: "เจอยาหาย ถ้ารู้เตียงเลือก Know Bed ไม่รู้เลือก Unknown"
5. **KPIs**: "ระบบคำนวณให้อัตโนมัติ ส่งออก CSV ได้ทุกเดือน"

---

This guide provides all the code needed to implement the enhanced features. Each component is self-contained and can be added to the existing App.jsx file following the integration steps above.
