import React, { useState, useEffect, useCallback, useRef } from 'react'
import { db } from './firebase.js'
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, setDoc, writeBatch, Timestamp
} from 'firebase/firestore'
import { DRUG_MASTER, DEFAULT_NURSES, STORAGE_GROUPS, SHIFTS, BEDS } from './data.js'

/* ═══ STYLES ═══ */
const css = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{height:100%;background:#F8F9FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#1A2E25}
#root{height:100%}
.app{max-width:480px;margin:0 auto;height:100vh;display:flex;flex-direction:column;background:#F8F9FA;position:relative;overflow:hidden}
/* topbar */
.bar{background:#0F766E;padding:12px 16px 14px;flex-shrink:0}
.bar-title{font-size:16px;font-weight:600;color:#fff}
.bar-sub{font-size:11px;color:#9FE1CB;margin-top:1px}
.bar-row{display:flex;align-items:center;justify-content:space-between}
.alert-chip{background:rgba(255,255,255,.22);color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:12px;padding:3px 11px;font-size:11px;font-weight:500;cursor:pointer}
/* scroll */
.scroll{flex:1;overflow-y:auto;padding:14px;padding-bottom:76px;display:flex;flex-direction:column;gap:12px}
.scroll::-webkit-scrollbar{display:none}
/* bottom nav */
.bnav{position:absolute;bottom:0;left:0;right:0;height:64px;background:#fff;border-top:0.5px solid #E0EAE5;display:flex;z-index:50}
.bni{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:none;background:none;cursor:pointer;position:relative;padding:0;font-family:inherit}
.bni-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;transition:transform .15s,background .15s}
.bni.on .bni-icon{transform:translateY(-4px) scale(1.08)}
.bni-label{font-size:9px;color:#8BA898;transition:color .15s;font-weight:400}
.bni.on .bni-label{color:#1A2E25;font-weight:500}
.bni:nth-child(1) .bni-icon{background:#E1F5EE}.bni:nth-child(1).on .bni-icon{background:#0F6E56}
.bni:nth-child(2) .bni-icon{background:#EEF5E8}.bni:nth-child(2).on .bni-icon{background:#3B6D11}
.bni:nth-child(3) .bni-icon{background:#E6F1FB}.bni:nth-child(3).on .bni-icon{background:#185FA5}
.bni:nth-child(4) .bni-icon{background:#FAEEDA}.bni:nth-child(4).on .bni-icon{background:#854F0B}
.bni:nth-child(5) .bni-icon{background:#EEEDFE}.bni:nth-child(5).on .bni-icon{background:#534AB7}
.bni:nth-child(6) .bni-icon{background:#FCEBEB}.bni:nth-child(6).on .bni-icon{background:#A32D2D}
.bni:nth-child(7) .bni-icon{background:#F1EFE8}.bni:nth-child(7).on .bni-icon{background:#5F5E5A}
.nav-dot{position:absolute;top:4px;right:calc(50% - 22px);width:7px;height:7px;background:#E24B4A;border-radius:50%;border:1.5px solid #fff}
/* cards */
.card{background:#fff;border:0.5px solid #D8EAE0;border-radius:12px;padding:14px}
.card.green{background:#E1F5EE;border-color:#9FE1CB}
.card.amber{background:#FAEEDA;border-color:#FAC775}
.card.red{background:#FCEBEB;border-color:#F7C1C1}
.card.blue{background:#E6F1FB;border-color:#B5D4F4}
.card.purple{background:#EEEDFE;border-color:#CECBF6}
/* stats grid */
.sg{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.sc{border-radius:10px;padding:10px 6px;text-align:center;border:0.5px solid transparent}
.sc-n{font-size:22px;font-weight:600;font-family:monospace}
.sc-l{font-size:10px;margin-top:2px}
/* badge */
.b{display:inline-block;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:500}
.bg{background:#E1F5EE;color:#0F6E56}.ba{background:#FAEEDA;color:#854F0B}.br{background:#FCEBEB;color:#A32D2D}.bb{background:#E6F1FB;color:#185FA5}.bp{background:#EEEDFE;color:#3C3489}.bgr{background:#F1EFE8;color:#5F5E5A}
/* rows */
.row{display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:0.5px solid #EEF4F0}
.row:last-child{border-bottom:none}
/* bed button grid for Smart Timestamp */
.bed-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}
.bed-btn{padding:20px 12px;border-radius:12px;border:2px solid #C8DDD4;background:#fff;font-size:16px;font-weight:600;color:#1A2E25;cursor:pointer;transition:all .15s;font-family:inherit}
.bed-btn:active{transform:scale(.95);background:#E1F5EE;border-color:#0F6E56;color:#0F6E56}
.bed-btn.selected{background:#0F6E56;border-color:#085041;color:#fff}
/* aging indicator */
.aging{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:500}
.aging.warning{background:#FFF3E0;color:#E65100}
.aging.danger{background:#FCEBEB;color:#A32D2D;animation:blink 1s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.6}}
/* pending item card */
.pending-card{background:#fff;border:0.5px solid #D8EAE0;border-radius:10px;padding:12px;margin-bottom:8px}
.pending-card.warning{border-color:#FFB74D;background:#FFF3E0}
.pending-card.danger{border-color:#F7C1C1;background:#FCEBEB}
.nav-dot.pulse{animation:pulse 1.5s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.bo{background:#FFF3E0;color:#E65100}
.slbl{font-size:11px;font-weight:500;color:#5F7A6A;margin-bottom:8px}
/* form */
.lbl{display:block;font-size:11px;color:#5F7A6A;margin-bottom:4px;margin-top:10px}
.lbl:first-child{margin-top:0}
.inp{width:100%;background:#F4F7F5;color:#1A2E25;border:0.5px solid #C8DDD4;border-radius:8px;padding:9px 11px;font-family:inherit;font-size:13px;outline:none}
.inp:focus{border-color:#0F6E56}
select.inp{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238BA898' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px}
.sw{position:relative}
.sw-icon{position:absolute;left:9px;top:50%;transform:translateY(-50%);pointer-events:none;width:14px;height:14px;opacity:.45}
.sw .inp{padding-left:30px}
.dd{border:0.5px solid #C8DDD4;border-radius:8px;overflow:hidden;max-height:160px;overflow-y:auto;margin-top:3px;background:#fff}
.ddi{padding:9px 12px;cursor:pointer;border-bottom:0.5px solid #EEF4F0;font-size:13px}
.ddi:last-child{border-bottom:none}
.ddi:active{background:#F4F7F5}
.pill{display:inline-flex;align-items:center;gap:5px;background:#E1F5EE;border:0.5px solid #9FE1CB;border-radius:20px;padding:4px 10px;font-size:12px;font-weight:500;color:#0F6E56;margin-top:4px}
.pill button{background:none;border:none;cursor:pointer;font-size:13px;color:#0F6E56;padding:0;line-height:1}
/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:8px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;border:0.5px solid #C8DDD4;background:#fff;color:#1A2E25}
.btn:disabled{opacity:.35;cursor:not-allowed}
.btn.primary{background:#0F6E56;border-color:#085041;color:#fff}
.btn.primary:active:not(:disabled){background:#085041}
.btn.full{width:100%}.btn.sm{padding:5px 11px;font-size:12px}
.btn.danger{background:#FCEBEB;border-color:#F7C1C1;color:#A32D2D}
.ok{background:#E1F5EE;border:0.5px solid #9FE1CB;border-radius:8px;padding:10px;color:#0F6E56;font-size:13px;font-weight:500;text-align:center}
.info{background:#F4F7F5;border-radius:8px;padding:10px 12px;font-size:12px;color:#5F7A6A;line-height:1.7;border-left:3px solid #0F6E56}
/* stepper */
.nc{display:inline-flex;align-items:center;border:0.5px solid #C8DDD4;border-radius:8px;overflow:hidden;background:#F4F7F5}
.nc button{padding:5px 13px;background:none;border:none;font-size:17px;cursor:pointer;color:#0F6E56;font-family:monospace}
.nc span{padding:5px 10px;font-family:monospace;font-size:14px;font-weight:600;min-width:34px;text-align:center;color:#1A2E25}
/* drug card in check */
.dcard{background:#fff;border:0.5px solid #D8EAE0;border-radius:10px;padding:11px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px}
.dcard.low{border-color:#FAC775;background:#FAEEDA}
.dcard.crit{border-color:#F7C1C1;background:#FCEBEB}
/* progress bar */
.pbar{height:3px;border-radius:2px;background:#EEF4F0;margin-top:4px;overflow:hidden;width:100px}
.pfill{height:100%;border-radius:2px}
/* grp header */
.ghdr{display:flex;align-items:center;gap:8px;padding:5px 0 7px}
.gdot{width:10px;height:10px;border-radius:3px;flex-shrink:0}
/* lot row */
.lotrow{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:0.5px solid #EEF4F0;border-left:3px solid transparent;padding-left:8px}
.lotrow:last-child{border-bottom:none}
.fefo-tag{background:#EEEDFE;color:#3C3489;border-radius:8px;padding:1px 6px;font-size:10px;font-weight:500}
/* withdraw row */
.wrow{display:flex;align-items:flex-start;gap:8px;padding:10px 0;border-bottom:0.5px solid #EEF4F0}
.wrow:last-child{border-bottom:none}
/* return panel */
.retpanel{background:#EEEDFE;border:0.5px solid #CECBF6;border-radius:10px;padding:12px;margin-top:8px}
/* overlay */
.overlay{position:absolute;inset:0;z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}
.ov-g{background:#0F6E56}.ov-r{background:#A32D2D}
.ov-icon{font-size:64px;margin-bottom:12px}
.ov-title{font-size:21px;font-weight:600;color:#fff;margin-bottom:8px;line-height:1.35}
.ov-sub{font-size:13px;color:rgba(255,255,255,.82);margin-bottom:16px;line-height:1.6}
.ov-box{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28);border-radius:12px;padding:14px 16px;margin-bottom:20px;width:100%}
.ov-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13px;color:rgba(255,255,255,.9)}
.ov-row+.ov-row{border-top:1px solid rgba(255,255,255,.15)}
.ov-pill{background:rgba(255,255,255,.28);border-radius:20px;padding:3px 11px;font-size:12px;color:#fff}
.shelf{background:rgba(255,255,255,.13);border:1.5px solid rgba(255,255,255,.28);border-radius:10px;padding:12px;margin-bottom:18px;width:100%}
.shelf-lbl{font-size:10px;color:rgba(255,255,255,.6);margin-bottom:8px;letter-spacing:.3px}
.shelf-slots{display:flex;gap:5px}
.sl{height:30px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:500;flex:1}
.sl.old{background:rgba(255,255,255,.2);color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.15)}
.sl.nw-g{background:#fff;color:#0F6E56;border:2px solid #9FE1CB}
.sl.nw-r{background:#fff;color:#A32D2D;border:2px solid #F7C1C1}
.shelf-dir{font-size:10px;color:rgba(255,255,255,.55);text-align:center;margin-top:5px}
/* quick dispense bar */
.qbar{background:#0F6E56;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer}
/* ─── Dashboard Action Buttons ─── */
@keyframes bell-rock{0%,100%{transform:rotate(0)}15%{transform:rotate(14deg)}30%{transform:rotate(-12deg)}45%{transform:rotate(9deg)}60%{transform:rotate(-6deg)}75%{transform:rotate(3deg)}}
@keyframes dot-pulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,234,0,0.8)}50%{transform:scale(1.3);box-shadow:0 0 0 7px transparent}}
.bell-anim{display:inline-block;animation:bell-rock 2.8s ease-in-out infinite;transform-origin:50% 0%;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.35))}
.pulse-dot{width:13px;height:13px;border-radius:50%;background:#FFEA00;animation:dot-pulse .9s ease-in-out infinite;flex-shrink:0}
@keyframes shake-scale{0%,100%{transform:scale(1) rotate(0)}10%{transform:scale(1.08) rotate(-8deg)}20%{transform:scale(1.08) rotate(8deg)}30%{transform:scale(1.05) rotate(-5deg)}40%{transform:scale(1.05) rotate(5deg)}50%,90%{transform:scale(1) rotate(0)}}
@keyframes bounce-icon{0%,100%{transform:translateY(0)}35%{transform:translateY(-7px)}55%{transform:translateY(-4px)}75%{transform:translateY(-2px)}}
@keyframes badge-blink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.15)}}
@keyframes ripple-out{0%{transform:scale(0.8);opacity:0.5}100%{transform:scale(2);opacity:0}}
@keyframes icon-pulse{0%,100%{box-shadow:0 0 0 0 rgba(236,64,122,0.55)}60%{box-shadow:0 0 0 10px rgba(236,64,122,0)}}
@keyframes icon-pulse-blue{0%,100%{box-shadow:0 0 0 0 rgba(66,165,245,0.55)}60%{box-shadow:0 0 0 10px rgba(66,165,245,0)}}
.alert-icon-pulse{animation:icon-pulse 1.6s ease-in-out infinite}
.alert-icon-pulse-blue{animation:icon-pulse-blue 1.6s ease-in-out infinite}
.shake-icon{display:inline-block;animation:shake-scale 0.9s ease-in-out infinite}
.bounce-icon{display:inline-block;animation:bounce-icon 1.5s ease-in-out infinite}
.blink-badge{animation:badge-blink 1s ease-in-out infinite}
.sc-ripple{position:relative;overflow:hidden;transition:transform .2s ease,box-shadow .2s ease}
.sc-ripple:hover{transform:scale(1.02);box-shadow:0 4px 14px rgba(0,0,0,0.12);cursor:pointer}
.sc-ripple:active{transform:scale(0.98) !important;box-shadow:0 1px 4px rgba(0,0,0,0.08) !important}
.sc-ripple::after{content:'';position:absolute;inset:0;border-radius:inherit;background:rgba(0,0,0,0.06);transform:scale(0);opacity:0;transition:transform .3s,opacity .3s}
.sc-ripple:active::after{transform:scale(2);opacity:1;transition:none}

.qbar:active{background:#085041}
.qbar-icon{width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px}
.qbar-text{flex:1;color:#fff}
.qbar-title{font-size:13px;font-weight:500}
.qbar-sub{font-size:10px;color:#9FE1CB;margin-top:1px}
.qpanel{background:#fff;border:1.5px solid #0F6E56;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
/* loading */
.loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:12px;background:#F4F7F5}
.spinner{width:36px;height:36px;border:3px solid #D8EAE0;border-top-color:#0F6E56;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
/* login */
.login{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;background:linear-gradient(160deg,#E1F5EE 0%,#F4F7F5 50%,#EEEDFE 100%)}
.login-logo{font-size:56px;margin-bottom:16px}
.login-title{font-size:24px;font-weight:700;color:#0F6E56;margin-bottom:4px}
.login-sub{font-size:13px;color:#5F7A6A;margin-bottom:28px;text-align:center}
.login-card{background:#fff;border-radius:16px;padding:24px;width:100%;max-width:360px;box-shadow:0 4px 24px rgba(15,110,86,.1)}
/* scanner */
@keyframes scanline{0%{top:0}100%{top:calc(100% - 2px)}}
.scan-line{position:absolute;left:0;right:0;height:2px;background:#4ADE80;animation:scanline 1.8s ease-in-out infinite alternate}
`

/* ═══ HELPERS ═══ */
const daysLeft = d => Math.round((new Date(d) - new Date()) / 86400000)
const fmtDT = ts => {
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' }) + ' ' +
    d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}
const fmtMY = d => { const dt = new Date(d); return String(dt.getMonth() + 1).padStart(2, '0') + '/' + dt.getFullYear() }
const fmtDTsafe = d => {
  if (!d) return ''
  const dt = d?.toDate ? d.toDate() : new Date(d)
  const dd = String(dt.getDate()).padStart(2,'0')
  const mm = String(dt.getMonth()+1).padStart(2,'0')
  const yyyy = dt.getFullYear() + 543
  const hh = String(dt.getHours()).padStart(2,'0')
  const min = String(dt.getMinutes()).padStart(2,'0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}
const fmtDsafe = d => {
  if (!d) return ''
  const dt = d?.toDate ? d.toDate() : new Date(d)
  const dd = String(dt.getDate()).padStart(2,'0')
  const mm = String(dt.getMonth()+1).padStart(2,'0')
  const yyyy = dt.getFullYear() + 543
  return `${dd}/${mm}/${yyyy}`
}
const myToISO = (m, y) => { if (!m || !y) return ''; const last = new Date(+y, +m, 0).getDate(); return `${y}-${String(m).padStart(2,'0')}-${last}` }
const shiftDateKey = (ts, shift) => {
  const d = new Date(ts)
  const isNight = (shift || '').includes('Night')
  const h = d.getHours()
  if (isNight && h >= 0 && h < 8) d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}
const fmtExpiry = (expiry, drug) => {
  if (!expiry || expiry === '2099-12-31') return 'ไม่มี EXP'
  if (drug?.fullDateExp) {
    const dt = new Date(expiry)
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
  }
  return fmtMY(expiry)
}

// แปลง durationMin (นาที) → "X ชม. Y นาที" ถ้า ≥60 หรือ "X นาที"
const fmtDuration = (min) => {
  if (min == null) return ''
  if (min < 60) return `${min} นาที`
  const h = Math.floor(min / 60)
  const m = Math.round((min % 60) * 10) / 10
  return m > 0 ? `${h} ชม. ${m} นาที` : `${h} ชม.`
}

/* ═══ NURSE PICKER ═══ */
function NursePicker({ value, query, open, nurses, onChange, onSelect, onClear }) {
  const filtered = query ? nurses.filter(n => n.includes(query)) : nurses
  return (
    <div>
      <div className="sw">
        <svg className="sw-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/></svg>
        <input className="inp" value={value || query} placeholder="พิมพ์ชื่อพยาบาล..."
          onChange={e => onChange(e.target.value)}
          onFocus={() => onChange(query || '', true)} />
      </div>
      {open && !value && (
        <div className="dd">
          {filtered.length ? filtered.map(n => (
            <div key={n} className="ddi" onMouseDown={() => onSelect(n)}>{n}</div>
          )) : <div className="ddi" style={{ color: '#8BA898' }}>ไม่พบ</div>}
        </div>
      )}
      {value && (
        <div className="pill">✓ {value}<button onClick={onClear}>✕</button></div>
      )}
    </div>
  )
}

/* ═══ DRUG PICKER ═══ */
function DrugPicker({ drugs, selectedId, query, open, onChange, onSelect, onClear }) {
  const q = (query || '').toLowerCase()
  const filtered = q ? drugs.filter(d => d.name.toLowerCase().includes(q)) : drugs
  const sel = drugs.find(d => d.id == selectedId)
  const stockOf = d => d.stock || 0
  return (
    <div>
      <div className="sw">
        <svg className="sw-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/></svg>
        <input className="inp" value={sel ? sel.name : query} placeholder="พิมพ์ชื่อยา..."
          onChange={e => onChange(e.target.value)}
          onFocus={() => onChange(query || '', true)} />
      </div>
      {open && !selectedId && (
        <div className="dd">
          {filtered.length ? filtered.map(d => (
            <div key={d.id} className="ddi" onMouseDown={() => onSelect(d.id)}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{d.name}</div>
              <div style={{ fontSize: 10, color: '#8BA898' }}>เหลือ {stockOf(d)} {d.unit}{d.fefoExp ? ` · EXP ${fmtMY(d.fefoExp)}` : ''}</div>
            </div>
          )) : <div className="ddi" style={{ color: '#8BA898' }}>ไม่พบ</div>}
        </div>
      )}
      {sel && selectedId && (
        <div style={{ background: '#F4F7F5', borderRadius: 8, padding: '8px 10px', marginTop: 3, fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1 }}><b>{sel.name}</b> · {stockOf(sel)} {sel.unit}{sel.fefoExp ? ` · FEFO ${fmtMY(sel.fefoExp)}` : ''}</div>
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#8BA898' }}>✕</button>
        </div>
      )}
    </div>
  )
}

/* ═══ MONTH/YEAR PICKER ═══ */
function MyPicker({ month, year, onMonth, onYear }) {
  const curYear = new Date().getFullYear()
  const months = ['01','02','03','04','05','06','07','08','09','10','11','12']
  const thM = ['Jan.','Feb.','Mar.','Apr.','May','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.']
  const years = Array.from({ length: 15 }, (_, i) => curYear + i)
  return (
    <div className="g2">
      <div>
        <div className="lbl">เดือน EXP</div>
        <select className="inp" value={month} onChange={e => onMonth(e.target.value)}>
          <option value="">-- Month --</option>
          {months.map((m, i) => <option key={m} value={m}>{m} ({thM[i]})</option>)}
        </select>
      </div>
      <div>
        <div className="lbl">EXP Year</div>
        <select className="inp" value={year} onChange={e => onYear(e.target.value)}>
          <option value="">-- Year --</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  )
}

/* ═══ FULL DATE PICKER (วัน/เดือน/ปี) สำหรับยาอายุสั้น ═══ */
function FullDatePicker({ value, onChange }) {
  return (
    <div>
      <div className="lbl">วันที่ EXP (วัน/เดือน/ปี)</div>
      <input type="date" className="inp" value={value || ''}
        onChange={e => onChange(e.target.value)}
        min={new Date().toISOString().split('T')[0]} />
      {value && <div style={{ fontSize:11, color:'#0F6E56', marginTop:3 }}>→ EXP {new Date(value).toLocaleDateString('th-TH')}</div>}
    </div>
  )
}

/* ═══ SMART EXP PICKER — เลือกโหมด month/year หรือ full date ═══ */
function ExpPicker({ drug, expM, expY, fullDate, onExpM, onExpY, onFullDate, allowToggle }) {
  const [toggleFull, setToggleFull] = React.useState(false)
  const useFullDate = drug?.fullDateExp || toggleFull
  if (useFullDate) {
    return (
      <>
        <FullDatePicker value={fullDate} onChange={onFullDate} />
        {allowToggle && !drug?.fullDateExp && (
          <button onClick={() => { setToggleFull(false); onFullDate && onFullDate('') }}
            style={{ marginTop:4, background:'none', border:'none', cursor:'pointer', fontSize:10, color:'#8BA898', padding:'2px 0', textDecoration:'underline' }}>
            เปลี่ยนกลับเป็นเดือน/ปี
          </button>
        )}
      </>
    )
  }
  return (
    <>
      <MyPicker month={expM} year={expY} onMonth={onExpM} onYear={onExpY} />
      {expM && expY && <div style={{ fontSize:11, color:'#0F6E56', marginTop:3 }}>→ บันทึกเป็น EXP {expM}/{expY} (วันสุดท้ายของเดือน)</div>}
      {allowToggle && (
        <button onClick={() => { setToggleFull(true); onExpM && onExpM(''); onExpY && onExpY('') }}
          style={{ marginTop:4, background:'none', border:'none', cursor:'pointer', fontSize:10, color:'#185FA5', padding:'2px 0', textDecoration:'underline' }}>
          ระบุวัน/เดือน/ปี แบบเต็ม
        </button>
      )}
    </>
  )
}

/* ═══ PUTAWAY OVERLAY ═══ */
function PutawayOverlay({ drug, drugs, qty, expiry, returnLots, pa, fefoExp, context, singleStock, groupName, groupIcon, onDone }) {
  // ── Multi-Drug Mode (Emergency หลายยา) ──
  if (drugs && drugs.length > 1) {
    return (
      <div className="overlay" style={{ background:'#0F4A38', alignItems:'stretch', justifyContent:'flex-start', padding:16, overflowY:'auto', gap:0 }}>
        <div style={{ fontSize:17, fontWeight:800, color:'#fff', marginBottom:4 }}>
          {context === 'return' ? 'คืนยา' : 'รับเข้า'} {drugs.length} รายการ
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginBottom:16 }}>
          ตรวจสอบตำแหน่งวางของแต่ละยา
        </div>
        
        {/* Drug List */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
          {drugs.map((item, idx) => {
            const itemDrug = item.drug
            const isSingle = item.singleStock
            const numReturningLots = item.returnLots?.length || 1
            
            // คำนวณข้อความตำแหน่ง
            let positionLabel = ''
            if (!isSingle && item.pa) {
              const dir = item.pa.direction || 'ltr'
              const pos = item.pa.position || 1
              const par = item.pa.par || (item.pa.existingLots?.length || 0) + 1
              
              if (dir === 'rtl') {
                // RTL: ขวา = EXP ก่อน
                if (pos === 1) {
                  positionLabel = 'วางช่อง 1 (ขวาสุด)'
                } else if (pos === par) {
                  positionLabel = `วางช่อง ${pos} (ซ้ายสุด)`
                } else {
                  positionLabel = `วางช่องที่ ${pos} จากขวา`
                }
              } else if (dir === 'fb') {
                // FB: หน้า = EXP ก่อน
                if (pos === 1) {
                  positionLabel = 'วางช่อง 1 (หน้าสุด)'
                } else if (pos === par) {
                  positionLabel = `วางช่อง ${pos} (หลังสุด)`
                } else {
                  positionLabel = `วางช่องที่ ${pos} จากด้านหน้า`
                }
              } else {
                // LTR: ซ้าย = EXP ก่อน
                if (pos === 1) {
                  positionLabel = 'วางช่อง 1 (ซ้ายสุด)'
                } else if (pos === par) {
                  positionLabel = `วางช่อง ${pos} (ขวาสุด)`
                } else {
                  positionLabel = `วางช่องที่ ${pos} จากซ้าย`
                }
              }
            }
            
            return (
              <div key={idx} style={{ background:'rgba(0,0,0,0.25)', borderRadius:12, padding:12, border:'1px solid rgba(255,255,255,0.1)' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#fff', background:'rgba(255,255,255,0.1)', width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{itemDrug.name}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>
                        EXP {fmtMY(item.expiry)} · {item.qty || item.returnLots?.reduce((s,l)=>s+l.qty,0) || 1} {itemDrug.unit}
                      </div>
                    </div>
                  </div>
                  {isSingle && (
                    <div style={{ fontSize:10, padding:'3px 8px', borderRadius:12, background:'rgba(245,166,35,0.2)', color:'#F5A623', fontWeight:600 }}>
                      Single stock
                    </div>
                  )}
                </div>
                
                {/* Position Info */}
                {isSingle ? (
                  // Single Stock
                  <div style={{ background:'rgba(245,166,35,0.1)', border:'1px solid rgba(245,166,35,0.3)', borderRadius:8, padding:10 }}>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginBottom:6, display:'flex', alignItems:'center', gap:4 }}>
                      <span>📦</span>
                      <span>Slot {item.groupName || 'M-04'}</span>
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.85)' }}>
                      Single stock - วางตรงนี้แล้วนำของเดิมออก FEFO
                    </div>
                  </div>
                ) : (
                  // Multi-lot
                  <div style={{ background:'rgba(93,219,167,0.08)', border:'1px solid rgba(93,219,167,0.2)', borderRadius:8, padding:10 }}>
                    {/* Position Label */}
                    <div style={{ fontSize:12, color:'#5DDBA7', fontWeight:600, marginBottom:4 }}>
                      {positionLabel}
                    </div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>
                      EXP ใหม่กว่าของเดิม - อยู่ตำแหน่งตรง
                    </div>
                    
                    {/* Timeline */}
                    {item.pa && (
                      <div style={{ marginTop:8 }}>
                        <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', marginBottom:4, display:'flex', justifyContent:'space-between' }}>
                          {item.pa.direction === 'rtl' ? (
                            <>
                              <span>← ซ้าย</span>
                              <span>ขวา (หยิบก่อน) →</span>
                            </>
                          ) : item.pa.direction === 'fb' ? (
                            <>
                              <span>← หน้า (หยิบก่อน)</span>
                              <span>หลัง →</span>
                            </>
                          ) : (
                            <>
                              <span>← ซ้าย (หยิบก่อน)</span>
                              <span>ขวา →</span>
                            </>
                          )}
                        </div>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {/* Build timeline array และ reverse สำหรับ RTL */}
                          {(() => {
                            const timelineItems = []
                            
                            // Build timeline
                            item.pa.existingLots?.forEach((lot, lotIdx) => {
                              const lotPosition = lotIdx + 1
                              const isNewPosition = lotPosition === item.pa.position
                              
                              if (isNewPosition) {
                                timelineItems.push(
                                  <div key={`new-${lotIdx}`} style={{ fontSize:9, padding:'4px 6px', borderRadius:6, background:'rgba(93,219,167,0.3)', border:'1px solid rgba(93,219,167,0.5)', color:'#5DDBA7', fontWeight:700, display:'flex', alignItems:'center', gap:2 }}>
                                    <span>📍</span>
                                    <span>วาง</span>
                                  </div>
                                )
                              }
                              
                              timelineItems.push(
                                <div key={lotIdx} style={{ fontSize:9, padding:'4px 6px', borderRadius:6, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.6)' }}>
                                  {fmtMY(lot.expiry)}
                                </div>
                              )
                            })
                            
                            // Add "วาง" at the end if position = last
                            if (item.pa.position === (item.pa.existingLots?.length || 0) + 1) {
                              timelineItems.push(
                                <div key="new-last" style={{ fontSize:9, padding:'4px 6px', borderRadius:6, background:'rgba(93,219,167,0.3)', border:'1px solid rgba(93,219,167,0.5)', color:'#5DDBA7', fontWeight:700, display:'flex', alignItems:'center', gap:2 }}>
                                  <span>📍</span>
                                  <span>วาง</span>
                                </div>
                              )
                            }
                            
                            // Reverse สำหรับ RTL
                            if (item.pa.direction === 'rtl') {
                              return timelineItems.reverse()
                            }
                            
                            return timelineItems
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        <button onClick={onDone} style={{ background:'#5DDBA7', border:'none', borderRadius:12, padding:13, color:'#050D0A', fontFamily:'inherit', fontSize:14, fontWeight:800, cursor:'pointer', width:'100%' }}>
          ✓ ยืนยัน — วางยาแล้ว
        </button>
      </div>
    )
  }
  
  // ── Single-Stock: overlay แบบง่าย "วางแทนของเดิม" ──
  if (singleStock) {
    return (
      <div className="overlay" style={{ background:'#0F4A38', alignItems:'stretch', justifyContent:'flex-start', padding:16, overflowY:'auto', gap:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ fontSize:17, fontWeight:800, color:'#fff' }}>{drug.name}</div>
          <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, fontWeight:700, background:'rgba(255,255,255,0.1)', color:'#9FE1CB', border:'1px solid rgba(255,255,255,0.2)' }}>
            Single-Stock · {context === 'return' ? 'คืนยา' : 'รับเข้า'}
          </span>
          <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, fontWeight:700, background:'rgba(245,166,35,0.15)', color:'#F5A623', marginLeft:'auto' }}>
            {qty} {drug.unit}
          </span>
        </div>
        <div style={{ textAlign:'center', margin:'10px 0 6px', fontSize:52 }}>🔄</div>
        <div style={{ fontSize:21, fontWeight:800, color:'#fff', textAlign:'center', marginBottom:4 }}>วางแทนของเดิม</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', textAlign:'center', marginBottom:16, lineHeight:1.5 }}>
          ยานี้มีสต็อกสูงสุด 1 ชิ้น<br/>นำยาเก่าออก แล้ววางยาใหม่แทน
        </div>
        <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:14, marginBottom:12 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>📍 ตำแหน่งเก็บยา</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#5DDBA7' }}>{groupIcon} {groupName}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:4 }}>นำยาชิ้นเก่าออกก่อน แล้ววางชิ้นใหม่แทนที่</div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'10px 12px', marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', fontSize:12, color:'rgba(255,255,255,0.85)', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            <span>{context === 'return' ? 'ยาที่คืน' : 'ยาที่รับเข้า'}</span>
            <span style={{ background:'rgba(255,255,255,0.18)', borderRadius:20, padding:'3px 10px', fontSize:11 }}>{drug.name}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', fontSize:12, color:'rgba(255,255,255,0.85)', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            <span>EXP ของยานี้</span>
            <span style={{ background:'rgba(245,200,74,0.2)', color:'#F5C84A', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700 }}>{fmtMY(expiry)} (อีก {daysLeft(expiry)} วัน)</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', fontSize:12, color:'rgba(255,255,255,0.85)' }}>
            <span>จำนวน</span>
            <span style={{ background:'rgba(255,255,255,0.18)', borderRadius:20, padding:'3px 10px', fontSize:11 }}>{qty} {drug.unit}</span>
          </div>
        </div>
        <button onClick={onDone} style={{ background:'#5DDBA7', border:'none', borderRadius:12, padding:13, color:'#050D0A', fontFamily:'inherit', fontSize:14, fontWeight:800, cursor:'pointer', width:'100%' }}>
          ✓ รับทราบ — วางยาแล้ว
        </button>
      </div>
    )
  }
  const dir = pa.direction || 'fb'

  // รองรับทั้ง single lot (expiry/qty) และ multi lot (returnLots array)
  const retLots = returnLots
    ? [...returnLots].sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    : [{ expiry, qty: qty || 1 }]

  const RETURN_COLORS = [
    { bg:'#0F4A38', border:'#5DDBA7', text:'#fff', label:'#5DDBA7' },
    { bg:'#3D1F5A', border:'#C09EF5', text:'#fff', label:'#C09EF5' },
    { bg:'#56360A', border:'#F5C842', text:'#fff', label:'#F5C842' },
  ]

  // รวม existing lots + ทุก return lot แล้ว sort ascending EXP
  const existingLots = pa.existingLots || []
  const allSorted = [
    ...existingLots.map(l => ({ exp: l.exp, expiry: l.expiry, isReturn: false, retIdx: -1 })),
    ...retLots.map((l, i) => ({ exp: fmtMY(l.expiry), expiry: l.expiry, qty: l.qty, isReturn: true, retIdx: i })),
  ].sort((a, b) => new Date(a.expiry) - new Date(b.expiry))

  const total = allSorted.length
  const totalRetQty = retLots.reduce((s, l) => s + (l.qty || 1), 0)

  // ── helper: ตำแหน่งของแต่ละ return lot ──
  const getPosInfo = (retIdx) => {
    const idx = allSorted.findIndex(l => l.isReturn && l.retIdx === retIdx)
    const prev = allSorted[idx - 1]
    const next = allSorted[idx + 1]
    let posText = ''
    if (total === 1) {
      posText = 'วางได้เลย (lot แรกในชั้น)'
    } else if (dir === 'fb') {
      if (idx === 0)          posText = `วางหน้าสุด (อันดับที่ 1/${total})`
      else if (idx === total-1) posText = `วางหลังสุด (อันดับที่ ${idx+1}/${total})`
      else                    posText = `วางอันดับที่ ${idx+1} จาก ${total} lot`
    } else if (dir === 'ltr') {
      if (idx === 0)          posText = `วางซ้ายสุด (อันดับที่ 1/${total})`
      else if (idx === total-1) posText = `วางขวาสุด (อันดับที่ ${idx+1}/${total})`
      else                    posText = `วางอันดับที่ ${idx+1} จาก ${total} lot`
    } else { // rtl
      if (idx === 0)          posText = `วางขวาสุด (อันดับที่ 1/${total})`
      else if (idx === total-1) posText = `วางซ้ายสุด (อันดับที่ ${total}/${total})`
      else                    posText = `วางอันดับที่ ${total - idx} จาก ${total} lot`
    }
    let posDetail = ''
    if (dir === 'rtl') {
      if (prev && next) posDetail = `ระหว่าง ${next.exp} (ซ้าย) และ ${prev.exp} (ขวา)`
      else if (prev)    posDetail = `ทางซ้ายของ ${prev.exp}`
      else if (next)    posDetail = `ทางขวาของ ${next.exp}`
    } else if (dir === 'fb') {
      if (prev && next) posDetail = `ระหว่าง ${prev.exp} (หน้า) และ ${next.exp} (หลัง)`
      else if (prev)    posDetail = `หลัง ${prev.exp}`
      else if (next)    posDetail = `หน้า ${next.exp}`
    } else {
      if (prev && next) posDetail = `ระหว่าง ${prev.exp} และ ${next.exp}`
      else if (prev)    posDetail = `หลัง ${prev.exp}`
      else if (next)    posDetail = `หน้า ${next.exp}`
    }
    return { posText, posDetail }
  }

  // ── Palette ──
  const palMap = {
    ltr: { pickClr:'#5DDBA7', cardBorder:'rgba(93,219,167,0.25)'  },
    rtl: { pickClr:'#C09EF5', cardBorder:'rgba(192,158,245,0.25)' },
    fb:  { pickClr:'#66B8E5', cardBorder:'rgba(102,184,229,0.25)' },
  }
  const c = palMap[dir] || palMap.fb
  const isHoriz = dir === 'ltr' || dir === 'rtl'
  const pickArrow = dir === 'ltr' ? '←' : dir === 'rtl' ? '→' : ''
  const ovBg  = dir === 'rtl' ? '#120A1A' : dir === 'ltr' ? '#0A1810' : '#0A1218'
  const cardBg = 'rgba(255,255,255,0.07)'
  const dimTxt = 'rgba(255,255,255,0.5)'

  // สำหรับ RTL แสดงจากขวาไปซ้าย → reverse
  const displayLots = dir === 'rtl' ? [...allSorted].reverse() : allSorted
  // fb: หน้าอยู่ล่าง หลังอยู่บน
  const fbLots = [...allSorted].reverse()

  const pillStyle = { background:'rgba(255,255,255,0.18)', borderRadius:20, padding:'3px 10px', fontSize:11, color:'#fff' }
  const rowStyle  = { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', fontSize:12, color:'rgba(255,255,255,0.85)', borderBottom:'1px solid rgba(255,255,255,0.08)' }

  return (
    <div className="overlay" style={{ background:ovBg, alignItems:'stretch', justifyContent:'flex-start', padding:16, overflowY:'auto', gap:0 }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <div style={{ fontSize:17, fontWeight:800, color:'#fff' }}>{drug.name}</div>
        <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, fontWeight:700, background:'rgba(255,255,255,0.1)', color:c.pickClr, border:`1px solid ${c.cardBorder}` }}>
          {context === 'return' ? 'คืนยา' : 'รับเข้า'}
        </span>
        <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, fontWeight:700, background:'rgba(245,166,35,0.15)', color:'#F5A623', marginLeft:'auto' }}>
          {totalRetQty} {drug.unit}
        </span>
      </div>

      {/* ── Shelf card ── */}
      <div style={{ background:cardBg, borderRadius:14, padding:'12px 10px', marginBottom:10, border:`1px solid ${c.cardBorder}` }}>
        {isHoriz ? (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:10, fontWeight:600 }}>
              {dir === 'rtl'
                ? <><span style={{ color:dimTxt }}>◄ ซ้าย</span><span style={{ color:c.pickClr }}>ขวา (หยิบก่อน) ►</span></>
                : <><span style={{ color:c.pickClr }}>◄ ซ้าย (หยิบก่อน)</span><span style={{ color:dimTxt }}>ขวา ►</span></>}
            </div>
            <div style={{ display:'flex', gap:5, overflowX:'auto' }}>
              {displayLots.map((l, i) => {
                const rc = l.isReturn ? RETURN_COLORS[l.retIdx] : null
                return (
                  <div key={i} style={{
                    flex:1, minWidth:52, borderRadius:9, padding:'8px 4px', textAlign:'center',
                    background: rc ? rc.bg : 'rgba(255,255,255,0.1)',
                    border: rc ? `2px solid ${rc.border}` : '1.5px solid rgba(255,255,255,0.15)',
                    color: rc ? rc.text : 'rgba(255,255,255,0.7)',
                    position:'relative', marginTop: l.isReturn ? 22 : 0,
                    boxShadow: rc ? `0 0 10px ${rc.border}44` : 'none',
                  }}>
                    {l.isReturn && (
                      <div style={{ position:'absolute', top:-18, left:'50%', transform:'translateX(-50%)', fontSize:9, fontWeight:800, color:rc.label, whiteSpace:'nowrap', background:ovBg, padding:'1px 5px', borderRadius:4 }}>
                        ▶ {retLots.length > 1 ? `lot ${l.retIdx + 1}` : 'วาง'}
                      </div>
                    )}
                    <div style={{ fontSize:11, fontWeight:800 }}>{l.exp}</div>
                    <div style={{ fontSize:9, marginTop:2, opacity:0.8 }}>{l.isReturn ? 'คืน' : 'เดิม'}</div>
                    {l.isReturn && <div style={{ fontSize:9, marginTop:3, color:rc.label, fontWeight:700 }}>{pickArrow} วาง</div>}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <>
            {/* FB: หลังอยู่บน หน้าอยู่ล่าง — each row: [num+label | EXP+type | arrow] */}
            <div style={{ fontSize:9, color:dimTxt, fontWeight:600, textAlign:'center', marginBottom:8, letterSpacing:1 }}>↑ หลังชั้น</div>
            {/* กล่องยา compact — จัดกึ่งกลาง ไม่เต็มหน้าจอ */}
            <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' }}>
              {fbLots.map((l, i) => {
                const rc = l.isReturn ? RETURN_COLORS[l.retIdx] : null
                const realIdx = allSorted.indexOf(l)
                const isFront = realIdx === 0, isBack = realIdx === total - 1
                const posWord = isFront ? 'หน้าสุด' : isBack ? 'หลังสุด' : `ที่ ${realIdx + 1}`
                return (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', borderRadius:10, overflow:'hidden',
                    width:180, minHeight:82,
                    background: rc ? rc.bg : 'rgba(255,255,255,0.07)',
                    border: rc ? `2px solid ${rc.border}` : '1.5px solid rgba(255,255,255,0.1)',
                    boxShadow: rc ? `0 0 12px ${rc.border}33` : 'none',
                  }}>
                    {/* Left badge */}
                    <div style={{
                      width:52, flexShrink:0, display:'flex', flexDirection:'column',
                      alignItems:'center', justifyContent:'center', padding:'8px 4px',
                      borderRight:'1px solid rgba(255,255,255,0.08)', alignSelf:'stretch',
                    }}>
                      <div style={{ fontSize:12, fontWeight:700, lineHeight:1, color: rc ? rc.label : 'rgba(255,255,255,0.4)' }}>{realIdx + 1}</div>
                      <div style={{ fontSize:12, fontWeight:800, marginTop:2, color: rc ? rc.label : 'rgba(255,255,255,0.3)' }}>{posWord}</div>
                    </div>
                    {/* Right: EXP + type + arrow */}
                    <div style={{ flex:1, padding:'0 8px' }}>
                      <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{l.exp}</div>
                      <div style={{ fontSize:9, marginTop:2, color: rc ? rc.label : 'rgba(255,255,255,0.4)' }}>
                        {l.isReturn ? (retLots.length > 1 ? `คืน lot ${l.retIdx + 1}` : 'คืน') : 'เดิม'}
                        {l.isReturn ? <span style={{ marginLeft:4, fontWeight:800 }}>← วาง</span> : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Shelf edge glow — หน้าชั้น */}
            <div style={{ position:'relative', marginTop:6, height:28, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ position:'absolute', top:0, left:12, right:12, height:2, background:'linear-gradient(to right,transparent,#5DDBA7,transparent)', borderRadius:2 }} />
              <div style={{ fontSize:10, fontWeight:700, color:'#5DDBA7', marginTop:10, display:'flex', alignItems:'center', gap:5 }}>
                <span>🖐</span> หน้าชั้น — หยิบจากนี้ก่อน
              </div>
            </div>
          </>
        )}
        <div style={{ textAlign:'center', fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:7, paddingTop:7, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          📋 เรียงตาม EXP — {total} lots ทั้งหมด (เติมใหม่ {totalRetQty} {drug.unit})
        </div>
      </div>

      {/* ── Position guides — 1 card per return lot ── */}
      {retLots.map((rl, ri) => {
        const { posText, posDetail } = getPosInfo(ri)
        const rc = RETURN_COLORS[ri]
        return (
          <div key={ri} style={{ background:cardBg, borderRadius:12, padding:'10px 12px', marginBottom:8, borderLeft:`3px solid ${rc.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:700, background:rc.bg, color:rc.text, border:`1px solid ${rc.border}` }}>
                {retLots.length > 1 ? `lot ${ri + 1} · ` : ''}{fmtMY(rl.expiry)}
              </span>
              <span style={{ fontSize:10, color:dimTxt }}>{rl.qty || 1} {drug.unit} · อีก {daysLeft(rl.expiry)} วัน</span>
            </div>
            <div style={{ fontSize:13, fontWeight:800, color:rc.label }}>📍 {posText}</div>
            {posDetail && <div style={{ fontSize:11, color:dimTxt, marginTop:2 }}>{posDetail}</div>}
          </div>
        )
      })}

      <button onClick={onDone} style={{ background:c.pickClr, border:'none', borderRadius:12, padding:13, color:'#050D0A', fontFamily:'inherit', fontSize:14, fontWeight:800, cursor:'pointer', width:'100%', marginTop:4 }}>
        ✓ รับทราบ — วางยาแล้ว
      </button>
    </div>
  )
}

/* ═══ MAIN APP ═══ */
export default function App() {
  const [loading, setLoading] = useState(true)
  const [curTab, setCurTab] = useState('dashboard')
  const [putaway, setPutaway] = useState(null)
  const [qModal, setQModal] = useState(false)
  const [globalScanOpen, setGlobalScanOpen] = useState(false)
  const [qModalInitDrug, setQModalInitDrug] = useState('')
  const [smartTimestampModal, setSmartTimestampModal] = useState(false)
  const [replaceModal, setReplaceModal] = useState(false)
  const [replacePending, setReplacePending] = useState(null)
  const [missingReturnModal, setMissingReturnModal] = useState(false)
  const [missingReturnPending, setMissingReturnPending] = useState(null)
  const [expirySearchOverride, setExpirySearchOverride] = useState('')

  // Data state
  const [drugs, setDrugs] = useState([])
  const [lots, setLots] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [checks, setChecks] = useState([])
  const [removals, setRemovals] = useState([])
  const [expirySnapshots, setExpirySnapshots] = useState([])
  const [pendingSyncs, setPendingSyncs] = useState([])
  const [nurses, setNurses] = useState([])
  const [seeded, setSeeded] = useState(false)
  const [locationDirs, setLocationDirs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('termya_loc_dirs') || '{}') } catch { return {} }
  })
  const saveLocDir = (groupId, dir) => {
    const next = { ...locationDirs, [groupId]: dir }
    setLocationDirs(next)
    localStorage.setItem('termya_loc_dirs', JSON.stringify(next))
  }

  // ── Seed initial data ──
  useEffect(() => {
    const init = async () => {
      try {
        // Seed drugs if empty
        const snap = await getDocs(collection(db, 'drugs'))
        if (snap.empty) {
          const batch = writeBatch(db)
          DRUG_MASTER.forEach(d => {
            batch.set(doc(db, 'drugs', String(d.id)), d)
          })
          await batch.commit()
        }
      } catch (e) { console.error('Seed drugs error:', e) }

      try {
        // Seed nurses if empty (separate try/catch so drugs error won't block this)
        const nSnap = await getDocs(collection(db, 'nurses'))
        if (nSnap.empty) {
          const batch2 = writeBatch(db)
          DEFAULT_NURSES.forEach((n, i) => {
            batch2.set(doc(db, 'nurses', String(i)), { name: n, order: i })
          })
          await batch2.commit()
        }
      } catch (e) { console.error('Seed nurses error:', e) }

      setSeeded(true)
    }
    init()
  }, [])

  // ── Real-time listeners ──
  useEffect(() => {
    if (!seeded) return
    const unsubs = []
    unsubs.push(onSnapshot(collection(db, 'drugs'), s => {
      setDrugs(s.docs.map(d => ({ docId: d.id, ...d.data() })))
    }))
    unsubs.push(onSnapshot(collection(db, 'lots'), s => {
      setLots(s.docs.map(d => ({ docId: d.id, ...d.data() })))
    }))
    unsubs.push(onSnapshot(query(collection(db, 'withdrawals'), orderBy('ts', 'desc')), s => {
      setWithdrawals(s.docs.map(d => ({ docId: d.id, ...d.data() })))
    }))
    unsubs.push(onSnapshot(query(collection(db, 'checks'), orderBy('ts', 'desc')), s => {
      setChecks(s.docs.map(d => ({ docId: d.id, ...d.data() })))
    }))
    unsubs.push(onSnapshot(query(collection(db, 'stock_removals'), orderBy('ts', 'desc')), s => {
      setRemovals(s.docs.map(d => ({ docId: d.id, ...d.data() })))
    }))
    unsubs.push(onSnapshot(query(collection(db, 'expiry_snapshots'), orderBy('ts', 'desc')), s => {
      setExpirySnapshots(s.docs.map(d => ({ docId: d.id, ...d.data() })))
    }))
    unsubs.push(onSnapshot(collection(db, 'nurses'), s => {
      const ns = s.docs.map(d => d.data()).sort((a, b) => (a.order || 0) - (b.order || 0))
      setNurses(ns.map(n => n.name))
    }))
    unsubs.push(onSnapshot(query(collection(db, 'pending_syncs'), orderBy('timestamp', 'desc')), s => {
      setPendingSyncs(s.docs.map(d => ({ docId: d.id, ...d.data() })))
    }))
    setLoading(false)
    return () => unsubs.forEach(u => u())
  }, [seeded])

  // ── Auto Expiry Snapshot (ทุกครั้งที่เปิดแอป ถ้ายังไม่มี snapshot เดือนที่แล้ว) ──
  useEffect(() => {
    if (!lots.length || !drugs.length) return
    const now = new Date()
    // คำนวณเดือนที่แล้ว
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth()+1).padStart(2,'0')}`
    // ตรวจว่ามี snapshot เดือนที่แล้วแล้วหรือยัง
    const alreadyExists = expirySnapshots.some(s => s.monthKey === prevYM)
    if (alreadyExists) return
    // สร้าง snapshot
    const EXCHANGE_START = 211
    const daysLeftFn = (expiry) => {
      const exp = new Date(expiry); exp.setHours(0,0,0,0)
      const today = new Date(); today.setHours(0,0,0,0)
      return Math.ceil((exp - today) / 86400000)
    }
    const activeLots = lots.filter(l => l.qty > 0 && l.expiry !== '2099-12-31' && !l.loaned)
    const snapItems = activeLots.map(l => {
      const drug = drugs.find(d => String(d.id) === String(l.drugId))
      const dl = daysLeftFn(l.expiry)
      const status = dl <= 0 ? 'หมดอายุ'
        : dl < EXCHANGE_START ? 'เกินเวลาแลก'
        : dl <= 220 ? 'ถึงเวลาแลก'
        : null
      if (!status) return null
      return { drugName: drug?.name || '', expiry: l.expiry, daysLeft: dl, qty: l.qty, unit: drug?.unit || '', status }
    }).filter(Boolean)
    // allDrugStocks: สต็อกทุกตัว ณ เวลา snapshot
    const allDrugStocks = drugs.map(d => {
      const dLots = lots.filter(l => String(l.drugId) === String(d.id))
      const stock = dLots.reduce((s,l) => s + (l.qty||0), 0)
      const fefoLot = [...dLots].filter(l => l.qty > 0 && l.expiry !== '2099-12-31').sort((a,b) => new Date(a.expiry)-new Date(b.expiry))[0]
      const fefoExp = fefoLot?.expiry || null
      const status = stock <= 0 ? 'หมด' : stock <= (d.min||0) ? 'Low' : 'ปกติ'
      return { id: d.id, name: d.name, stock, par: d.par||0, min: d.min||0, fefoExp, status, unit: d.unit||'' }
    })
    // nearExpiryLots: lot ใกล้หมดอายุตาม alertDays
    const nearExpiryLots = lots.filter(l => {
      if (!l.qty || l.expiry === '2099-12-31' || l.loaned) return false
      const drug = drugs.find(d => String(d.id) === String(l.drugId))
      if (!drug) return false
      const dl = daysLeftFn(l.expiry)
      return dl >= 0 && dl <= (drug.alertDays || 30)
    }).map(l => {
      const drug = drugs.find(d => String(d.id) === String(l.drugId))
      const dl = daysLeftFn(l.expiry)
      return { drugName: drug?.name||'', expiry: l.expiry, daysLeft: dl, alertDays: drug?.alertDays||30, qty: l.qty, unit: drug?.unit||'', loaned: l.loaned||false }
    })
    const payload = {
      monthKey: prevYM,
      ts: Timestamp.now(),
      items: snapItems,
      expiredCount:  snapItems.filter(i=>i.status==='หมดอายุ').length,
      overdueCount:  snapItems.filter(i=>i.status==='เกินเวลาแลก').length,
      dueCount:      snapItems.filter(i=>i.status==='ถึงเวลาแลก').length,
      allDrugStocks,
      nearExpiryLots,
    }
    setDoc(doc(db, 'expiry_snapshots', prevYM), payload)
      .then(() => console.log(`[Term-Ya] Auto snapshot saved: ${prevYM}`))
      .catch(e => console.error('[Term-Ya] Snapshot error:', e))
  }, [lots, drugs, expirySnapshots])

  // ── Computed helpers ──
  const stockOf = useCallback(id => lots.filter(l => l.drugId == id).reduce((s, l) => s + (l.qty || 0), 0), [lots])
  const lotsOf = useCallback(id => lots.filter(l => l.drugId == id && l.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry)), [lots])
  const fefoOf = useCallback(id => { const ls = lotsOf(id); return ls.length ? ls[0] : null }, [lotsOf])
  const drugsWithStock = useCallback(() => drugs.map(d => ({ ...d, stock: stockOf(d.id), fefoExp: fefoOf(d.id)?.expiry })), [drugs, stockOf, fefoOf])

  const getDrugDir = useCallback((drugId) => {
    const drug = drugs.find(d => String(d.id) === String(drugId))
    if (drug?.shelfDirectionOverride && drug.shelfDirectionOverride !== 'inherit') return drug.shelfDirectionOverride
    const group = STORAGE_GROUPS.find(g => g.id === drug?.groupId)
    return locationDirs[drug?.groupId] || group?.shelfDirection || 'fb'
  }, [drugs, locationDirs])

  const calcPutaway = useCallback((drugId, retExp) => {
    const ex = lotsOf(drugId)
    const dir = getDrugDir(drugId)
    const pickSide = dir === 'fb' ? 'หน้าชั้น' : dir === 'ltr' ? 'ซ้าย' : 'ขวา'
    const putSide  = dir === 'fb' ? 'หลังชั้น' : dir === 'ltr' ? 'ขวา'   : 'ซ้าย'
    const labelPick = dir === 'fb' ? 'วางหน้าสุด'  : dir === 'ltr' ? 'วางซ้ายสุด'  : 'วางขวาสุด'
    const labelPut  = dir === 'fb' ? 'วางหลังสุด' : dir === 'ltr' ? 'วางขวาสุด' : 'วางซ้ายสุด'
    // existing lots sorted ascending by EXP — ส่งให้ overlay แสดงตำแหน่งจริง
    const sortedEx = [...ex].sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    const existingLots = sortedEx.map(l => ({ exp: fmtMY(l.expiry), expiry: l.expiry }))
    if (!ex.length) return { isFEFOSide: true, label: labelPick, reason: 'lot แรกในสต็อก', direction: dir, pickSide, putSide, existingLots }
    const fefoMs = new Date(ex[0].expiry).getTime()
    const retMs  = new Date(retExp).getTime()
    const isBeforeFefo = retMs < fefoMs  // EXP เท่ากัน → วางหลัง (ของเดิมอยู่ก่อน)
    return isBeforeFefo
      ? { isFEFOSide: true,  label: labelPick, reason: `EXP ≤ FEFO (${fmtMY(ex[0].expiry)}) → ${labelPick}`, direction: dir, pickSide, putSide, existingLots }
      : { isFEFOSide: false, label: labelPut,  reason: `EXP > FEFO (${fmtMY(ex[0].expiry)}) → ${labelPut}`,  direction: dir, pickSide, putSide, existingLots }
  }, [lotsOf, getDrugDir, fmtMY])

  // Exchange window constants (days before EXP)
  const EXCHANGE_END   = 220  // ถึงเวลาแลก: 211-220 วันก่อน EXP
  const EXCHANGE_START = 211  // เกินเวลาแลก: ≤ 210 วัน (ยังไม่หมด)

  const getAlerts = () => {
    const dl = drugsWithStock()
    const drugAlertMap = dl.reduce((m, d) => { m[d.id] = d.alertDays || 30; return m }, {})
    return {
      low:          dl.filter(d => !d.singleStock && d.stock > 0 && d.stock <= d.min),
      out:          dl.filter(d => d.stock <= 0),
      exp:          lots.filter(l => l.qty > 0 && !l.loaned && daysLeft(l.expiry) <= 0 && l.expiry !== '2099-12-31'),
      soon:         lots.filter(l => {
        if (!l.qty || l.expiry === '2099-12-31') return false
        const d = daysLeft(l.expiry)
        const threshold = drugAlertMap[l.drugId] ?? 30
        return d > 0 && d <= threshold
      }),
      // Exchange Due: 211–220 วันก่อน EXP = ถึงเวลาแลกคืน
      exchangeDue:  lots.filter(l => {
        if (!l.qty || l.loaned || l.expiry === '2099-12-31') return false
        const d = daysLeft(l.expiry)
        return d >= EXCHANGE_START && d <= EXCHANGE_END
      }),
      // Exchange Overdue: ≤ 210 วัน แต่ยังไม่หมด = เกินเวลาแลกแล้ว (ไม่นับยาฝากใช้)
      exchangeOver: lots.filter(l => {
        if (!l.qty || l.loaned || l.expiry === '2099-12-31') return false
        const d = daysLeft(l.expiry)
        return d > 0 && d < EXCHANGE_START
      }),
    }
  }

  const TABS = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'check',     icon: '✅', label: 'Stock Count' },
    { id: 'withdraw',  icon: '💊', label: 'Restock' },
    { id: 'expiry',    icon: '📅', label: 'Expiry' },
    { id: 'pending',   icon: '⏱', label: 'Pending' },
    { id: 'history',   icon: '📋', label: 'History' },
    { id: 'export',    icon: '📤', label: 'Export' },
    { id: 'setting',   icon: '⚙️', label: 'Setting' },
  ]

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="loading"><div className="spinner"/><div style={{ color: '#5F7A6A', fontSize: 13 }}>กำลังโหลด...</div></div>
    </>
  )

  const handleGlobalScan = (drugName) => {
    setGlobalScanOpen(false)
    const dl = drugsWithStock()
    const drug = dl.find(d => d.name === drugName)
    if (!drug) { alert(`ไม่พบยา: ${drugName}`); return }
    if (curTab === 'expiry') {
      setExpirySearchOverride(drugName)
    } else {
      setQModalInitDrug(drugName)
      setQModal(true)
    }
  }

  const alerts = getAlerts()
  const alertCount = alerts.low.length + alerts.out.length + alerts.exp.length + alerts.exchangeDue.length + alerts.exchangeOver.length
  const unret = withdrawals.filter(w => !w.pending_sync_id && w.usage_type !== 'Missing_Tracked' && w.usage_type !== 'Missing_Unknown' && w.usage_type !== 'Emergency' && (!w.returned || (w.returned_qty !== undefined && w.returned_qty < w.qty)))
  const lastCheck = checks[0]

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Topbar */}
        <div className="bar">
          <div className="bar-row">
            <div>
              <div className="bar-title">💊 Term-Ya Application</div>
              <div className="bar-sub">Bangkok Hospital Chanthaburi : ICU-B</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => setGlobalScanOpen(true)}
                style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:20, padding:'5px 12px', color:'#fff', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                📷 สแกน
              </button>
              {alertCount > 0 && (
                <div className="alert-chip" onClick={() => setCurTab('expiry')}>
                  🔔 {alertCount} Alert
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="scroll">
          {putaway && (
            <PutawayOverlay {...putaway} onDone={() => setPutaway(null)} />
          )}
          {curTab === 'dashboard' && (
            <Dashboard
              drugsWithStock={drugsWithStock} alerts={alerts} unret={unret}
              lastCheck={lastCheck} lots={lots} lotsOf={lotsOf}
              calcPutaway={calcPutaway} nurses={nurses}
              setCurTab={setCurTab} setPutaway={setPutaway}
              db={db} fmtMY={fmtMY} daysLeft={daysLeft} setQModal={setQModal}
              setSmartTimestampModal={setSmartTimestampModal}
              pendingSyncs={pendingSyncs}
            />
          )}
          {curTab === 'check' && (
            <StockCount
              drugs={drugsWithStock()} nurses={nurses} lots={lots} lotsOf={lotsOf}
              db={db} fmtMY={fmtMY} daysLeft={daysLeft}
            />
          )}
          {curTab === 'withdraw' && (
            <Withdraw
              drugs={drugsWithStock()} nurses={nurses} lots={lots} lotsOf={lotsOf}
              withdrawals={unret} calcPutaway={calcPutaway}
              db={db} fmtMY={fmtMY} setPutaway={setPutaway}
            />
          )}
          {curTab === 'expiry' && (
            <Expiry lots={lots} drugs={drugs} daysLeft={daysLeft} fmtMY={fmtMY} db={db}
              removals={removals} nurses={nurses} drugsWithStock={drugsWithStock}
              searchOverride={expirySearchOverride} onSearchOverrideClear={() => setExpirySearchOverride('')} />
          )}
          {curTab === 'history' && (
            <History withdrawals={withdrawals} checks={checks} lots={lots}
              lotsOf={lotsOf} calcPutaway={calcPutaway} fmtDT={fmtDT} fmtMY={fmtMY}
              daysLeft={daysLeft} db={db} setPutaway={setPutaway}
              nurses={nurses} drugs={drugsWithStock()}
            />
          )}
          {curTab === 'export' && (
            <Export
              drugsWithStock={drugsWithStock} lots={lots} withdrawals={withdrawals} expirySnapshots={expirySnapshots}
              checks={checks} daysLeft={daysLeft} fmtMY={fmtMY}
              calcPutaway={calcPutaway} lotsOf={lotsOf} removals={removals}
            />
          )}
          {curTab === 'pending' && (
            <PendingView
              pendingSyncs={pendingSyncs}
              withdrawals={withdrawals}
              drugs={drugs}
              nurses={nurses}
              db={db}
              setReplaceModal={(p) => { setReplacePending(p); setReplaceModal(true) }}
              setMissingReturnModal={(p) => { setMissingReturnPending(p); setMissingReturnModal(true) }}
              fmtDTsafe={fmtDTsafe}
              lots={lots}
              drugsWithStock={drugsWithStock}
              getDrugDir={getDrugDir}
              setPutaway={setPutaway}
              calcPutaway={calcPutaway}
            />
          )}
          {curTab === 'setting' && (
            <Setting
              drugs={drugs} nurses={nurses} db={db}
              locationDirs={locationDirs} saveLocDir={saveLocDir}
            />
          )}
        </div>

        {/* Bottom Nav */}
        <nav className="bnav">
          {TABS.map(t => (
            <button key={t.id} className={`bni${curTab === t.id ? ' on' : ''}`} onClick={() => setCurTab(t.id)}>
              {t.id === 'expiry' && alertCount > 0 && <div className="nav-dot"/>}
              {t.id === 'pending' && pendingSyncs.filter(p => p.status === 'pending').length > 0 && <div className="nav-dot pulse"/>}
              <div className="bni-icon">{t.icon}</div>
              <span className="bni-label">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <QuickUseModal open={qModal} onClose={() => { setQModal(false); setQModalInitDrug('') }} drugsWithStock={drugsWithStock} lots={lots} nurses={nurses} db={db} initDrug={qModalInitDrug} />
      {globalScanOpen && <QrScanModal onScan={handleGlobalScan} onClose={() => setGlobalScanOpen(false)} drugs={drugsWithStock()} />}
      {smartTimestampModal && (
        <SmartTimestampModal
          open={smartTimestampModal}
          onClose={() => setSmartTimestampModal(false)}
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
          getDrugDir={getDrugDir}
          withdrawals={withdrawals}
          setPutaway={setPutaway}
          calcPutaway={calcPutaway}
        />
      )}
      {missingReturnModal && (
        <ReplaceModal
          open={missingReturnModal}
          onClose={() => { setMissingReturnModal(false); setMissingReturnPending(null) }}
          pending={missingReturnPending}
          drugsWithStock={drugsWithStock}
          lots={lots}
          nurses={nurses}
          db={db}
          getDrugDir={getDrugDir}
          withdrawals={withdrawals}
          setPutaway={setPutaway}
          calcPutaway={calcPutaway}
        />
      )}
    </>
  )
}

/* ═══ QR SCAN MODAL ═══ */
function QrScanModal({ onScan, onClose, drugs }) {
  const scannerRef = React.useRef(null)
  const divRef = React.useRef(null)
  const [status, setStatus] = useState('loading')
  const [errMsg, setErrMsg] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const SCANNER_ID = 'termya-qr-scanner'

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current = null
    }
  }

  useEffect(() => {
    setStatus('loading'); setErrMsg('')
    let cancelled = false

    const loadLib = () => new Promise((resolve, reject) => {
      if (typeof Html5Qrcode !== 'undefined') { resolve(); return }
      const existing = document.querySelector('script[src*="html5-qrcode"]')
      if (existing) { existing.onload = resolve; existing.onerror = reject; return }
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'
      s.onload = resolve; s.onerror = reject
      document.head.appendChild(s)
    })

    const startScanner = async () => {
      try {
        await loadLib()
        if (cancelled) return

        // รอให้ div mount ใน DOM (poll สูงสุด 3 วินาที)
        let waited = 0
        while (!document.getElementById(SCANNER_ID) && waited < 3000) {
          await new Promise(r => setTimeout(r, 50)); waited += 50
        }
        if (cancelled) return
        if (!document.getElementById(SCANNER_ID)) {
          throw new Error('ไม่พบ element กล้อง — ลองใหม่')
        }

        // ถ้า scanner เก่ายังค้างอยู่ ให้ stop ก่อน
        try {
          const old = new Html5Qrcode(SCANNER_ID)
          await old.stop().catch(() => {})
        } catch(_) {}

        const scanner = new Html5Qrcode(SCANNER_ID)
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 200, height: 200 }, aspectRatio: 1.0, disableFlip: false },
          (decodedText) => {
            if (cancelled) return
            stopScanner(); onScan(decodedText)
          },
          () => {}
        )
        if (!cancelled) setStatus('scanning')
      } catch(e) {
        if (cancelled) return
        const msg = e?.toString() || ''
        setStatus('error')
        setErrMsg(
          msg.includes('NotAllowed') || msg.includes('Permission')
            ? 'กรุณาอนุญาตให้ใช้กล้องในเบราว์เซอร์'
            : msg.includes('NotFound')
            ? 'ไม่พบกล้องในอุปกรณ์'
            : 'เปิดกล้องไม่ได้ — ' + msg.substring(0, 80)
        )
      }
    }

    startScanner()
    return () => { cancelled = true; stopScanner() }
  }, [retryCount])

  useEffect(() => { return () => stopScanner() }, [])

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
      <div style={{ background:'#fff', borderRadius:16, padding:20, width:'min(340px,95vw)', textAlign:'center', maxHeight:'92vh', overflowY:'auto', position:'relative' }}>
        <button onClick={() => { stopScanner(); onClose() }}
          style={{ position:'absolute', top:12, right:12, width:32, height:32, borderRadius:'50%', background:'#F4F7F5', border:'0.5px solid #C8DDD4', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#5F7A6A', flexShrink:0 }}>✕</button>
        <div style={{ fontSize:14, fontWeight:500, color:'#0F6E56', marginBottom:4 }}>สแกน QR ยา</div>
        <div style={{ fontSize:11, color:'#8BA898', marginBottom:10 }}>จ่อกล้องไปที่ QR ในกรอบ</div>

        {/* div นี้ต้องอยู่ใน DOM ตลอด ไม่ว่าจะ status ไหน */}
        <div style={{ position:'relative', margin:'0 auto 12px', borderRadius:12, overflow:'hidden',
          border: `2px solid ${status==='scanning'?'#0F6E56':'#ccc'}`,
          width:260, background:'#111',
          display: status==='error' ? 'none' : 'block' }}>
          <div id={SCANNER_ID} ref={divRef} style={{ width:'100%' }} />
          {status === 'loading' && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.7)', color:'#9FE1CB', fontSize:12, gap:8, minHeight:220 }}>
              <div style={{ width:28, height:28, border:'3px solid #9FE1CB', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.9s linear infinite' }} />
              กำลังเปิดกล้อง...
            </div>
          )}
        </div>

        {status === 'error' && (
          <div style={{ margin:'0 0 12px', background:'#FCEBEB', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'12px 14px', textAlign:'left' }}>
            <div style={{ fontSize:12, color:'#A32D2D', lineHeight:1.6, marginBottom:10 }}>⚠️ {errMsg}</div>
            <button onClick={() => setRetryCount(n => n+1)}
              style={{ width:'100%', padding:'9px', background:'#0F6E56', border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer' }}>
              🔄 ลองใหม่
            </button>
          </div>
        )}

        <div style={{ fontSize:11, color:'#8BA898', margin:'4px 0 6px' }}>หรือเลือกยาจากรายการ</div>
        <div style={{ maxHeight:180, overflowY:'auto', border:'0.5px solid #E0EAE5', borderRadius:8, marginBottom:12 }}>
          {drugs.map((d,i) => (
            <button key={d.id}
              onClick={() => { stopScanner(); onScan(d.name) }}
              style={{ width:'100%', padding:'10px 12px', border:'none', borderBottom: i<drugs.length-1?'0.5px solid #F0F4F2':'none', background:'#fff', cursor:'pointer', fontSize:13, textAlign:'left', color:'#1A2E25' }}>
              {d.name}
            </button>
          ))}
        </div>
        <button onClick={() => { stopScanner(); onClose() }}
          style={{ padding:'9px 24px', background:'#F0F4F2', border:'0.5px solid #C8DDD4', borderRadius:8, cursor:'pointer', fontSize:13, color:'#5F7A6A' }}>
          ยกเลิก
        </button>
      </div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  )
}


/* ═══ DASHBOARD ═══ */

/* ═══ SMART TIMESTAMP MODAL ═══ */
function SmartTimestampModal({ open, onClose, db }) {
  const [done, setDone] = useState(false)
  const [savedBed, setSavedBed] = useState('')
  const [saving, setSaving] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [tick, setTick] = React.useState(0)

  // Live clock
  React.useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const now = new Date()
  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const tapBed = async (bed) => {
    if (saving || done) return
    setSaving(true)
    try {
      const ts = Timestamp.now()
      await addDoc(collection(db, 'pending_syncs'), {
        bed_id: bed, nurse: '', timestamp: ts, source: 'emergency',
        status: 'pending', created_at: ts, completed_at: null,
        completed_by: null, reconciled_withdrawal_id: null,
        drug_id: null, drug_name: null, qty: null
      })
      setSavedBed(bed)
      setDone(true)
      let n = 3
      setCountdown(n)
      const timer = setInterval(() => {
        n -= 1
        setCountdown(n)
        if (n <= 0) { clearInterval(timer); doClose() }
      }, 1000)
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message)
    }
    setSaving(false)
  }

  const doClose = () => {
    setDone(false)
    setSavedBed('')
    setSaving(false)
    setCountdown(3)
    onClose()
  }

  if (!open) return null

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.75)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:14 }}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:420, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'0.5px solid #E0EAE5' }}>
          <div style={{ fontSize:15, fontWeight:600, color:'#E65100' }}>🚨 Smart Timestamp</div>
          <button onClick={doClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#8BA898' }}>✕</button>
        </div>

        {!done ? (
          <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>
            {/* Clock */}
            <div style={{ background:'#FFF3E0', borderRadius:12, padding:'14px', marginBottom:14, textAlign:'center' }}>
              <div style={{ fontSize:36, fontWeight:700, color:'#E65100', fontFamily:'monospace', letterSpacing:3 }}>{timeStr}</div>
              <div style={{ fontSize:12, color:'#854F0B', marginTop:4 }}>กดปุ่มเตียงเพื่อบันทึกทันที</div>
            </div>
            {/* Beds — tap once to save */}
            <div className="lbl">กดเตียงที่ใช้ยา (กดครั้งเดียวบันทึกเลย)</div>
            <div className="bed-grid">
              {BEDS.map(bed => (
                <button key={bed} className="bed-btn"
                  onClick={() => tapBed(bed)}
                  disabled={saving}
                  style={{ opacity: saving ? 0.5 : 1 }}>
                  {saving ? '...' : bed}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ flex:1, padding:'32px 16px', textAlign:'center' }}>
            <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:18, fontWeight:600, color:'#0F6E56', marginBottom:6 }}>บันทึกสำเร็จ!</div>
            <div style={{ fontSize:14, color:'#1A2E25', fontWeight:500, marginBottom:4 }}>เตียง {savedBed}</div>
            <div style={{ fontSize:12, color:'#8BA898', marginBottom:20 }}>กรุณาเติมยาคืนใน "Pending" tab</div>
            <div style={{ background:'#E0EAE5', borderRadius:6, height:6, overflow:'hidden', marginBottom:8 }}>
              <div style={{ height:'100%', background:'#0F6E56', width:(countdown/3*100)+'%', transition:'width 1s linear' }} />
            </div>
            <div style={{ fontSize:11, color:'#8BA898' }}>ปิดอัตโนมัติใน {countdown} วินาที...</div>
          </div>
        )}
      </div>
    </div>
  )
}


/* ═══ REPLACE MODAL (Multi-Drug + Partial + Success Overlay) ═══ */
function ReplaceModal({ open, onClose, pending, drugsWithStock, lots, nurses, db, getDrugDir, withdrawals, setPutaway, calcPutaway }) {
  const [nurse, setNurse] = useState('')
  const [nurseQuery, setNurseQuery] = useState('')
  const [nurseOpen, setNurseOpen] = useState(false)
  
  // สำหรับ Missing: หายา drugId จากชื่อ
  const isMissing = pending?.source === 'missing_tracked'
  const getMissingDrugId = () => {
    if (!isMissing || !pending?.drug_name) return null
    const dl = drugsWithStock()
    const found = dl.find(d => d.name === pending.drug_name)
    return found?.id || null
  }
  
  // Multi-drug cart
  const initialCart = () => {
    if (isMissing) {
      const drugId = getMissingDrugId()
      return [{ id: 1, drugId, drugQuery: '', drugOpen: false, qty: 1, expM: '', expY: '', fullDate: '', fefoPreview: null }]
    }
    return [{ id: 1, drugId: null, drugQuery: '', drugOpen: false, qty: 1, expM: '', expY: '', fullDate: '', fefoPreview: null }]
  }
  
  const [cart, setCart] = useState(initialCart())
  const [saving, setSaving] = useState(false)
  const [closeJob, setCloseJob] = useState(true)

  const getHoursSince = (ts) => {
    if (!ts) return 0
    const then = ts?.toDate ? ts.toDate() : new Date(ts)
    return (new Date() - then) / 3600000
  }

  useEffect(() => {
    if (!open) {
      setNurse(''); setNurseQuery(''); setNurseOpen(false)
      setCart(initialCart())
      setSaving(false); setCloseJob(true)
    } else {
      // Reset cart when modal opens
      setCart(initialCart())
    }
  }, [open])

  const addCartItem = () => {
    if (isMissing) {
      // Missing: เพิ่ม lot ของยาเดียวกัน
      const drugId = getMissingDrugId()
      setCart(prev => [...prev, { id: Date.now(), drugId, drugQuery: '', drugOpen: false, qty: 1, expM: '', expY: '', fullDate: '', fefoPreview: null }])
    } else {
      // Emergency: เพิ่มยาใหม่
      setCart(prev => [...prev, { id: Date.now(), drugId: null, drugQuery: '', drugOpen: false, qty: 1, expM: '', expY: '', fullDate: '', fefoPreview: null }])
    }
  }
  const removeCartItem = (id) => setCart(prev => prev.filter(c => c.id !== id))
  
  // Calculate FEFO Preview - รวม multiple lots ที่เติมพร้อมกัน
  const calculateFEFOWithReturns = (drugId, expiry, qtyToReplace = 0, isMissing = false, otherReturnedLots = [], otherReturnedQtys = []) => {
    if (!drugId || !expiry) return null
    
    let existingLots = lots
      .filter(l => l.drugId == drugId && l.qty > 0)
      .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    
    // ถ้าไม่ใช่ Missing → ต้องหัก qty ที่จะถูกตัดออก (FEFO) ก่อน
    if (!isMissing && qtyToReplace > 0) {
      existingLots = existingLots.map(l => ({ ...l })) // clone
      // ✓ FIX: หัก FEFO รวมทั้ง qty ของรายการอื่นด้วย
      const totalQtyToReplace = qtyToReplace + otherReturnedQtys.reduce((sum, q) => sum + q, 0)
      let remaining = totalQtyToReplace
      for (let i = 0; i < existingLots.length && remaining > 0; i++) {
        const take = Math.min(existingLots[i].qty, remaining)
        existingLots[i].qty -= take
        remaining -= take
      }
      // กรอง lot ที่เหลือ 0 ออก
      existingLots = existingLots.filter(l => l.qty > 0)
    }
    
    // ดู direction configuration ของยา
    const dir = getDrugDir(drugId)
    
    // รวม existing + lots อื่นที่เติมพร้อมกัน + ยาใหม่ แล้ว sort
    const allLots = [
      ...existingLots.map(l => ({ expiry: l.expiry, isNew: false })),
      ...otherReturnedLots.map(exp => ({ expiry: exp, isNew: false })),
      { expiry, isNew: true }
    ].sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    
    const total = allLots.length
    const newIndex = allLots.findIndex(l => l.isNew)
    
    if (total === 1) {
      // Single stock - lot แรก
      return { 
        label: `🟣 วางตำแหน่งที่ 1 (lot แรก)`, 
        color: '#9C27B0', 
        desc: 'lot แรก'
      }
    }
    
    // คำนวณอันดับตาม direction
    let position, label, color, positionText
    
    if (dir === 'rtl') {
      // RTL: ขวา = EXP ก่อน (index 0), ซ้าย = EXP หลัง
      position = newIndex + 1  // ตำแหน่งที่ 1 = ขวาสุด
      if (position === 1) {
        positionText = 'ขวาสุด'
      } else if (position === total) {
        positionText = 'ซ้ายสุด'
      } else {
        positionText = `ที่ ${position} นับจากขวา`
      }
    } else if (dir === 'fb') {
      // FB: นับจากหน้า
      position = newIndex + 1
      if (position === 1) {
        positionText = 'หน้าสุด'
      } else if (position === total) {
        positionText = 'หลังสุด'
      } else {
        positionText = `ที่ ${position} นับจากหน้า`
      }
    } else {
      // LTR: นับจากซ้าย
      position = newIndex + 1
      if (position === 1) {
        positionText = 'ซ้ายสุด'
      } else if (position === total) {
        positionText = 'ขวาสุด'
      } else {
        positionText = `ที่ ${position} นับจากซ้าย`
      }
    }
    
    const newDate = new Date(expiry)
    const fefoDate = new Date(allLots[0].expiry)
    const isBeforeFefo = newDate <= fefoDate
    
    if (isBeforeFefo) {
      // EXP ใหม่กว่าหรือเท่ากับ FEFO → วางด้านที่ออกก่อน
      color = '#4CAF50'
      label = `🟢 วาง${positionText}`
    } else {
      // EXP เก่ากว่า FEFO → วางด้านที่ออกหลัง
      color = '#F44336'
      label = `🔴 วาง${positionText}`
    }
    
    return { 
      label, 
      color, 
      desc: `จาก ${total} ตำแหน่ง`
    }
  }
  
  const updateCart = (id, field, val) => {
    setCart(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c
        const u = { ...c, [field]: val }
        
        // Clear preview ถ้าเปลี่ยนยา
        if (field === 'drugId') {
          u.fefoPreview = null
        }
        
        return u
      })
      
      // Recalculate FEFO for ALL items after any update
      const isMissing = pending?.source === 'missing_tracked'
      
      return updated.map(item => {
        if (!item.drugId || ((!item.expM || !item.expY) && !item.fullDate)) {
          return { ...item, fefoPreview: null }
        }
        
        const drug = drugsWithStock().find(d => d.id == item.drugId)
        if (!drug) return { ...item, fefoPreview: null }
        
        // คำนวณ expiry ของ item นี้
        let expiry
        if (drug?.fullDateExp && item.fullDate) {
          expiry = item.fullDate
        } else if (!drug?.fullDateExp && item.expM && item.expY) {
          const lastDay = new Date(+item.expY, +item.expM, 0).getDate()
          expiry = `${item.expY}-${String(item.expM).padStart(2,'0')}-${lastDay}`
        } else {
          return { ...item, fefoPreview: null }
        }
        
        // หา expiry และ qty ของ lots อื่นที่เติมพร้อมกัน
        const otherReturnedData = updated
          .filter(c => c.id !== item.id && c.drugId == item.drugId)
          .map(c => {
            let exp = null
            if (drug?.fullDateExp && c.fullDate) {
              exp = c.fullDate
            } else if (!drug?.fullDateExp && c.expM && c.expY) {
              const lastDay = new Date(+c.expY, +c.expM, 0).getDate()
              exp = `${c.expY}-${String(c.expM).padStart(2,'0')}-${lastDay}`
            }
            return { expiry: exp, qty: c.qty || 1 }
          })
          .filter(d => d.expiry !== null)
        
        const otherReturnedLots = otherReturnedData.map(d => d.expiry)
        const otherReturnedQtys = otherReturnedData.map(d => d.qty)
        
        // คำนวณ FEFO รวมกับ lots อื่น
        return {
          ...item,
          fefoPreview: calculateFEFOWithReturns(
            item.drugId, 
            expiry, 
            item.qty || 0, 
            isMissing,
            otherReturnedLots,
            otherReturnedQtys
          )
        }
      })
    })
  }

  const submit = async () => {
    if (!nurse || saving) return
    const validItems = cart.filter(c => c.drugId)
    if (validItems.length === 0) return alert('กรุณาเลือกยาอย่างน้อย 1 รายการ')

    setSaving(true)
    try {
      const dl = drugsWithStock()
      const recon_mins = Math.round(getHoursSince(pending.timestamp) * 60)

      // Group items by drugId for PutawayOverlay
      const drugGroups = {}
      
      // Track lots after FEFO deduction (for Emergency only)
      const lotsAfterFEFO = {}
      
      // ✓ FIX: Track cumulative FEFO deductions for same drug
      const cumulativeLotsAfterFEFO = {}
      
      for (const item of validItems) {
        const drug = dl.find(d => d.id == item.drugId)
        if (!drug) continue

        const useFull = drug?.fullDateExp
        const newExpiry = useFull
          ? item.fullDate || '2099-12-31'
          : (item.expM && item.expY
            ? `${item.expY}-${String(item.expM).padStart(2,'0')}-${new Date(+item.expY,+item.expM,0).getDate()}`
            : '2099-12-31')

        // 1. Deduct old stock FEFO (ถ้าเป็น Emergency เท่านั้น - Missing ตัดไปแล้วตอน Stock Count)
        if (pending.source !== 'missing_tracked') {
          // ✓ FIX: ใช้ lots ที่ตัดไปแล้ว (cumulative) ถ้ามี ไม่งั้นใช้ lots จาก state
          const drugLots = (cumulativeLotsAfterFEFO[drug.id] 
            ? cumulativeLotsAfterFEFO[drug.id] 
            : lots.filter(l => l.drugId == item.drugId && l.qty > 0)
          ).sort((a,b) => new Date(a.expiry) - new Date(b.expiry))
          
          // Simulate FEFO deduction locally
          let remainingLots = drugLots.map(l => ({ ...l })) // clone
          let rem = item.qty
          for (const lot of remainingLots) {
            if (rem <= 0) break
            const take = Math.min(lot.qty, rem)
            await updateDoc(doc(db, 'lots', lot.docId), { qty: lot.qty - take })
            lot.qty -= take
            rem -= take
          }
          
          // Store lots after deduction (filter out qty=0)
          const updatedLots = remainingLots.filter(l => l.qty > 0)
          lotsAfterFEFO[drug.id] = updatedLots
          // ✓ FIX: อัพเดต cumulative tracking
          cumulativeLotsAfterFEFO[drug.id] = updatedLots
        } else {
          // Missing: ไม่ต้องตัด FEFO (ตัดไปแล้วตอน Stock Count)
          lotsAfterFEFO[drug.id] = lots.filter(l => l.drugId == item.drugId && l.qty > 0)
        }

        // 2. Add new lot
        await addDoc(collection(db, 'lots'), {
          drugId: drug.id, qty: item.qty, expiry: newExpiry,
          addedAt: Timestamp.now(), source: 'replace', loaned: false
        })

        // 3. Withdrawal record
        if (pending.source === 'missing_tracked') {
          // Missing: UPDATE withdrawal เดิม (ที่สร้างตอน Stock Count) แทนการสร้างใหม่
          // หา withdrawal ที่ link กับ pending นี้และยังไม่ได้ return
          const existingW = withdrawals?.find(w => 
            w.pending_sync_id === pending.docId && 
            !w.returned
          )
          
          if (existingW) {
            // Update withdrawal เดิม
            await updateDoc(doc(db, 'withdrawals', existingW.docId), {
              returned: true,
              retExp: newExpiry,
              return_timestamp: Timestamp.now()
            })
          } else {
            // Fallback: ถ้าหาไม่เจอ (กรณี withdrawal ถูกลบหรือ bug)
            console.warn('[Missing Return] ไม่เจอ withdrawal เดิม - สร้างใหม่แทน', { 
              pending_sync_id: pending.docId 
            })
            await addDoc(collection(db, 'withdrawals'), {
              nurse, drugId: drug.id, drugName: drug.name,
              bed: pending.bed_id, qty: item.qty,
              note: `(Replace: Missing)`,
              returned: true, retExp: newExpiry, ts: Timestamp.now(),
              return_timestamp: Timestamp.now(),
              usage_type: 'Missing_Tracked',
              pending_sync_id: pending.docId,
              reconciliation_time_minutes: recon_mins
            })
          }
        } else {
          // Emergency: สร้าง withdrawal ใหม่ (แบบเดิม)
          await addDoc(collection(db, 'withdrawals'), {
            nurse, drugId: drug.id, drugName: drug.name,
            bed: pending.bed_id, qty: item.qty,
            note: `(Replace: Emergency)`,
            returned: true, retExp: newExpiry, ts: Timestamp.now(),
            return_timestamp: Timestamp.now(),
            usage_type: 'Emergency',
            pending_sync_id: pending.docId,
            reconciliation_time_minutes: recon_mins
          })
        }
        
        // Group lots by drugId for overlay
        if (!drugGroups[drug.id]) {
          drugGroups[drug.id] = { drug, lots: [], lotsAfterFEFO: cumulativeLotsAfterFEFO[drug.id] || lotsAfterFEFO[drug.id] || [] }
        } else {
          // ✓ FIX: Update lotsAfterFEFO ทุกรอบเพื่อให้ได้ค่าล่าสุด
          drugGroups[drug.id].lotsAfterFEFO = cumulativeLotsAfterFEFO[drug.id] || lotsAfterFEFO[drug.id] || []
        }
        drugGroups[drug.id].lots.push({ expiry: newExpiry, qty: item.qty })
      }

      // 4. Update returned_qty; auto-close when fully returned
      const returnedNow = validItems.reduce((s,i) => s + i.qty, 0)
      if (isMissing) {
        const prevReturned = pending.returned_qty || 0
        const totalRequired = pending.qty || 0
        const newReturned = prevReturned + returnedNow
        const isComplete = newReturned >= totalRequired
        await updateDoc(doc(db, 'pending_syncs', pending.docId), {
          returned_qty: newReturned,
          ...(isComplete ? {
            status: 'completed', completed_at: Timestamp.now(), completed_by: nurse,
            drug_name: validItems.map(i => dl.find(d=>d.id==i.drugId)?.name).filter(Boolean).join(', ')
          } : {})
        })
      } else if (closeJob) {
        await updateDoc(doc(db, 'pending_syncs', pending.docId), {
          status: 'completed', completed_at: Timestamp.now(),
          completed_by: nurse,
          drug_name: validItems.map(i => dl.find(d=>d.id==i.drugId)?.name).filter(Boolean).join(', '),
          qty: returnedNow
        })
      }

      // Helper: คำนวณ pa ด้วย lots หลังตัด FEFO
      const calcPutawayWithLots = (drugId, expiry, existingLots) => {
        const drug = dl.find(d => d.id == drugId)
        if (!drug) return null
        
        // ใช้ getDrugDir() เหมือน calculateFEFOWithReturns
        const dir = getDrugDir(drugId)
        
        // ✓ FIX: Format existingLots ให้มี 'exp' field สำหรับ PutawayOverlay
        const formattedExistingLots = existingLots.map(l => ({
          exp: fmtMY(l.expiry),
          expiry: l.expiry
        }))
        
        // คำนวณ position โดยใช้ Par (จำนวนชิ้นที่ควรมี)
        // แทนการนับ lots
        const sorted = [...formattedExistingLots, { expiry, isNew: true }]
          .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
        
        const newIndex = sorted.findIndex(l => l.isNew)
        const position = newIndex + 1
        
        return {
          direction: dir,
          position,
          existingLots: formattedExistingLots,  // ✓ ส่ง formatted version
          par: drug.par  // ← เพิ่ม par เพื่อให้ overlay ใช้
        }
      }

      // 5. Show PutawayOverlay
      const drugIds = Object.keys(drugGroups)
      
      if (isMissing || drugIds.length === 1) {
        // Missing หรือ Emergency ยาเดียว → แสดงแบบเดิม
        const drugId = drugIds[0]
        const { drug, lots: returnLots, lotsAfterFEFO: existingLots } = drugGroups[drugId]
        
        if (drug?.singleStock) {
          const group = STORAGE_GROUPS.find(g => g.id === drug.groupId)
          setPutaway({
            drug,
            qty: returnLots[0].qty,
            expiry: returnLots[0].expiry,
            context: 'return',
            singleStock: true,
            groupName: group?.name || '',
            groupIcon: group?.icon || '📦'
          })
        } else {
          const sortedLots = returnLots.sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
          const pa = calcPutawayWithLots(drug.id, sortedLots[0].expiry, existingLots)
          
          if (sortedLots.length === 1) {
            setPutaway({
              drug,
              qty: sortedLots[0].qty,
              expiry: sortedLots[0].expiry,
              pa,
              context: 'return'
            })
          } else {
            setPutaway({
              drug,
              returnLots: sortedLots,
              pa,
              context: 'return'
            })
          }
        }
      } else {
        // Emergency หลายยา → แสดงแบบ multi-drug
        const allDrugs = drugIds.map(drugId => {
          const { drug, lots, lotsAfterFEFO: existingLots } = drugGroups[drugId]
          const sortedLots = lots.sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
          
          if (drug?.singleStock) {
            const group = STORAGE_GROUPS.find(g => g.id === drug.groupId)
            return {
              drug,
              qty: sortedLots[0].qty,
              expiry: sortedLots[0].expiry,
              singleStock: true,
              groupName: group?.name || '',
              groupIcon: group?.icon || '📦'
            }
          } else {
            return {
              drug,
              returnLots: sortedLots.length > 1 ? sortedLots : null,
              qty: sortedLots.length === 1 ? sortedLots[0].qty : null,
              expiry: sortedLots[0].expiry,
              pa: calcPutawayWithLots(drug.id, sortedLots[0].expiry, existingLots)
            }
          }
        })
        
        setPutaway({
          drugs: allDrugs,  // ← ส่ง array
          context: 'return'
        })
      }
      
      // Close modal
      onClose()
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message)
    }
    setSaving(false)
  }

  if (!open || !pending) return null
  const dl = drugsWithStock()
  const curYear = new Date().getFullYear()
  const months = ['01','02','03','04','05','06','07','08','09','10','11','12']
  const thM = ['Jan.','Feb.','Mar.','Apr.','May','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.']
  const years = Array.from({length:15},(_,i)=>curYear+i)

  // ── Main Form ──
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.65)', zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'14px 14px 0 0', width:'100%', maxWidth:480, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'0.5px solid #E0EAE5' }}>
          <div style={{ fontSize:14, fontWeight:500, color:'#0F6E56' }}>{isMissing ? '✓ Return & ปิดรายการ' : '✓ Replace & ปิดรายการ'}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#8BA898' }}>✕</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>
          {/* Pending info */}
          <div className="card blue" style={{ marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>{pending.bed_id}
              <span className="b bo" style={{ marginLeft:6 }}>{pending.source === 'emergency' ? 'Emergency' : 'Missing'}</span>
            </div>
            <div style={{ fontSize:11, color:'#5F7A6A', marginTop:2 }}>
              ⏱ {getHoursSince(pending.timestamp).toFixed(1)} ชม. ที่แล้ว{pending.nurse ? ` · ${pending.nurse}` : ''}
            </div>
          </div>

          {/* Nurse */}
          <div className="lbl">พยาบาลผู้เติมยาคืน</div>
          <NursePicker value={nurse} query={nurseQuery} open={nurseOpen} nurses={nurses}
            onChange={(v,o)=>{ setNurseQuery(v); setNurse(''); setNurseOpen(o!==undefined?o:v.length>0) }}
            onSelect={v=>{ setNurse(v); setNurseQuery(v); setNurseOpen(false) }}
            onClear={()=>{ setNurse(''); setNurseQuery(''); setNurseOpen(false) }} />

          {/* Multi-drug cart */}
          <div style={{ marginTop:14, marginBottom:4, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:12, fontWeight:500, color:'#1A2E25' }}>ยาที่นำมาเติมคืน</div>
            {isMissing ? (
              <button onClick={addCartItem} className="btn sm" style={{ fontSize:11, padding:'4px 10px', color:'#0F6E56', borderColor:'#9FE1CB' }}>+ เพิ่ม lot (ถ้า EXP ต่าง)</button>
            ) : (
              <button onClick={addCartItem} className="btn sm" style={{ fontSize:11, padding:'4px 10px', color:'#0F6E56', borderColor:'#9FE1CB' }}>+ เพิ่มยา</button>
            )}
          </div>

          {/* Missing: แสดงชื่อยา 1 ครั้ง */}
          {isMissing && (
            <div style={{ marginBottom:8, padding:'10px 12px', background:'#FFF', border:'0.5px solid #D8EAE0', borderRadius:8 }}>
              <div style={{ fontSize:13, fontWeight:500, color:'#1A2E25' }}>{pending.drug_name || '(ยาไม่ระบุ)'}</div>
            </div>
          )}

          {cart.map((item, idx) => {
            const selDrug = dl.find(d => d.id == item.drugId)
            return (
              <div key={item.id} style={{ border:'0.5px solid #D8EAE0', borderRadius:10, padding:'10px 12px', marginBottom:8, background:'#F9FCF9' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ fontSize:11, fontWeight:500, color:'#5F7A6A' }}>
                    {isMissing ? `Lot ${idx+1}` : `ยารายการที่ ${idx+1}`}
                  </div>
                  {((isMissing && cart.length > 1) || (!isMissing && cart.length > 1)) && (
                    <button onClick={() => removeCartItem(item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#A32D2D', fontSize:16 }}>✕</button>
                  )}
                </div>

                {/* Drug picker สำหรับ Emergency */}
                {!isMissing && (
                  <div style={{ marginBottom:8 }}>
                    <DrugPicker drugs={dl} selectedId={item.drugId} query={item.drugQuery} open={item.drugOpen}
                      onChange={(v,o)=>{ updateCart(item.id,'drugQuery',v); updateCart(item.id,'drugId',null); updateCart(item.id,'drugOpen',o!==undefined?o:v.length>0) }}
                      onSelect={id=>{ updateCart(item.id,'drugId',id); updateCart(item.id,'drugQuery',''); updateCart(item.id,'drugOpen',false) }}
                      onClear={()=>{ updateCart(item.id,'drugId',null); updateCart(item.id,'drugQuery','') }} />
                  </div>
                )}

                {/* Qty */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div>
                    <div className="lbl" style={{ marginTop:0 }}>จำนวน</div>
                    <input type="number" className="inp" value={item.qty} min="1"
                      onChange={e=>updateCart(item.id,'qty',Math.max(1,parseInt(e.target.value)||1))} />
                  </div>
                  {selDrug?.fullDateExp ? (
                    <div>
                      <div className="lbl" style={{ marginTop:0 }}>EXP (วัน/เดือน/ปี)</div>
                      <input type="date" className="inp" value={item.fullDate}
                        onChange={e=>updateCart(item.id,'fullDate',e.target.value)}
                        min={new Date().toISOString().split('T')[0]} />
                    </div>
                  ) : (
                    <div>
                      <div className="lbl" style={{ marginTop:0 }}>เดือน EXP</div>
                      <select className="inp" value={item.expM} onChange={e=>updateCart(item.id,'expM',e.target.value)}>
                        <option value="">-- Month --</option>
                        {months.map((m,i)=><option key={m} value={m}>{m} ({thM[i]})</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {!selDrug?.fullDateExp && (
                  <div>
                    <div className="lbl" style={{ marginTop:0 }}>EXP Year</div>
                    <select className="inp" value={item.expY} onChange={e=>updateCart(item.id,'expY',e.target.value)}>
                      <option value="">-- Year --</option>
                      {years.map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
                
                {/* FEFO Preview */}
                {item.fefoPreview && (
                  <div style={{ 
                    marginTop: 8, 
                    padding: '8px 12px', 
                    background: item.fefoPreview.color + '15',
                    border: `0.5px solid ${item.fefoPreview.color}80`,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <div style={{ 
                      fontSize: 11, 
                      fontWeight: 600, 
                      color: item.fefoPreview.color 
                    }}>
                      {item.fefoPreview.label}
                    </div>
                    <div style={{ 
                      fontSize: 10, 
                      color: '#5F7A6A',
                      flex: 1
                    }}>
                      {item.fefoPreview.desc}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Close job toggle / return progress */}
          {isMissing ? (() => {
            const prevReturned = pending?.returned_qty || 0
            const totalRequired = pending?.qty || 0
            const cartQty = cart.reduce((s,c) => s + c.qty, 0)
            const afterReturn = prevReturned + cartQty
            const pct = totalRequired > 0 ? Math.min(100, Math.round(afterReturn / totalRequired * 100)) : 0
            const isComplete = afterReturn >= totalRequired
            return (
              <div style={{ marginTop:10, background:'#F4F7F5', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:'#1A2E25' }}>ความคืบหน้าการคืนยา</span>
                  <span style={{ fontSize:12, fontWeight:600, color: isComplete ? '#0F6E56' : '#E65100' }}>
                    {afterReturn}/{totalRequired} amp
                  </span>
                </div>
                <div style={{ background:'#D6EAE2', borderRadius:999, height:7, overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', background: isComplete ? '#0F6E56' : '#FFB74D', borderRadius:999, transition:'width 0.3s' }}/>
                </div>
                <div style={{ fontSize:10, color:'#8BA898', marginTop:5 }}>
                  {isComplete ? '✓ ครบแล้ว — จะปิดรายการอัตโนมัติ' : `ยังค้างอีก ${totalRequired - afterReturn} amp — pending จะยังค้างไว้`}
                </div>
              </div>
            )
          })() : (
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginTop:10, background:'#F4F7F5', borderRadius:10, padding:'10px 12px' }}>
              <input type="checkbox" checked={closeJob} onChange={e=>setCloseJob(e.target.checked)}
                style={{ width:18, height:18, accentColor:'#0F6E56', cursor:'pointer' }} />
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'#1A2E25' }}>ปิดรายการ Pending หลังบันทึก</div>
                <div style={{ fontSize:10, color:'#8BA898', marginTop:1 }}>ยกเลิกถ้ายาคืนยังไม่ครบ</div>
              </div>
            </label>
          )}

          <div style={{ marginTop:8, padding:'8px 10px', background:'#E1F5EE', borderRadius:8, fontSize:10, color:'#5F7A6A' }}>
            💡 ตัดสต็อกเดิม (FEFO) → เพิ่ม lot ใหม่ → บันทึกการใช้ → ปิดรายการ
          </div>
        </div>

        <div style={{ padding:'10px 14px', borderTop:'0.5px solid #E0EAE5' }}>
          <button className="btn primary full" onClick={submit}
            disabled={!nurse || cart.filter(c=>c.drugId).length===0 || saving}>
            {saving ? 'กำลังบันทึก...' : isMissing ? (() => {
              const _prev = pending?.returned_qty || 0
              const _tot  = pending?.qty || 0
              const _now  = cart.reduce((s,c) => s + c.qty, 0)
              const _after = _prev + _now
              const _done  = _after >= _tot
              return _done
                ? `✓ Return ${_now} amp · ครบ ${_tot}/${_tot} — ปิดรายการ`
                : `✓ Return ${_now} amp · ยังเหลือ ${_tot - _after} amp`
            })() : `✓ Replace ${cart.filter(c=>c.drugId).length} รายการ${!closeJob?' (ค้างต่อ)':''}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══ CONFIRM MODAL ═══ */
function ConfirmModal({ open, title, message, icon, onConfirm, onCancel, confirmLabel='ยืนยัน', confirmDanger=false }) {
  if (!open) return null
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.55)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#fff', borderRadius:16, padding:22, width:'100%', maxWidth:300, textAlign:'center' }}>
        {icon && <div style={{ width:48, height:48, borderRadius:'50%', background: confirmDanger ? '#FCEBEB' : '#E1F5EE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:24 }}>{icon}</div>}
        <div style={{ fontSize:15, fontWeight:500, color:'#1A2E25', marginBottom:6 }}>{title}</div>
        {message && <div style={{ fontSize:12, color:'#5F7A6A', marginBottom:18, lineHeight:1.5 }}>{message}</div>}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onCancel} style={{ flex:1, padding:'10px', borderRadius:10, border:'0.5px solid #C8DDD4', background:'#F4F7F5', fontSize:13, cursor:'pointer', color:'#1A2E25', fontFamily:'inherit' }}>ยกเลิก</button>
          <button onClick={onConfirm} style={{ flex:1, padding:'10px', borderRadius:10, border:'none', background: confirmDanger ? '#A32D2D' : '#0F6E56', color:'#fff', fontSize:13, cursor:'pointer', fontWeight:500, fontFamily:'inherit' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}


/* ═══ PENDING VIEW TAB ═══ */
function PendingView({ pendingSyncs, withdrawals, drugs, nurses, db, setReplaceModal, setMissingReturnModal, fmtDTsafe, lots, drugsWithStock, getDrugDir, setPutaway, calcPutaway }) {
  const pending = pendingSyncs.filter(p => p.status === 'pending')
  
  // รวม Stock Returns (withdrawals ที่ยังไม่ได้คืน และไม่มี pending_sync_id)
  const stockReturns = withdrawals.filter(w => 
    !w.pending_sync_id && 
    w.usage_type !== 'Missing_Tracked' && 
    w.usage_type !== 'Emergency' &&
    (!w.returned || (w.returned_qty !== undefined && w.returned_qty < w.qty))
  )
  
  // รวมทุกอย่างเป็น unified list
  const allPending = [
    ...pending.map(p => ({ ...p, type: 'replacement', timestamp: p.timestamp })),
    ...stockReturns.map(w => ({ ...w, type: 'return', timestamp: w.ts }))
  ].sort((a, b) => {
    const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp)
    const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp)
    return bTime - aTime // เรียงจากใหม่ไปเก่า
  })
  
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingDeleteId, setPendingDeleteId] = React.useState(null)
  const [retStates, setRetStates] = React.useState({})

  const getHoursSince = (timestamp) => {
    if (!timestamp) return 0
    const now = new Date()
    const then = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
    return (now - then) / (1000 * 60 * 60)
  }

  const getAgingClass = (hours) => {
    if (hours >= 6) return 'danger'
    if (hours >= 4) return 'warning'
    return ''
  }

  const deletePending = async (docId) => {
    setPendingDeleteId(docId)
    setConfirmOpen(true)
  }

  const doDelete = async () => {
    try {
      await deleteDoc(doc(db, 'pending_syncs', pendingDeleteId))
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message)
    }
    setConfirmOpen(false)
    setPendingDeleteId(null)
  }
  
  // Calculate FEFO Preview for inline return form
  const calculateFEFO = (drugId, expiry) => {
    if (!drugId || !expiry) return null
    
    const existingLots = lots
      .filter(l => l.drugId == drugId && l.qty > 0)
      .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    
    const dir = getDrugDir(drugId)
    
    if (existingLots.length === 0) {
      return { 
        label: `🟣 วางตำแหน่งที่ 1 (lot แรก)`, 
        color: '#9C27B0', 
        desc: 'lot แรก'
      }
    }
    
    const allLots = [
      ...existingLots.map(l => ({ expiry: l.expiry, isNew: false })),
      { expiry, isNew: true }
    ].sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    
    const total = allLots.length
    const newIndex = allLots.findIndex(l => l.isNew)
    
    let position, label, color, positionText
    
    if (dir === 'rtl') {
      position = newIndex + 1
      positionText = position === 1 ? 'ขวาสุด' : position === total ? 'ซ้ายสุด' : `ที่ ${position} นับจากขวา`
    } else if (dir === 'fb') {
      position = newIndex + 1
      positionText = position === 1 ? 'หน้าสุด' : position === total ? 'หลังสุด' : `ที่ ${position} นับจากหน้า`
    } else {
      position = newIndex + 1
      positionText = position === 1 ? 'ซ้ายสุด' : position === total ? 'ขวาสุด' : `ที่ ${position} นับจากซ้าย`
    }
    
    const newDate = new Date(expiry)
    const fefoDate = new Date(existingLots[0].expiry)
    const isBeforeFefo = newDate <= fefoDate
    
    color = isBeforeFefo ? '#4CAF50' : '#F44336'
    label = isBeforeFefo ? `🟢 วาง${positionText}` : `🔴 วาง${positionText}`
    
    return { label, color, desc: `จาก ${total} ตำแหน่ง` }
  }
  
  const openRet = (docId, drugId) => {
    const dl = drugsWithStock()
    const drug = dl.find(d => d.id == drugId)
    setRetStates(prev => ({ 
      ...prev, 
      [docId]: { 
        open: true, 
        entries: [{ 
          id: 1, 
          qty: 1, 
          expM: '', 
          expY: '', 
          fullDate: '', 
          fefoPreview: null 
        }],
        useFull: drug?.fullDateExp || false
      } 
    }))
  }
  
  const closeRet = (docId) => setRetStates(prev => { const n = { ...prev }; delete n[docId]; return n })
  
  const addRetEntry = (docId) => {
    setRetStates(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        entries: [...prev[docId].entries, { id: Date.now(), qty: 1, expM: '', expY: '', fullDate: '', fefoPreview: null }]
      }
    }))
  }
  
  const removeRetEntry = (docId, entryId) => {
    setRetStates(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        entries: prev[docId].entries.filter(e => e.id !== entryId)
      }
    }))
  }
  
  const updateRetEntry = (docId, entryId, field, val, drugId) => {
    setRetStates(prev => {
      const state = prev[docId]
      const updatedEntries = state.entries.map(e => {
        if (e.id !== entryId) return e
        
        const updated = { ...e, [field]: val }
        
        return updated
      })
      
      // Recalculate FEFO for ALL entries after any update
      const finalEntries = updatedEntries.map(entry => {
        if ((entry.expM && entry.expY) || entry.fullDate) {
          const dl = drugsWithStock()
          const drug = dl.find(d => d.id == drugId)
          
          let expiry
          if (drug?.fullDateExp && entry.fullDate) {
            expiry = entry.fullDate
          } else if (!drug?.fullDateExp && entry.expM && entry.expY) {
            const lastDay = new Date(+entry.expY, +entry.expM, 0).getDate()
            expiry = `${entry.expY}-${String(entry.expM).padStart(2,'0')}-${lastDay}`
          } else {
            return { ...entry, fefoPreview: null }
          }
          
          // Calculate FEFO considering ALL returned lots
          const allReturnedLots = updatedEntries
            .filter(e => e.id !== entry.id && ((e.expM && e.expY) || e.fullDate))
            .map(e => {
              if (drug?.fullDateExp && e.fullDate) {
                return e.fullDate
              } else if (!drug?.fullDateExp && e.expM && e.expY) {
                const lastDay = new Date(+e.expY, +e.expM, 0).getDate()
                return `${e.expY}-${String(e.expM).padStart(2,'0')}-${lastDay}`
              }
              return null
            })
            .filter(Boolean)
          
          return { ...entry, fefoPreview: calculateFEFOWithReturns(drugId, expiry, allReturnedLots) }
        }
        return { ...entry, fefoPreview: null }
      })
      
      return {
        ...prev,
        [docId]: { ...state, entries: finalEntries }
      }
    })
  }
  
  // Calculate FEFO including other returned lots
  const calculateFEFOWithReturns = (drugId, expiry, otherReturnedLots = []) => {
    if (!drugId || !expiry) return null
    
    const existingLots = lots
      .filter(l => l.drugId == drugId && l.qty > 0)
      .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    
    const dir = getDrugDir(drugId)
    
    // Combine existing + all returned lots (including this one)
    const allLots = [
      ...existingLots.map(l => ({ expiry: l.expiry, isNew: false })),
      ...otherReturnedLots.map(exp => ({ expiry: exp, isNew: false })),
      { expiry, isNew: true }
    ].sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    
    const total = allLots.length
    const newIndex = allLots.findIndex(l => l.isNew)
    
    if (total === 1) {
      return { 
        label: `🟣 วางตำแหน่งที่ 1 (lot แรก)`, 
        color: '#9C27B0', 
        desc: 'lot แรก',
        position: 1,
        total: 1
      }
    }
    
    let position, label, color, positionText
    
    if (dir === 'rtl') {
      position = newIndex + 1
      positionText = position === 1 ? 'ขวาสุด' : position === total ? 'ซ้ายสุด' : `ที่ ${position} นับจากขวา`
    } else if (dir === 'fb') {
      position = newIndex + 1
      positionText = position === 1 ? 'หน้าสุด' : position === total ? 'หลังสุด' : `ที่ ${position} นับจากหน้า`
    } else {
      position = newIndex + 1
      positionText = position === 1 ? 'ซ้ายสุด' : position === total ? 'ขวาสุด' : `ที่ ${position} นับจากซ้าย`
    }
    
    const newDate = new Date(expiry)
    const fefoDate = new Date(allLots[0].expiry)
    const isBeforeFefo = newDate <= fefoDate
    
    color = isBeforeFefo ? '#4CAF50' : '#F44336'
    label = isBeforeFefo ? `🟢 วาง${positionText}` : `🔴 วาง${positionText}`
    
    return { 
      label, 
      color, 
      desc: `จาก ${total} ตำแหน่ง`,
      position,
      total
    }
  }
  
  const submitReturn = async (withdrawal) => {
    const state = retStates[withdrawal.docId]
    if (!state) return
    
    const validEntries = state.entries.filter(e => (e.expM && e.expY) || e.fullDate)
    if (validEntries.length === 0) return alert('กรุณากรอก EXP อย่างน้อย 1 รายการ')
    
    try {
      const dl = drugsWithStock()
      const drug = dl.find(d => d.id == withdrawal.drugId)
      if (!drug) throw new Error('ไม่พบข้อมูลยา')
      
      // บันทึกทุก lot ลง Firebase ก่อน
      for (const entry of validEntries) {
        const iso = state.useFull
          ? entry.fullDate || '2099-12-31'
          : (entry.expM && entry.expY
            ? myToISO(entry.expM, entry.expY)
            : '2099-12-31')
        
        await addDoc(collection(db, 'lots'), {
          drugId: drug.id,
          qty: entry.qty,
          expiry: iso,
          addedAt: Timestamp.now(),
          source: 'return',
          loaned: false
        })
      }
      
      // Update withdrawal — partial or full
      const firstIso = validEntries[0].fullDate || myToISO(validEntries[0].expM, validEntries[0].expY)
      const returnedNowQty = validEntries.reduce((s, e) => s + (e.qty || 1), 0)
      const prevReturnedQty = withdrawal.returned_qty || 0
      const newReturnedQty = prevReturnedQty + returnedNowQty
      const totalRequired = withdrawal.qty || 0
      const isFullyReturned = newReturnedQty >= totalRequired
      await updateDoc(doc(db, 'withdrawals', withdrawal.docId), {
        returned_qty: newReturnedQty,
        returned: isFullyReturned,
        retExp: firstIso,
        return_timestamp: Timestamp.now()
      })
      
      // แสดง PutawayOverlay แบบเดียวกับ restock
      if (validEntries.length > 0) {
        if (drug?.singleStock) {
          const group = STORAGE_GROUPS.find(g => g.id === drug.groupId)
          const firstIso = validEntries[0].fullDate || myToISO(validEntries[0].expM, validEntries[0].expY)
          setPutaway({ 
            drug, 
            qty: validEntries[0].qty, 
            expiry: firstIso, 
            context: 'return', 
            singleStock: true, 
            groupName: group?.name || '', 
            groupIcon: group?.icon || '📦' 
          })
        } else {
          // Multi-lot return: ส่ง returnLots array
          const returnLots = validEntries
            .map(e => ({ 
              expiry: e.fullDate || myToISO(e.expM, e.expY), 
              qty: e.qty 
            }))
            .filter(e => e.expiry)
            .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
          
          const firstIso = returnLots[0].expiry
          const pa = calcPutaway(withdrawal.drugId, firstIso)
          
          setPutaway({ 
            drug, 
            returnLots, 
            pa, 
            context: 'return' 
          })
        }
      }
      
      closeRet(withdrawal.docId)
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message)
    }
  }

  return (
    <div className="scroll">
      {/* Confirm Delete Overlay */}
      {confirmOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:300, textAlign:'center' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'#FCEBEB', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:24 }}>🗑️</div>
            <div style={{ fontSize:15, fontWeight:500, color:'#1A2E25', marginBottom:6 }}>ยืนยันการลบรายการ</div>
            <div style={{ fontSize:12, color:'#5F7A6A', marginBottom:20, lineHeight:1.5 }}>รายการ Pending นี้จะถูกลบออก<br/>ไม่สามารถเรียกคืนได้</div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn full" onClick={() => { setConfirmOpen(false); setPendingDeleteId(null) }} style={{ flex:1 }}>ยกเลิก</button>
              <button className="btn danger full" onClick={doDelete} style={{ flex:1, background:'#A32D2D', color:'#fff', border:'none' }}>ลบรายการ</button>
            </div>
          </div>
        </div>
      )}
      <div className="card blue">
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>⏱ Pending - ยารอคืนเข้าสต็อก</div>
        <div style={{ fontSize: 11, color: '#5F7A6A' }}>
          รายการที่ต้องทำให้เสร็จภายในเวร ({allPending.length} รายการ)
        </div>
      </div>
      {allPending.length === 0 ? (
        <div className="ok">✓ ไม่มีรายการค้าง — ทุกอย่างเรียบร้อย</div>
      ) : (
        <>
          <div className="info">
            💡 <b>วิธีคืนยา:</b> กดปุ่ม "Replace" หรือ "Return" แล้วพิมพ์ชื่อยาและกรอก EXP ที่นำมาคืน
          </div>
          {allPending.map(item => {
            const hours = getHoursSince(item.timestamp)
            const agingClass = getAgingClass(hours)
            
            if (item.type === 'replacement') {
              // Pending Replacement (Emergency / Missing)
              const drugName = item.drug_name || '(ยาไม่ระบุ)'
              return (
                <div key={item.docId} className={`pending-card ${agingClass}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E25', marginBottom: 2 }}>
                        {item.bed_id}
                        {item.source === 'missing_tracked' && <span className="b br" style={{ marginLeft: 6 }}>Missing</span>}
                        {item.source === 'emergency' && <span className="b bo" style={{ marginLeft: 6 }}>Emergency</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#5F7A6A' }}>{drugName} · {item.nurse}</div>
                      {item.source === 'missing_tracked' && item.qty > 0 && (() => {
                        const ret = item.returned_qty || 0
                        const tot = item.qty || 0
                        const pct = Math.min(100, Math.round(ret / tot * 100))
                        const done = ret >= tot
                        return (
                          <div style={{ marginTop:5 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                              <span style={{ fontSize:10, color: done ? '#0F6E56' : '#E65100', fontWeight:500 }}>
                                {done ? '✓ คืนครบแล้ว' : `คืนแล้ว ${ret}/${tot} amp`}
                              </span>
                              <span style={{ fontSize:10, color:'#8BA898' }}>{pct}%</span>
                            </div>
                            <div style={{ background:'#D6EAE2', borderRadius:999, height:5, overflow:'hidden' }}>
                              <div style={{ width:`${pct}%`, height:'100%', background: done ? '#0F6E56' : '#FFB74D', borderRadius:999 }}/>
                            </div>
                          </div>
                        )
                      })()}
                      <div style={{ fontSize: 10, color: '#8BA898', marginTop: 2 }}>{fmtDTsafe(item.timestamp)}</div>
                    </div>
                    <div className={`aging ${agingClass}`}>⏱ {hours.toFixed(1)} ชม.</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {item.source === 'missing_tracked' ? (() => {
                      const _ret = item.returned_qty || 0
                      const _tot = item.qty || 0
                      const _done = _tot > 0 && _ret >= _tot
                      const _left = Math.max(0, _tot - _ret)
                      return _done ? (
                        <div style={{ flex:1, padding:'6px 10px', background:'#E1F5EE', borderRadius:8, fontSize:11, color:'#0F6E56', fontWeight:500, textAlign:'center' }}>✓ คืนครบแล้ว {_tot} amp</div>
                      ) : (
                        <button className="btn primary full sm" onClick={() => setMissingReturnModal(item)}>
                          ✓ Return{_ret > 0 ? ` (เหลือ ${_left} amp)` : ''}
                        </button>
                      )
                    })() : (
                      <button className="btn primary full sm" onClick={() => setReplaceModal(item)}>✓ Replace</button>
                    )}
                    <button className="btn danger sm" onClick={() => deletePending(item.docId)}>✕</button>
                  </div>
                </div>
              )
            } else {
              // Stock Return - inline form with FEFO preview
              const rs = retStates[item.docId]
              const curYear = new Date().getFullYear()
              const months = ['01','02','03','04','05','06','07','08','09','10','11','12']
              const thM = ['Jan.','Feb.','Mar.','Apr.','May','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.']
              const years = Array.from({length:15},(_,i)=>curYear+i)
              
              return (
                <div key={item.docId} className={`pending-card ${agingClass}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2E25', marginBottom: 2 }}>
                        {item.bed} — {item.drugName}
                        <span className="b" style={{ marginLeft: 6, background:'#E3F2FD', color:'#1565C0', border:'0.5px solid #64B5F6', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:600 }}>เบิกไป ×{item.qty}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#5F7A6A' }}>{item.nurse}</div>
                      {/* Partial return progress */}
                      {(() => {
                        const _ret = item.returned_qty || 0
                        const _tot = item.qty || 0
                        if (_ret === 0 || _tot === 0) return null
                        const _pct = Math.min(100, Math.round(_ret / _tot * 100))
                        const _left = Math.max(0, _tot - _ret)
                        return (
                          <div style={{ marginTop:5 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                              <span style={{ fontSize:10, color:'#E65100', fontWeight:500 }}>คืนแล้ว {_ret}/{_tot} · ยังเหลือ {_left}</span>
                              <span style={{ fontSize:10, color:'#8BA898' }}>{_pct}%</span>
                            </div>
                            <div style={{ background:'#D6EAE2', borderRadius:999, height:5, overflow:'hidden' }}>
                              <div style={{ width:`${_pct}%`, height:'100%', background:'#FFB74D', borderRadius:999 }}/>
                            </div>
                          </div>
                        )
                      })()}
                      <div style={{ fontSize: 10, color: '#8BA898', marginTop: 2 }}>{fmtDTsafe(item.timestamp)}</div>
                    </div>
                    <div className={`aging ${agingClass}`}>⏱ {hours.toFixed(1)} ชม.</div>
                  </div>
                  
                  {!rs?.open && (() => {
                    const _ret = item.returned_qty || 0
                    const _tot = item.qty || 0
                    const _left = Math.max(0, _tot - _ret)
                    return (
                      <button onClick={() => openRet(item.docId, item.drugId)} className="btn primary full sm">
                        {_ret > 0 ? `ยืนยัน Return · เหลืออีก ${_left} ชิ้น` : 'ยืนยัน Return + ดูตำแหน่งการวาง'}
                      </button>
                    )
                  })()}
                  
                  {rs?.open && (
                    <div style={{ marginTop: 8, padding: '10px 12px', background: '#F9FCF9', border: '0.5px solid #D8EAE0', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#1A2E25', marginBottom: 8 }}>
                        ระบุ EXP ของยาที่คืน
                        {rs.entries.length === 1 && (
                          <button onClick={() => addRetEntry(item.docId)} 
                            style={{ float: 'right', fontSize: 10, padding: '2px 8px', background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 6, color: '#0F6E56', cursor: 'pointer' }}>
                            + เพิ่ม lot (ถ้า EXP ต่าง)
                          </button>
                        )}
                      </div>
                      
                      <div style={{ fontSize: 11, color: '#5F7A6A', marginBottom: 8, padding: '6px 10px', background: '#E3F2FD', borderRadius: 6 }}>
                        💡 FEFO ปัจจุบัน: 03/2027
                      </div>
                      
                      {rs.entries.map((entry, idx) => (
                        <div key={entry.id} style={{ marginBottom: 8, padding: '8px 10px', background: '#fff', border: '0.5px solid #E0EAE5', borderRadius: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ fontSize: 10, fontWeight: 500, color: '#5F7A6A' }}>ชุดที่ {idx + 1}</div>
                            {rs.entries.length > 1 && (
                              <button onClick={() => removeRetEntry(item.docId, entry.id)}
                                style={{ background: 'none', border: 'none', color: '#A32D2D', fontSize: 14, cursor: 'pointer' }}>✕</button>
                            )}
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                            <div>
                              <div style={{ fontSize: 10, color: '#5F7A6A', marginBottom: 2 }}>จำนวน</div>
                              <input type="number" value={entry.qty} min="1"
                                onChange={e => updateRetEntry(item.docId, entry.id, 'qty', Math.max(1, parseInt(e.target.value) || 1), item.drugId)}
                                style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '0.5px solid #D8EAE0', borderRadius: 6 }} />
                            </div>
                            {rs.useFull ? (
                              <div>
                                <div style={{ fontSize: 10, color: '#5F7A6A', marginBottom: 2 }}>EXP (วัน/เดือน/ปี)</div>
                                <input type="date" value={entry.fullDate}
                                  onChange={e => updateRetEntry(item.docId, entry.id, 'fullDate', e.target.value, item.drugId)}
                                  min={new Date().toISOString().split('T')[0]}
                                  style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '0.5px solid #D8EAE0', borderRadius: 6 }} />
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontSize: 10, color: '#5F7A6A', marginBottom: 2 }}>เดือน EXP</div>
                                <select value={entry.expM} 
                                  onChange={e => updateRetEntry(item.docId, entry.id, 'expM', e.target.value, item.drugId)}
                                  style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '0.5px solid #D8EAE0', borderRadius: 6 }}>
                                  <option value="">-- Month --</option>
                                  {months.map((m,i) => <option key={m} value={m}>{m} ({thM[i]})</option>)}
                                </select>
                              </div>
                            )}
                          </div>
                          
                          {!rs.useFull && (
                            <div style={{ marginBottom: 6 }}>
                              <div style={{ fontSize: 10, color: '#5F7A6A', marginBottom: 2 }}>EXP Year</div>
                              <select value={entry.expY}
                                onChange={e => updateRetEntry(item.docId, entry.id, 'expY', e.target.value, item.drugId)}
                                style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '0.5px solid #D8EAE0', borderRadius: 6 }}>
                                <option value="">-- Year --</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                          )}
                          
                          {/* FEFO Preview */}
                          {entry.fefoPreview && (
                            <div style={{ 
                              padding: '6px 10px', 
                              background: entry.fefoPreview.color + '15',
                              border: `0.5px solid ${entry.fefoPreview.color}80`,
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: entry.fefoPreview.color }}>
                                {entry.fefoPreview.label}
                              </div>
                              <div style={{ fontSize: 9, color: '#5F7A6A', flex: 1 }}>
                                {entry.fefoPreview.desc}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button onClick={() => closeRet(item.docId)} className="btn sm" style={{ flex: 1 }}>
                          ยกเลิก
                        </button>
                        <button onClick={() => submitReturn(item)} className="btn primary sm" style={{ flex: 1 }}
                          disabled={!rs?.entries?.some(e => e.fullDate || (e.expM && e.expY))}>
                          {(() => {
                            const _ret = item.returned_qty || 0
                            const _tot = item.qty || 0
                            const _now = rs?.entries?.reduce((s,e)=>s+(e.qty||1),0)||0
                            const _after = _ret + _now
                            const _done = _after >= _tot
                            return _done
                              ? `✓ Return ${_now} · ครบ ${_tot}/${_tot} — ปิดรายการ`
                              : `✓ Return ${_now} · ยังเหลือ ${Math.max(0,_tot-_after)}`
                          })()}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            }
          })}
        </>
      )}
    </div>
  )
}

function QuickUseModal({ open, onClose, drugsWithStock, lots, nurses, db, initDrug }) {
  const [qCart, setQCart]   = useState({})
  const [qScanned, setQScanned] = useState(new Set())
  const [qNurse, setQNurse] = useState(''); const [qNQ, setQNQ] = useState(''); const [qNOpen, setQNOpen] = useState(false)
  const [qBed, setQBed]     = useState(''); const [qBedOther, setQBedOther] = useState('')
  const [qSearch, setQSearch] = useState('')
  const [qSaving, setQSaving] = useState(false)
  const [qDone, setQDone]   = useState(false)
  const [qCountdown, setQCountdown] = useState(3)
  const [doneSnap, setDoneSnap] = useState([])
  const [doneNurse, setDoneNurse] = useState('')
  const [qScanOpen, setQScanOpen] = useState(false)

  const dl = drugsWithStock()
  const cartDrugs = () => dl.filter(d => (qCart[d.id] || 0) > 0)
  const totalItems = () => Object.values(qCart).reduce((a, b) => a + b, 0)
  const adj = (id, delta) => {
    const drug = dl.find(d => d.id === id); if (!drug) return
    setQCart(prev => ({ ...prev, [id]: Math.max(0, Math.min(drug.stock, (prev[id] || 0) + delta)) }))
  }
  const doClose = () => {
    setQCart({}); setQScanned(new Set()); setQNurse(''); setQNQ(''); setQSearch('')
    setQBed(''); setQBedOther(''); setQDone(false); setDoneSnap([]); setQScanOpen(false); onClose()
  }
  // pre-select drug when opened via scan/global
  useEffect(() => {
    if (open && initDrug) {
      const dl = drugsWithStock()
      const drug = dl.find(d => d.name === initDrug)
      if (drug) {
        setQCart(prev => ({ ...prev, [drug.id]: Math.max(prev[drug.id]||0, 1) }))
        setQScanned(prev => new Set([...prev, drug.id]))
      }
    }
  }, [open, initDrug])
  const qScanDrug = (drugName) => {
    setQScanOpen(false)
    const dl = drugsWithStock()
    const drug = dl.find(d => d.name === drugName)
    if (!drug) { alert(`ไม่พบยา: ${drugName}`); return }
    setQCart(prev => ({ ...prev, [drug.id]: Math.max(prev[drug.id]||0, 1) }))
    setQScanned(prev => new Set([...prev, drug.id]))
  }
  const submit = async () => {
    setQSaving(true)
    try {
      const items = cartDrugs()
      const snap = items.map(d => ({ ...d, usedQty: qCart[d.id] || 0 }))
      const bedVal = qBed === 'other' ? 'อื่นๆ: ' + qBedOther.trim() : qBed
      for (const drug of items) {
        const qty = qCart[drug.id] || 0; if (!qty) continue
        const ls = lots.filter(l => l.drugId == drug.id && l.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
        let rem = qty
        for (const l of ls) {
          if (rem <= 0) break
          const take = Math.min(l.qty, rem)
          await updateDoc(doc(db, 'lots', l.docId), { qty: l.qty - take })
          rem -= take
        }
        await addDoc(collection(db, 'withdrawals'), {
          nurse: qNurse, drugId: drug.id, drugName: drug.name, bed: bedVal,
          qty, note: '(Multi Quick Use)', returned: false, retExp: '', ts: Timestamp.now(),
          usage_type: 'Normal',
          pending_sync_id: null,
          reconciliation_time_minutes: null
        })
      }
      setDoneSnap(snap); setDoneNurse(qNurse)
      setQDone(true); setQCountdown(3)
      let n = 3
      const t = setInterval(() => {
        n -= 1; setQCountdown(n)
        if (n <= 0) { clearInterval(t); doClose() }
      }, 1000)
    } catch (e) { alert('เกิดข้อผิดพลาด: ' + e.message) }
    setQSaving(false)
  }

  if (!open) return null
  const canSubmit = qNurse && qBed && (qBed !== 'other' || qBedOther.trim()) && cartDrugs().length > 0 && !qSaving

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '14px 14px 0 0', width: '100%', maxWidth: 480, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid #E0EAE5', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#0F6E56' }}>⚡ ใช้ยาสต็อก (Quick Use)</div>
          <button onClick={doClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#8BA898', lineHeight: 1 }}>✕</button>
        </div>
        {!qDone ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div className="lbl">พยาบาลผู้เบิก</div>
              <NursePicker value={qNurse} query={qNQ} open={qNOpen} nurses={nurses}
                onChange={(v, o) => { setQNQ(v); setQNurse(''); setQNOpen(o !== undefined ? o : v.length > 0) }}
                onSelect={v => { setQNurse(v); setQNQ(v); setQNOpen(false) }}
                onClear={() => { setQNurse(''); setQNQ(''); setQNOpen(false) }} />
            </div>
            <div>
              <div className="lbl">เตียงผู้ป่วย</div>
              <select className="inp" value={qBed} onChange={e => { setQBed(e.target.value); if (e.target.value !== 'other') setQBedOther('') }}>
                <option value="">-- เลือกเตียง --</option>
                {BEDS.map(b => <option key={b} value={b}>{b}</option>)}
                <option value="other">อื่นๆ (ระบุเอง)</option>
              </select>
              {qBed === 'other' && (
                <input className="inp" value={qBedOther} placeholder="เช่น แผนก OPD ยืม, ห้องฉุกเฉิน..." onChange={e => setQBedOther(e.target.value)} style={{ marginTop: 6 }} />
              )}
            </div>
            <div>
              <div className="lbl">เลือกยาและจำนวนที่ต้องการใช้</div>
              {/* selected section บนสุด */}
              {cartDrugs().length > 0 && (
                <div style={{ background:'#F0FAF5', border:'0.5px solid #9FE1CB', borderRadius:8, overflow:'hidden', marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 10px', background:'#E1F5EE', fontSize:10, fontWeight:500, color:'#0F6E56' }}>
                    <span>✓ ยาที่เลือกแล้ว</span>
                    <span>{cartDrugs().length} ชนิด / {totalItems()} รายการ</span>
                  </div>
                  {cartDrugs().map((drug,i) => (
                    <div key={drug.id} style={{ display:'flex', alignItems:'center', padding:'7px 10px', gap:8, borderBottom: i<cartDrugs().length-1?'0.5px solid #C8EDD8':'' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:500, color:'#0F6E56' }}>
                          {drug.name}
                          {qScanned.has(drug.id) && <span style={{ background:'#C8EDD8', borderRadius:10, padding:'1px 6px', fontSize:9, marginLeft:5, color:'#085041' }}>📷 สแกน</span>}
                        </div>
                        <div style={{ fontSize:10, color:'#5F7A6A' }}>stock {drug.stock} {drug.unit}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <button onClick={() => adj(drug.id,-1)} style={{ width:26, height:26, borderRadius:6, border:'0.5px solid #9FE1CB', background:'#fff', color:'#0F6E56', fontSize:16, cursor:'pointer', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                        <span style={{ minWidth:20, textAlign:'center', fontSize:14, fontWeight:700, color:'#0F6E56' }}>{qCart[drug.id]||0}</span>
                        <button onClick={() => adj(drug.id,+1)} disabled={(qCart[drug.id]||0)>=drug.stock} style={{ width:26, height:26, borderRadius:6, border:'none', background:(qCart[drug.id]||0)<drug.stock?'#0F6E56':'#E0EAE5', color:(qCart[drug.id]||0)<drug.stock?'#fff':'#aaa', fontSize:16, cursor:(qCart[drug.id]||0)<drug.stock?'pointer':'default', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* search + scan */}
              <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                <input className="inp" value={qSearch} onChange={e => setQSearch(e.target.value)} placeholder="🔍 ค้นหายา..." style={{ flex:1, marginBottom:0 }} />
                <button onClick={() => setQScanOpen(true)} title="สแกน QR"
                  style={{ padding:'8px 10px', background:'#E1F5EE', border:'0.5px solid #9FE1CB', borderRadius:8, cursor:'pointer', fontSize:18, color:'#0F6E56', flexShrink:0 }}>📷</button>
              </div>
              <div style={{ border: '0.5px solid #E0EAE5', borderRadius: 8, overflow: 'hidden', maxHeight: 300, overflowY: 'auto' }}>
                {dl.filter(d => d.name.toLowerCase().includes(qSearch.toLowerCase())).map((drug, i, arr) => {
                  const qty = qCart[drug.id] || 0; const sel = qty > 0
                  return (
                    <div key={drug.id} style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', gap: 10, background: sel ? '#F0FAF5' : '#fff', borderBottom: i < arr.length - 1 ? '0.5px solid #F0F4F2' : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: sel ? '#0F6E56' : '#1A2E25' }}>
                          {drug.name}
                          {qScanned.has(drug.id) && <span style={{ background:'#C8EDD8', borderRadius:10, padding:'1px 5px', fontSize:9, marginLeft:4, color:'#085041' }}>📷</span>}
                        </div>
                        <div style={{ fontSize: 10, color: '#8BA898', marginTop: 1 }}>
                          {STORAGE_GROUPS.find(g => g.id === drug.groupId)?.icon} {STORAGE_GROUPS.find(g => g.id === drug.groupId)?.name} · stock {drug.stock} {drug.unit}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <button onClick={() => adj(drug.id, -1)} disabled={qty === 0}
                          style={{ width: 30, height: 30, borderRadius: 7, border: '0.5px solid #C8DDD6', background: qty > 0 ? '#fff' : '#F5F5F5', color: qty > 0 ? '#0F6E56' : '#ccc', fontSize: 18, cursor: qty > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                        <span style={{ minWidth: 22, textAlign: 'center', fontSize: 15, fontWeight: 700, color: qty > 0 ? '#0F6E56' : '#8BA898' }}>{qty}</span>
                        <button onClick={() => adj(drug.id, +1)} disabled={qty >= drug.stock}
                          style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: qty < drug.stock ? '#0F6E56' : '#E0EAE5', color: qty < drug.stock ? '#fff' : '#aaa', fontSize: 18, cursor: qty < drug.stock ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#0F6E56', marginBottom: 4 }}>บันทึกสำเร็จ</div>
            <div style={{ fontSize: 12, color: '#5F7A6A', marginBottom: 16 }}>ตัดยา {doneSnap.length} ชนิด รวม {doneSnap.reduce((a, d) => a + d.usedQty, 0)} รายการ · โดย {doneNurse}</div>
            <div style={{ border: '0.5px solid #E0EAE5', borderRadius: 8, overflow: 'hidden', marginBottom: 16, textAlign: 'left' }}>
              {doneSnap.map((drug, i) => (
                <div key={drug.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: 12, borderBottom: i < doneSnap.length - 1 ? '0.5px solid #F0F4F2' : 'none' }}>
                  <span>{drug.name}</span>
                  <span style={{ fontWeight: 500, color: '#0F6E56' }}>×{drug.usedQty} {drug.unit}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#E0EAE5', borderRadius: 4, height: 4, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', background: '#0F6E56', width: (qCountdown / 3 * 100) + '%', transition: 'width 1s linear' }} />
            </div>
            <div style={{ fontSize: 11, color: '#8BA898' }}>ปิดอัตโนมัติใน {qCountdown} วินาที...</div>
          </div>
        )}
        {!qDone && (
          <div style={{ padding: '10px 14px', borderTop: '0.5px solid #E0EAE5', flexShrink: 0 }}>
            <button className="btn primary full" onClick={submit} disabled={!canSubmit}>
              {qSaving ? 'กำลังบันทึก...' : cartDrugs().length > 0 ? '⚡ ยืนยันการใช้ยา ' + cartDrugs().length + ' ชนิด / ' + totalItems() + ' รายการ' : '⚡ ยืนยันการใช้ยา'}
            </button>
          </div>
        )}
        {qScanOpen && <QrScanModal onScan={qScanDrug} onClose={() => setQScanOpen(false)} drugs={drugsWithStock()} />}
      </div>
    </div>
  )
}


function Dashboard({ drugsWithStock, alerts, unret, lastCheck, lots, lotsOf, calcPutaway, nurses, setCurTab, setPutaway, db, fmtMY, daysLeft, setQModal, setSmartTimestampModal, pendingSyncs }) {
  const [retStates, setRetStates] = useState({})
  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const dl = drugsWithStock()
  const openRet = docId => {
    const w = unret.find(x => x.docId === docId)
    // qty เริ่มต้น = ที่ยังเหลือ (qty - returned_qty)
    const remaining = Math.max(1, (w?.qty || 1) - (w?.returned_qty || 0))
    const initEntries = [{ qty: remaining, expM: '', expY: '', fullDate: '', preview: null }]
    setRetStates(s => ({ ...s, [docId]: { open: true, entries: initEntries } }))
  }
  const closeRet = docId => setRetStates(s => ({ ...s, [docId]: undefined }))

  const updRetEntry = (docId, idx, field, val) => {
    setRetStates(s => {
      const rs  = s[docId]
      if (!rs) return s
      const w2 = unret.find(w => w.docId === docId)
      const drugId2 = w2?.drugId
      const drugObj2 = dl.find(d => d.id == drugId2)
      const entries = rs.entries.map((e, i) => {
        if (i !== idx) return e
        const ne = { ...e, [field]: val }
        let iso = null
        if (field === 'fullDate' && val) iso = val
        else {
          const m = field === 'expM' ? val : e.expM
          const y = field === 'expY' ? val : e.expY
          if (m && y) iso = myToISO(m, y)
        }
        if (!iso) { ne.preview = null; return ne }
        // Single-stock: แสดง "วางแทนของเดิม" แทน FEFO
        if (drugObj2?.singleStock) {
          ne.preview = { singleStock: true, label: '🔄 วางแทนของเดิม', isFEFOSide: null }
          return ne
        }
        // Multi-lot: คำนวณตำแหน่งรวมกับ lot อื่นที่กำลังคืนพร้อมกัน
        const siblingIsos = rs.entries
          .filter((e2, j) => j !== i)
          .map(e2 => e2.fullDate || myToISO(e2.expM, e2.expY))
          .filter(Boolean)
        const allReturnIsos = [...siblingIsos, iso].sort()
        // ใช้ iso ที่เล็กสุดของทุก lot ที่คืนเพื่อ calc existingLots
        const pa = calcPutaway(drugId2, allReturnIsos[0])
        if (siblingIsos.length === 0) {
          // คืน lot เดียว — ใช้ label ปกติ
          const paSelf = calcPutaway(drugId2, iso)
          ne.preview = paSelf
        } else {
          // คืนหลาย lot — บอกแค่ "ดูตำแหน่งหลังยืนยัน" ไม่ให้สับสน
          ne.preview = { multiLot: true, label: '🔍 ดูตำแหน่งรวมหลังยืนยัน', isFEFOSide: null }
        }
        return ne
      })
      return { ...s, [docId]: { ...rs, entries } }
    })
  }
  const addRetEntry = docId => {
    setRetStates(s => {
      const rs = s[docId]; if (!rs) return s
      return { ...s, [docId]: { ...rs, entries: [...rs.entries, { qty: 1, expM: '', expY: '', fullDate: '', preview: null }] } }
    })
  }
  const removeRetEntry = (docId, idx) => {
    setRetStates(s => {
      const rs = s[docId]; if (!rs) return s
      const entries = rs.entries.filter((_, i) => i !== idx)
      return { ...s, [docId]: { ...rs, entries: entries.length ? entries : rs.entries } }
    })
  }

  const confirmRet = async (w) => {
    const rs = retStates[w.docId]; if (!rs) return
    const drug = dl.find(d => d.id == w.drugId) || { name: w.drugName, unit: '' }
    const validEntries = rs.entries.filter(e => e.fullDate || (e.expM && e.expY))
    // บันทึกทุก lot ลง Firebase ก่อน
    for (const entry of validEntries) {
      const iso = entry.fullDate || myToISO(entry.expM, entry.expY)
      if (!iso) continue
      await addDoc(collection(db, 'lots'), { drugId: w.drugId, qty: entry.qty, expiry: iso, ts: Timestamp.now() })
    }
    // แสดง overlay พร้อม return lots ทั้งหมดพร้อมกัน
    if (validEntries.length > 0) {
      if (drug?.singleStock) {
        const group = STORAGE_GROUPS.find(g => g.id === drug.groupId)
        const firstIso = validEntries[0].fullDate || myToISO(validEntries[0].expM, validEntries[0].expY)
        setPutaway({ drug, qty: validEntries[0].qty, expiry: firstIso, context: 'return', singleStock: true, groupName: group?.name || '', groupIcon: group?.icon || '📦' })
      } else {
        const firstIso = validEntries[0].fullDate || myToISO(validEntries[0].expM, validEntries[0].expY)
        const pa = calcPutaway(w.drugId, firstIso)
        const returnLots = validEntries
          .map(e => ({ expiry: e.fullDate || myToISO(e.expM, e.expY), qty: e.qty }))
          .filter(e => e.expiry)
          .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
        setPutaway({ drug, returnLots, pa, context: 'return' })
      }
    }
    const _retNow = validEntries.reduce((s, e) => s + (e.qty || 1), 0)
    const _prevRet = w.returned_qty || 0
    const _newRet  = _prevRet + _retNow
    const _isFull  = _newRet >= (w.qty || 0)
    await updateDoc(doc(db, 'withdrawals', w.docId), { 
      returned_qty: _newRet,
      returned: _isFull,
      retExp: validEntries[0]?.fullDate || myToISO(validEntries[0]?.expM, validEntries[0]?.expY),
      return_timestamp: Timestamp.now()
    })
    closeRet(w.docId)
  }

  return (
    <>
      {/* Quick Use Bar */}
      {/* ─── Action Buttons Row ─── */}
      <div style={{ display:'flex', gap:8 }}>

        {/* Emergency Use — LEFT */}
        {setSmartTimestampModal && (
          <div onClick={() => setSmartTimestampModal(true)}
            style={{ flex:1, background:'#E65100', borderRadius:14, padding:'13px 12px', cursor:'pointer', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-20, left:-20, width:70, height:70, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }}/>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ background:'#C62828', color:'#fff', borderRadius:6, padding:'3px 8px', fontSize:9, fontWeight:500, letterSpacing:.3 }}>EMERGENCY</div>
              <div className="pulse-dot"/>
            </div>
            <div style={{ marginBottom:6 }}>
              <span className="bell-anim" style={{ fontSize:36, lineHeight:1 }}>🔔</span>
            </div>
            <div style={{ color:'#fff', fontSize:13, fontWeight:500 }}>Emergency Use</div>
            <div style={{ color:'#FFCCBC', fontSize:11, marginTop:1 }}>ใช้ยาฉุกเฉิน</div>
            <div style={{ color:'rgba(255,255,255,0.75)', fontSize:10, marginTop:6, lineHeight:1.5 }}>กดเตียงทันที →<br/>เติมยาคืนภายหลัง</div>
          </div>
        )}

        {/* Stock Use — RIGHT */}
        <div onClick={() => setQModal(true)}
          style={{ flex:1, background:'#C5C0F0', borderRadius:14, padding:'13px 12px', cursor:'pointer' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ background:'rgba(255,255,255,0.45)', color:'#3C3489', borderRadius:20, padding:'2px 8px', fontSize:9, fontWeight:500 }}>กดใช้ยาสต็อก</div>
          </div>
          <div style={{ marginBottom:6 }}>
            <svg width="44" height="38" viewBox="0 0 44 38">
              <rect x="2" y="12" width="40" height="24" rx="7" fill="#fff" stroke="#E0E0E0" strokeWidth="1"/>
              <rect x="2" y="12" width="40" height="13" rx="7" fill="#EF5350"/>
              <rect x="2" y="21" width="40" height="4" fill="#E53935"/>
              <path d="M15 5 h14 a3 3 0 0 1 3 3 v4 H12 V8 a3 3 0 0 1 3-3Z" fill="#B71C1C"/>
              <circle cx="22" cy="28" r="7" fill="#E53935"/>
              <rect x="18.5" y="26.5" width="7" height="3" rx="1.5" fill="white"/>
              <rect x="20.5" y="24.5" width="3" height="7" rx="1.5" fill="white"/>
            </svg>
          </div>
          <div style={{ color:'#3C3489', fontSize:13, fontWeight:500 }}>Stock Use</div>
          <div style={{ color:'#534AB7', fontSize:11, marginTop:1 }}>ใช้ยาสต็อก</div>
          <div style={{ color:'rgba(60,52,137,0.6)', fontSize:10, marginTop:6, lineHeight:1.5 }}>เลือกยา → เตียง → ยืนยัน</div>
        </div>

      </div>

      {/* Stats — row 1: In Stock | Low Stock | Out of Stock */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }} id="stats-row1">
        <div className="sc sc-ripple" style={{ background: '#FFFFFF', borderColor: '#D0E8D5', border:'0.5px solid #D0E8D5', cursor:'pointer' }} onClick={()=>document.getElementById('sect-stock')?.scrollIntoView({behavior:'smooth',block:'nearest'})}>
          <div className="sc-n" style={{ color: '#1E8449' }}>{dl.filter(d => d.stock > 0).length}</div>
          <div className="sc-l" style={{ color: '#7F8C8D' }}>In Stock</div>
        </div>
        <div className="sc sc-ripple" style={{ background: '#FFFFFF', borderColor: '#F0C9A0', border:'0.5px solid #F0C9A0', cursor:'pointer' }} onClick={()=>document.getElementById('sect-stock')?.scrollIntoView({behavior:'smooth',block:'nearest'})}>
          <div className="sc-n" style={{ color: '#D35400' }}>{alerts.low.length}</div>
          <div className="sc-l" style={{ color: '#7F8C8D' }}>Low Stock</div>
        </div>
        <div className="sc sc-ripple" style={{ background: '#FFFFFF', borderColor: '#F5B8B8', border:'0.5px solid #F5B8B8', cursor:'pointer' }} onClick={()=>document.getElementById('sect-stock')?.scrollIntoView({behavior:'smooth',block:'nearest'})}>
          <div className="sc-n" style={{ color: '#C0392B' }}>{alerts.out.length}</div>
          <div className="sc-l" style={{ color: '#7F8C8D' }}>Out of Stock</div>
        </div>
      </div>
      {/* Stats — row 2: Expiry Alert | Pending Returns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginTop: -4 }}>
        <div className="sc sc-ripple" style={{ background: '#FFFFFF', borderColor: '#F8D99A', border:'0.5px solid #F8D99A', cursor:'pointer' }} onClick={()=>document.getElementById('sect-exp')?.scrollIntoView({behavior:'smooth',block:'nearest'})}>
          <div className="sc-n" style={{ color: '#F39C12' }}>{alerts.exp.length + alerts.soon.length + alerts.exchangeDue.length + alerts.exchangeOver.length}</div>
          <div className="sc-l" style={{ color: '#7F8C8D' }}>Expiry Alert</div>
        </div>
        <div className="sc sc-ripple" style={{ background: '#FFFFFF', borderColor: '#A8D4F0', border:'0.5px solid #A8D4F0', cursor:'pointer' }} onClick={()=>document.getElementById('sect-ret')?.scrollIntoView({behavior:'smooth',block:'nearest'})}>
          <div className="sc-n" style={{ color: '#2980B9' }}>{unret.length}</div>
          <div className="sc-l" style={{ color: '#7F8C8D' }}>Pending Returns</div>
        </div>
      </div>

      {/* ── Actionable Alert Cards (moved directly below stat cards) ── */}

      {/* Pending Alert — Emergency + Missing_Tracked */}
      {/* Emergency Replacement Alert - เร่งด่วนมาก */}
      {pendingSyncs && (() => {
        const emergencyPending = pendingSyncs.filter(p => p.status === 'pending' && p.source === 'emergency')
        if (emergencyPending.length === 0) return null
        const hasOld = emergencyPending.some(p => {
          const h = (new Date() - (p.timestamp?.toDate ? p.timestamp.toDate() : new Date(p.timestamp))) / 3600000
          return h >= 4
        })
        return (
          <div style={{ background:'#FCE4EC', border:'1.5px solid #EC407A', borderRadius:14, padding:'12px 14px', cursor:'pointer', position:'relative', transition:'all 0.2s ease', marginBottom:8 }}
            onClick={() => setCurTab('pending')}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 14px rgba(236,64,122,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
            {/* Badge with pulse */}
            <div className="blink-badge" style={{ position:'absolute', top:-6, left:12, background:'#F44336', color:'#fff', borderRadius:20, minWidth:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, padding:'0 5px', border:'2px solid #fff' }}>
              {emergencyPending.length}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {/* Icon wrap with pulse ring */}
              <div className="alert-icon-pulse" style={{ width:44, height:44, borderRadius:'50%', background:'#fff', border:'2px solid #EC407A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span className="shake-icon" style={{ fontSize:22 }}>🚨</span>
              </div>
              <div style={{ flex:1, minWidth:0, paddingRight:4 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#AD1457', wordBreak:'break-word', overflowWrap:'break-word' }}>
                  มียาฉุกเฉินรอเติมคืน {emergencyPending.length} รายการ
                </div>
                <div style={{ fontSize:11, color:'#C2185B', marginTop:3, lineHeight:1.5 }}>
                  ⚡ Emergency Use — ต้องเติมด่วน!
                </div>
                {hasOld && (
                  <div style={{ fontSize:10, color:'#B71C1C', marginTop:3, fontWeight:500 }}>⚠️ มีรายการค้างเกิน 4 ชม.</div>
                )}
                <div style={{ fontSize:10, color:'#AD1457', marginTop:2 }}>กด Pending tab เพื่อเติมยาคืน</div>
              </div>
              <div style={{ color:'#EC407A', fontSize:18, flexShrink:0, marginTop:2 }}>›</div>
            </div>
          </div>
        )
      })()}


      {/* Pending Returns */}
      <div id='sect-ret'/>
      {unret.length > 0 && (
        <div style={{ background:'#E3F2FD', border:'1.5px solid #42A5F5', borderRadius:14, padding:'12px 14px', position:'relative', cursor:'pointer', transition:'all 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 14px rgba(66,165,245,0.25)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
          {/* Badge */}
          <div className="blink-badge" style={{ position:'absolute', top:-6, left:12, background:'#F44336', color:'#fff', borderRadius:20, minWidth:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, padding:'0 5px', border:'2px solid #fff' }}>
            {unret.length}
          </div>
          {/* Overall progress for partial returns */}
          {(() => {
            const _totReq = unret.reduce((s,w) => s + (w.qty||0), 0)
            const _totRet = unret.reduce((s,w) => s + (w.returned_qty||0), 0)
            const _pct = _totReq > 0 ? Math.min(100, Math.round(_totRet/_totReq*100)) : 0
            const _partial = unret.filter(w => (w.returned_qty||0) > 0).length
            return (
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                <div className="alert-icon-pulse-blue" style={{ width:44, height:44, borderRadius:'50%', background:'#fff', border:'2px solid #42A5F5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span className="bounce-icon" style={{ fontSize:22 }}>📥</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0D47A1', wordBreak:'break-word', overflowWrap:'break-word' }}>Pending Returns ({unret.length})</div>
                  <div style={{ fontSize:10, color:'#1565C0', marginTop:1 }}>
                    ใส่ EXP เพื่อดูตำแหน่งวาง
                    {_partial > 0 && <span style={{ marginLeft:6, color:'#E65100', fontWeight:500 }}>· กำลังคืน {_partial} รายการ</span>}
                  </div>
                  {_totReq > 0 && _totRet > 0 && (
                    <div style={{ marginTop:5 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                        <span style={{ fontSize:10, color:'#1565C0' }}>คืนแล้ว {_totRet}/{_totReq}</span>
                        <span style={{ fontSize:10, color:'#1976D2' }}>{_pct}%</span>
                      </div>
                      <div style={{ background:'#BBDEFB', borderRadius:999, height:5, overflow:'hidden' }}>
                        <div style={{ width:`${_pct}%`, height:'100%', background: _pct===100?'#0F6E56':'#42A5F5', borderRadius:999, transition:'width 0.3s' }}/>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
          {unret.map(w => {
            const rs = retStates[w.docId]
            const exLots = lots.filter(l => l.drugId == w.drugId && l.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
            return (
              <div key={w.docId} className="wrow">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{w.bed} — {w.drugName}</span>
                    <span className="b bb">เบิกไป ×{w.qty}</span>
                    {(w.returned_qty || 0) > 0 && (
                      <span style={{ fontSize:10, color:'#E65100', fontWeight:500 }}>คืนแล้ว {w.returned_qty}/{w.qty}</span>
                    )}
                  </div>
                  {(w.returned_qty || 0) > 0 && (() => {
                    const _pct = Math.min(100, Math.round((w.returned_qty||0) / (w.qty||1) * 100))
                    return (
                      <div style={{ marginTop:4, marginBottom:2 }}>
                        <div style={{ background:'#D6EAE2', borderRadius:999, height:4, overflow:'hidden' }}>
                          <div style={{ width:`${_pct}%`, height:'100%', background:'#FFB74D', borderRadius:999 }}/>
                        </div>
                      </div>
                    )
                  })()}
                  <div style={{ fontSize: 10, color: '#8BA898', marginTop: 2 }}>{w.nurse} · {w.ts && fmtMY(w.ts.toDate ? w.ts.toDate().toISOString() : w.ts)}</div>
                  {rs?.open && (
                    <div className="retpanel">
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#3C3489', marginBottom: 6 }}>
                        ระบุจำนวน + EXP ของยาที่คืน (แยกได้ถ้า EXP ต่างกัน)
                      </div>
                      {exLots.length > 0 && <div style={{ fontSize: 11, color: '#534AB7', background: 'rgba(83,74,183,.08)', borderRadius: 6, padding: '5px 8px', marginBottom: 8 }}>FEFO ปัจจุบัน: <b>{fmtMY(exLots[0].expiry)}</b></div>}
                      {rs.entries.map((entry, idx) => {
                        const iso = entry.fullDate || myToISO(entry.expM, entry.expY)
                        return (
                          <div key={idx} style={{ background: 'rgba(83,74,183,.06)', borderRadius: 8, padding: '8px 10px', marginBottom: 8, border: '0.5px solid #CECBF6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <div style={{ fontSize: 11, fontWeight: 500, color: '#3C3489' }}>ชุดที่ {idx + 1}</div>
                              <div className="nc" style={{ transform: 'scale(.85)', transformOrigin: 'left' }}>
                                <button onClick={() => updRetEntry(w.docId, idx, 'qty', Math.max(1, entry.qty - 1))}>−</button>
                                <span>{entry.qty}</span>
                                <button onClick={() => updRetEntry(w.docId, idx, 'qty', entry.qty + 1)}>+</button>
                              </div>
                              <span style={{ fontSize: 10, color: '#8BA898' }}>{w.drugName.split(' ')[0]}</span>
                              {rs.entries.length > 1 && (
                                <button onClick={() => removeRetEntry(w.docId, idx)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#A32D2D' }}>✕</button>
                              )}
                            </div>
                            {(() => {
                              const retDrug = dl.find(d => d.id == w.drugId)
                              return <ExpPicker
                                drug={retDrug}
                                expM={entry.expM} expY={entry.expY} fullDate={entry.fullDate||''}
                                onExpM={v => updRetEntry(w.docId, idx, 'expM', v)}
                                onExpY={v => updRetEntry(w.docId, idx, 'expY', v)}
                                onFullDate={v => updRetEntry(w.docId, idx, 'fullDate', v)}
                                allowToggle={true} />
                            })()}
                            {entry.preview && (
                              <div style={{ marginTop: 6,
                                background: entry.preview.singleStock ? '#EEEDFE' : entry.preview.multiLot ? '#E8F4FD' : entry.preview.isFEFOSide ? '#FCEBEB' : '#E1F5EE',
                                border: `0.5px solid ${entry.preview.singleStock ? '#C09EF5' : entry.preview.multiLot ? '#90C8F0' : entry.preview.isFEFOSide ? '#F7C1C1' : '#9FE1CB'}`,
                                borderRadius: 6, padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ fontSize: 11, fontWeight: 500,
                                  color: entry.preview.singleStock ? '#5B3A8A' : entry.preview.multiLot ? '#185FA5' : entry.preview.isFEFOSide ? '#A32D2D' : '#0F6E56' }}>
                                  {entry.preview.label}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <button onClick={() => addRetEntry(w.docId)} className="btn sm full" style={{ marginBottom: 8 }}>
                        + เพิ่มชุด EXP (คืนยา EXP ต่างกัน)
                      </button>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn primary sm" style={{ flex: 1 }}
                          onClick={() => confirmRet(w)}
                          disabled={!rs.entries.some(e => e.fullDate || (e.expM && e.expY))}>
                          {(() => {
                            const _prev = w.returned_qty || 0
                            const _tot  = w.qty || 0
                            const _now  = rs.entries.reduce((s,e) => s + (e.qty||1), 0)
                            const _after = _prev + _now
                            return _after >= _tot
                              ? `✓ Return ${_now} · ครบ ${_tot}/${_tot} — ปิดรายการ`
                              : _prev > 0
                                ? `✓ Return ${_now} · ยังเหลือ ${Math.max(0,_tot-_after)}`
                                : 'ยืนยัน Return + ดูตำแหน่งวาง'
                          })()}
                        </button>
                        <button className="btn sm" onClick={() => closeRet(w.docId)}>ยกเลิก</button>
                      </div>
                    </div>
                  )}
                </div>
                {!rs?.open && (() => {
                  const _left = Math.max(0, (w.qty||0) - (w.returned_qty||0))
                  return (
                    <button onClick={() => openRet(w.docId)} style={{ padding: '5px 11px', borderRadius: 8, border: '0.5px solid #CECBF6', background: '#EEEDFE', color: '#3C3489', fontSize: 11, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
                      {(w.returned_qty||0) > 0 ? `Return (เหลือ ${_left})` : 'Return'}
                    </button>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}

      {/* Missing Tracked Alert - รอได้ ไม่เร่งด่วน */}
      {pendingSyncs && (() => {
        const missingPending = pendingSyncs.filter(p => p.status === 'pending' && p.source === 'missing_tracked')
        if (missingPending.length === 0) return null
        const hasOld = missingPending.some(p => {
          const h = (new Date() - (p.timestamp?.toDate ? p.timestamp.toDate() : new Date(p.timestamp))) / 3600000
          return h >= 6
        })
        // คำนวณ progress รวมทุก pending
        const totalRequired = missingPending.reduce((s,p) => s + (p.qty || 0), 0)
        const totalReturned = missingPending.reduce((s,p) => s + (p.returned_qty || 0), 0)
        const partialCount  = missingPending.filter(p => (p.returned_qty || 0) > 0 && (p.returned_qty || 0) < (p.qty || 0)).length
        const overallPct    = totalRequired > 0 ? Math.min(100, Math.round(totalReturned / totalRequired * 100)) : 0
        return (
          <div style={{ background:'#E3F2FD', border:'1.5px solid #64B5F6', borderRadius:14, padding:'12px 14px', cursor:'pointer', position:'relative', transition:'all 0.2s ease', marginBottom:8 }}
            onClick={() => setCurTab('pending')}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 14px rgba(100,181,246,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
            {/* Badge */}
            <div style={{ position:'absolute', top:-6, left:12, background:'#2196F3', color:'#fff', borderRadius:20, minWidth:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, padding:'0 5px', border:'2px solid #fff' }}>
              {missingPending.length}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {/* Icon */}
              <div style={{ width:44, height:44, borderRadius:'50%', background:'#fff', border:'2px solid #64B5F6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:22 }}>🔍</span>
              </div>
              <div style={{ flex:1, minWidth:0, paddingRight:4 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#1565C0', wordBreak:'break-word', overflowWrap:'break-word' }}>
                  ยาหายรอเติมคืน {missingPending.length} รายการ
                </div>
                <div style={{ fontSize:11, color:'#1976D2', marginTop:3, lineHeight:1.5 }}>
                  🔍 Missing Tracked: {missingPending.length} รายการ
                  {partialCount > 0 && <span style={{ marginLeft:6, color:'#E65100', fontWeight:500 }}>· กำลังคืน {partialCount} รายการ</span>}
                </div>
                {/* Overall progress bar */}
                {totalRequired > 0 && (
                  <div style={{ marginTop:6 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                      <span style={{ fontSize:10, color:'#1565C0' }}>คืนแล้ว {totalReturned}/{totalRequired} amp</span>
                      <span style={{ fontSize:10, color:'#1976D2' }}>{overallPct}%</span>
                    </div>
                    <div style={{ background:'#BBDEFB', borderRadius:999, height:5, overflow:'hidden' }}>
                      <div style={{ width:`${overallPct}%`, height:'100%', background: overallPct===100 ? '#0F6E56' : '#2196F3', borderRadius:999, transition:'width 0.3s' }}/>
                    </div>
                  </div>
                )}
                {hasOld && (
                  <div style={{ fontSize:10, color:'#0D47A1', marginTop:3, fontWeight:500 }}>⚠️ มีรายการค้างเกิน 6 ชม.</div>
                )}
                <div style={{ fontSize:10, color:'#1565C0', marginTop:2 }}>กด Pending tab เพื่อเติมยาคืน</div>
              </div>
              <div style={{ color:'#64B5F6', fontSize:18, flexShrink:0, marginTop:2 }}>›</div>
            </div>
          </div>
        )
      })()}

      {/* Last check — เขียวมิ้นต์เหมือนปุ่ม Stock Count */}
      <div style={{ background:'#E1F5EE', border:'0.5px solid #9FE1CB', borderRadius:12, padding:14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#0F6E56', marginBottom: 5 }}>👥 การเช็คสต็อกล่าสุด</div>
        {lastCheck
          ? (() => {
              const ts = lastCheck.ts?.toDate ? lastCheck.ts.toDate() : new Date(lastCheck.ts)
              const shiftShort = lastCheck.shift?.includes('Day') ? 'Day Shift' : lastCheck.shift?.includes('Night') ? 'Night Shift' : lastCheck.shift || ''
              const dateStr = ts.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
              const timeStr = ts.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
              return (
                <>
                  <div style={{ fontWeight: 500, fontSize: 13, color:'#1A2E25' }}>{lastCheck.nurse}</div>
                  <div style={{ fontSize: 11, color: '#388E3C', marginTop: 2 }}>
                    {shiftShort} · {dateStr} เวลา {timeStr}
                    {lastCheck.durationMin != null && <span> · เวลา <b>{fmtDuration(lastCheck.durationMin)}</b></span>}
                  </div>
                </>
              )
            })()
          : <div style={{ fontSize: 12, color: '#388E3C' }}>ยังไม่มีการเช็คสต็อก — <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setCurTab('check')}>เริ่มเลย</span></div>
        }
      </div>

      {/* Alert Card 1: Stock Alert — ครีมเบจ */}
      <div id='sect-stock'/>
      {(alerts.low.length > 0 || alerts.out.length > 0) && (
        <div style={{ background:'#FDF2E9', border:'0.5px solid #F0C08A', borderRadius:12, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:500, color:'#E67E22', marginBottom:8 }}>⚠️ Stock Alert — Low Stock & Out of Stock</div>
          {alerts.out.map(d => <div key={d.id} className="row"><div style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{d.name}</div><span style={{ display:'inline-block', padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:500, background:'#FADBD8', color:'#E74C3C' }}>Out of Stock</span></div>)}
          {alerts.low.map(d => <div key={d.id} className="row"><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{d.name}</div><div style={{ fontSize: 10, color: '#8BA898' }}>เหลือ {d.stock} {d.unit}</div></div><span className="b ba">Low</span></div>)}
        </div>
      )}

      {/* Alert Card 2: Expiry Alert — ชมพูพาสเทล */}
      {(alerts.exp.length > 0 || alerts.soon.length > 0 || alerts.exchangeDue.length > 0) && (
        <div style={{ background:'#FCE4EC', border:'0.5px solid #F48FB1', borderRadius:12, padding:14 }}>
          <div id='sect-exp'/>
          <div style={{ fontSize:11, fontWeight:500, color:'#D81B60', marginBottom:8 }}>📅 Expiry & Exchange Alert</div>
          {alerts.exp.map(l => {
            const d = dl.find(x => x.id == l.drugId)
            return d ? <div key={l.docId} className="row"><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{d.name}</div><div style={{ fontSize: 10, color: '#C2185B' }}>EXP {fmtMY(l.expiry)}</div></div><span style={{ display:'inline-block', padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:500, background:'#D81B60', color:'#fff' }}>หมดอายุ</span></div> : null
          })}
          {alerts.exchangeDue.map(l => {
            const d = dl.find(x => x.id == l.drugId)
            return d ? <div key={l.docId} className="row"><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{d.name}</div><div style={{ fontSize: 10, color: '#C2185B' }}>EXP {fmtMY(l.expiry)} · อีก {daysLeft(l.expiry)} วัน</div></div><span style={{ display:'inline-block', padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:500, background:'#D81B60', color:'#fff' }}>ถึงเวลาแลก</span></div> : null
          })}
          {alerts.soon.slice(0, 5).map(l => {
            const d = dl.find(x => x.id == l.drugId)
            if (!d) return null
            return (
              <div key={l.docId} className="row">
                <div style={{ flex: 1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{d.name}</div>
                    {l.loaned && <span className="b bb" style={{ fontSize:9 }}>ฝากใช้</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#C2185B' }}>EXP {fmtMY(l.expiry)} · ใกล้หมดอายุ</div>
                </div>
                <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:500, background:'#D81B60', color:'#fff' }}>อีก {daysLeft(l.expiry)} วัน</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Locations summary */}
      <div className="card">
        <div className="slbl">Locations</div>
        {STORAGE_GROUPS.map(g => {
          const gDrugs = dl.filter(d => d.groupId === g.id)
          const hasLow = gDrugs.some(d => d.stock <= d.min)
          return (
            <div key={g.id} className="row">
              <div style={{ width: 10, height: 10, borderRadius: 3, background: g.color, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{g.icon} {g.name}</div></div>
              <span className={`b ${hasLow ? 'ba' : 'bg'}`}>{gDrugs.length} items</span>
            </div>
          )
        })}
      </div>

      <div className="g2">
        <button className="btn full" onClick={() => setCurTab('check')} style={{ background: '#E1F5EE', borderColor: '#9FE1CB', color: '#0F6E56', padding: 14, flexDirection: 'column', gap: 5, borderRadius: 12 }}>
          ✅<span style={{ fontSize: 12, fontWeight: 500 }}>Stock Count</span>
        </button>
        <button className="btn full" onClick={() => setCurTab('withdraw')} style={{ background: '#E6F1FB', borderColor: '#B5D4F4', color: '#185FA5', padding: 14, flexDirection: 'column', gap: 5, borderRadius: 12 }}>
          💊<span style={{ fontSize: 12, fontWeight: 500 }}>Restock</span>
        </button>
      </div>
    </>
  )
}

/* ═══ STOCK COUNT (Detailed) ═══ */
const DRAFT_KEY = 'termya_stockcount_draft'

function StockCount({ drugs, nurses, lots, lotsOf, db, fmtMY, daysLeft }) {
  const [step, setStep]       = useState('setup')
  const [nurse, setNurse]     = useState(''); const [nQ, setNQ] = useState(''); const [nOpen, setNOpen] = useState(false)
  const [shift, setShift]     = useState('')
  const [fridgeTemp, setFridgeTemp] = useState('')
  const [counts, setCounts]   = useState({})
  const [search, setSearch]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [startTs, setStartTs] = useState(null)       // originalStartTs (เวลาเริ่มแรก)
  const [activeMs, setActiveMs] = useState(0)         // ms ที่นับยาจริงๆ (สะสม, ไม่รวมเวลาออกไป)
  const [sessionStart, setSessionStart] = useState(null) // ms ที่เริ่ม session นี้ (null = paused)
  const [pauseModal, setPauseModal] = useState(null)  // {pausedAt, pausedMin} แสดงเมื่อกลับเข้ามา
  const [resolves, setResolves] = useState([])
  const [rIdx, setRIdx]         = useState(0)
  // per-location accordion + confirm
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [confirmedGroups, setConfirmedGroups] = useState({})
  const [draftRestored, setDraftRestored] = useState(false)
  const [staleDraftModal, setStaleDraftModal] = useState(null) // {draftTs} เมื่อพบ draft จากวันอื่น
  const [doneDurationMin, setDoneDurationMin] = useState(null)
  const [locDiscModal, setLocDiscModal] = useState(null)  // {groupId,gName,resolves,rIdx}
  // Refs เก็บค่าล่าสุดสำหรับ cleanup (ไม่ต้อง deps)
  const activeMsRef    = useRef(0)
  const sessionStartRef = useRef(null)
  const stepRef        = useRef('setup')
  useEffect(() => { activeMsRef.current = activeMs }, [activeMs])
  useEffect(() => { sessionStartRef.current = sessionStart }, [sessionStart])
  useEffect(() => { stepRef.current = step }, [step])
  const [locResolves, setLocResolves]   = useState([])    // resolved items per location
  const isResetting = useRef(false)

  // ── Restore draft from localStorage on mount ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) { setDraftRestored(true); return }
      const d = JSON.parse(raw)
      const isStaleDay = d.startTs && new Date(d.startTs).toDateString() !== new Date().toDateString()
      if (d.nurse) { setNurse(d.nurse); setNQ(d.nurse) }
      if (d.shift) setShift(d.shift)
      if (d.fridgeTemp !== undefined) setFridgeTemp(d.fridgeTemp)
      if (d.counts) setCounts(d.counts)
      if (d.confirmedGroups) setConfirmedGroups(d.confirmedGroups)
      if (d.expandedGroup) setExpandedGroup(d.expandedGroup)
      if (d.activeMs) { setActiveMs(d.activeMs); activeMsRef.current = d.activeMs }
      if (d.startTs) setStartTs({ toMillis: () => d.startTs, toDate: () => new Date(d.startTs) })
      if (isStaleDay) {
        setStaleDraftModal({ draftTs: d.startTs })
      } else if (d.step === 'count' && d.pausedAt) {
        // กลับเข้ามาหลังจากออกไป → แสดง pauseModal ทันที ไม่ resume timer อัตโนมัติ
        setStep('count')
        const pausedMin = Math.round((Date.now() - d.pausedAt) / 60000)
        setPauseModal({ pausedAt: d.pausedAt, pausedMin })
      } else {
        if (d.step && d.step !== 'done') setStep(d.step)
        // ถ้า step=count และไม่มี pausedAt = session ปกติ เริ่ม timer ได้เลย
        if (d.step === 'count' && !d.pausedAt) setSessionStart(Date.now())
      }
    } catch(e) {}
    setDraftRestored(true)
  }, [])

  // ── Save draft to localStorage whenever key state changes ──
  useEffect(() => {
    if (!draftRestored || isResetting.current) return
    if (step === 'done') { localStorage.removeItem(DRAFT_KEY); return }
    if (!nurse && !shift && Object.keys(counts).length === 0) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        nurse, shift, fridgeTemp, counts, confirmedGroups, step, expandedGroup,
        startTs: startTs?.toMillis ? startTs.toMillis() : null,
        activeMs,
        // pausedAt จะถูก set ตอน unmount เท่านั้น — ไม่ save ที่นี่
      }))
    } catch(e) {}
  }, [nurse, shift, fridgeTemp, counts, confirmedGroups, step, startTs, activeMs, expandedGroup, draftRestored])

  // ── Pause timer เมื่อ app ไป background (visibilitychange) ──
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && stepRef.current === 'count' && sessionStartRef.current) {
        // App ไป background → pause: สะสม activeMs แล้ว clear sessionStart
        const earned = Date.now() - sessionStartRef.current
        setActiveMs(prev => { activeMsRef.current = prev + earned; return prev + earned })
        setSessionStart(null); sessionStartRef.current = null
        // บันทึก pausedAt ลง draft
        try {
          const raw = localStorage.getItem(DRAFT_KEY)
          if (raw) { const d = JSON.parse(raw); d.pausedAt = Date.now(); d.activeMs = activeMsRef.current; localStorage.setItem(DRAFT_KEY, JSON.stringify(d)) }
        } catch(e) {}
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // ── Pause timer เมื่อ unmount (ออกจาก Stock Count tab) ──
  useEffect(() => {
    return () => {
      if (stepRef.current !== 'count') return
      const earned = sessionStartRef.current ? Date.now() - sessionStartRef.current : 0
      const total = activeMsRef.current + earned
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) { const d = JSON.parse(raw); d.pausedAt = Date.now(); d.activeMs = total; localStorage.setItem(DRAFT_KEY, JSON.stringify(d)) }
      } catch(e) {}
    }
  }, [])

  const adj = (id, d) => setCounts(c => ({
    ...c, [id]: Math.max(0, (c[id] !== undefined ? c[id] : (drugs.find(x=>x.id==id)?.par||0)) + d)
  }))
  const getCount = id => counts[id] !== undefined ? counts[id] : (drugs.find(x=>x.id==id)?.par||0)
  const reset = () => {
    isResetting.current = true
    localStorage.removeItem(DRAFT_KEY)
    setStep('setup'); setCounts({}); setResolves([]); setRIdx(0); setStartTs(null)
    setActiveMs(0); activeMsRef.current = 0
    setSessionStart(null); sessionStartRef.current = null
    setPauseModal(null)
    setExpandedGroup(null); setConfirmedGroups({}); setLocResolves([]); setLocDiscModal(null)
    setNurse(''); setNQ(''); setShift(''); setFridgeTemp('')
    setTimeout(() => { isResetting.current = false }, 100)
  }

  const confirmGroup = (groupId, groupName, gDrugs) => {
    const discList = []
    gDrugs.forEach(d => {
      const cnt = getCount(d.id)
      const ls  = lotsOf(d.id)
      const sys = ls.reduce((s,l)=>s+l.qty, 0)
      if (cnt < sys) {
        const lotCuts = {}; let rem = sys - cnt
        ls.forEach(l => { if(rem<=0){lotCuts[l.docId]=0;return}; const cut=Math.min(l.qty,rem); lotCuts[l.docId]=cut; rem-=cut })
        discList.push({ type:'cut', drug:d, counted:cnt, systemTotal:sys, lots:ls, lotCuts, expM:'', expY:'', missingType:'', missingBed:'' })
      } else if (cnt > sys) {
        discList.push({ type:'add', drug:d, counted:cnt, systemTotal:sys, lots:ls, lotCuts:{}, expM:'', expY:'', extraLots:[{ id:1, qty:cnt-sys, expM:'', expY:'' }] })
      }
    })
    if (discList.length === 0) {
      setConfirmedGroups(prev => ({ ...prev, [groupId]: true }))
      setExpandedGroup(null)
    } else {
      setLocDiscModal({ groupId, gName: groupName, resolves: discList, rIdx: 0 })
    }
  }

  const totalConfirmed = Object.keys(confirmedGroups).length
  const totalGroups    = STORAGE_GROUPS.filter(g => drugs.some(d => d.groupId === g.id)).length
  const allConfirmed   = totalConfirmed >= totalGroups

  const handleSubmitCount = () => {
    const list = []
    drugs.forEach(d => {
      const cnt         = getCount(d.id)
      const ls          = lotsOf(d.id)
      const systemTotal = ls.reduce((s,l) => s + l.qty, 0)
      const alreadyRes = locResolves.find(r => r.drug.id === d.id)
      if (alreadyRes) { list.push(alreadyRes); return }
      if (cnt < systemTotal) {
        const lotCuts = {}; let rem = systemTotal - cnt
        ls.forEach(l => { if (rem <= 0) { lotCuts[l.docId] = 0; return }; const cut = Math.min(l.qty, rem); lotCuts[l.docId] = cut; rem -= cut })
        list.push({ type:'cut', drug:d, counted:cnt, systemTotal, lots:ls, lotCuts, expM:'', expY:'', missingType:'', missingBed:'' })
      } else if (cnt > systemTotal) {
        list.push({ type:'add', drug:d, counted:cnt, systemTotal, lots:ls, lotCuts:{}, extraLots:[{ id:1, qty:cnt-systemTotal, expM:'', expY:'' }] })
      }
    })
    if (list.length === 0) { applyAll([]); return }
    if (list.every(r => isValid(r))) { applyAll(list); return }
    setResolves(list); setRIdx(0); setStep('resolve')
  }

  const setLotCut = (ri, lotDocId, val) => setResolves(prev => prev.map((r,i) => {
    if (i !== ri) return r
    const maxCut = r.lots.find(l => l.docId === lotDocId)?.qty || 0
    return { ...r, lotCuts: { ...r.lotCuts, [lotDocId]: Math.max(0, Math.min(maxCut, val)) } }
  }))
  const setExpM = (ri, v) => setResolves(prev => prev.map((r,i) => i===ri ? {...r, expM:v} : r))
  const setExpY = (ri, v) => setResolves(prev => prev.map((r,i) => i===ri ? {...r, expY:v} : r))
  const setMissingType = (ri, v) => setResolves(prev => prev.map((r,i) => i===ri ? {...r, missingType:v, lotCuts: v==='known' ? (() => { const lc={}; let rem=prev[ri].systemTotal-prev[ri].counted; prev[ri].lots.forEach(l=>{ if(rem<=0){lc[l.docId]=0;return}; const cut=Math.min(l.qty,rem); lc[l.docId]=cut; rem-=cut }); return lc })() : prev[ri].lotCuts } : r))
  const setMissingBed = (ri, v) => setResolves(prev => prev.map((r,i) => i===ri ? {...r, missingBed:v} : r))
  const setMissingNote = (ri, v) => setResolves(prev => prev.map((r,i) => i===ri ? {...r, missingNote:v} : r))
  
  // Extra lots management functions
  const addExtraLot = (ri) => setResolves(prev => prev.map((r,i) => {
    if (i !== ri || r.type !== 'add') return r
    const newId = r.extraLots.length > 0 ? Math.max(...r.extraLots.map(l => l.id)) + 1 : 1
    return { ...r, extraLots: [...r.extraLots, { id: newId, qty: 1, expM: '', expY: '' }] }
  }))
  
  const removeExtraLot = (ri, lotId) => setResolves(prev => prev.map((r,i) => {
    if (i !== ri || r.type !== 'add') return r
    if (r.extraLots.length === 1) return r
    return { ...r, extraLots: r.extraLots.filter(l => l.id !== lotId) }
  }))
  
  const updateExtraLot = (ri, lotId, field, value) => setResolves(prev => prev.map((r,i) => {
    if (i !== ri || r.type !== 'add') return r
    return { ...r, extraLots: r.extraLots.map(l => l.id === lotId ? { ...l, [field]: value } : l) }
  }))
  
  const totalCut  = r => Object.values(r.lotCuts).reduce((s,v)=>s+v, 0)
  const neededCut = r => r.systemTotal - r.counted
  const isValid   = r => r.type==='cut' ? (r.missingType!=='' && totalCut(r)===neededCut(r) && (r.missingType!=='known' || (r.missingBed!=='' && (r.missingBed!=='other' || (r.missingNote||'').trim()!=='')))) : (() => { const totalExtraQty = r.extraLots.reduce((s,l) => s + l.qty, 0); const allLotsHaveExp = r.extraLots.every(l => l.expM !== '' && l.expY !== ''); return allLotsHaveExp && totalExtraQty === (r.counted - r.systemTotal) })()

  const applyAll = async (rList) => {
    setSaving(true)
    try {
      const batch = writeBatch(db)
      const totalDrugs = drugs.length
      const deficientItems = drugs
        .map(d => ({ id: d.id, name: d.name, counted: getCount(d.id), min: d.min, par: d.par }))
        .filter(d => d.counted < d.min)
      const discrepancyItems = drugs
        .map(d => { const cnt = getCount(d.id); const sys = lotsOf(d.id).reduce((s,l)=>s+l.qty,0); return { id: d.id, name: d.name, counted: cnt, system: sys, diff: sys - cnt } })
        .filter(d => d.diff > 0)
      const totalDiscrepancyUnits = discrepancyItems.reduce((s,d)=>s+d.diff, 0)

      for (const d of drugs) {
        const cnt = getCount(d.id); const ls = lotsOf(d.id); const systemTotal = ls.reduce((s,l)=>s+l.qty,0)
        const r = rList.find(x => x.drug.id === d.id)
        if (cnt === systemTotal) continue

        if (cnt < systemTotal && r) {
          if (r.missingType === 'known' && r.missingBed) {
            // Missing_Tracked: FEFO auto-cut + pending_sync + withdrawal
            const sortedLots = [...ls].sort((a,b) => new Date(a.expiry)-new Date(b.expiry))
            let rem = systemTotal - cnt
            for (const l of sortedLots) {
              if (rem <= 0) break
              const cut = Math.min(l.qty, rem)
              batch.update(doc(db,'lots',l.docId), { qty: l.qty - cut })
              rem -= cut
            }
            // pending_sync for Missing_Tracked
            const bedVal = r.missingBed === 'other' ? `อื่นๆ: ${r.missingNote||''}` : r.missingBed
            const pRef = doc(collection(db,'pending_syncs'))
            batch.set(pRef, {
              bed_id: bedVal, nurse, drug_id: d.id, drug_name: d.name,
              qty: systemTotal - cnt, timestamp: Timestamp.now(),
              source: 'missing_tracked', status: 'pending',
              created_at: Timestamp.now(), completed_at: null,
              completed_by: null, reconciled_withdrawal_id: null
            })
            // withdrawal record
            const wRef = doc(collection(db,'withdrawals'))
            batch.set(wRef, {
              nurse, drugId: d.id, drugName: d.name, bed: bedVal,
              qty: systemTotal - cnt,
              note: r.missingBed==='other' ? `(Stock Count — Missing Tracked: ${r.missingNote||''})` : '(Stock Count — Missing Tracked)',
              returned: false, retExp: '', ts: Timestamp.now(),
              usage_type: 'Missing_Tracked',
              pending_sync_id: pRef.id,
              reconciliation_time_minutes: null
            })
          } else {
            // Missing_Unknown or no type: cut selected lots + withdrawal
            ls.forEach(l => { const cut = r.lotCuts[l.docId] || 0; if (cut > 0) batch.update(doc(db,'lots',l.docId), { qty: l.qty - cut }) })
            if (r.missingType === 'unknown') {
              const wRef = doc(collection(db,'withdrawals'))
              batch.set(wRef, {
                nurse, drugId: d.id, drugName: d.name, bed: '(Unknown — Stock Count)',
                qty: systemTotal - cnt,
                note: r.missingNote ? `(Stock Count — Missing Unknown: ${r.missingNote})` : '(Stock Count — Missing Unknown)',
                returned: true, retExp: '', ts: Timestamp.now(),
                usage_type: 'Missing_Unknown',
                pending_sync_id: null,
                reconciliation_time_minutes: null
              })
            } else {
              // No missingType selected (shouldn't happen due to isValid, but fallback)
              ls.forEach(l => { const cut = r.lotCuts[l.docId] || 0; if (cut > 0) batch.update(doc(db,'lots',l.docId), { qty: l.qty - cut }) })
            }
          }
        } else if (cnt > systemTotal && r && r.extraLots && r.extraLots.length > 0) {
          for (const lot of r.extraLots) {
            if (!lot.expM || !lot.expY) continue
            const expiry = myToISO(lot.expM, lot.expY)
            const ref = doc(collection(db,'lots'))
            batch.set(ref, { drugId: d.id, qty: lot.qty, expiry, note:'stock-count-add', ts: Timestamp.now() })
          }
        } else if (cnt > systemTotal && ls.length > 0) {
          batch.update(doc(db,'lots',ls[0].docId), { qty: ls[0].qty + (cnt - systemTotal) })
        }
      }

      await batch.commit()
      const endTs = Timestamp.now()
      const safeStartTs = startTs ? Timestamp.fromMillis(startTs.toMillis()) : null
      // ใช้ ref แทน state เพื่อป้องกัน stale closure — sessionStartRef มีค่าล่าสุดเสมอ
      const finalActiveMs = activeMsRef.current + (sessionStartRef.current ? Date.now() - sessionStartRef.current : 0)
      const durationSec = finalActiveMs > 0 ? Math.round(finalActiveMs / 1000) : null
      const durationMin = durationSec !== null ? Math.round(durationSec / 60 * 10) / 10 : null
      await addDoc(collection(db,'checks'), {
        nurse, shift,
        fridgeTemp: fridgeTemp !== '' ? Number(fridgeTemp) : null,
        fridgeTempOk: fridgeTemp !== '' ? (Number(fridgeTemp) >= 2 && Number(fridgeTemp) <= 8) : null,
        mode:'detailed', startTs: safeStartTs, endTs, durationSec, durationMin, ts: endTs,
        totalDrugs, deficientCount: deficientItems.length, deficientDrugs: deficientItems,
        deficiencyRate: Math.round(deficientItems.length / totalDrugs * 1000) / 10,
        discrepancyCount: discrepancyItems.length, discrepancyItems, totalDiscrepancyUnits,
        untracedRate: Math.round(discrepancyItems.length / totalDrugs * 1000) / 10,
        drugCounts: drugs.map(d => ({ id: d.id, name: d.name, unit: d.unit, par: d.par, min: d.min, counted: getCount(d.id), system: lotsOf(d.id).reduce((s,l)=>s+l.qty,0) })),
      })
      setDoneDurationMin(durationMin)
      setStep('done')
      localStorage.removeItem(DRAFT_KEY)
    } catch (e) { alert('เกิดข้อผิดพลาด: ' + e.message) }
    setSaving(false)
  }

  /* ── DONE ── */
  if (step==='done') return (
    <div style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{fontSize:56,marginBottom:12}}>✅</div>
      <div style={{fontSize:18,fontWeight:600,color:'#0F6E56',marginBottom:8}}>บันทึกสำเร็จ</div>
      <div style={{fontSize:12,color:'#5F7A6A',marginBottom:20}}>
        {nurse} · {shift}
        {doneDurationMin != null && <span> · ใช้เวลา <b style={{color:'#0F6E56'}}>{fmtDuration(doneDurationMin)}</b></span>}
      </div>
      <button className="btn primary" onClick={reset}>Stock Count รอบถัดไป</button>
    </div>
  )

  /* ── RESOLVE ── */
  if (step==='resolve') {
    const r = resolves[rIdx]; const valid = isValid(r)
    const curYear = new Date().getFullYear()
    const months = ['01','02','03','04','05','06','07','08','09','10','11','12']
    const thM = ['Jan.','Feb.','Mar.','Apr.','May','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.']
    const years = Array.from({length:15},(_,i)=>curYear+i)
    return (
      <>
        <div style={{fontSize:12,color:'#5F7A6A',marginBottom:8}}>ตรวจพบ {resolves.length} รายการที่ต้องยืนยัน · ({rIdx+1}/{resolves.length})</div>
        <div className={`card ${r.type==='cut'?'amber':'purple'}`}>
          <div style={{fontSize:13,fontWeight:600,color:r.type==='cut'?'#854F0B':'#3C3489',marginBottom:6}}>
            {r.type==='cut' ? '⚠️ ยาน้อยกว่าระบบ — เลือก lot ที่จะตัดออก' : '➕ ยามากกว่าระบบ — ระบุวันหมดอายุ'}
          </div>
          <div style={{background:'#fff',borderRadius:8,padding:'10px 12px',marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:600}}>{r.drug.name}</div>
            <div style={{fontSize:11,color:'#5F7A6A',marginTop:3}}>
              ระบบมี <b>{r.systemTotal}</b> · นับได้ <b style={{color:r.type==='cut'?'#A32D2D':'#0F6E56'}}>{r.counted}</b> · {r.type==='cut'?`ต้องตัดออก ${neededCut(r)}`:`เพิ่มเข้า ${r.counted - r.systemTotal}`} {r.drug.unit}
            </div>
          </div>
          {r.type==='cut' ? (
            <>
              {/* Missing Tracking UI */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:600,color:'#854F0B',marginBottom:8}}>🔍 ยาหายเพราะอะไร?</div>
                <div style={{display:'flex',gap:8,marginBottom:8}}>
                  <button onClick={()=>setMissingType(rIdx,'known')}
                    style={{flex:1,padding:'12px 8px',borderRadius:12,border:`2px solid ${r.missingType==='known'?'#0F6E56':'#E0EAE5'}`,background:r.missingType==='known'?'#0F6E56':'#E8F8F2',color:r.missingType==='known'?'#fff':'#0F6E56',fontFamily:'inherit',cursor:'pointer',fontSize:12,fontWeight:600,boxShadow:r.missingType==='known'?'0 3px 8px rgba(15,110,86,0.35)':'0 2px 4px rgba(0,0,0,0.08)',transition:'all .15s'}}>
                    🏥 ระบุเตียงได้<br/><span style={{fontSize:10,fontWeight:400,opacity:.85}}>ระบุเตียงผู้ป่วยได้<br/>ทราบว่ายาไปไหน</span>
                  </button>
                  <button onClick={()=>setMissingType(rIdx,'unknown')}
                    style={{flex:1,padding:'12px 8px',borderRadius:12,border:`2px solid ${r.missingType==='unknown'?'#A32D2D':'#F0D0D0'}`,background:r.missingType==='unknown'?'#A32D2D':'#FDF0F0',color:r.missingType==='unknown'?'#fff':'#A32D2D',fontFamily:'inherit',cursor:'pointer',fontSize:12,fontWeight:600,boxShadow:r.missingType==='unknown'?'0 3px 8px rgba(163,45,45,0.35)':'0 2px 4px rgba(0,0,0,0.08)',transition:'all .15s'}}>
                    ❓ ไม่ทราบสาเหตุ<br/><span style={{fontSize:10,fontWeight:400,opacity:.85}}>ยาสูญหาย<br/>หาไม่พบ</span>
                  </button>
                </div>
                {r.missingType==='known' && (
                  <div>
                    <div style={{fontSize:11,color:'#0F6E56',marginBottom:4}}>เลือกเตียงที่ใช้ยา:</div>
                    <select className="inp" value={r.missingBed} onChange={e=>setMissingBed(rIdx,e.target.value)}>
                      <option value="">-- เลือกเตียง --</option>
                      {BEDS.map(b=><option key={b} value={b}>{b}</option>)}
                      <option value="other">อื่นๆ (ระบุเอง)</option>
                    </select>
                    {r.missingBed==='other' && (
                      <input className="inp" style={{marginTop:6}} placeholder="เช่น แผนกอื่นยืม, ผู้ป่วยย้ายวอร์ด, ห้องฉุกเฉิน..."
                        value={r.missingNote||''} onChange={e=>setMissingNote(rIdx,e.target.value)} />
                    )}
                    {r.missingBed && r.missingBed!=='other' && <div style={{fontSize:10,color:'#0F6E56',marginTop:4,background:'#E1F5EE',padding:'4px 8px',borderRadius:6}}>✓ ระบบจะตัด FEFO อัตโนมัติ และสร้างรายการ Pending ให้เติมยาคืน</div>}
                    {r.missingBed==='other' && r.missingNote && <div style={{fontSize:10,color:'#0F6E56',marginTop:4,background:'#E1F5EE',padding:'4px 8px',borderRadius:6}}>✓ บันทึกสาเหตุ: {r.missingNote}</div>}
                  </div>
                )}
                {r.missingType==='unknown' && (
                  <div>
                    <div style={{fontSize:10,color:'#A32D2D',background:'#FCEBEB',padding:'6px 10px',borderRadius:8,marginBottom:6}}>
                      บันทึกเป็น Missing_Unknown · ตัด lot ที่เลือกด้านล่างออกจากระบบทันที
                    </div>
                    <div style={{fontSize:11,color:'#5F7A6A',marginBottom:4}}>หมายเหตุเพิ่มเติม (ถ้ามี):</div>
                    <input className="inp" placeholder="เช่น แผนกอื่นยืม, ผู้ป่วยย้ายวอร์ด, ไม่ทราบสาเหตุ..."
                      value={r.missingNote||''} onChange={e=>setMissingNote(rIdx,e.target.value)} />
                  </div>
                )}
              </div>
              {r.missingType!=='' && <div style={{fontSize:11,fontWeight:500,color:'#854F0B',marginBottom:8}}>
                {r.missingType==='known' ? '✓ ตัด FEFO อัตโนมัติ (ไม่ต้องเลือก lot)' : 'เลือก lot ที่หายไป (รวมต้องครบ '+neededCut(r)+' '+r.drug.unit+'):'}
              </div>}
              {(r.missingType==='' || r.missingType==='unknown') && r.lots.map(l => {
                const cut = r.lotCuts[l.docId] || 0; const dl2 = daysLeft(l.expiry); const fake = l.expiry==='2099-12-31'
                return (
                  <div key={l.docId} style={{background:'#fff',borderRadius:8,padding:'10px 12px',marginBottom:8,border:`${cut>0?'1.5px solid #FAC775':'0.5px solid #D8EAE0'}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:cut>0?6:0}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:500}}>{fake?'ไม่มีข้อมูล EXP':`EXP ${fmtMY(l.expiry)}`}{!fake&&dl2<=30&&<span className="b br" style={{marginLeft:6}}>อีก {dl2} วัน</span>}</div>
                        <div style={{fontSize:10,color:'#8BA898'}}>มีอยู่ {l.qty} {r.drug.unit}</div>
                      </div>
                      <div style={{fontSize:11,color:'#5F7A6A'}}>ตัดออก:</div>
                      <div className="nc" style={{transform:'scale(.9)'}}>
                        <button onClick={()=>setLotCut(rIdx,l.docId,cut-1)}>−</button>
                        <span>{cut}</span>
                        <button onClick={()=>setLotCut(rIdx,l.docId,cut+1)}>+</button>
                      </div>
                    </div>
                    {cut>0&&<div style={{fontSize:10,color:'#854F0B',background:'#FAEEDA',borderRadius:5,padding:'3px 8px'}}>เหลือ {l.qty-cut} {r.drug.unit} ใน lot นี้</div>}
                  </div>
                )
              })}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderTop:'0.5px solid #FAC775',marginTop:4}}>
                <div style={{fontSize:12}}>ตัดแล้ว: <b style={{color:totalCut(r)===neededCut(r)?'#0F6E56':'#A32D2D'}}>{totalCut(r)}</b> / {neededCut(r)} {r.drug.unit}</div>
                <div style={{fontSize:11,color:valid?'#0F6E56':'#A32D2D'}}>{valid?'✓ ครบแล้ว':'ยังไม่ครบ'}</div>
              </div>
            </>
          ) : (
            <>
              <div style={{fontSize:11,fontWeight:500,color:'#3C3489',marginBottom:8}}>ระบุ EXP ของยาที่นับเพิ่มได้ {r.counted - r.systemTotal} {r.drug.unit}:</div>
              <div className="g2">
                <div>
                  <div className="lbl" style={{color:'#3C3489'}}>เดือน EXP</div>
                  <select className="inp" value={r.expM} onChange={e=>setExpM(rIdx,e.target.value)}>
                    <option value="">-- Month --</option>
                    {months.map((m,i)=><option key={m} value={m}>{m} ({thM[i]})</option>)}
                  </select>
                </div>
                <div>
                  <div className="lbl" style={{color:'#3C3489'}}>EXP Year</div>
                  <select className="inp" value={r.expY} onChange={e=>setExpY(rIdx,e.target.value)}>
                    <option value="">-- Year --</option>
                    {years.map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              {r.expM&&r.expY&&<div style={{fontSize:11,color:'#0F6E56',marginTop:4}}>→ จะบันทึก EXP {r.expM}/{r.expY} (วันสุดท้ายของเดือน)</div>}
            </>
          )}
        </div>
        <div style={{display:'flex',gap:8}}>
          {rIdx>0&&<button className="btn sm" onClick={()=>setRIdx(i=>i-1)}>← ก่อนหน้า</button>}
          {rIdx<resolves.length-1
            ? <button className="btn primary" style={{flex:1}} onClick={()=>setRIdx(i=>i+1)} disabled={!valid}>ถัดไป ({rIdx+2}/{resolves.length}) →</button>
            : <button className="btn primary" style={{flex:1}} onClick={()=>applyAll(resolves)} disabled={!valid||saving}>{saving?'กำลังบันทึก...':'✓ ยืนยันและบันทึกทั้งหมด'}</button>
          }
        </div>
        <div className="info">ต้องยืนยันครบทุกรายการก่อนกดบันทึก</div>
      </>
    )
  }

  /* ── SETUP ── */
  if (step==='setup') {
    const hasDraft = nurse || Object.keys(counts).length > 0
    return (
      <>
        {staleDraftModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
            <div style={{background:'white',borderRadius:16,padding:20,maxWidth:320,width:'100%',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
              <div style={{fontSize:16,fontWeight:700,color:'#0F6E56',marginBottom:8}}>⚠️ พบข้อมูลค้างจากวันก่อน</div>
              <div style={{fontSize:13,color:'#555',lineHeight:1.6,marginBottom:14}}>
                มีข้อมูลที่บันทึกไว้ตั้งแต่ <b>{new Date(staleDraftModal.draftTs).toLocaleDateString('th-TH',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</b><br/>
                ต้องการดำเนินการต่อหรือเริ่มนับใหม่?<br/>
                <span style={{fontSize:11,color:'#888'}}>(หากดำเนินการต่อ ระบบจะนับเวลาเริ่มเช็คยาจากตอนนี้)</span>
              </div>
              <button className="btn primary full" onClick={()=>setStaleDraftModal(null)}
                style={{background:'#0F6E56',color:'white',marginBottom:6}}>
                ▶️ ดำเนินการต่อ (รีเซตเวลาเริ่ม)
              </button>
              <button className="btn primary full" onClick={()=>{ reset(); setStaleDraftModal(null) }}
                style={{background:'#A32D2D',color:'white'}}>
                🔄 เริ่มนับใหม่ (ล้างข้อมูลเก่า)
              </button>
            </div>
          </div>
        )}
        <div className="card">
          <div className="slbl">Stock Count — ระบุผู้รับผิดชอบ</div>
          <div className="lbl">ชื่อพยาบาล</div>
          <NursePicker value={nurse} query={nQ} open={nOpen} nurses={nurses}
            onChange={(v,o)=>{setNQ(v);setNurse('');setNOpen(o!==undefined?o:v.length>0)}}
            onSelect={v=>{setNurse(v);setNQ(v);setNOpen(false)}}
            onClear={()=>{setNurse('');setNQ('');setNOpen(false)}} />
          <div className="lbl">เวร</div>
          <select className="inp" value={shift} onChange={e=>setShift(e.target.value)}>
            <option value="">-- เลือกเวร --</option>
            {SHIFTS.map(s=><option key={s}>{s}</option>)}
          </select>
          {hasDraft && (
            <div style={{marginTop:10,background:'#E1F5EE',borderRadius:8,padding:'8px 12px',border:'0.5px solid #9FE1CB',fontSize:11,color:'#0F6E56'}}>
              📋 พบข้อมูลที่บันทึกไว้ก่อนหน้า ({Object.keys(counts).length} รายการ, ยืนยันแล้ว {Object.keys(confirmedGroups).length} location)
              <button onClick={reset} style={{marginLeft:8,background:'none',border:'none',color:'#A32D2D',cursor:'pointer',fontSize:10,textDecoration:'underline'}}>ล้างและเริ่มใหม่</button>
            </div>
          )}
          <div style={{marginTop:14}}>
            <button className="btn primary full" onClick={()=>{
              const now = Timestamp.now()
              if (!startTs) setStartTs(now)               // originalStartTs (เวลาแรกสุด)
              setSessionStart(Date.now()); sessionStartRef.current = Date.now()
              setStep('count')
            }} disabled={!nurse||!shift}>
              {hasDraft ? `ดำเนินการต่อ (${Object.keys(confirmedGroups).length}/${totalGroups} location)` : `เริ่ม Stock Count (${drugs.length} รายการ)`}
            </button>
          </div>
        </div>
        <div className="info">นับละเอียด · ยาที่เกิน → ต้องใส่ EXP · ยาที่ขาด → เลือก lot ที่จะตัดออก · ค่า default = par level</div>
      </>
    )
  }

  /* ── COUNT FORM (Accordion by Location) ── */
  const q = search.toLowerCase()
  const changed = Object.entries(counts).filter(([id,c])=>c!==(drugs.find(x=>x.id==id)?.par||0)).length

  return (
    <>
      {/* ── Pause Modal: แสดงทุกครั้งที่กลับเข้ามาหน้านับยา ── */}
      {pauseModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'white',borderRadius:16,padding:20,maxWidth:320,width:'100%',boxShadow:'0 8px 32px rgba(0,0,0,0.25)'}}>
            <div style={{fontSize:16,fontWeight:700,color:'#0F6E56',marginBottom:8}}>⏸ หยุดนับยาชั่วคราว</div>
            <div style={{fontSize:13,color:'#444',lineHeight:1.7,marginBottom:6}}>
              ออกจากหน้านับยาไป <b>{pauseModal.pausedMin} นาที</b><br/>
              เวลาที่นับไปแล้ว: <b style={{color:'#0F6E56'}}>{Math.round(activeMs/60000*10)/10} นาที</b>
            </div>
            <div style={{fontSize:11,color:'#8BA898',marginBottom:14}}>
              ยืนยันแล้ว {Object.keys(confirmedGroups).length}/{drugs.length > 0 ? '7' : '-'} location
            </div>
            <button className="btn primary full" onClick={()=>{
              // ดำเนินการต่อ: เริ่ม session ใหม่ต่อจาก activeMs ที่สะสมไว้
              setSessionStart(Date.now()); sessionStartRef.current = Date.now()
              // ลบ pausedAt ออกจาก draft
              try { const r=localStorage.getItem(DRAFT_KEY); if(r){ const d=JSON.parse(r); delete d.pausedAt; localStorage.setItem(DRAFT_KEY,JSON.stringify(d)) } } catch(e){}
              setPauseModal(null)
            }} style={{marginBottom:6}}>
              ▶️ ดำเนินการต่อ (นับเวลาต่อ)
            </button>
            <div style={{fontSize:10,color:'#8BA898',textAlign:'center',marginBottom:10}}>
              เวลาที่ออกไป {pauseModal.pausedMin} นาที จะไม่ถูกนับรวม
            </div>
            <button className="btn primary full" onClick={()=>{ reset() }}
              style={{background:'#A32D2D',color:'white'}}>
              🔄 เริ่มใหม่ทั้งหมด (ล้างชื่อ+เวร+ข้อมูล)
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:4}}>
        <div>
          <div style={{fontWeight:500,fontSize:13}}>{nurse}</div>
          <div style={{fontSize:11,color:'#5F7A6A'}}>เวร{shift} · แก้ไข {changed} รายการ · ยืนยันแล้ว {totalConfirmed}/{totalGroups} location</div>
        </div>
        <button className="btn primary sm" onClick={handleSubmitCount} disabled={saving||!allConfirmed||fridgeTemp===''}
          style={{opacity:(allConfirmed&&fridgeTemp!=='')?1:0.5}}>
          {saving?'กำลังบันทึก...':'ตรวจสอบและบันทึก'}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{height:6,background:'#E0EAE5',borderRadius:3,marginBottom:10,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${Math.round(totalConfirmed/Math.max(totalGroups,1)*100)}%`,background:'#0F6E56',borderRadius:3,transition:'width .4s'}}/>
      </div>

      {/* ── อุณหภูมิตู้เย็น card ── */}
      {(() => {
        const t = fridgeTemp !== '' ? Number(fridgeTemp) : null
        const tooLow  = t !== null && t < 2
        const tooHigh = t !== null && t > 8
        const ok      = t !== null && !tooLow && !tooHigh
        const missing = fridgeTemp === ''
        return (
          <div style={{
            borderRadius:10, padding:'10px 14px', marginBottom:8,
            display:'flex', alignItems:'center', gap:10,
            background: missing ? '#FFF8E1' : ok ? '#E1F5EE' : '#FCEBEB',
            border: `0.5px solid ${missing ? '#FFD54F' : ok ? '#9FE1CB' : '#F7C1C1'}`
          }}>
            <span style={{fontSize:20, flexShrink:0}}>🌡️</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12, fontWeight:600, color: missing ? '#8B6900' : ok ? '#0F6E56' : '#A32D2D', marginBottom:4}}>
                {missing ? 'กรุณากรอกอุณหภูมิตู้เย็นก่อนยืนยัน' : ok ? `✅ อุณหภูมิ ${fridgeTemp}°C อยู่ในเกณฑ์ปกติ (2–8°C)` : tooHigh ? `⚠️ อุณหภูมิ ${fridgeTemp}°C สูงกว่าปกติ — โปรดตรวจสอบตู้เย็นทันที!` : `⚠️ อุณหภูมิ ${fridgeTemp}°C ต่ำกว่าปกติ — โปรดตรวจสอบตู้เย็นทันที!`}
              </div>
              <div style={{position:'relative', maxWidth:160}}>
                <input
                  className="inp"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="เช่น 4.5"
                  value={fridgeTemp}
                  onChange={e => setFridgeTemp(e.target.value)}
                  style={{
                    paddingRight:36,
                    background: missing ? '#fff' : ok ? '#F0FAF6' : '#FEF2F2',
                    borderColor: missing ? '#FFD54F' : ok ? '#9FE1CB' : '#F7C1C1',
                    fontSize:13, fontWeight:500
                  }}
                />
                <span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#8BA898',pointerEvents:'none'}}>°C</span>
              </div>
            </div>
          </div>
        )
      })()}

      {!allConfirmed && <div className="info" style={{marginBottom:8}}>กรุณายืนยันครบทุก location ก่อนกดบันทึก</div>}

      <div className="sw">
        <svg className="sw-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/></svg>
        <input className="inp" style={{paddingLeft:30}} value={search} placeholder="ค้นหายา..." onChange={e=>{setSearch(e.target.value); if(e.target.value) setExpandedGroup('__search__')}} />
      </div>

      {/* Search results (flat list when searching) */}
      {q ? (
        <div className="card" style={{padding:'0 14px'}}>
          {drugs.filter(d=>d.name.toLowerCase().includes(q)).map(d=>{
            const cnt = getCount(d.id); const systemTotal = lotsOf(d.id).reduce((s,l)=>s+l.qty,0)
            const isLow=cnt<d.min; const isPar=cnt<d.par; const clr=isLow?'#E24B4A':isPar?'#BA7517':'#0F6E56'
            const diff=cnt-d.par; const isCut=cnt<systemTotal; const isAdd=cnt>systemTotal
            return (
              <div key={d.id} className={`dcard${isLow?' crit':isPar?' low':''}`}
                style={isCut?{borderColor:'#FAC775',background:'#FFFBF0'}:isAdd?{borderColor:'#CECBF6',background:'#F7F6FE'}:{}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                    <div style={{fontSize:12,fontWeight:500}}>{d.name}</div>
                    {d.highAlert&&<span className="ha">High Alert</span>}
                    {d.controlled&&<span className="ctrl">Controlled</span>}
                    {diff===0&&<span style={{background:'#E6F1FB',color:'#185FA5',borderRadius:5,padding:'1px 5px',fontSize:10,fontFamily:'monospace'}}>=par</span>}
                    {diff<0&&<span style={{background:'#FCEBEB',color:'#A32D2D',borderRadius:5,padding:'1px 5px',fontSize:10,fontFamily:'monospace'}}>{diff}</span>}
                    {diff>0&&<span style={{background:'#E1F5EE',color:'#0F6E56',borderRadius:5,padding:'1px 5px',fontSize:10,fontFamily:'monospace'}}>+{diff}</span>}
                  </div>
                  <div style={{fontSize:10,color:'#8BA898',marginTop:2}}>par {d.par} · min {d.min} {d.unit} · ระบบมี {systemTotal}</div>
                  <div className="pbar"><div className="pfill" style={{width:`${Math.min(100,Math.round(cnt/Math.max(d.par,1)*100))}%`,background:clr}}/></div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                  <div className="nc"><button onClick={()=>adj(d.id,-1)}>−</button><span>{cnt}</span><button onClick={()=>adj(d.id,1)}>+</button></div>
                  <div style={{fontSize:10,color:'#8BA898'}}>{d.unit}</div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Accordion per location */
        STORAGE_GROUPS.map(g => {
          const gDrugs = drugs.filter(d => d.groupId === g.id)
          if (!gDrugs.length) return null
          const isExpanded  = expandedGroup === g.id
          const isConfirmed = !!confirmedGroups[g.id]
          const gChanged    = gDrugs.filter(d => counts[d.id] !== undefined && counts[d.id] !== d.par).length
          const gLow        = gDrugs.filter(d => getCount(d.id) < d.min).length

          return (
            <div key={g.id} style={{marginBottom:8}}>
              {/* Group header — clickable */}
              <div onClick={() => setExpandedGroup(isExpanded ? null : g.id)}
                style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:10,cursor:'pointer',
                  background: isConfirmed ? '#E1F5EE' : isExpanded ? '#fff' : '#F4F7F5',
                  border: `0.5px solid ${isConfirmed?'#9FE1CB':isExpanded?'#C8DDD4':'#E0EAE5'}`,
                  boxShadow: isExpanded ? '0 1px 4px rgba(0,0,0,.06)' : 'none'}}>
                <div className="gdot" style={{background:g.color, flexShrink:0}}/>
                <div style={{fontSize:13,fontWeight:500,flex:1}}>{g.icon} {g.name}</div>
                {gLow>0 && <span style={{background:'#FCEBEB',color:'#A32D2D',borderRadius:5,padding:'2px 7px',fontSize:10,fontWeight:500}}>⚠ {gLow}</span>}
                {gChanged>0 && !gLow && <span style={{background:'#FAEEDA',color:'#854F0B',borderRadius:5,padding:'2px 7px',fontSize:10}}>แก้ {gChanged}</span>}
                {isConfirmed && <span style={{background:'#0F6E56',color:'#fff',borderRadius:5,padding:'2px 8px',fontSize:10,fontWeight:600}}>✓ ยืนยันแล้ว</span>}
                <span style={{fontSize:11,color:'#8BA898'}}>{gDrugs.length} รายการ</span>
                <span style={{fontSize:12,color:'#8BA898'}}>{isExpanded ? '▲' : '▼'}</span>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{border:'0.5px solid #C8DDD4',borderTop:'none',borderRadius:'0 0 10px 10px',background:'#fff',padding:'8px 10px 12px'}}>
                  {gDrugs.map(d => {
                    const cnt = getCount(d.id); const systemTotal = lotsOf(d.id).reduce((s,l)=>s+l.qty,0)
                    const isLow=cnt<d.min; const isPar=cnt<d.par; const clr=isLow?'#E24B4A':isPar?'#BA7517':'#0F6E56'
                    const diff=cnt-d.par; const isCut=cnt<systemTotal; const isAdd=cnt>systemTotal
                    return (
                      <div key={d.id} className={`dcard${isLow?' crit':isPar?' low':''}`}
                        style={isCut?{borderColor:'#FAC775',background:'#FFFBF0'}:isAdd?{borderColor:'#CECBF6',background:'#F7F6FE'}:{}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                            <div style={{fontSize:12,fontWeight:500}}>{d.name}</div>
                            {d.highAlert&&<span className="ha">High Alert</span>}
                            {d.controlled&&<span className="ctrl">Controlled</span>}
                            {diff===0&&<span style={{background:'#E6F1FB',color:'#185FA5',borderRadius:5,padding:'1px 5px',fontSize:10,fontFamily:'monospace'}}>=par</span>}
                            {diff<0&&<span style={{background:'#FCEBEB',color:'#A32D2D',borderRadius:5,padding:'1px 5px',fontSize:10,fontFamily:'monospace'}}>{diff}</span>}
                            {diff>0&&<span style={{background:'#E1F5EE',color:'#0F6E56',borderRadius:5,padding:'1px 5px',fontSize:10,fontFamily:'monospace'}}>+{diff}</span>}
                            {isCut&&<span style={{background:'#FAEEDA',color:'#854F0B',borderRadius:5,padding:'1px 5px',fontSize:10}}>⚠ ต้องเลือก lot</span>}
                            {isAdd&&<span style={{background:'#EEEDFE',color:'#3C3489',borderRadius:5,padding:'1px 5px',fontSize:10}}>➕ ต้องใส่ EXP</span>}
                          </div>
                          <div style={{fontSize:10,color:'#8BA898',marginTop:2}}>par {d.par} · min {d.min} {d.unit} · ระบบมี {systemTotal}{d.fefoExp?` · FEFO ${fmtMY(d.fefoExp)}`:''}</div>
                          <div className="pbar"><div className="pfill" style={{width:`${Math.min(100,Math.round(cnt/Math.max(d.par,1)*100))}%`,background:clr}}/></div>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <div className="nc"><button onClick={()=>adj(d.id,-1)}>−</button><span>{cnt}</span><button onClick={()=>adj(d.id,1)}>+</button></div>
                          <div style={{fontSize:10,color:'#8BA898'}}>{d.unit}</div>
                        </div>
                      </div>
                    )
                  })}
                  {/* Confirm button */}
                  <button onClick={() => confirmGroup(g.id, g.name, gDrugs)}
                    style={{width:'100%',marginTop:4,padding:'10px',borderRadius:8,border:'none',
                    background:'#0F6E56',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                    ✓ ยืนยัน {g.name} ({gDrugs.length} รายการ)
                  </button>
                  {isConfirmed && (
                    <button onClick={() => setConfirmedGroups(prev => { const n={...prev}; delete n[g.id]; return n })}
                      style={{width:'100%',marginTop:6,padding:'6px',borderRadius:8,border:'0.5px solid #C8DDD4',
                        background:'none',color:'#8BA898',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                      แก้ไขใหม่
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}

      {/* ── Per-location discrepancy modal ── */}
      {locDiscModal && (() => {
        const { groupId, gName, resolves: mRes, rIdx: mIdx } = locDiscModal
        const r = mRes[mIdx]; if (!r) return null
        const mTotCut = rx => Object.values(rx.lotCuts).reduce((s,v)=>s+v,0)
        const mNeeded = rx => rx.systemTotal - rx.counted
        const mAddValid = rx => { const tot=rx.extraLots.reduce((s,l)=>s+l.qty,0); const allExp=rx.extraLots.every(l=>l.expM!==''&&l.expY!==''); return allExp && tot===(rx.counted-rx.systemTotal) }
        const mValid  = r.type==='cut' ? (r.missingType && r.missingType!=='' && mTotCut(r)===mNeeded(r) && (r.missingType!=='known' || (r.missingBed&&r.missingBed!==''&&(r.missingBed!=='other'||(r.missingNote||'').trim()!=='')))) : mAddValid(r)
        const allMValid = mRes.every(rx => rx.type==='cut' ? (rx.missingType && rx.missingType!=='' && mTotCut(rx)===mNeeded(rx) && (rx.missingType!=='known' || (rx.missingBed&&rx.missingBed!==''&&(rx.missingBed!=='other'||(rx.missingNote||'').trim()!=='')))) : mAddValid(rx))
        const curYear = new Date().getFullYear()
        const months = ['01','02','03','04','05','06','07','08','09','10','11','12']
        const thM = ['Jan.','Feb.','Mar.','Apr.','May','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.']
        const years = Array.from({length:15},(_,i)=>curYear+i)
        const setMExpM = v => setLocDiscModal(prev => { const nr=[...prev.resolves]; nr[prev.rIdx]={...nr[prev.rIdx],expM:v}; return {...prev,resolves:nr} })
        const setMExpY = v => setLocDiscModal(prev => { const nr=[...prev.resolves]; nr[prev.rIdx]={...nr[prev.rIdx],expY:v}; return {...prev,resolves:nr} })
        const addMExtraLot = () => setLocDiscModal(prev => {
          const nr=[...prev.resolves]; const ri=prev.rIdx; const rx=nr[ri]; if (rx.type!=='add') return prev
          const newId = rx.extraLots.length > 0 ? Math.max(...rx.extraLots.map(l=>l.id))+1 : 1
          nr[ri]={...rx, extraLots:[...rx.extraLots,{id:newId,qty:1,expM:'',expY:''}]}
          return {...prev,resolves:nr}
        })
        const removeMExtraLot = (lotId) => setLocDiscModal(prev => {
          const nr=[...prev.resolves]; const ri=prev.rIdx; const rx=nr[ri]; if (rx.type!=='add'||rx.extraLots.length<=1) return prev
          nr[ri]={...rx, extraLots:rx.extraLots.filter(l=>l.id!==lotId)}
          return {...prev,resolves:nr}
        })
        const updateMExtraLot = (lotId, field, value) => setLocDiscModal(prev => {
          const nr=[...prev.resolves]; const ri=prev.rIdx; const rx=nr[ri]; if (rx.type!=='add') return prev
          nr[ri]={...rx, extraLots:rx.extraLots.map(l=>l.id===lotId?{...l,[field]:value}:l)}
          return {...prev,resolves:nr}
        })
        const setMLotCut = (docId, val) => setLocDiscModal(prev => {
          const nr=[...prev.resolves]; const ri=prev.rIdx; const lot=nr[ri].lots.find(x=>x.docId===docId)
          nr[ri]={...nr[ri],lotCuts:{...nr[ri].lotCuts,[docId]:Math.max(0,Math.min(lot?.qty||0,val))}}
          return {...prev,resolves:nr}
        })
        const saveAndConfirm = async () => {
          // Handle Missing_Tracked: write to Firebase immediately
          for (const rx of mRes) {
            if (rx.type!=='cut') continue
            if (rx.missingType==='known' && rx.missingBed) {
              try {
                const sortedLots=[...rx.lots].sort((a,b)=>new Date(a.expiry)-new Date(b.expiry))
                let rem=rx.systemTotal-rx.counted
                for(const l of sortedLots){if(rem<=0)break;const cut=Math.min(l.qty,rem);await updateDoc(doc(db,'lots',l.docId),{qty:l.qty-cut});rem-=cut}
                const pRef=await addDoc(collection(db,'pending_syncs'),{bed_id:rx.missingBed,nurse,drug_id:rx.drug.id,drug_name:rx.drug.name,qty:rx.systemTotal-rx.counted,timestamp:startTs||Timestamp.now(),source:'missing_tracked',status:'pending',created_at:Timestamp.now(),completed_at:null,completed_by:null,reconciled_withdrawal_id:null})
                const bedValLoc=rx.missingBed==='other'?`อื่นๆ: ${rx.missingNote||''}`:rx.missingBed
                await addDoc(collection(db,'withdrawals'),{nurse,drugId:rx.drug.id,drugName:rx.drug.name,bed:bedValLoc,qty:rx.systemTotal-rx.counted,note:rx.missingBed==='other'?`(Stock Count — Missing Tracked: ${rx.missingNote||''})`:'(Stock Count — Missing Tracked)',returned:false,retExp:'',ts:Timestamp.now(),usage_type:'Missing_Tracked',pending_sync_id:pRef.id,reconciliation_time_minutes:null})
              } catch(e){console.error('Missing_Tracked save error:',e)}
            } else if (rx.missingType==='unknown') {
              try {
                rx.lots.forEach(async l=>{const cut=rx.lotCuts[l.docId]||0;if(cut>0)await updateDoc(doc(db,'lots',l.docId),{qty:l.qty-cut})})
                await addDoc(collection(db,'withdrawals'),{nurse,drugId:rx.drug.id,drugName:rx.drug.name,bed:'(Unknown — Stock Count)',qty:rx.systemTotal-rx.counted,note:rx.missingNote?`(Stock Count — Missing Unknown: ${rx.missingNote})`:'(Stock Count — Missing Unknown)',returned:false,retExp:'',ts:Timestamp.now(),usage_type:'Missing_Unknown',pending_sync_id:null,reconciliation_time_minutes:null})
              } catch(e){console.error('Missing_Unknown save error:',e)}
            }
          }
          setLocResolves(prev => { const ids=mRes.map(rx=>rx.drug.id); return [...prev.filter(rx=>!ids.includes(rx.drug.id)),...mRes] })
          setConfirmedGroups(prev => ({...prev,[groupId]:true}))
          setExpandedGroup(null); setLocDiscModal(null)
        }
        const skipAndConfirm = () => {
          setConfirmedGroups(prev => ({...prev,[groupId]:true}))
          setExpandedGroup(null); setLocDiscModal(null)
        }
        return (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
            <div style={{background:'var(--color-background-primary)',borderRadius:'12px 12px 0 0',padding:16,width:'100%',maxWidth:480,maxHeight:'88vh',overflowY:'auto'}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>พบความคลาดเคลื่อน — {gName}</div>
              <div style={{fontSize:11,color:'#8BA898',marginBottom:10}}>รายการ {mIdx+1}/{mRes.length} · กรุณาจัดการก่อนยืนยัน location นี้</div>
              <div className={`card ${r.type==='cut'?'amber':'purple'}`}>
                <div style={{fontSize:13,fontWeight:600,color:r.type==='cut'?'#854F0B':'#3C3489',marginBottom:6}}>
                  {r.type==='cut' ? '⚠️ ยาน้อยกว่าระบบ — เลือก lot ที่จะตัดออก' : '➕ ยามากกว่าระบบ — ระบุวันหมดอายุ'}
                </div>
                <div style={{background:'#fff',borderRadius:8,padding:'10px 12px',marginBottom:10}}>
                  <div style={{fontSize:13,fontWeight:600}}>{r.drug.name}</div>
                  <div style={{fontSize:11,color:'#5F7A6A',marginTop:3}}>
                    ระบบมี <b>{r.systemTotal}</b> · นับได้ <b style={{color:r.type==='cut'?'#A32D2D':'#0F6E56'}}>{r.counted}</b> · {r.type==='cut'?`ต้องตัดออก ${mNeeded(r)}`:`เพิ่มเข้า ${r.counted-r.systemTotal}`} {r.drug.unit}
                  </div>
                </div>
                {r.type==='cut' ? (
                  <>
                    {/* Missing Tracking UI for locDiscModal */}
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:12,fontWeight:600,color:'#854F0B',marginBottom:6}}>🔍 ยาหายเพราะอะไร?</div>
                      <div style={{display:'flex',gap:8,marginBottom:6}}>
                        <button onClick={()=>setLocDiscModal(prev=>{const nr=[...prev.resolves];const ri=prev.rIdx;const fefoLots=[...nr[ri].lots].sort((a,b)=>new Date(a.expiry)-new Date(b.expiry));const lc={};let rem=nr[ri].systemTotal-nr[ri].counted;fefoLots.forEach(l=>{if(rem<=0){lc[l.docId]=0;return};const cut=Math.min(l.qty,rem);lc[l.docId]=cut;rem-=cut});nr[ri]={...nr[ri],missingType:'known',lotCuts:lc};return{...prev,resolves:nr}})}
                          style={{flex:1,padding:'10px 8px',borderRadius:12,border:`2px solid ${r.missingType==='known'?'#0F6E56':'#E0EAE5'}`,background:r.missingType==='known'?'#0F6E56':'#E8F8F2',color:r.missingType==='known'?'#fff':'#0F6E56',fontFamily:'inherit',cursor:'pointer',fontSize:11,fontWeight:600,boxShadow:r.missingType==='known'?'0 3px 8px rgba(15,110,86,0.35)':'0 2px 4px rgba(0,0,0,0.08)',transition:'all .15s'}}>
                          🏥 ระบุเตียงได้<br/><span style={{fontSize:9,fontWeight:400,opacity:.85}}>ระบุเตียงผู้ป่วยได้<br/>ทราบว่ายาไปไหน</span>
                        </button>
                        <button onClick={()=>setLocDiscModal(prev=>{const nr=[...prev.resolves];nr[prev.rIdx]={...nr[prev.rIdx],missingType:'unknown'};return{...prev,resolves:nr}})}
                          style={{flex:1,padding:'10px 8px',borderRadius:12,border:`2px solid ${r.missingType==='unknown'?'#A32D2D':'#F0D0D0'}`,background:r.missingType==='unknown'?'#A32D2D':'#FDF0F0',color:r.missingType==='unknown'?'#fff':'#A32D2D',fontFamily:'inherit',cursor:'pointer',fontSize:11,fontWeight:600,boxShadow:r.missingType==='unknown'?'0 3px 8px rgba(163,45,45,0.35)':'0 2px 4px rgba(0,0,0,0.08)',transition:'all .15s'}}>
                          ❓ ไม่ทราบสาเหตุ<br/><span style={{fontSize:9,fontWeight:400,opacity:.85}}>ยาสูญหาย<br/>หาไม่พบ</span>
                        </button>
                      </div>
                      {r.missingType==='known' && (
                        <div>
                          <select className="inp" value={r.missingBed||''} onChange={e=>setLocDiscModal(prev=>{const nr=[...prev.resolves];nr[prev.rIdx]={...nr[prev.rIdx],missingBed:e.target.value};return{...prev,resolves:nr}})}>
                            <option value="">-- เลือกเตียง --</option>
                            {BEDS.map(b=><option key={b} value={b}>{b}</option>)}
                            <option value="other">อื่นๆ (ระบุเอง)</option>
                          </select>
                          {r.missingBed==='other' && (
                            <input className="inp" style={{marginTop:6}} placeholder="เช่น แผนกอื่นยืม, ผู้ป่วยย้ายวอร์ด..."
                              value={r.missingNote||''} onChange={e=>setLocDiscModal(prev=>{const nr=[...prev.resolves];nr[prev.rIdx]={...nr[prev.rIdx],missingNote:e.target.value};return{...prev,resolves:nr}})} />
                          )}
                          {r.missingBed && r.missingBed!=='other' && <div style={{fontSize:10,color:'#0F6E56',marginTop:3,background:'#E1F5EE',padding:'3px 8px',borderRadius:5}}>✓ ตัด FEFO อัตโนมัติ + สร้าง Pending ให้เติมคืน</div>}
                        </div>
                      )}
                      {r.missingType==='unknown' && (
                      <div>
                        <div style={{fontSize:10,color:'#A32D2D',background:'#FCEBEB',padding:'5px 8px',borderRadius:6,marginBottom:5}}>บันทึกเป็น Missing_Unknown · ตัด lot ที่เลือกด้านล่าง</div>
                        <input className="inp" style={{fontSize:11}} placeholder="หมายเหตุ: เช่น แผนกอื่นยืม, ผู้ป่วยย้ายวอร์ด..."
                          value={r.missingNote||''} onChange={e=>setLocDiscModal(prev=>{const nr=[...prev.resolves];nr[prev.rIdx]={...nr[prev.rIdx],missingNote:e.target.value};return{...prev,resolves:nr}})} />
                      </div>
                    )}
                    </div>
                    {(r.missingType===''||r.missingType===undefined) && <div style={{fontSize:10,color:'#8BA898',textAlign:'center',padding:'4px',marginBottom:6}}>← เลือกประเภทก่อน</div>}
                    {(r.missingType==='unknown' || (!r.missingType)) && <>
                    <div style={{fontSize:11,fontWeight:500,color:'#854F0B',marginBottom:8}}>เลือก lot และจำนวนที่จะตัดออก (รวมต้องครบ {mNeeded(r)} {r.drug.unit}):</div>
                    {r.lots.map(l => {
                      const cut=r.lotCuts[l.docId]||0; const dl2=daysLeft(l.expiry); const fake=l.expiry==='2099-12-31'
                      return (
                        <div key={l.docId} style={{background:'#fff',borderRadius:8,padding:'10px 12px',marginBottom:8,border:`${cut>0?'1.5px solid #FAC775':'0.5px solid #D8EAE0'}`}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:cut>0?6:0}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,fontWeight:500}}>{fake?'ไม่มีข้อมูล EXP':`EXP ${fmtMY(l.expiry)}`}{!fake&&dl2<=30&&<span className="b br" style={{marginLeft:6}}>อีก {dl2} วัน</span>}</div>
                              <div style={{fontSize:10,color:'#8BA898'}}>มีอยู่ {l.qty} {r.drug.unit}</div>
                            </div>
                            <div style={{fontSize:11,color:'#5F7A6A'}}>ตัดออก:</div>
                            <div className="nc" style={{transform:'scale(.9)'}}>
                              <button onClick={()=>setMLotCut(l.docId,cut-1)}>−</button>
                              <span>{cut}</span>
                              <button onClick={()=>setMLotCut(l.docId,cut+1)}>+</button>
                            </div>
                          </div>
                          {cut>0&&<div style={{fontSize:10,color:'#854F0B',background:'#FAEEDA',borderRadius:5,padding:'3px 8px'}}>เหลือ {l.qty-cut} {r.drug.unit} ใน lot นี้</div>}
                        </div>
                      )
                    })}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderTop:'0.5px solid #FAC775',marginTop:4}}>
                      <div style={{fontSize:12}}>ตัดแล้ว: <b style={{color:mTotCut(r)===mNeeded(r)?'#0F6E56':'#A32D2D'}}>{mTotCut(r)}</b> / {mNeeded(r)} {r.drug.unit}</div>
                      <div style={{fontSize:11,color:mTotCut(r)===mNeeded(r)?'#0F6E56':'#A32D2D'}}>{mTotCut(r)===mNeeded(r)?'✓ ครบแล้ว':'ยังไม่ครบ'}</div>
                    </div>
                    </>}
                    {r.missingType==='known' && r.missingBed && (
                      <div style={{fontSize:11,color:'#0F6E56',background:'#E1F5EE',padding:'8px 10px',borderRadius:8,marginTop:6}}>✓ ตัด FEFO อัตโนมัติ → สร้าง Pending สำหรับ {r.missingBed}</div>
                    )}
                  </>
                ) : (
                  <>
                    {/* ⚠️ กล่องเตือน - ยาเกินต้องใส่ EXP ที่ต่างจากที่มีอยู่ */}
                    <div style={{background:'#FFF4E5',border:'1.5px solid #F9A825',borderRadius:8,padding:'10px 12px',marginBottom:12}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#E65100',marginBottom:4}}>
                        ⚠️ ยาที่นับได้เกิน {r.counted-r.systemTotal} {r.drug.unit}
                      </div>
                      <div style={{fontSize:12,color:'#854F0B'}}>
                        EXP ของยาที่เกิน <b>ต้องต่างจาก EXP ที่มีอยู่ด้านล่าง</b>
                      </div>
                    </div>

                    {/* แสดง EXP ที่มีอยู่แล้ว */}
                    <div style={{fontSize:12,fontWeight:600,color:'#3C3489',marginBottom:8}}>
                      📦 EXP ที่มีอยู่ใน stock ({r.lots.length} lot):
                    </div>
                    <div style={{background:'#F4F3FE',borderRadius:8,padding:'10px 12px',marginBottom:14,border:'1.5px solid #9E95D9'}}>
                      {r.lots.length===0
                        ? <div style={{fontSize:12,color:'#8BA898'}}>ยังไม่มี lot ในระบบ</div>
                        : r.lots.map((l,i) => (
                          <div key={l.docId} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:i<r.lots.length-1?'0.5px solid #CECBF6':'none'}}>
                            <span style={{fontSize:12,color:'#5F7A6A',fontWeight:500}}>lot {i+1} · {l.qty} {r.drug.unit}</span>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              {i===0&&<span style={{background:'#E1F5EE',color:'#0F6E56',fontSize:10,padding:'2px 6px',borderRadius:3,fontWeight:600}}>FEFO</span>}
                              <span style={{fontSize:13,fontWeight:700,color:'#3C3489'}}>EXP {fmtMY(l.expiry)}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    <div style={{fontSize:12,fontWeight:600,color:'#E65100',marginBottom:8}}>
                      ➕ ระบุยาที่เกิน {r.counted-r.systemTotal} {r.drug.unit} (แยกตาม EXP):
                    </div>
                    
                    {r.extraLots.map((lot, idx) => {
                      const totalExtraQty = r.extraLots.reduce((sum, l) => sum + l.qty, 0)
                      const maxQty = (r.counted - r.systemTotal) - (totalExtraQty - lot.qty)
                      
                      return (
                        <div key={lot.id} style={{background:'rgba(230,81,0,.06)',borderRadius:8,padding:'10px 12px',marginBottom:8,border:'1.5px solid #FFB74D'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                            <div style={{fontSize:12,fontWeight:600,color:'#E65100'}}>Lot เกิน {idx + 1}</div>
                            {r.extraLots.length > 1 && (
                              <button onClick={() => removeMExtraLot(lot.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#A32D2D'}}>✕</button>
                            )}
                          </div>
                          
                          <div style={{marginBottom:8}}>
                            <div className="lbl" style={{color:'#3C3489',marginBottom:4}}>จำนวน</div>
                            <div className="nc">
                              <button onClick={() => updateMExtraLot(lot.id, 'qty', Math.max(1, lot.qty - 1))}>−</button>
                              <span>{lot.qty}</span>
                              <button onClick={() => updateMExtraLot(lot.id, 'qty', Math.min(maxQty, lot.qty + 1))} disabled={lot.qty >= maxQty}>+</button>
                            </div>
                            <div style={{fontSize:10,color:'#854F0B',marginTop:2}}>สูงสุด {maxQty} {r.drug.unit}</div>
                          </div>
                          
                          <div className="g2">
                            <div>
                              <div className="lbl" style={{color:'#3C3489'}}>เดือน EXP</div>
                              <select className="inp" value={lot.expM} onChange={e => updateMExtraLot(lot.id, 'expM', e.target.value)}>
                                <option value="">-- Month --</option>
                                {months.map((m,i)=><option key={m} value={m}>{m} ({thM[i]})</option>)}
                              </select>
                            </div>
                            <div>
                              <div className="lbl" style={{color:'#3C3489'}}>EXP Year</div>
                              <select className="inp" value={lot.expY} onChange={e => updateMExtraLot(lot.id, 'expY', e.target.value)}>
                                <option value="">-- Year --</option>
                                {years.map(y=><option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                          </div>
                          
                          {lot.expM && lot.expY && (
                            <div style={{fontSize:11,color:'#0F6E56',marginTop:4}}>→ จะบันทึก {lot.qty} {r.drug.unit}, EXP {lot.expM}/{lot.expY}</div>
                          )}
                        </div>
                      )
                    })}
                    
                    <button onClick={() => addMExtraLot()} className="btn sm full" style={{marginBottom:12,borderColor:'#FFB74D',color:'#E65100'}} disabled={r.extraLots.reduce((s, l) => s + l.qty, 0) >= (r.counted - r.systemTotal)}>
                      + เพิ่ม lot (ถ้า EXP ต่าง)
                    </button>
                    
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'#FFF3E0',borderRadius:6,border:'1px solid #FFB74D'}}>
                      <div style={{fontSize:12}}>รวมยาเกิน: <b style={{color:r.extraLots.reduce((s,l)=>s+l.qty,0)===(r.counted-r.systemTotal)?'#0F6E56':'#A32D2D'}}>{r.extraLots.reduce((s,l)=>s+l.qty,0)}</b> / {r.counted-r.systemTotal} {r.drug.unit}</div>
                      <div style={{fontSize:11,color:r.extraLots.reduce((s,l)=>s+l.qty,0)===(r.counted-r.systemTotal)?'#0F6E56':'#A32D2D'}}>{r.extraLots.reduce((s,l)=>s+l.qty,0)===(r.counted-r.systemTotal)?'✓ ครบแล้ว':'ยังไม่ครบ'}</div>
                    </div>

                  </>
                )}
              </div>
              <div style={{display:'flex',gap:8,marginTop:8}}>
                {mIdx>0&&<button className="btn sm" onClick={()=>setLocDiscModal(prev=>({...prev,rIdx:prev.rIdx-1}))}>← ก่อนหน้า</button>}
                {mIdx<mRes.length-1
                  ? <button className="btn primary" style={{flex:1}} onClick={()=>setLocDiscModal(prev=>({...prev,rIdx:prev.rIdx+1}))} disabled={!mValid}>ถัดไป ({mIdx+2}/{mRes.length}) →</button>
                  : <button className="btn primary" style={{flex:1}} onClick={saveAndConfirm} disabled={!allMValid}>✓ ยืนยัน {gName}</button>
                }
              </div>
              <button style={{width:'100%',marginTop:6,padding:'8px',borderRadius:8,border:'0.5px solid #C8DDD4',
                background:'none',color:'#8BA898',fontSize:11,cursor:'pointer',fontFamily:'inherit'}} onClick={skipAndConfirm}>
                ข้ามไปก่อน (จัดการทีหลัง)
              </button>
            </div>
          </div>
        )
      })()}

      {allConfirmed && (
        <button className="btn primary full" onClick={handleSubmitCount} disabled={saving||fridgeTemp===''} style={{marginTop:8,opacity:fridgeTemp!==''?1:0.5}}>
          {saving?'กำลังบันทึก...':fridgeTemp===''?'กรุณากรอกอุณหภูมิตู้เย็นก่อนบันทึก':'✓ ตรวจสอบและบันทึกทั้งหมด'}
        </button>
      )}
    </>
  )
}

/* ═══ WITHDRAW / RESTOCK ═══ */
function Withdraw({ drugs, nurses, lots, lotsOf, withdrawals, calcPutaway, db, fmtMY, setPutaway }) {
  const [nurse, setNurse] = useState(''); const [nQ, setNQ] = useState(''); const [nOpen, setNOpen] = useState(false)
  const [drugId, setDrugId] = useState(''); const [dQ, setDQ] = useState(''); const [dOpen, setDOpen] = useState(false)
  const [bed, setBed] = useState(''); const [qty, setQty] = useState(1); const [note, setNote] = useState('')
  const [ok, setOk] = useState(false)
  const [retStates, setRetStates] = useState({})
  // Restock mode
  const [rstDrugId, setRstDrugId] = useState(''); const [rstDQ, setRstDQ] = useState(''); const [rstDOpen, setRstDOpen] = useState(false)
  const [rstQty, setRstQty] = useState(1); const [rstExpM, setRstExpM] = useState(''); const [rstExpY, setRstExpY] = useState('')
  const [rstFullDate, setRstFullDate] = useState('')
  const [rstLoaned, setRstLoaned] = useState(false)
  const [rstNurse, setRstNurse] = useState(''); const [rstNQ, setRstNQ] = useState(''); const [rstNOpen, setRstNOpen] = useState(false)
  const [rstOk, setRstOk] = useState(false)
  const [tab, setTab] = useState('withdraw')

  const submit = async () => {
    const drug = drugs.find(d => d.id == drugId); if (!drug) return
    const ls = lots.filter(l => l.drugId == drug.id && l.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    let rem = qty
    for (const l of ls) {
      if (rem <= 0) break
      const take = Math.min(l.qty, rem)
      await updateDoc(doc(db, 'lots', l.docId), { qty: l.qty - take })
      rem -= take
    }
    await addDoc(collection(db, 'withdrawals'), { nurse, drugId: drug.id, drugName: drug.name, bed, qty, note, returned: false, retExp: '', ts: Timestamp.now() })
    setOk(true); setDrugId(''); setDQ(''); setBed(''); setQty(1); setNote('')
    setTimeout(() => setOk(false), 2000)
  }

  const submitRst = async () => {
    const drug = drugs.find(d => d.id == rstDrugId)
    const useFullDate = drug?.fullDateExp || false
    const iso = useFullDate ? rstFullDate : myToISO(rstExpM, rstExpY)
    if (!rstDrugId || !iso || !rstNurse) return
    const ex = lots.filter(l => l.drugId == rstDrugId && l.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    const pa = calcPutaway(rstDrugId, iso)
    const fefoExp = ex.length ? fmtMY(ex[0].expiry) : null
    await addDoc(collection(db, 'lots'), { drugId: parseInt(rstDrugId), qty: rstQty, expiry: iso, loaned: rstLoaned, ts: Timestamp.now(), addedBy: rstNurse })
    setRstOk(true); setRstDrugId(''); setRstDQ(''); setRstQty(1); setRstExpM(''); setRstExpY(''); setRstFullDate(''); setRstLoaned(false)
    setTimeout(() => setRstOk(false), 2000)
    if (drug?.singleStock) {
      const group = STORAGE_GROUPS.find(g => g.id === drug.groupId)
      setPutaway({ drug, qty: rstQty, expiry: iso, context: 'restock', singleStock: true, groupName: group?.name || '', groupIcon: group?.icon || '📦' })
    } else {
      setPutaway({ drug: drug || { name: 'ยาที่เติม', unit: '' }, qty: rstQty, expiry: iso, pa, fefoExp, context: 'restock' })
    }
  }

  const openRet = docId => {
    const w = withdrawals.find(x => x.docId === docId)
    setRetStates(s => ({ ...s, [docId]: { open: true, entries: [{ qty: w?.qty||1, expM:'', expY:'', fullDate:'', preview:null }] } }))
  }
  const closeRet = docId => setRetStates(s => ({ ...s, [docId]: undefined }))
  const updWRetEntry = (docId, idx, field, val, drugId) => {
    setRetStates(s => {
      const rs = s[docId]; if (!rs) return s
      const drugObj3 = drugs.find(d => d.id == drugId)
      const entries = rs.entries.map((e,i) => {
        if (i !== idx) return e
        const ne = { ...e, [field]: val }
        let iso = null
        if (field === 'fullDate' && val) iso = val
        else { const m2 = field==='expM'?val:e.expM; const y2 = field==='expY'?val:e.expY; if (m2&&y2) iso = myToISO(m2,y2) }
        if (!iso) { ne.preview = null; return ne }
        if (drugObj3?.singleStock) {
          ne.preview = { singleStock: true, label: '🔄 วางแทนของเดิม', isFEFOSide: null }
          return ne
        }
        const siblingIsos2 = rs.entries
          .filter((_,j) => j !== i)
          .map(e2 => e2.fullDate || myToISO(e2.expM, e2.expY))
          .filter(Boolean)
        if (siblingIsos2.length === 0) {
          ne.preview = calcPutaway(drugId, iso)
        } else {
          ne.preview = { multiLot: true, label: '🔍 ดูตำแหน่งรวมหลังยืนยัน', isFEFOSide: null }
        }
        return ne
      })
      return { ...s, [docId]: { ...rs, entries } }
    })
  }
  const addWRetEntry = docId => setRetStates(s => {
    const rs = s[docId]; if (!rs) return s
    return { ...s, [docId]: { ...rs, entries: [...rs.entries, { qty:1, expM:'', expY:'', fullDate:'', preview:null }] } }
  })
  const removeWRetEntry = (docId, idx) => setRetStates(s => {
    const rs = s[docId]; if (!rs) return s
    return { ...s, [docId]: { ...rs, entries: rs.entries.filter((_,i)=>i!==idx) } }
  })
  const confirmRet = async (w) => {
    const rs = retStates[w.docId]; if (!rs) return
    const entries = rs.entries || []
    const validEntries = entries.filter(e => e.fullDate || (e.expM && e.expY))
    if (!validEntries.length) return
    const drug = drugs.find(d => d.id == w.drugId) || { name: w.drugName, unit: '' }
    // บันทึกทุก lot ลง Firebase ก่อน
    for (const entry of validEntries) {
      const iso = entry.fullDate || myToISO(entry.expM, entry.expY)
      await addDoc(collection(db, 'lots'), { drugId: w.drugId, qty: entry.qty, expiry: iso, ts: Timestamp.now() })
    }
    // แสดง overlay พร้อม return lots ทั้งหมดพร้อมกัน
    if (validEntries.length > 0) {
      if (drug?.singleStock) {
        const group = STORAGE_GROUPS.find(g => g.id === drug.groupId)
        const firstIso = validEntries[0].fullDate || myToISO(validEntries[0].expM, validEntries[0].expY)
        setPutaway({ drug, qty: validEntries[0].qty, expiry: firstIso, context: 'return', singleStock: true, groupName: group?.name || '', groupIcon: group?.icon || '📦' })
      } else {
        const firstIso = validEntries[0].fullDate || myToISO(validEntries[0].expM, validEntries[0].expY)
        const pa = calcPutaway(w.drugId, firstIso)
        const returnLots = validEntries
          .map(e => ({ expiry: e.fullDate || myToISO(e.expM, e.expiry), qty: e.qty }))
          .filter(e => e.expiry)
          .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
        setPutaway({ drug, returnLots, pa, context: 'return' })
      }
    }
    const firstIso = validEntries[0].fullDate || myToISO(validEntries[0].expM, validEntries[0].expY)
    await updateDoc(doc(db, 'withdrawals', w.docId), { 
      returned: true, 
      retExp: firstIso,
      return_timestamp: Timestamp.now()
    })
    closeRet(w.docId)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className={`btn full${tab === 'withdraw' ? ' primary' : ''}`} onClick={() => setTab('withdraw')}>ใช้ยาสต็อก</button>
        <button className={`btn full${tab === 'restock' ? ' primary' : ''}`} onClick={() => setTab('restock')}>เติมยาเข้าสต็อก</button>
      </div>

      {tab === 'withdraw' ? (
        <>
          <div className="card">
            <div className="slbl">บันทึกการใช้ยาสต็อก</div>
            {ok && <div className="ok" style={{ marginBottom: 10 }}>บันทึกสำเร็จ ✓</div>}
            <div className="lbl">พยาบาลผู้เบิก</div>
            <NursePicker value={nurse} query={nQ} open={nOpen} nurses={nurses}
              onChange={(v, o) => { setNQ(v); setNurse(''); setNOpen(o !== undefined ? o : v.length > 0) }}
              onSelect={v => { setNurse(v); setNQ(v); setNOpen(false) }}
              onClear={() => { setNurse(''); setNQ(''); setNOpen(false) }} />
            <div className="lbl">ยาที่เบิก</div>
            <DrugPicker drugs={drugs} selectedId={drugId} query={dQ} open={dOpen}
              onChange={(v, o) => { setDQ(v); setDrugId(''); setDOpen(o !== undefined ? o : v.length > 0) }}
              onSelect={id => { setDrugId(id); setDQ(''); setDOpen(false) }}
              onClear={() => { setDrugId(''); setDQ(''); setDOpen(false) }} />
            <div className="lbl">เตียงผู้ป่วย</div>
            <select className="inp" value={bed} onChange={e => setBed(e.target.value)}>
              <option value="">-- เลือกเตียง --</option>
              {BEDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="lbl">จำนวน</div>
            <div className="nc">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}>+</button>
            </div>
            <div className="lbl">หมายเหตุ</div>
            <input className="inp" value={note} placeholder="เช่น stat dose..." onChange={e => setNote(e.target.value)} />
            <div style={{ marginTop: 12 }}>
              <button className="btn primary full" onClick={submit} disabled={!nurse || !drugId || !bed}>บันทึกการใช้ยาสต็อก</button>
            </div>
          </div>
        </>
      ) : (
        <div className="card purple">
          <div className="slbl" style={{ color: '#3C3489' }}>เติมยาเข้าสต็อก + ระบุวัน EXP</div>
          {rstOk && <div className="ok" style={{ marginBottom: 10 }}>เติมยาสำเร็จ ✓</div>}
          <div className="lbl" style={{ color: '#3C3489' }}>ยาที่ต้องการเติม</div>
          <DrugPicker drugs={drugs} selectedId={rstDrugId} query={rstDQ} open={rstDOpen}
            onChange={(v, o) => { setRstDQ(v); setRstDrugId(''); setRstDOpen(o !== undefined ? o : v.length > 0) }}
            onSelect={id => { setRstDrugId(id); setRstDQ(''); setRstDOpen(false) }}
            onClear={() => { setRstDrugId(''); setRstDQ(''); setRstDOpen(false) }} />
          <div className="lbl" style={{ color: '#3C3489' }}>จำนวน</div>
          <div className="nc">
            <button onClick={() => setRstQty(q => Math.max(1, q - 1))}>−</button>
            <span>{rstQty}</span>
            <button onClick={() => setRstQty(q => q + 1)}>+</button>
          </div>
          {/* ExpPicker รองรับ fullDateExp */}
          {(() => {
            const rstDrug = drugs.find(d => d.id == rstDrugId)
            return (
              <ExpPicker
                drug={rstDrug}
                expM={rstExpM} expY={rstExpY} fullDate={rstFullDate}
                onExpM={setRstExpM} onExpY={setRstExpY} onFullDate={setRstFullDate}
              />
            )
          })()}
          {/* Loaned (ฝากใช้) checkbox */}
          <div style={{ marginTop:10, background:'#F4F7F5', borderRadius:8, padding:'10px 12px', border:`0.5px solid ${rstLoaned?'#185FA5':'#C8DDD4'}`, display:'flex', alignItems:'flex-start', gap:10 }}>
            <input type="checkbox" checked={rstLoaned} onChange={e => setRstLoaned(e.target.checked)} style={{ marginTop:2, accentColor:'#185FA5' }} />
            <div>
              <div style={{ fontSize:12, fontWeight:500, color: rstLoaned?'#185FA5':'#1A2E25' }}>🏷 ยาฝากใช้ (จากห้องยากลาง)</div>
              <div style={{ fontSize:10, color:'#5F7A6A', marginTop:2 }}>ถ้าเลือก — ยานี้จะไม่ถูกนับเป็น EXP ของแผนก หาก expire โดยไม่ได้ใช้</div>
            </div>
          </div>
          <div className="lbl" style={{ color: '#3C3489', marginTop: 10 }}>พยาบาลผู้เติม</div>
          <NursePicker value={rstNurse} query={rstNQ} open={rstNOpen} nurses={nurses}
            onChange={(v, o) => { setRstNQ(v); setRstNurse(''); setRstNOpen(o !== undefined ? o : v.length > 0) }}
            onSelect={v => { setRstNurse(v); setRstNQ(v); setRstNOpen(false) }}
            onClear={() => { setRstNurse(''); setRstNQ(''); setRstNOpen(false) }} />
          <div style={{ marginTop: 12 }}>
            {(() => {
              const rstDrug = drugs.find(d => d.id == rstDrugId)
              const hasExp = rstDrug?.fullDateExp ? !!rstFullDate : (!!rstExpM && !!rstExpY)
              return (
                <button className="btn primary full" style={{ background: '#534AB7', borderColor: '#3C3489' }}
                  onClick={submitRst} disabled={!rstDrugId || !hasExp || !rstNurse}>
                  {rstDrug?.singleStock ? 'บันทึกเติมยา' : 'บันทึกเติมยา + ดูตำแหน่งวาง'}
                </button>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
}

/* ═══ EXPIRY ═══ */
function Expiry({ lots, drugs, daysLeft, fmtMY, db, removals, nurses, drugsWithStock, searchOverride, onSearchOverrideClear }) {
  const [search, setSearch]   = useState('')
  const [tab, setTab]         = useState('lots')   // lots | remove | history
  const [expScanOpen, setExpScanOpen] = useState(false)
  useEffect(() => {
    if (searchOverride) { setSearch(searchOverride); setTab('lots'); if (onSearchOverrideClear) onSearchOverrideClear() }
  }, [searchOverride])
  const [selLot, setSelLot]   = useState(null)
  const [reason, setReason]   = useState('')
  const [nurse, setNurse]     = useState(''); const [nQ, setNQ] = useState(''); const [nOpen, setNOpen] = useState(false)
  const [note, setNote]       = useState('')
  const [saving, setSaving]   = useState(false)
  const [ok, setOk]           = useState(false)
  // EXP edit
  const [editLotId, setEditLotId] = useState(null)
  const [editExpM, setEditExpM]   = useState('')
  const [editExpY, setEditExpY]   = useState('')
  const [editFullDate, setEditFullDate] = useState('')
  const [editSaving, setEditSaving]   = useState(false)
  const [editLoaned, setEditLoaned]   = useState(false)
  // Split-lot states: splitLotId = docId ที่กำลัง split, splitItems = [{expM,expY,fullDate}]
  const [splitLotId, setSplitLotId] = useState(null)
  const [splitItems, setSplitItems] = useState([])

  const submitEditExp = async () => {
    const lot = lots.find(l => l.docId === editLotId); if (!lot) return
    const drug = drugs.find(d => d.id == lot.drugId)
    const iso = drug?.fullDateExp ? editFullDate : myToISO(editExpM, editExpY)
    if (!iso) return
    setEditSaving(true)
    try {
      await updateDoc(doc(db, 'lots', editLotId), { expiry: iso, loaned: editLoaned })
      setEditLotId(null); setEditExpM(''); setEditExpY(''); setEditFullDate(''); setEditLoaned(false)
    } catch(e) { alert('เกิดข้อผิดพลาด: ' + e.message) }
    setEditSaving(false)
  }

  const openSplit = (l) => {
    setSplitLotId(l.docId)
    setEditLotId(null)
    // สร้าง entry ตามจำนวน qty
    setSplitItems(Array.from({ length: l.qty }, () => ({ expM:'', expY:'', fullDate:'' })))
  }

  const submitSplit = async () => {
    const lot = lots.find(l => l.docId === splitLotId); if (!lot) return
    const drug = drugs.find(d => d.id == lot.drugId)
    // ตรวจว่าครบทุก item
    const isos = splitItems.map(it => drug?.fullDateExp ? it.fullDate : myToISO(it.expM, it.expY))
    if (isos.some(iso => !iso)) { alert('กรุณากรอก EXP ให้ครบทุกชิ้น'); return }
    setEditSaving(true)
    try {
      const batch = writeBatch(db)
      // ลบ lot เดิม
      batch.delete(doc(db, 'lots', splitLotId))
      // สร้าง lot ใหม่ทีละชิ้น qty=1
      isos.forEach(iso => {
        const ref = doc(collection(db, 'lots'))
        batch.set(ref, { drugId: lot.drugId, qty: 1,
          expiry: iso, loaned: lot.loaned || false, ts: Timestamp.now() })
      })
      await batch.commit()
      setSplitLotId(null); setSplitItems([])
    } catch(e) { alert('เกิดข้อผิดพลาด: ' + e.message) }
    setEditSaving(false)
  }
  const dl2 = drugsWithStock()

  const q = search.toLowerCase()
  const allLots = lots
    .filter(l => l.qty > 0)
    .map(l => { const d = drugs.find(x => x.id == l.drugId); return d ? { ...l, drugName: d.name, groupId: d.groupId, alertDays: d.alertDays || 30 } : null })
    .filter(Boolean)
    .filter(l => !q || l.drugName.toLowerCase().includes(q))
    .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))

  const fefoSet = new Set()
  drugs.forEach(d => {
    const ls = lots.filter(l => l.drugId == d.id && l.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    if (ls.length) fefoSet.add(ls[0].docId)
  })

  // ยาที่ถึงเวลาแลกคืนแล้ว (daysLeft ≤ alertDays) แต่ยังอยู่ในสต็อก (ไม่นับยาฝากใช้)
  const exchangeDueLots = allLots.filter(l => {
    const dl = daysLeft(l.expiry)
    return !l.loaned && dl > 0 && dl <= l.alertDays && l.expiry !== '2099-12-31'
  })
  // ยาที่หมดอายุแล้ว (ไม่นับยาฝากใช้)
  const expiredLots = allLots.filter(l => !l.loaned && daysLeft(l.expiry) <= 0 && l.expiry !== '2099-12-31')

  const submitRemoval = async () => {
    if (!selLot || !reason || !nurse) return
    setSaving(true)
    try {
      const drug = drugs.find(d => d.id == selLot.drugId)
      const dl   = daysLeft(selLot.expiry)
      await addDoc(collection(db, 'stock_removals'), {
        lotDocId:      selLot.docId,
        drugId:        selLot.drugId,
        drugName:      selLot.drugName,
        qty:           selLot.qty,
        expiry:        selLot.expiry,
        reason,                                          // expired | returned_to_pharmacy | damaged
        daysBeforeExp: dl,                               // ติดลบ = หมดแล้ว
        wasInExchangeWindow: dl > 0 && dl <= (selLot.alertDays || 30), // อยู่ใน window แล้วยังไม่แลก
        missedExchange: reason === 'expired' && dl <= 0, // หมดอายุโดยไม่ได้แลก
        isDataCorrection: reason === 'data_correction',
        nurse, note,
        ts: Timestamp.now()
      })
      // ลบ lot ออกจากสต็อก
      await deleteDoc(doc(db, 'lots', selLot.docId))
      setOk(true); setSelLot(null); setReason(''); setNote('')
      setTimeout(() => setOk(false), 2500)
    } catch(e) { alert('เกิดข้อผิดพลาด: ' + e.message) }
    setSaving(false)
  }

  const reasonLabel = { expired: '🗑 หมดอายุ', returned_to_pharmacy: '🔄 ส่งคืนห้องยา', damaged: '⚠️ เสื่อมสภาพ', data_correction: '✏️ แก้ไขข้อมูล' }

  return (
    <>
      {/* Tab bar */}
      <div style={{ display:'flex', gap:6 }}>
        {[['lots','📋 รายการ lot'],['remove','✂️ ตัดออก'],['history','📜 ประวัติ']].map(([t,l]) => (
          <button key={t} className={`btn${tab===t?' primary':''} sm`} style={{ flex:1 }} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {/* Alert banners */}
      {expiredLots.length > 0 && (
        <div className="card red" style={{ padding:'10px 14px' }}>
          <div style={{ fontSize:12, fontWeight:500, color:'#A32D2D' }}>🚨 ยาหมดอายุ {expiredLots.length} lot — ต้องตัดออกจากสต็อก</div>
          <div style={{ fontSize:11, color:'#A32D2D', marginTop:2 }}>กดแท็บ "ตัดออก" แล้วเลือก lot ที่ต้องการจัดการ</div>
        </div>
      )}
      {exchangeDueLots.length > 0 && (
        <div className="card amber" style={{ padding:'10px 14px' }}>
          <div style={{ fontSize:12, fontWeight:500, color:'#854F0B' }}>⏰ ยาถึงเวลาแลกคืนห้องยา {exchangeDueLots.length} lot</div>
          <div style={{ fontSize:11, color:'#854F0B', marginTop:2 }}>ยาเหล่านี้ถึงเกณฑ์แจ้งเตือนแล้ว ควรส่งคืนห้องยาก่อน EXP</div>
        </div>
      )}

      {/* TAB: Lot list */}
      {tab==='lots' && (
        <>
          <div style={{ display:'flex', gap:6 }}>
            <div className="sw" style={{ flex:1 }}>
              <svg className="sw-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/></svg>
              <input className="inp" style={{ paddingLeft:30 }} value={search} placeholder="ค้นหายา..." onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => setExpScanOpen(true)} title="สแกน QR → ดู EXP"
              style={{ padding:'8px 10px', background:'#FAEEDA', border:'0.5px solid #FAC775', borderRadius:8, cursor:'pointer', fontSize:18, color:'#854F0B', flexShrink:0 }}>📷</button>
          </div>
          {expScanOpen && <QrScanModal onScan={name => { setSearch(name); setExpScanOpen(false) }} onClose={() => setExpScanOpen(false)} drugs={drugs} />}
          <div style={{ fontSize:11, color:'#8BA898' }}>{allLots.length} lots · เรียงจากใกล้หมดอายุก่อน</div>
          <div className="card" style={{ padding:'0 14px' }}>
            {allLots.map(l => {
              const dl = daysLeft(l.expiry); const fake = l.expiry==='2099-12-31'
              let clr, bg
              if (dl<=0) { clr='#A32D2D'; bg='#FCEBEB' }
              else if (dl<=7) { clr='#A32D2D'; bg='#FCEBEB' }
              else if (dl<=30) { clr='#854F0B'; bg='#FAEEDA' }
              else if (dl<=l.alertDays) { clr='#854F0B'; bg='#FAEEDA' }
              else { clr='#0F6E56'; bg='#E1F5EE' }
              const g = STORAGE_GROUPS.find(x => x.id===l.groupId)
              const isExchangeOver = !fake && dl > 0 && dl < 211
              const isExchangeDue  = !fake && dl >= 211 && dl <= 220
              const isSoon         = !fake && dl > 0 && dl <= l.alertDays
              const isEditing = editLotId === l.docId
              const drug = drugs.find(x => x.id == l.drugId)
              return (
                <div key={l.docId} className="lotrow" style={{ borderLeftColor:clr }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                      <div style={{ fontSize:12, fontWeight:500 }}>{l.drugName}</div>
                      {fefoSet.has(l.docId) && <span className="fefo-tag">FEFO</span>}
                      {g && <span className="b bgr" style={{ fontSize:9 }}>{g.icon}{g.name}</span>}
                      {l.loaned && <span className="b bb" style={{ fontSize:9 }}>ฝากใช้</span>}
                      {isExchangeOver && !isSoon && <span className="b br" style={{ fontSize:9 }}>เกินเวลาแลก</span>}
                      {isExchangeDue  && <span className="b ba" style={{ fontSize:9 }}>ถึงเวลาแลก</span>}
                      {isSoon && !isExchangeDue && <span className="b ba" style={{ fontSize:9 }}>ใกล้หมดอายุ</span>}
                    </div>
                    <div style={{ fontSize:10, fontFamily:'monospace', color:'#8BA898', marginTop:2 }}>
                      {fake?'ไม่มี EXP':`EXP ${fmtExpiry(l.expiry, drug)}`} · qty {l.qty}
                    </div>
                    {isEditing && (
                      <div style={{ marginTop:8, background:'#FAEEDA', borderRadius:8, padding:'10px 12px', border:'0.5px solid #FAC775' }}>
                        <div style={{ fontSize:11, fontWeight:500, color:'#854F0B', marginBottom:6 }}>✏️ แก้ไขวัน EXP</div>
                        <ExpPicker drug={drug}
                          expM={editExpM} expY={editExpY} fullDate={editFullDate}
                          onExpM={setEditExpM} onExpY={setEditExpY} onFullDate={setEditFullDate} />
                        <label style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, cursor:'pointer', fontSize:11, color:'#5F7A6A' }}>
                          <input type="checkbox" checked={editLoaned} onChange={e => setEditLoaned(e.target.checked)}
                            style={{ width:14, height:14, cursor:'pointer', accentColor:'#185FA5' }} />
                          ยาฝากใช้ (loaned)
                        </label>
                        <div style={{ display:'flex', gap:6, marginTop:8 }}>
                          <button className="btn primary sm" style={{ flex:1 }} onClick={submitEditExp}
                            disabled={editSaving||(drug?.fullDateExp?!editFullDate:(!editExpM||!editExpY))}>
                            {editSaving?'กำลังบันทึก...':'บันทึก'}
                          </button>
                          <button className="btn sm" onClick={() => setEditLotId(null)}>ยกเลิก</button>
                        </div>
                        {l.qty > 1 && (
                          <button onClick={() => openSplit(l)}
                            style={{ marginTop:8, width:'100%', background:'none', border:'0.5px solid #FAC775',
                              borderRadius:6, padding:'5px', fontSize:10, color:'#854F0B', cursor:'pointer', fontFamily:'inherit' }}>
                            แยก {l.qty} ชิ้นนี้ — กำหนด EXP คนละวัน
                          </button>
                        )}
                      </div>
                    )}
                    {splitLotId === l.docId && (
                      <div style={{ marginTop:8, background:'#E6F1FB', borderRadius:8, padding:'10px 12px', border:'0.5px solid #B5D4F4' }}>
                        <div style={{ fontSize:11, fontWeight:500, color:'#185FA5', marginBottom:8 }}>
                          แยก lot — กำหนด EXP ทีละชิ้น ({l.qty} ชิ้น)
                        </div>
                        {splitItems.map((it, idx) => (
                          <div key={idx} style={{ marginBottom:8 }}>
                            <div style={{ fontSize:10, color:'#5F7A6A', marginBottom:3 }}>ชิ้นที่ {idx+1}</div>
                            <ExpPicker drug={drug}
                              expM={it.expM} expY={it.expY} fullDate={it.fullDate}
                              onExpM={v => setSplitItems(s => s.map((x,i)=>i===idx?{...x,expM:v}:x))}
                              onExpY={v => setSplitItems(s => s.map((x,i)=>i===idx?{...x,expY:v}:x))}
                              onFullDate={v => setSplitItems(s => s.map((x,i)=>i===idx?{...x,fullDate:v}:x))} />
                          </div>
                        ))}
                        <div style={{ display:'flex', gap:6, marginTop:4 }}>
                          <button className="btn primary sm" style={{ flex:1 }} onClick={submitSplit}
                            disabled={editSaving}>
                            {editSaving?'กำลังบันทึก...':'บันทึกแยก lot'}
                          </button>
                          <button className="btn sm" onClick={() => { setSplitLotId(null); setSplitItems([]) }}>ยกเลิก</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                    <span className="b" style={{ background:bg, color:clr }}>
                      {dl<=0?'หมดแล้ว':`อีก ${dl} วัน`}
                    </span>
                    {!fake && (
                      <button onClick={() => {
                        if (isEditing) { setEditLotId(null); return }
                        setSplitLotId(null); setSplitItems([])
                        setEditLotId(l.docId)
                        setEditExpM(''); setEditExpY(''); setEditFullDate('')
                        setEditLoaned(l.loaned || false)
                      }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, padding:'2px 4px', color: isEditing?'#A32D2D':'#8BA898', lineHeight:1 }}
                        title={isEditing ? 'ยกเลิก' : 'แก้ไข EXP'}>
                        {isEditing ? '✕' : '✏️'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {!allLots.length && <div style={{ padding:24, textAlign:'center', fontSize:12, color:'#8BA898' }}>ยังไม่มี lot</div>}
          </div>
        </>
      )}

      {/* TAB: Remove */}
      {tab==='remove' && (
        <>
          {ok && <div className="ok">บันทึกสำเร็จ ✓</div>}
          <div className="info" style={{ borderColor:'#A32D2D' }}>
            ใช้สำหรับตัด lot ออกจากสต็อกอย่างเป็นทางการ — ระบบจะบันทึกเหตุผลเพื่อใช้ในงานวิจัย
          </div>

          {/* เลือก lot */}
          <div className="card">
            <div className="slbl">เลือก lot ที่ต้องการจัดการ</div>
            <div className="dd" style={{ maxHeight:220 }}>
              {allLots.map(l => {
                const dl = daysLeft(l.expiry)
                const isExp = dl <= 0
                const isDue = dl > 0 && dl <= l.alertDays
                const sel   = selLot?.docId === l.docId
                return (
                  <div key={l.docId} className="ddi" onClick={() => setSelLot(l)}
                    style={{ background: sel ? '#E1F5EE' : undefined, borderLeft: sel ? '3px solid #0F6E56' : undefined }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:500 }}>{l.drugName}</div>
                        <div style={{ fontSize:10, color:'#8BA898' }}>
                          EXP {l.expiry==='2099-12-31'?'ไม่มี':fmtMY(l.expiry)} · qty {l.qty}
                        </div>
                      </div>
                      {l.loaned && <span className="b bb" style={{ fontSize:9 }}>ฝากใช้</span>}
                      {isExp && <span className="b br">หมดอายุ</span>}
                      {!isExp && dl > 0 && dl < 211 && <span className="b br">เกินเวลาแลก</span>}
                      {!isExp && dl >= 211 && dl <= 220 && <span className="b ba">ถึงเวลาแลก</span>}
                      {!isExp && isDue && dl < 211 && <span className="b ba" style={{ fontSize:9 }}>ใกล้หมดอายุ</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {selLot && (
            <div className="card red">
              <div className="slbl" style={{ color:'#A32D2D' }}>เหตุผลที่ตัดออก</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  ['expired',             '🗑 หมดอายุ — นำออกทิ้ง'],
                  ['returned_to_pharmacy','🔄 ส่งคืนห้องยา — แลกคืนก่อน EXP'],
                  ['damaged',             '⚠️ เสื่อมสภาพ — ไม่สามารถใช้ได้'],
                  ['data_correction',     '✏️ แก้ไขข้อมูล — บันทึกผิดพลาด'],
                ].map(([v,l]) => (
                  <label key={v} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer',
                    background: reason===v ? '#FCEBEB' : 'var(--color-background-secondary)',
                    border: `0.5px solid ${reason===v?'#F7C1C1':'var(--color-border-secondary)'}`,
                    borderRadius:8, padding:'10px 12px' }}>
                    <input type="radio" name="reason" value={v} checked={reason===v} onChange={()=>setReason(v)} />
                    <div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{l}</div>
                      {v==='returned_to_pharmacy' && selLot &&
                        <div style={{ fontSize:10, color:'#5F7A6A', marginTop:2 }}>
                          คืนก่อน EXP {daysLeft(selLot.expiry)} วัน
                          {daysLeft(selLot.expiry) > 0 ? ' ✓ ทันเวลา' : ' — หมดอายุแล้ว'}
                        </div>
                      }
                    </div>
                  </label>
                ))}
              </div>
              <div className="lbl" style={{ marginTop:10 }}>พยาบาลผู้บันทึก</div>
              <NursePicker value={nurse} query={nQ} open={nOpen} nurses={nurses}
                onChange={(v,o)=>{setNQ(v);setNurse('');setNOpen(o!==undefined?o:v.length>0)}}
                onSelect={v=>{setNurse(v);setNQ(v);setNOpen(false)}}
                onClear={()=>{setNurse('');setNQ('');setNOpen(false)}} />
              <div className="lbl">หมายเหตุ (ถ้ามี)</div>
              <input className="inp" value={note} placeholder="เช่น เลขที่ใบส่งคืน..." onChange={e=>setNote(e.target.value)} />
              <div style={{ marginTop:12, background:'var(--color-background-secondary)', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#5F7A6A' }}>
                <div style={{ fontWeight:500, marginBottom:4 }}>สรุปรายการที่จะตัดออก:</div>
                <div>{selLot.drugName} · qty {selLot.qty} · EXP {selLot.expiry==='2099-12-31'?'ไม่มี':fmtMY(selLot.expiry)}</div>
                {reason && <div style={{ marginTop:4, color:'#A32D2D' }}>เหตุผล: {reasonLabel[reason]}</div>}
              </div>
              <button className="btn full" style={{ marginTop:10, background:'#A32D2D', borderColor:'#791F1F', color:'#fff' }}
                onClick={submitRemoval} disabled={!reason||!nurse||saving}>
                {saving?'กำลังบันทึก...':'✓ ยืนยันตัดออกจากสต็อก'}
              </button>
            </div>
          )}
        </>
      )}

      {/* TAB: History of removals */}
      {tab==='history' && (
        <>
          <div style={{ fontSize:11, color:'#8BA898' }}>{removals.length} รายการที่ตัดออก</div>
          <div className="card" style={{ padding:'0 14px' }}>
            {removals.length ? removals.map(r => {
              const reasonClr = r.reason==='expired'?'#A32D2D':r.reason==='returned_to_pharmacy'?'#0F6E56':'#854F0B'
              const reasonBg  = r.reason==='expired'?'#FCEBEB':r.reason==='returned_to_pharmacy'?'#E1F5EE':'#FAEEDA'
              return (
                <div key={r.docId} className="wrow">
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:12, fontWeight:500 }}>{r.drugName}</span>
                      <span className="b" style={{ background:reasonBg, color:reasonClr }}>
                        {reasonLabel[r.reason]||r.reason}
                      </span>
                      <span className="b bgr">×{r.qty}</span>
                    </div>
                    <div style={{ fontSize:10, color:'#8BA898', marginTop:2 }}>
                      {r.nurse} · EXP {r.expiry&&r.expiry!=='2099-12-31'?fmtMY(r.expiry):'-'}
                      {r.daysBeforeExp!=null && ` · ${r.daysBeforeExp>0?`คืนก่อน EXP ${r.daysBeforeExp} วัน`:'หมดอายุแล้ว'}`}
                    </div>
                    {r.note && <div style={{ fontSize:10, color:'#8BA898' }}>{r.note}</div>}
                    <div style={{ fontSize:10, color:'#8BA898', fontFamily:'monospace' }}>
                      {r.ts?.toDate ? r.ts.toDate().toLocaleString('th-TH') : ''}
                    </div>
                  </div>
                </div>
              )
            }) : <div style={{ padding:24, textAlign:'center', fontSize:12, color:'#8BA898' }}>ยังไม่มีประวัติ</div>}
          </div>
        </>
      )}
    </>
  )
}

/* ═══ HISTORY ═══ */
function History({ withdrawals, checks, lots, lotsOf, calcPutaway, fmtDT, fmtMY, daysLeft, db, setPutaway, nurses, drugs }) {
  const [tab, setTab] = useState('w')
  const [retStates, setRetStates] = useState({})
  const [historyMonth, setHistoryMonth] = useState('all')

  const openRet = docId => setRetStates(s => ({ ...s, [docId]: { open: true, expM: '', expY: '', preview: null } }))
  const closeRet = docId => setRetStates(s => ({ ...s, [docId]: undefined }))
  const setRetMY = (docId, m, y, w) => {
    const expM = m !== undefined ? m : retStates[docId]?.expM || ''
    const expY = y !== undefined ? y : retStates[docId]?.expY || ''
    let preview = null
    if (expM && expY) preview = calcPutaway(w.drugId, myToISO(expM, expY))
    setRetStates(s => ({ ...s, [docId]: { ...s[docId], expM, expY, preview } }))
  }
  const confirmRet = async (w) => {
    const rs = retStates[w.docId]; if (!rs?.expM || !rs?.expY) return
    const iso = myToISO(rs.expM, rs.expY)
    const drug = drugs.find(d => d.id == w.drugId) || { name: w.drugName, unit: '' }
    const ex = lots.filter(l => l.drugId == w.drugId && l.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    const pa = calcPutaway(w.drugId, iso)
    const fefoExp = ex.length ? fmtMY(ex[0].expiry) : null
    await updateDoc(doc(db, 'withdrawals', w.docId), { 
      returned: true, 
      retExp: iso,
      return_timestamp: Timestamp.now()
    })
    await addDoc(collection(db, 'lots'), { drugId: w.drugId, qty: w.qty, expiry: iso, ts: Timestamp.now() })
    closeRet(w.docId)
    setPutaway({ drug, qty: w.qty, expiry: iso, pa, fefoExp, context: 'return' })
  }

  // Generate available months from withdrawals
  const availableMonths = [...new Set(withdrawals.map(w => {
    const ts = w.ts?.toDate ? w.ts.toDate() : new Date(w.ts)
    return ts.toISOString().slice(0,7)
  }))].sort().reverse()

  // Filter data by selected month
  const filteredWithdrawals = historyMonth === 'all' ? withdrawals : withdrawals.filter(w => {
    const ts = w.ts?.toDate ? w.ts.toDate() : new Date(w.ts)
    return ts.toISOString().slice(0,7) === historyMonth
  })

  const filteredChecks = historyMonth === 'all' ? checks : checks.filter(c => {
    const ts = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
    return ts.toISOString().slice(0,7) === historyMonth
  })

  return (
    <>
      {/* Month Filter Dropdown */}
      <div style={{ marginBottom: 8 }}>
        <select value={historyMonth} onChange={e => setHistoryMonth(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #CECBF6', background: '#fff', fontSize: 12, color: '#1A2E25' }}>
          <option value="all">📅 ทุกเดือน ({withdrawals.length} รายการ)</option>
          {availableMonths.map(month => {
            const count = withdrawals.filter(w => {
              const ts = w.ts?.toDate ? w.ts.toDate() : new Date(w.ts)
              return ts.toISOString().slice(0,7) === month
            }).length
            const [y, m] = month.split('-')
            const label = new Date(y, m-1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
            return <option key={month} value={month}>{label} ({count} รายการ)</option>
          })}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className={`btn full${tab === 'w' ? ' primary' : ''}`} onClick={() => setTab('w')}>เบิกยา ({filteredWithdrawals.length})</button>
        <button className={`btn full${tab === 'c' ? ' primary' : ''}`} onClick={() => setTab('c')}>เช็คสต็อก ({filteredChecks.length})</button>
      </div>
      <div className="card" style={{ padding: '0 14px' }}>
        {tab === 'w' ? (
          filteredWithdrawals.length ? filteredWithdrawals.map(w => {
            const rs = retStates[w.docId]
            const exLots = lots.filter(l => l.drugId == w.drugId && l.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
            return (
              <div key={w.docId} className="wrow">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{w.drugName}</span>
                    <span className="b bb">×{w.qty}</span>
                    {/* Usage Type Badges */}
                    {!w.usage_type || w.usage_type === 'Normal' ? (
                      <span className="b" style={{background:'#E3F2FD', color:'#1976D2', border:'0.5px solid #90CAF9', fontSize:10, padding:'2px 7px'}}>💊 Stock Use</span>
                    ) : w.usage_type === 'Emergency' ? (
                      <span className="b" style={{background:'#FFEBEE', color:'#C62828', border:'0.5px solid #EF5350', fontSize:10, padding:'2px 7px'}}>🔔 Emergency Use</span>
                    ) : w.usage_type === 'Missing_Tracked' ? (
                      <span className="b" style={{background:'#FFF3E0', color:'#E65100', border:'0.5px solid #FFB74D', fontSize:10, padding:'2px 7px'}}>🔍 Missing-Track</span>
                    ) : w.usage_type === 'Missing_Unknown' ? (
                      <span className="b" style={{background:'#FCE4EC', color:'#AD1457', border:'0.5px solid #F06292', fontSize:10, padding:'2px 7px'}}>❓ Missing-Unk</span>
                    ) : null}
                    {w.returned && <span className="b bg">Return แล้ว{w.retExp ? ` · EXP ${fmtMY(w.retExp)}` : ''}{w.return_timestamp ? ` · ${fmtDT(w.return_timestamp)}` : ''}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#8BA898' }}>{w.bed} · {w.nurse}{w.note && w.note !== '(Quick)' && !w.note.includes('Replace:') && !w.note.includes('Multi Quick Use') ? ' · ' + w.note : w.note === '(Quick)' ? ' · ⚡ Quick' : ''}</div>
                  <div style={{ fontSize: 10, color: '#8BA898', fontFamily: 'monospace' }}>{w.ts && fmtDT(w.ts)}</div>
                  {rs?.open && !w.returned && (
                    <div className="retpanel">
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#3C3489', marginBottom: 8 }}>ระบุ EXP ยาที่คืน</div>
                      {exLots.length > 0 && <div style={{ fontSize: 11, color: '#534AB7', background: 'rgba(83,74,183,.08)', borderRadius: 6, padding: '5px 8px', marginBottom: 8 }}>FEFO ปัจจุบัน: <b>{fmtMY(exLots[0].expiry)}</b></div>}
                      <MyPicker month={rs.expM} year={rs.expY}
                        onMonth={m => setRetMY(w.docId, m, undefined, w)}
                        onYear={y => setRetMY(w.docId, undefined, y, w)} />
                      {rs.preview && (
                        <div style={{ marginTop: 8, background: rs.preview.isFEFOSide ? '#FCEBEB' : '#E1F5EE', border: `0.5px solid ${rs.preview.isFEFOSide ? '#F7C1C1' : '#9FE1CB'}`, borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{rs.preview.isFEFOSide ? '🚨' : '✅'}</span>
                          <div style={{ fontSize: 12, fontWeight: 500, color: rs.preview.isFEFOSide ? '#A32D2D' : '#0F6E56' }}>{rs.preview.label}</div>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button className="btn primary sm" style={{ flex: 1 }} onClick={() => confirmRet(w)} disabled={!rs.expM || !rs.expY}>Return + ดูตำแหน่งวาง</button>
                        <button className="btn sm" onClick={() => closeRet(w.docId)}>ยกเลิก</button>
                      </div>
                    </div>
                  )}
                </div>
                {!w.returned && !rs?.open && (
                  <button onClick={() => openRet(w.docId)} style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid #CECBF6', background: '#EEEDFE', color: '#3C3489', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>Return</button>
                )}
                {w.returned && <span style={{ fontSize: 10, color: '#8BA898' }}>คืนแล้ว</span>}
              </div>
            )
          }) : <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: '#8BA898' }}>ยังไม่มีบันทึก</div>
        ) : (
          filteredChecks.length ? filteredChecks.map(c => (
            <div key={c.docId} className="wrow">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{c.nurse}</div>
                <div style={{ fontSize: 10, color: '#8BA898' }}>
                  เวร{c.shift} · {c.ts && fmtDT(c.ts)}
                  {c.durationMin != null && <span style={{color:'#0F6E56',marginLeft:4}}>· {fmtDuration(c.durationMin)}</span>}
                </div>
              </div>
              <span className="b bg">✓ เช็คแล้ว</span>
            </div>
          )) : <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: '#8BA898' }}>ยังไม่มีบันทึก</div>
        )}
      </div>
    </>
  )
}

/* ═══ EXPORT ═══ */
function Export({ drugsWithStock, lots, withdrawals, checks, daysLeft, fmtMY, calcPutaway, lotsOf, removals, expirySnapshots }) {
  const dl = drugsWithStock()
  const [reportDays, setReportDays] = useState(30)
  const [kpiMonth, setKpiMonth] = useState('all')
  const [logMonth, setLogMonth] = useState(() => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}` })
  const [withdrawalMonth, setWithdrawalMonth] = useState(() => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}` })
  const [reportMonth, setReportMonth] = useState(() => { const n=new Date(); n.setMonth(n.getMonth()-1); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}` })
  const [expandedDay, setExpandedDay] = useState(null)
  const [logExpanded, setLogExpanded] = useState(false)
  const BOM = '\uFEFF'
  const exportCSV = (name, content) => {
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `TermYa_${name}_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  /* ── Compliance calculation ── */
  const calcCompliance = (days) => {
    const now   = new Date()
    const start = new Date(now); start.setDate(start.getDate() - days + 1); start.setHours(0,0,0,0)
    // สร้าง map: "YYYY-MM-DD_Day"|"YYYY-MM-DD_Night" → true
    const done = new Set()
    checks.forEach(c => {
      const ts = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
      if (ts < start) return
      const shiftKey = c.shift?.includes('Day') ? 'Day' : 'Night'
      const dateKey = shiftDateKey(ts, c.shift)
      done.add(`${dateKey}_${shiftKey}`)
    })
    // นับวันที่ควรเช็ค (Day + Night ต่อวัน)
    const daily = []
    for (let i = 0; i < days; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i)
      if (d > now) break
      const dateKey = d.toISOString().slice(0,10)
      const thDate  = d.toLocaleDateString('th-TH', { day:'2-digit', month:'2-digit', year:'2-digit' })
      daily.push({
        dateKey, thDate,
        day:   done.has(`${dateKey}_Day`),
        night: done.has(`${dateKey}_Night`),
        total: (done.has(`${dateKey}_Day`) ? 1 : 0) + (done.has(`${dateKey}_Night`) ? 1 : 0)
      })
    }
    const expected = daily.length * 2
    const actual   = daily.reduce((s,d) => s + d.total, 0)
    const rate     = expected > 0 ? Math.round(actual / expected * 1000) / 10 : 0
    return { daily, expected, actual, rate, days: daily.length }
  }

  const comp = calcCompliance(reportDays)
  const checksWithDur = checks.filter(c => c.durationMin != null)
  const avgDur = checksWithDur.length
    ? Math.round(checksWithDur.reduce((s,c)=>s+(c.durationMin||0),0)/checksWithDur.length*10)/10 : null

  // Missed Timely Exchange Rate
  const totalRemoved       = removals.length
  const missedExchange     = removals.filter(r => r.missedExchange).length          // expired โดยไม่ได้แลก
  const returnedInTime     = removals.filter(r => r.reason==='returned_to_pharmacy' && r.daysBeforeExp > 0).length
  const missedExchangeRate = totalRemoved > 0 ? Math.round(missedExchange/totalRemoved*1000)/10 : null

  // กรอง checks ตามเดือนที่เลือก (สำหรับ KPI)
  const kpiChecks = kpiMonth === 'all' ? checks : checks.filter(c => {
    const ts = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
    return ts.toISOString().slice(0,7) === kpiMonth
  })

  // Stock Deficiency Rate (avg จาก kpiChecks)
  const checksWithDef = kpiChecks.filter(c => c.deficiencyRate != null)
  const avgDefRate = checksWithDef.length
    ? Math.round(checksWithDef.reduce((s,c)=>s+(c.deficiencyRate||0),0)/checksWithDef.length*10)/10 : null
  const totalDefUnits = checksWithDef.reduce((s,c) => {
    const units = (c.deficientDrugs||[]).reduce((su,d) => su + Math.max(0,(d.min||0)-(d.counted||0)), 0)
    return s + units
  }, 0)

  // Untraced Loss Rate (avg จาก kpiChecks)
  const checksWithUnt = kpiChecks.filter(c => c.untracedRate != null)
  const avgUntracedRate = checksWithUnt.length
    ? Math.round(checksWithUnt.reduce((s,c)=>s+(c.untracedRate||0),0)/checksWithUnt.length*10)/10 : null
  const totalUntracedUnits = checksWithUnt.reduce((s,c) => s + (c.totalDiscrepancyUnits||0), 0)

  // unique months จาก checks (สำหรับ dropdown)
  const availableMonths = [...new Set(checks.map(c => {
    const ts = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
    return ts.toISOString().slice(0,7)
  }))].sort().reverse()

  /* ── Exports ── */
  const exportCompliance = () => {
    const c = calcCompliance(reportDays)
    let csv = `=== รายงานอัตราการเช็คสต็อกยา ===\r\n`
    csv += `ช่วงเวลา: ${reportDays} วันย้อนหลัง\r\n`
    csv += `Bangkok Hospital Chanthaburi : ICU-B\r\n\r\n`
    csv += `สรุป:\r\n`
    csv += `เป้าหมาย,${c.expected} ครั้ง (${c.days} วัน × 2 เวร)\r\n`
    csv += `เช็คจริง,${c.actual} ครั้ง\r\n`
    csv += `อัตราการเช็ค,${c.rate}%\r\n`
    if (avgDur !== null) csv += `ระยะเวลาเฉลี่ย,${avgDur} นาที\r\n`
    csv += `\r\nรายวัน:\r\nวันที่,Day Shift,Night Shift,เช็คแล้ว (จาก 2)\r\n`
    c.daily.forEach(d => {
      csv += `"${d.thDate}","${d.day?'✓':'✗'}","${d.night?'✓':'✗'}",${d.total}\r\n`
    })
    exportCSV('Compliance', csv)
  }
  const exportStock = () => {
    let csv = 'ชื่อยา,สต็อก,par,ขั้นต่ำ,หน่วย,FEFO EXP,สถานะ\r\n'
    dl.forEach(d => {
      const s = d.stock <= 0 ? 'หมด' : d.stock <= d.min ? 'Low' : 'ปกติ'
      csv += `"${d.name}",${d.stock},${d.par},${d.min},${d.unit},${d.fefoExp ? fmtMY(d.fefoExp) : ''},${s}\r\n`
    })
    exportCSV('Stock', csv)
  }
  const exportLots = () => {
    let csv = 'ชื่อยา,วัน EXP,เหลือ(วัน),จำนวน,หน่วย,สถานะ EXP,FEFO,ฝากใช้,วันที่รับเข้า\r\n'
    const sortedLots = [...lots].filter(l=>l.qty>0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    sortedLots.forEach(l => {
      const d = dl.find(x => x.id == l.drugId); if (!d) return
      if (l.expiry === '2099-12-31') { csv += `"${d.name}","ไม่มี EXP","",${l.qty},${d.unit},"","","",""\r\n`; return }
      const fefoLots = lotsOf(d.id)
      const isFefo = fefoLots.length && fefoLots[0].docId === l.docId ? 'ใช่' : ''
      const dl2 = daysLeft(l.expiry)
      const status = dl2 <= 0 ? 'หมดอายุ' : dl2 < 211 && dl2 > 0 ? 'เกินเวลาแลก' : dl2 >= 211 && dl2 <= 220 ? 'ถึงเวลาแลก' : dl2 <= (d.alertDays||30) ? 'ใกล้หมดอายุ' : 'ปกติ'
      const loanedStr = l.loaned ? 'ใช่' : ''
      const tsStr = fmtDsafe(l.ts)
      csv += `"${d.name}","${fmtMY(l.expiry)}",${dl2},${l.qty},${d.unit},"${status}","${isFefo}","${loanedStr}","${tsStr}"\r\n`
    })
    exportCSV('Lots', csv)
  }
  const exportWithdrawals = () => {
    const [wy, wm] = withdrawalMonth.split('-').map(Number)
    const filtered = withdrawalMonth === 'all' ? withdrawals : withdrawals.filter(w => {
      const ts = w.ts?.toDate ? w.ts.toDate() : new Date(w.ts)
      return ts.getFullYear() === wy && ts.getMonth()+1 === wm
    })
    const mLabel = withdrawalMonth === 'all' ? 'ทุกเดือน'
      : new Date(wy, wm-1, 1).toLocaleDateString('th-TH', { month:'long', year:'numeric' })

    // ── Section 1: Summary ──
    const totalUses    = filtered.length
    const returned     = filtered.filter(w => w.returned).length
    const pending      = filtered.filter(w => !w.returned && w.usage_type !== 'Missing_Unknown').length
    const drugUsage    = {}
    filtered.forEach(w => { drugUsage[w.drugName] = (drugUsage[w.drugName]||0) + w.qty })
    const topDrugs = Object.entries(drugUsage).sort((a,b)=>b[1]-a[1]).slice(0,5)

    let csv = `Bangkok Hospital Chanthaburi : ICU-B\r\n`
    csv += `=== ประวัติการใช้ยา/Return : ${mLabel} ===\r\n\r\n`
    csv += `=== สรุปทั่วไป ===\r\n`
    csv += `จำนวนครั้งใช้ยาทั้งหมด,${totalUses}\r\n`
    csv += `Return แล้ว,${returned}\r\n`
    csv += `ยังค้าง Return,${pending}\r\n`
    csv += `\r\nยาที่ใช้บ่อยสุด 5 อันดับ (หน่วย):\r\n`
    csv += `ชื่อยา,จำนวนหน่วยรวม\r\n`
    topDrugs.forEach(([name, qty]) => { csv += `"${name}",${qty}\r\n` })

    // ── Section 2: Usage Type Breakdown (ใหม่!) ──
    const normal    = filtered.filter(w => !w.usage_type || w.usage_type === 'Normal')
    const emergency = filtered.filter(w => w.usage_type === 'Emergency')
    const missTrack = filtered.filter(w => w.usage_type === 'Missing_Tracked')
    const missUnk   = filtered.filter(w => w.usage_type === 'Missing_Unknown')
    const smartTS   = filtered.filter(w => w.usage_type === 'Emergency' && w.pending_sync_id)

    csv += `\r\n=== สรุปตามประเภทการใช้ยา (Usage Type) ===\r\n`
    csv += `ประเภท,จำนวนครั้ง,จำนวนหน่วย,%\r\n`
    const typeRows = [
      ['Stock Use', normal.length, normal.reduce((s,w)=>s+w.qty,0)],
      ['Emergency Use', emergency.length, emergency.reduce((s,w)=>s+w.qty,0)],
      ['Missing — ทวนสอบได้', missTrack.length, missTrack.reduce((s,w)=>s+w.qty,0)],
      ['Missing — ทวนสอบไม่ได้', missUnk.length, missUnk.reduce((s,w)=>s+w.qty,0)],
    ]
    typeRows.forEach(([label, cnt, qty]) => {
      const pct = totalUses > 0 ? (cnt/totalUses*100).toFixed(1) : 0
      csv += `"${label}",${cnt},${qty},${pct}%\r\n`
    })

    // ── Section 3: Smart Timestamp Statistics (ใหม่!) ──
    const smartNormal = normal.length
    const smartEmg    = emergency.length
    csv += `\r\n=== สถิติ Emergency Use vs Stock Use ===\r\n`
    csv += `Stock Use,${smartNormal} ครั้ง\r\n`
    csv += `Emergency Use,${smartEmg} ครั้ง\r\n`
    csv += `สัดส่วน Emergency,${totalUses > 0 ? (smartEmg/totalUses*100).toFixed(1) : 0}%\r\n`
    if (emergency.length > 0) {
      const recon_times = emergency.filter(w => w.reconciliation_time_minutes != null)
      if (recon_times.length > 0) {
        const avgRecon = Math.round(recon_times.reduce((s,w)=>s+(w.reconciliation_time_minutes||0),0)/recon_times.length)
        csv += `เวลาเฉลี่ยในการเติมยาคืน (Reconciliation),${avgRecon} นาที\r\n`
        const over2h = recon_times.filter(w => (w.reconciliation_time_minutes||0) > 120)
        csv += `เกิน 2 ชม.,${over2h.length} ครั้ง (${recon_times.length > 0 ? (over2h.length/recon_times.length*100).toFixed(0) : 0}%)\r\n`
      }
    }

    // ── Section 4: Missing Drug Detail (ใหม่!) ──
    const missingAll = filtered.filter(w => w.usage_type === 'Missing_Tracked' || w.usage_type === 'Missing_Unknown')
    if (missingAll.length > 0) {
      csv += `\r\n=== รายละเอียดยาที่หาย ===\r\n`
      csv += `วันเวลา,พยาบาล,ชื่อยา,จำนวน,เตียง,ประเภท,แหล่งที่มา,หมายเหตุ\r\n`
      missingAll.sort((a,b) => {
        const ta = a.ts?.toDate ? a.ts.toDate() : new Date(a.ts)
        const tb = b.ts?.toDate ? b.ts.toDate() : new Date(b.ts)
        return tb - ta
      }).forEach(w => {
        const ts = w.ts?.toDate ? w.ts.toDate() : new Date(w.ts)
        const tsStr = fmtDTsafe(w.ts)
        const typeTh = w.usage_type === 'Missing_Tracked' ? 'ทวนสอบได้ (Missing_Tracked)' : 'ทวนสอบไม่ได้ (Missing_Unknown)'
        const source = w.note?.includes('Stock Count') ? 'Stock Count' : 'Quick Use / อื่นๆ'
        csv += `"${tsStr}","${w.nurse}","${w.drugName}",${w.qty},"${w.bed}","${typeTh}","${source}","${w.note||''}"\r\n`
      })
      // สรุปรายยาที่หายบ่อย
      const missingByDrug = {}
      missingAll.forEach(w => {
        if (!missingByDrug[w.drugName]) missingByDrug[w.drugName] = { tracked: 0, unknown: 0, qty: 0 }
        if (w.usage_type === 'Missing_Tracked') missingByDrug[w.drugName].tracked += w.qty
        else missingByDrug[w.drugName].unknown += w.qty
        missingByDrug[w.drugName].qty += w.qty
      })
      csv += `\r\nสรุปยาที่หายบ่อย:\r\n`
      csv += `ชื่อยา,ทวนสอบได้ (หน่วย),ทวนสอบไม่ได้ (หน่วย),รวม\r\n`
      Object.entries(missingByDrug).sort((a,b)=>b[1].qty-a[1].qty).forEach(([name, d]) => {
        csv += `"${name}",${d.tracked},${d.unknown},${d.qty}\r\n`
      })
    } else {
      csv += `\r\n=== รายละเอียดยาที่หาย ===\r\nไม่มีรายการยาหายในช่วงเวลานี้\r\n`
    }

    // ── Section 5: Expiry Snapshot ──
    csv += `\r\n=== Expiry Snapshot (ณ เวลา export) ===\r\n`
    csv += `ชื่อยา,EXP,เหลือ (วัน),จำนวน,หน่วย,สถานะ\r\n`
    const snapLots = [...lots]
      .filter(l => l.qty > 0 && l.expiry !== '2099-12-31' && !l.loaned)
      .sort((a,b) => new Date(a.expiry)-new Date(b.expiry))
    snapLots.forEach(l => {
      const d = dl.find(x => x.id == l.drugId); if (!d) return
      const dLeft = daysLeft(l.expiry)
      const status = dLeft <= 0 ? 'หมดอายุ'
        : dLeft < 211 ? 'เกินเวลาแลก'
        : dLeft <= 220 ? 'ถึงเวลาแลก'
        : dLeft <= (d.alertDays||30) ? 'ใกล้หมดอายุ'
        : ''
      if (!status) return
      csv += `"${d.name}","${fmtMY(l.expiry)}",${dLeft},${l.qty},"${d.unit}","${status}"\r\n`
    })
    const expiredLots  = snapLots.filter(l => daysLeft(l.expiry) <= 0)
    const overdueLots  = snapLots.filter(l => { const d = daysLeft(l.expiry); return d > 0 && d < 211 })
    const dueLots      = snapLots.filter(l => { const d = daysLeft(l.expiry); return d >= 211 && d <= 220 })
    csv += `\r\nสรุป Expiry:\r\n`
    csv += `หมดอายุ (lot),${expiredLots.length}\r\nเกินเวลาแลก (lot),${overdueLots.length}\r\nถึงเวลาแลก (lot),${dueLots.length}\r\n`

    // ── Section 6: Removal history ──
    const filteredRemovals = withdrawalMonth === 'all' ? removals : removals.filter(r => {
      const ts = r.ts?.toDate ? r.ts.toDate() : new Date(r.ts)
      return ts.getFullYear() === wy && ts.getMonth()+1 === wm
    })
    if (filteredRemovals.length > 0) {
      csv += `\r\n=== รายการยาที่ตัดออก : ${mLabel} ===\r\n`
      csv += `ชื่อยา,จำนวน,EXP,เหตุผล,เหลือก่อน EXP (วัน),ฝากใช้,พยาบาล,วันที่บันทึก\r\n`
      filteredRemovals.forEach(r => {
        const tsStr = fmtDsafe(r.ts)
        const reasonTh = r.reason==='expired'?'หมดอายุ':r.reason==='returned_to_pharmacy'?'ส่งคืนห้องยา':r.reason==='data_correction'?'แก้ไขข้อมูล':'เสื่อมสภาพ'
        const expStr = r.expiry==='2099-12-31'?'ไม่มี':fmtMY(r.expiry)
        csv += `"${r.drugName}",${r.qty},"${expStr}","${reasonTh}",${r.daysBeforeExp??''},"${r.loaned?'ใช่':''}","${r.nurse||''}","${tsStr}"\r\n`
      })
      const missedInMonth = filteredRemovals.filter(r=>r.missedExchange).length
      const totalInMonth  = filteredRemovals.length
      const rateInMonth   = totalInMonth > 0 ? Math.round(missedInMonth/totalInMonth*1000)/10 : 0
      csv += `\r\nMissed Timely Exchange Rate (${mLabel}),${rateInMonth}%\r\n`
    }

    // ── Section 7: Detailed withdrawal log (เพิ่ม usage_type column) ──
    csv += `\r\n=== รายละเอียดการใช้ยาทุกรายการ ===\r\n`
    csv += `วันเวลา,พยาบาล,ยา,จำนวน,เตียง,ประเภทการใช้,หมายเหตุ,Return แล้ว,EXP ที่คืน,ตำแหน่งวาง\r\n`
    filtered.forEach(w => {
      let pos = ''
      if (w.returned && w.retExp) {
        const pa = calcPutaway(w.drugId, w.retExp)
        pos = pa.position === 'front' ? 'หน้าสุด' : 'หลังสุด'
      }
      const usageTypeTh = {
        'Normal': 'Quick Use',
        'Emergency': 'Smart Timestamp',
        'Missing_Tracked': 'ยาหาย (ทวนสอบได้)',
        'Missing_Unknown': 'ยาหาย (ทวนสอบไม่ได้)'
      }[w.usage_type] || 'Quick Use'
      csv += `"${fmtDTsafe(w.ts)}","${w.nurse}","${w.drugName}",${w.qty},"${w.bed}","${usageTypeTh}","${w.note||''}","${w.returned?'ใช่':'ไม่'}","${w.retExp?fmtMY(w.retExp):''}","${pos}"\r\n`
    })
    const fname = withdrawalMonth === 'all' ? 'Withdrawals_All' : `Withdrawals_${withdrawalMonth}`
    exportCSV(fname, csv)
  }
  const exportMonthly = () => {
    const [ry, rm] = reportMonth.split('-').map(Number)
    const mLabel = new Date(ry, rm-1, 1).toLocaleDateString('th-TH', { month:'long', year:'numeric' })
    // หา snapshot ของเดือนที่เลือก
    const snap = expirySnapshots.find(s => s.monthKey === reportMonth)
    // กรอง removals ตามเดือน
    const monthRemovals = removals.filter(r => {
      const ts = r.ts?.toDate ? r.ts.toDate() : new Date(r.ts)
      return ts.getFullYear() === ry && ts.getMonth()+1 === rm
    })
    // กรอง checks ตามเดือน
    const monthChecks = checks.filter(c => {
      const ts = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
      return ts.getFullYear() === ry && ts.getMonth()+1 === rm
    })
    // KPI จาก monthChecks
    const mCompTotal = monthChecks.length
    const mDefChecks = monthChecks.filter(c => c.deficiencyRate != null)
    const mAvgDef = mDefChecks.length ? Math.round(mDefChecks.reduce((s,c)=>s+(c.deficiencyRate||0),0)/mDefChecks.length*10)/10 : null
    const mDurChecks = monthChecks.filter(c => c.durationMin != null)
    const mAvgDur = mDurChecks.length ? Math.round(mDurChecks.reduce((s,c)=>s+c.durationMin,0)/mDurChecks.length*10)/10 : null
    const mUntChecks = monthChecks.filter(c => c.untracedRate != null)
    const mAvgUnt = mUntChecks.length ? Math.round(mUntChecks.reduce((s,c)=>s+(c.untracedRate||0),0)/mUntChecks.length*10)/10 : null
    const mMissed = monthRemovals.filter(r => r.missedExchange).length
    const mRetInTime = monthRemovals.filter(r => r.reason==='returned_to_pharmacy' && r.daysBeforeExp > 0).length
    const mMissedRate = (mMissed+mRetInTime)>0 ? Math.round(mMissed/(mMissed+mRetInTime)*1000)/10 : null
    // withdrawals ของเดือนนั้น
    const monthWithdrawals = withdrawals.filter(w => {
      const ts = w.ts?.toDate ? w.ts.toDate() : new Date(w.ts)
      return ts.getFullYear() === ry && ts.getMonth()+1 === rm
    })
    const snapNote = snap ? `(Snapshot: ${snap.monthKey})` : '(ไม่มี Snapshot — ใช้ข้อมูล ณ ปัจจุบัน)'
    let csv = `=== Term-Ya Monthly Report ===\r\n${mLabel}  ${snapNote}\r\nBangkok Hospital Chanthaburi : ICU-B\r\n\r\n`
    // ── ส่วนสต็อก ──
    csv += 'ชื่อยา,สต็อก,par,FEFO EXP,สถานะ\r\n'
    if (snap?.allDrugStocks?.length) {
      snap.allDrugStocks.forEach(d => {
        csv += `"${d.name}",${d.stock},${d.par},"${d.fefoExp ? fmtMY(d.fefoExp) : ''}",${d.status}\r\n`
      })
    } else {
      dl.forEach(d => {
        const s = d.stock <= 0 ? 'หมด' : d.stock <= d.min ? 'Low' : 'ปกติ'
        csv += `"${d.name}",${d.stock},${d.par},"${d.fefoExp ? fmtMY(d.fefoExp) : ''}",${s}\r\n`
      })
    }
    // ── ยาใกล้หมดอายุ ──
    csv += '\r\nยาใกล้หมดอายุ (ตาม alertDays ต่อยา):\r\nชื่อยา,EXP,เหลือ(วัน),แจ้งเตือนที่,จำนวน,ฝากใช้\r\n'
    if (snap?.nearExpiryLots?.length) {
      snap.nearExpiryLots.forEach(l => {
        csv += `"${l.drugName}","${fmtMY(l.expiry)}",${l.daysLeft},${l.alertDays},${l.qty},"${l.loaned?'ใช่':''}"\r\n`
      })
    } else {
      lots.filter(l => {
        if (!l.qty || l.expiry === '2099-12-31') return false
        const d = dl.find(x => x.id == l.drugId); if (!d) return false
        const dd = daysLeft(l.expiry)
        return dd >= 0 && dd <= (d.alertDays || 30)
      }).sort((a,b) => new Date(a.expiry)-new Date(b.expiry)).forEach(l => {
        const d = dl.find(x => x.id == l.drugId); if (!d) return
        const dd = daysLeft(l.expiry)
        csv += `"${d.name}","${fmtMY(l.expiry)}",${dd},${d.alertDays||30},${l.qty},"${l.loaned?'ใช่':''}"\r\n`
      })
    }
    // ── ยาที่ตัดออก (กรองตามเดือน) ──
    if (monthRemovals.length > 0) {
      csv += `\r\nรายการยาที่ตัดออก : ${mLabel} (${monthRemovals.length} รายการ):\r\n`
      csv += `ชื่อยา,จำนวน,EXP,เหตุผล,เหลือก่อน EXP (วัน),ฝากใช้,พยาบาล,วันที่บันทึก\r\n`
      monthRemovals.forEach(r => {
        const ts = fmtDsafe(r.ts)
        const reasonTh = r.reason==='expired'?'หมดอายุ':r.reason==='returned_to_pharmacy'?'ส่งคืนห้องยา':r.reason==='data_correction'?'แก้ไขข้อมูล':'เสื่อมสภาพ'
        const loaned = r.loaned ? 'ใช่' : ''
        const expStr = r.expiry==='2099-12-31'?'ไม่มี':fmtMY(r.expiry)
        csv += `"${r.drugName}",${r.qty},"${expStr}","${reasonTh}",${r.daysBeforeExp??''},"${loaned}","${r.nurse||''}","${ts}"\r\n`
      })
    }
    // ── KPI ──
    csv += `\r\nตัวชี้วัดงานวิจัย : ${mLabel}\r\n`
    csv += `จำนวน session ที่เช็คยา,${mCompTotal} ครั้ง\r\n`
    if (mAvgDef!=null)    csv += `Stock Deficiency Rate (เฉลี่ย),${mAvgDef}%\r\n`
    if (mAvgDur!=null)    csv += `ระยะเวลาเฉลี่ยต่อ session,${mAvgDur} นาที\r\n`
    if (mAvgUnt!=null)    csv += `Untraced Drug Loss Rate (เฉลี่ย),${mAvgUnt}%\r\n`
    if (mMissedRate!=null) csv += `Missed Timely Exchange Rate,${mMissedRate}% (expired ${mMissed} / คืนทัน ${mRetInTime} lot)\r\n`
    csv += `รวมการใช้ยาสต็อก : ${mLabel},${monthWithdrawals.length} ครั้ง\r\n`
    exportCSV(`Monthly_${reportMonth}`, csv)
  }

  /* ── Drug Count Matrix export ── */
  const exportDrugCountMatrix = () => {
    const checksWithCounts = checks.filter(c => c.drugCounts && c.drugCounts.length > 0)
    if (!checksWithCounts.length) { alert('ยังไม่มีข้อมูล (ต้องทำ Stock Count ก่อน)'); return }
    // เรียง session จากเก่าสุดไปใหม่สุด (ascending)
    const sorted = [...checksWithCounts].sort((a, b) => {
      const ta = a.ts?.toDate ? a.ts.toDate() : new Date(a.ts)
      const tb = b.ts?.toDate ? b.ts.toDate() : new Date(b.ts)
      return ta - tb
    })
    // สร้าง unique drug list จาก checks
    const drugMap = {}
    sorted.forEach(c => c.drugCounts.forEach(d => { drugMap[d.id] = d.name }))
    const drugIds = Object.keys(drugMap)
    // header row 1: วันที่ + เวร, row 2: ชื่อพยาบาล
    const dateHeaders = sorted.map(c => {
      const ts = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
      const dateStr = ts.toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit',year:'2-digit'})
      const shiftStr = (c.shift||'').includes('Day') ? 'D' : 'N'
      return `"${dateStr} ${shiftStr}"`
    })
    const nurseHeaders = sorted.map(c => `"${c.nurse||''}"`)
    const durHeaders   = sorted.map(c => c.durationMin != null ? `"${fmtDuration(c.durationMin)}"` : '""')
    let csv = `ชื่อยา,par,min,${dateHeaders.join(',')}\r\n`
    csv += `,,,${nurseHeaders.join(',')}\r\n`
    csv += `,,,${durHeaders.join(',')}\r\n`
    drugIds.forEach(id => {
      const name = drugMap[id]
      // get par/min from latest check
      const latestEntry = sorted.map(c => c.drugCounts.find(d => String(d.id)===String(id))).filter(Boolean).pop()
      const par = latestEntry?.par ?? ''
      const min = latestEntry?.min ?? ''
      const row = sorted.map(c => {
        const entry = (c.drugCounts||[]).find(d => String(d.id)===String(id))
        return entry !== undefined ? entry.counted : ''
      })
      csv += `"${name}",${par},${min},${row.join(',')}\r\n`
    })
    exportCSV('DrugCountMatrix', csv)
  }

  /* ── Monthly daily log ── */
  const buildMonthLog = (ym) => {
    const [y, m] = ym.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const rows = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const daySess  = checks.filter(c => {
        const ts = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
        return shiftDateKey(ts, c.shift) === dateKey && (c.shift||'').includes('Day')
      })
      const nightSess = checks.filter(c => {
        const ts = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
        return shiftDateKey(ts, c.shift) === dateKey && !(c.shift||'').includes('Day')
      })
      const thDate = new Date(dateKey).toLocaleDateString('th-TH', { day:'2-digit', month:'2-digit' })
      const dow = new Date(dateKey).toLocaleDateString('th-TH', { weekday:'short' })
      rows.push({ dateKey, thDate, dow, d, daySess, nightSess,
        dayDone: daySess.length > 0, nightDone: nightSess.length > 0 })
    }
    const total   = rows.length * 2
    const actual  = rows.reduce((s,r) => s + (r.dayDone?1:0) + (r.nightDone?1:0), 0)
    const rate    = total > 0 ? Math.round(actual/total*1000)/10 : 0
    return { rows, total, actual, rate, y, m, daysInMonth }
  }

  const exportCombinedMonthLog = () => {
    const log = buildMonthLog(logMonth)
    const [y,m] = logMonth.split('-').map(Number)
    const mName = new Date(y,m-1,1).toLocaleDateString('th-TH',{month:'long',year:'numeric'})
    const totalDrugs = log.rows.flatMap(r=>[...r.daySess,...r.nightSess])
      .find(c=>c.totalDrugs)?.totalDrugs || 0

    // ── Section 1: Monthly Summary ──
    let csv = `Bangkok Hospital Chanthaburi : ICU-B\r\n`
    csv += `=== รายงานประจำเดือน : ${mName} ===\r\n\r\n`
    csv += `=== สรุปรายเดือน ===\r\n`
    csv += `เดือน,Compliance Rate (%),เช็คจริง,เป้าหมาย,`
    csv += `Avg Stock Deficiency Rate (%),ยาขาด (ชนิด/เดือน),หน่วยขาดรวม,`
    csv += `Avg Untraced Drug Loss Rate (%),ยาหาย (ชนิด/เดือน),หน่วยหายรวม\r\n`

    const monthChecks = checks.filter(c => {
      const ts = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
      return ts.toISOString().slice(0,7) === logMonth
    })
    const mDefChecks = monthChecks.filter(c=>c.deficiencyRate!=null)
    const mAvgDef = mDefChecks.length
      ? Math.round(mDefChecks.reduce((s,c)=>s+(c.deficiencyRate||0),0)/mDefChecks.length*10)/10 : 0
    const mDefSpecies = mDefChecks.reduce((s,c)=>s+(c.deficientCount||0),0)
    const mDefUnits = mDefChecks.reduce((s,c)=>{
      return s+(c.deficientDrugs||[]).reduce((su,d)=>su+Math.max(0,(d.min||0)-(d.counted||0)),0)
    },0)
    const mUntChecks = monthChecks.filter(c=>c.untracedRate!=null)
    const mAvgUnt = mUntChecks.length
      ? Math.round(mUntChecks.reduce((s,c)=>s+(c.untracedRate||0),0)/mUntChecks.length*10)/10 : 0
    const mUntSpecies = mUntChecks.reduce((s,c)=>s+(c.discrepancyCount||0),0)
    const mUntUnits = mUntChecks.reduce((s,c)=>s+(c.totalDiscrepancyUnits||0),0)
    csv += `"${mName}",${log.rate}%,${log.actual},${log.total},`
    csv += `${mAvgDef}%,${mDefSpecies},${mDefUnits},`
    csv += `${mAvgUnt}%,${mUntSpecies},${mUntUnits}\r\n`

    // ── Section 2: Daily Log รายเวร ──
    csv += `\r\n=== บันทึกการเช็คยารายวัน ===\r\n`
    csv += `วันที่,วัน,เวร,พยาบาล,ระยะเวลา (นาที),`
    csv += `Stock Deficiency Rate (%),ยาขาด (ชนิด),ยาขาด (หน่วย),รายการยาขาด,`
    csv += `Untraced Drug Loss Rate (%),ยาหาย (ชนิด),ยาหาย (หน่วย),รายการยาหาย\r\n`

    const fmtShiftRow = (date, dow, shiftLabel, sess) => {
      if (!sess.length) {
        return `${date},${dow},${shiftLabel},,,,,,,,,,\r\n`
      }
      const c = sess[0]
      const nurse = c.nurse || ''
      const dur = c.durationMin != null ? c.durationMin : ''
      const defRate = c.deficiencyRate != null ? c.deficiencyRate+'%' : ''
      const defCount = c.deficientCount || 0
      const defUnits = (c.deficientDrugs||[]).reduce((s,d)=>s+Math.max(0,(d.min||0)-(d.counted||0)),0)
      const defList = (c.deficientDrugs||[]).map(d=>{
        const short = Math.max(0,(d.min||0)-(d.counted||0))
        return short>0 ? `${d.name}×${short}` : d.name
      }).join('; ')
      const untRate = c.untracedRate != null ? c.untracedRate+'%' : ''
      const untCount = c.discrepancyCount || 0
      const untUnits = c.totalDiscrepancyUnits || 0
      const untList = (c.discrepancyItems||[]).map(d=>`${d.name}×${d.diff}`).join('; ')
      return `${date},${dow},${shiftLabel},"${nurse}",${dur},`
        +`${defRate},${defCount},${defUnits},"${defList}",`
        +`${untRate},${untCount},${untUnits},"${untList}"\r\n`
    }

    log.rows.forEach(r => {
      csv += fmtShiftRow(r.d, r.dow, 'Day', r.daySess)
      csv += fmtShiftRow(r.d, r.dow, 'Night', r.nightSess)
    })

    csv += `\r\n=== หมายเหตุ ===\r\n`
    csv += `Stock Deficiency Rate,"จำนวนชนิดยาที่นับได้ < min / ยาทั้งหมด × 100"\r\n`
    csv += `Untraced Drug Loss Rate,"จำนวนชนิดยาที่นับได้น้อยกว่าระบบ / ยาทั้งหมด × 100"\r\n`
    csv += `หน่วยขาด/หาย,"ผลรวมจำนวนหน่วย (units) ของยาทุกชนิดที่ขาด/หาย"\r\n`
    csv += `Export โดย Term-Ya Application\r\n`

    exportCSV(`DailyLog_${logMonth}`, csv)
  }
  // keep alias for backward compat
  const exportMonthLog = exportCombinedMonthLog

  /* ── Bar chart helper ── */
  const barColor = (total) => total === 2 ? '#0F6E56' : total === 1 ? '#854F0B' : '#E24B4A'
  const rateColor = comp.rate >= 80 ? '#0F6E56' : comp.rate >= 50 ? '#854F0B' : '#A32D2D'
  const rateBg    = comp.rate >= 80 ? '#E1F5EE' : comp.rate >= 50 ? '#FAEEDA' : '#FCEBEB'
  const rateBd    = comp.rate >= 80 ? '#9FE1CB' : comp.rate >= 50 ? '#FAC775' : '#F7C1C1'

  const exportFridgeTemp = () => {
    const [fy, fm] = logMonth.split('-').map(Number)
    const mLabel = new Date(fy, fm-1, 1).toLocaleDateString('th-TH', { month:'long', year:'numeric' })
    // กรองเฉพาะ checks เดือนที่เลือก และมีข้อมูลอุณหภูมิ
    const monthChecks = checks
      .filter(c => {
        const ts = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
        return ts.getFullYear() === fy && ts.getMonth()+1 === fm && c.fridgeTemp != null
      })
      .sort((a,b) => {
        const ta = a.ts?.toDate ? a.ts.toDate() : new Date(a.ts)
        const tb = b.ts?.toDate ? b.ts.toDate() : new Date(b.ts)
        return ta - tb
      })

    let csv = `Bangkok Hospital Chanthaburi : ICU-B\r\n`
    csv += `=== บันทึกอุณหภูมิตู้เย็นยา : ${mLabel} ===\r\n`
    csv += `เกณฑ์ปกติ: 2–8 องศาเซลเซียส\r\n\r\n`

    if (!monthChecks.length) {
      csv += `ไม่มีข้อมูลอุณหภูมิในเดือนนี้\r\n`
      exportCSV(`FridgeTemp_${logMonth}`, csv)
      return
    }

    csv += `วันที่,เวร,พยาบาล,อุณหภูมิ (°C),สถานะ\r\n`
    monthChecks.forEach(c => {
      const ts = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
      const dateStr = ts.toLocaleDateString('th-TH', {
        day:'2-digit', month:'2-digit', year:'2-digit',
        hour:'2-digit', minute:'2-digit'
      })
      const status = c.fridgeTempOk === false
        ? (c.fridgeTemp > 8 ? '⚠️ สูงกว่าปกติ' : '⚠️ ต่ำกว่าปกติ')
        : '✅ ปกติ'
      csv += `"${dateStr}","${c.shift||''}","${c.nurse||''}",${c.fridgeTemp},"${status}"\r\n`
    })

    // สรุปท้าย
    const temps = monthChecks.map(c => c.fridgeTemp)
    const avg   = Math.round(temps.reduce((s,t)=>s+t,0)/temps.length * 10) / 10
    const minT  = Math.min(...temps)
    const maxT  = Math.max(...temps)
    const outCount = monthChecks.filter(c => c.fridgeTempOk === false).length

    csv += `\r\n=== สรุปประจำเดือน ===\r\n`
    csv += `จำนวนครั้งที่บันทึก,${monthChecks.length} ครั้ง\r\n`
    csv += `อุณหภูมิเฉลี่ย,${avg} °C\r\n`
    csv += `ต่ำสุด,${minT} °C\r\n`
    csv += `สูงสุด,${maxT} °C\r\n`
    csv += `ครั้งที่นอกเกณฑ์ (< 2 หรือ > 8°C),${outCount} ครั้ง\r\n`
    csv += `อัตรานอกเกณฑ์,${monthChecks.length>0?Math.round(outCount/monthChecks.length*1000)/10:0}%\r\n`

    exportCSV(`FridgeTemp_${logMonth}`, csv)
  }

  const exportExpirySnapshots = () => {
    if (!expirySnapshots.length) { alert('ยังไม่มีข้อมูล Snapshot (จะบันทึกอัตโนมัติเมื่อเปิดแอปในต้นเดือนถัดไป)'); return }
    let csv = `Bangkok Hospital Chanthaburi : ICU-B\r\n`
    csv += `=== Expiry Snapshot รายเดือน ===\r\n\r\n`
    csv += `=== สรุปทุกเดือน ===\r\n`
    csv += `เดือน,หมดอายุ (lot),เกินเวลาแลก (lot),ถึงเวลาแลก (lot)\r\n`
    const sorted = [...expirySnapshots].sort((a,b) => a.monthKey.localeCompare(b.monthKey))
    sorted.forEach(s => {
      const [y,m] = s.monthKey.split('-').map(Number)
      const mName = new Date(y,m-1,1).toLocaleDateString('th-TH',{month:'long',year:'numeric'})
      csv += `"${mName}",${s.expiredCount||0},${s.overdueCount||0},${s.dueCount||0}\r\n`
    })
    csv += `\r\n=== รายละเอียดแต่ละเดือน ===\r\n`
    sorted.forEach(s => {
      const [y,m] = s.monthKey.split('-').map(Number)
      const mName = new Date(y,m-1,1).toLocaleDateString('th-TH',{month:'long',year:'numeric'})
      csv += `\r\n--- ${mName} ---\r\n`
      csv += `ชื่อยา,EXP,เหลือ (วัน),จำนวน,หน่วย,สถานะ\r\n`
      ;(s.items||[]).sort((a,b)=>a.daysLeft-b.daysLeft).forEach(i => {
        csv += `"${i.drugName}","${fmtMY(i.expiry)}",${i.daysLeft},${i.qty},"${i.unit}","${i.status}"\r\n`
      })
    })
    exportCSV('ExpirySnapshots', csv)
  }

  const items = [
    { label: 'รายงานประจำเดือน',          desc: 'สรุป stock + ยาหมดอายุ + อัตราเช็คยา',  fn: exportMonthly },
    { label: 'สต็อกปัจจุบัน',             desc: 'ทุก drug + จำนวน + สถานะ',             fn: exportStock },
    { label: 'ข้อมูล Lot + EXP',          desc: 'ทุก lot เรียงตาม EXP',                  fn: exportLots },
    { label: 'ประวัติใช้ยา/Return',        desc: 'ตามเดือนที่เลือก + Expiry Snapshot',  fn: exportWithdrawals },
    { label: 'ประวัติเช็คยารายวัน (CSV)',    desc: 'ตามเดือนที่เลือกด้านบน',               fn: exportMonthLog },
    { label: 'จำนวนยาต่อ session (Matrix)',   desc: 'ยา × session — ทุกครั้งที่นับ',         fn: exportDrugCountMatrix },
    { label: 'Expiry Snapshot รายเดือน',      desc: 'ยาหมดอายุ/เกินเวลาแลก — บันทึกอัตโนมัติทุกต้นเดือน', fn: exportExpirySnapshots },
    { label: '🌡️ อุณหภูมิตู้เย็น (รายเดือน)', desc: 'บันทึกอุณหภูมิตู้เย็นแต่ละเวร ตามเดือนที่เลือก',      fn: exportFridgeTemp },
  ]

  return (
    <>
      {/* Compliance Card */}
      <div className="card" style={{ background: rateBg, borderColor: rateBd }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
          <div style={{ fontSize:13, fontWeight:500, color: rateColor }}>อัตราการเช็คสต็อก</div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {[7,14,30,90].map(d => (
              <button key={d} onClick={() => setReportDays(d)}
                style={{ padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit',
                  background: reportDays===d ? rateColor : 'rgba(0,0,0,.06)',
                  color: reportDays===d ? '#fff' : rateColor,
                  border: `0.5px solid ${reportDays===d ? rateColor : 'transparent'}` }}>
                {d}ว
              </button>
            ))}
          </div>
        </div>

        {/* Big rate number */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:12, marginBottom:12 }}>
          <div style={{ fontSize:52, fontWeight:600, fontFamily:'monospace', color: rateColor, lineHeight:1 }}>
            {comp.rate}
          </div>
          <div style={{ paddingBottom:6 }}>
            <div style={{ fontSize:18, fontWeight:500, color: rateColor }}>%</div>
            <div style={{ fontSize:11, color: rateColor, marginTop:2 }}>
              {comp.actual} / {comp.expected} ครั้ง · {comp.days} วัน
            </div>
          </div>
          <div style={{ flex:1 }}/>
          <div style={{ textAlign:'right', paddingBottom:6 }}>
            <div style={{ fontSize:11, color: rateColor }}>เป้าหมาย</div>
            <div style={{ fontSize:18, fontWeight:600, fontFamily:'monospace', color: rateColor }}>2×/วัน</div>
            <div style={{ fontSize:10, color: rateColor }}>Day + Night</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height:8, background:'rgba(0,0,0,.1)', borderRadius:4, overflow:'hidden', marginBottom:12 }}>
          <div style={{ height:'100%', width:`${Math.min(100,comp.rate)}%`, background: rateColor, borderRadius:4, transition:'width .5s' }}/>
        </div>

        {/* Daily mini-bars (last 14 days) */}
        <div style={{ fontSize:10, color: rateColor, marginBottom:6, fontWeight:500 }}>
          รายวัน {comp.days > 14 ? '(14 วันล่าสุด)' : `(${comp.days} วัน)`}
        </div>
        <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:40 }}>
          {comp.daily.slice(-14).map((d,i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <div style={{ width:'100%', borderRadius:2,
                height: d.total===2?32:d.total===1?18:6,
                background: barColor(d.total), opacity:.85 }}
                title={`${d.thDate}: Day${d.day?'✓':'✗'} Night${d.night?'✓':'✗'}`}
              />
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:8, fontSize:10, color: rateColor, flexWrap:'wrap' }}>
          <span>🟩 ครบ 2 เวร</span>
          <span>🟨 1 เวร</span>
          <span>🟥 ไม่มีเลย</span>
        </div>

        {avgDur !== null && (
          <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(0,0,0,.06)', borderRadius:8, fontSize:12, color: rateColor }}>
            ⏱ เวลาเฉลี่ยต่อครั้ง: <b>{avgDur} นาที</b>
            {checksWithDur.length > 0 && ` (จาก ${checksWithDur.length} ครั้งที่บันทึกเวลา)`}
          </div>
        )}
      </div>

      {/* Shift breakdown */}
      <div className="card">
        <div className="slbl">สรุปตาม Shift ({reportDays} วันล่าสุด)</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {['Day','Night'].map(shift => {
            const done  = comp.daily.filter(d => shift==='Day' ? d.day : d.night).length
            const total = comp.daily.length
            const pct   = total > 0 ? Math.round(done/total*10)/10*100 : 0
            const shiftLabel = shift==='Day' ? 'Day Shift (เดย์)' : 'Night Shift (ไนท์)'
            const clr = pct >= 80 ? '#0F6E56' : pct >= 50 ? '#854F0B' : '#A32D2D'
            const bg  = pct >= 80 ? '#E1F5EE' : pct >= 50 ? '#FAEEDA' : '#FCEBEB'
            return (
              <div key={shift} style={{ background:bg, borderRadius:10, padding:'10px 12px', border:`0.5px solid ${clr}22` }}>
                <div style={{ fontSize:11, color:clr, fontWeight:500, marginBottom:4 }}>{shiftLabel}</div>
                <div style={{ fontSize:28, fontWeight:600, fontFamily:'monospace', color:clr }}>{pct.toFixed(0)}%</div>
                <div style={{ fontSize:10, color:clr }}>{done} / {total} วัน</div>
                <div style={{ height:4, background:'rgba(0,0,0,.1)', borderRadius:2, overflow:'hidden', marginTop:6 }}>
                  <div style={{ height:'100%', width:`${Math.min(100,pct)}%`, background:clr, borderRadius:2 }}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Research KPIs */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div className="slbl" style={{ marginBottom:0 }}>ตัวชี้วัดงานวิจัย (Research KPIs)</div>
          <select value={kpiMonth} onChange={e=>setKpiMonth(e.target.value)}
            style={{ fontSize:10, padding:'3px 6px', borderRadius:6, border:'0.5px solid #C8DDD4',
              background:'#F4F7F5', color:'#0F6E56', fontFamily:'inherit', cursor:'pointer' }}>
            <option value="all">ทุกเดือน</option>
            {availableMonths.map(ym => {
              const [y,mo] = ym.split('-').map(Number)
              const label = new Date(y,mo-1,1).toLocaleDateString('th-TH',{month:'short',year:'2-digit'})
              return <option key={ym} value={ym}>{label}</option>
            })}
          </select>
        </div>
        {[
          { label:'Stock Check Compliance Rate',    value: `${comp.rate}%`,                  sub:`${comp.actual}/${comp.expected} ครั้ง · ${reportDays} วัน`, clr: comp.rate>=80?'#0F6E56':'#854F0B' },
          { label:'Stock Deficiency Rate (เฉลี่ย)',  value: avgDefRate!=null?`${avgDefRate}%`:'ยังไม่มีข้อมูล', sub: avgDefRate!=null ? `${checksWithDef.length} session · ขาด ${totalDefUnits} หน่วยรวม` : 'ยาที่ขาดสต็อก ณ เวลาตรวจสอบ', clr:'#854F0B' },
          { label:'ระยะเวลาเฉลี่ยต่อ session',       value: avgDur!=null?`${avgDur} นาที`:'ยังไม่มีข้อมูล', sub:`จาก ${checksWithDur.length} session`, clr:'#185FA5' },
          { label:'Untraced Drug Loss Rate',         value: avgUntracedRate!=null?`${avgUntracedRate}%`:'ยังไม่มีข้อมูล', sub: avgUntracedRate!=null ? `${checksWithUnt.length} session · หาย ${totalUntracedUnits} หน่วยรวม` : 'ยาที่นับได้น้อยกว่าระบบ', clr:'#A32D2D', expand: kpiChecks.filter(c=>c.discrepancyItems?.length>0).slice(0,1) },
          { label:'Missed Timely Exchange Rate',     value: missedExchangeRate!=null?`${missedExchangeRate}%`:'ยังไม่มีข้อมูล', sub:`expired ${missedExchange} / คืนทันเวลา ${returnedInTime} lot`, clr:'#A32D2D' },
        ].map(k => (
          <div key={k.label}>
            <div className="row">
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500 }}>{k.label}</div>
                <div style={{ fontSize:10, color:'#8BA898' }}>{k.sub}</div>
              </div>
              <div style={{ fontSize:16, fontWeight:600, fontFamily:'monospace', color:k.clr }}>{k.value}</div>
            </div>
            {k.expand?.length > 0 && k.expand[0].discrepancyItems?.length > 0 && (
              <div style={{ background:'#FCEBEB', borderRadius:8, padding:'8px 10px', marginBottom:4, border:'0.5px solid #F7C1C1' }}>
                <div style={{ fontSize:10, color:'#A32D2D', fontWeight:500, marginBottom:4 }}>
                  🔍 รายการล่าสุด ({k.expand[0].ts?.toDate ? k.expand[0].ts.toDate().toLocaleDateString('th-TH') : ''})
                </div>
                {k.expand[0].discrepancyItems.map((d,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'2px 0', borderBottom:'0.5px solid #F7C1C1' }}>
                    <span>{d.name}</span>
                    <span style={{ fontFamily:'monospace', color:'#A32D2D' }}>นับได้ {d.counted} / ระบบ {d.system} (หาย {d.diff})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="sg" style={{ gridTemplateColumns:'repeat(2,1fr)' }}>
        <div className="sc" style={{ background:'#E1F5EE', borderColor:'#9FE1CB' }}>
          <div className="sc-n" style={{ color:'#0F6E56' }}>{dl.length}</div>
          <div className="sc-l" style={{ color:'#3B6D11' }}>รายการยา</div>
        </div>
        <div className="sc" style={{ background:'#E6F1FB', borderColor:'#B5D4F4' }}>
          <div className="sc-n" style={{ color:'#185FA5' }}>{withdrawals.length}</div>
          <div className="sc-l" style={{ color:'#185FA5' }}>บันทึกใช้ยา</div>
        </div>
        <div className="sc" style={{ background:'#FAEEDA', borderColor:'#FAC775' }}>
          <div className="sc-n" style={{ color:'#854F0B' }}>{lots.filter(l => l.qty > 0 && daysLeft(l.expiry) <= 30 && daysLeft(l.expiry) >= 0).length}</div>
          <div className="sc-l" style={{ color:'#854F0B' }}>ใกล้หมดอายุ</div>
        </div>
        <div className="sc" style={{ background:'#EEEDFE', borderColor:'#CECBF6' }}>
          <div className="sc-n" style={{ color:'#3C3489' }}>{checks.length}</div>
          <div className="sc-l" style={{ color:'#3C3489' }}>ครั้งเช็คสต็อก</div>
        </div>
      </div>

      {/* Monthly Daily Log */}
      {(() => {
        const log = buildMonthLog(logMonth)
        const [y, m] = logMonth.split('-').map(Number)
        const prevMonth = () => {
          const d = new Date(y, m-2, 1)
          setLogMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
          setExpandedDay(null)
        }
        const nextMonth = () => {
          const d = new Date(y, m, 1)
          const now = new Date()
          if (d <= now) { setLogMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); setExpandedDay(null) }
        }
        const mName = new Date(y, m-1, 1).toLocaleDateString('th-TH', { month:'long', year:'numeric' })
        const isCurrentMonth = y === new Date().getFullYear() && m === new Date().getMonth()+1
        const logRateColor = log.rate>=80?'#0F6E56':log.rate>=50?'#854F0B':'#A32D2D'
        const logRateBg    = log.rate>=80?'#E1F5EE':log.rate>=50?'#FAEEDA':'#FCEBEB'
        return (
          <div className="card" style={{ padding:'0' }}>
            {/* Header */}
            <div style={{ padding:'12px 14px 10px', borderBottom:'0.5px solid #EEF4F0' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, cursor:'pointer' }}
                onClick={() => setLogExpanded(v => !v)}>
                <div style={{ fontSize:13, fontWeight:500 }}>📅 ประวัติเช็คยารายวัน <span style={{ fontSize:10, color:'#8BA898', marginLeft:4 }}>{logExpanded ? '▲ ย่อ' : '▼ ดูรายละเอียด'}</span></div>
                <button onClick={e => { e.stopPropagation(); exportMonthLog() }} style={{ background:'#E1F5EE', border:'0.5px solid #9FE1CB', borderRadius:6, padding:'4px 10px', fontSize:11, color:'#0F6E56', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>↓ CSV</button>
              </div>
              {/* Month navigator */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <button onClick={prevMonth} style={{ background:'none', border:'0.5px solid #C8DDD4', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:13, color:'#0F6E56' }}>‹</button>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{mName}</div>
                  <div style={{ fontSize:11, color: logRateColor, fontWeight:500 }}>
                    Compliance {log.rate}% · {log.actual}/{log.total} ครั้ง
                  </div>
                </div>
                <button onClick={nextMonth} disabled={isCurrentMonth}
                  style={{ background:'none', border:'0.5px solid #C8DDD4', borderRadius:6, padding:'4px 10px', cursor: isCurrentMonth?'default':'pointer', fontSize:13, color: isCurrentMonth?'#C8DDD4':'#0F6E56' }}>›</button>
              </div>
            </div>

            {logExpanded && <>
            {/* Legend */}
            <div style={{ display:'flex', gap:10, padding:'6px 14px', background:'#F4F7F5', fontSize:10, color:'#5F7A6A', borderBottom:'0.5px solid #EEF4F0' }}>
              <span>🟩 เช็คแล้ว</span><span>🟥 ไม่ได้เช็ค</span><span>◻️ ยังไม่ถึง</span>
            </div>

            {/* Day rows */}
            {log.rows.map(r => {
              const today = new Date().toISOString().slice(0,10)
              const isFuture = r.dateKey > today
              const isToday  = r.dateKey === today
              const expanded = expandedDay === r.dateKey
              const isWeekend = [0,6].includes(new Date(r.dateKey).getDay())

              const ShiftCell = ({ done, future, sessions }) => (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                  height:36, borderRadius:6, fontSize:12, fontWeight:600,
                  background: future ? '#F4F7F5' : done ? '#E1F5EE' : '#FCEBEB',
                  color: future ? '#C8DDD4' : done ? '#0F6E56' : '#A32D2D',
                  border: `0.5px solid ${future?'#E0EAE5':done?'#9FE1CB':'#F7C1C1'}` }}>
                  {future ? '–' : done ? '✓' : '✗'}
                  {!future && sessions.length > 1 && <span style={{ fontSize:9, marginLeft:2 }}>×{sessions.length}</span>}
                </div>
              )

              const allSess = [...r.daySess, ...r.nightSess]
              const hasDeficit = allSess.some(c => (c.deficientDrugs||[]).length > 0)
              const hasUntraced = allSess.some(c => (c.discrepancyItems||[]).length > 0)

              return (
                <div key={r.dateKey}
                  style={{ borderBottom:'0.5px solid #EEF4F0', background: isToday?'#F0FAF6': isWeekend?'#FAFBFA':'#fff' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px',
                    cursor: (!isFuture && allSess.length > 0) ? 'pointer' : 'default' }}
                    onClick={() => !isFuture && allSess.length && setExpandedDay(expanded ? null : r.dateKey)}>
                    {/* Date label */}
                    <div style={{ width:46, flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight: isToday?700:500, color: isToday?'#0F6E56':'#1A2E25', fontFamily:'monospace' }}>{String(r.d).padStart(2,'0')}</div>
                      <div style={{ fontSize:9, color: isWeekend?'#A32D2D':'#8BA898' }}>{r.dow}</div>
                    </div>
                    {/* Day shift */}
                    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                      <div style={{ fontSize:9, color:'#8BA898', fontWeight:500 }}>DAY</div>
                      <ShiftCell done={r.dayDone} future={isFuture} sessions={r.daySess} />
                    </div>
                    {/* Night shift */}
                    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                      <div style={{ fontSize:9, color:'#8BA898', fontWeight:500 }}>NIGHT</div>
                      <ShiftCell done={r.nightDone} future={isFuture} sessions={r.nightSess} />
                    </div>
                    {/* Status dots */}
                    <div style={{ width:28, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                      {hasDeficit  && <span title="ยาขาดสต็อก" style={{ fontSize:11 }}>⚠️</span>}
                      {hasUntraced && <span title="ยาหาย"      style={{ fontSize:11 }}>🔍</span>}
                      {(!isFuture && allSess.length > 0) && <span style={{ fontSize:10, color:'#C8DDD4' }}>{expanded?'▲':'▼'}</span>}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expanded && (
                    <div style={{ padding:'0 14px 10px', background:'#F4F7F5', borderTop:'0.5px solid #EEF4F0' }}>
                      {allSess.map((c, ci) => {
                        const ts = c.ts?.toDate ? c.ts.toDate() : new Date(c.ts)
                        const timeStr = ts.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})
                        const isDay = (c.shift||'').includes('Day')
                        const defDrugs = c.deficientDrugs || []
                        const untraced = c.discrepancyItems || []
                        return (
                          <div key={ci} style={{ marginTop:8, background:'#fff', borderRadius:8, padding:'10px 12px', border:'0.5px solid #D8EAE0' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                              <span style={{ fontSize:11, fontWeight:600, color: isDay?'#854F0B':'#185FA5',
                                background: isDay?'#FAEEDA':'#E6F1FB', borderRadius:5, padding:'2px 7px' }}>
                                {isDay?'☀️ Day':'🌙 Night'} {timeStr}
                              </span>
                              <span style={{ fontSize:11, color:'#5F7A6A' }}>{c.nurse}</span>
                              {c.durationMin && <span style={{ fontSize:10, color:'#8BA898', marginLeft:'auto' }}>⏱ {fmtDuration(c.durationMin)}</span>}
                            </div>
                            {defDrugs.length > 0 && (
                              <div style={{ marginBottom:4 }}>
                                <div style={{ fontSize:10, color:'#854F0B', fontWeight:500, marginBottom:3 }}>⚠️ ยาที่ขาด ({defDrugs.length} รายการ)</div>
                                {defDrugs.map((drug,di) => (
                                  <div key={di} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#1A2E25', padding:'2px 0', borderBottom:'0.5px solid #EEF4F0' }}>
                                    <span>{drug.name}</span>
                                    <span style={{ color:'#A32D2D', fontFamily:'monospace' }}>นับได้ {drug.counted} / min {drug.min}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {untraced.length > 0 && (
                              <div>
                                <div style={{ fontSize:10, color:'#A32D2D', fontWeight:500, marginBottom:3 }}>🔍 ยาที่นับได้น้อยกว่าระบบ ({untraced.length} รายการ)</div>
                                {untraced.map((drug,di) => (
                                  <div key={di} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#1A2E25', padding:'2px 0', borderBottom:'0.5px solid #EEF4F0' }}>
                                    <span>{drug.name}</span>
                                    <span style={{ color:'#A32D2D', fontFamily:'monospace' }}>หาย {drug.diff} {''}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {defDrugs.length===0 && untraced.length===0 && (
                              <div style={{ fontSize:11, color:'#0F6E56' }}>✅ ไม่พบรายการผิดปกติ</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            </>}
            {/* Month summary footer */}
            <div style={{ padding:'10px 14px', background: logRateBg, borderTop:'0.5px solid #EEF4F0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:11, color: logRateColor }}>
                รวมเดือนนี้: เช็ค <b>{log.actual}</b> / เป้า <b>{log.total}</b> ครั้ง
              </div>
              <div style={{ fontSize:16, fontWeight:700, fontFamily:'monospace', color: logRateColor }}>{log.rate}%</div>
            </div>
          </div>
        )
      })()}

      {/* Downloads */}
      <div className="card">
        <div className="slbl">ดาวน์โหลดข้อมูล (CSV)</div>
        {/* Report month picker */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0 10px', borderBottom:'0.5px solid #EEF4F0', marginBottom:4 }}>
          <div style={{ fontSize:11, color:'#5F7A6A', flexShrink:0 }}>เดือนสำหรับ รายงานประจำเดือน:</div>
          <select value={reportMonth} onChange={e=>setReportMonth(e.target.value)}
            style={{ fontSize:11, padding:'3px 6px', borderRadius:6, border:'0.5px solid #C8DDD4',
              background:'#F4F7F5', color:'#0F6E56', fontFamily:'inherit', cursor:'pointer', flex:1 }}>
            {expirySnapshots.length > 0
              ? [...expirySnapshots].sort((a,b)=>b.monthKey.localeCompare(a.monthKey)).map(s => {
                  const [y,mo] = s.monthKey.split('-').map(Number)
                  const lbl = new Date(y,mo-1,1).toLocaleDateString('th-TH',{month:'long',year:'numeric'})
                  return <option key={s.monthKey} value={s.monthKey}>{lbl} ✅</option>
                })
              : <option value={reportMonth}>ยังไม่มี Snapshot</option>
            }
          </select>
        </div>
        {!expirySnapshots.find(s=>s.monthKey===reportMonth) && (
          <div style={{ fontSize:10, color:'#B8860B', padding:'2px 0 8px', marginBottom:4 }}>
            ⚠️ ไม่มี Snapshot ของเดือนนี้ — จะใช้ข้อมูล ณ ปัจจุบันแทน
          </div>
        )}
        {/* Withdrawal month picker */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0 10px', borderBottom:'0.5px solid #EEF4F0', marginBottom:8 }}>
          <div style={{ fontSize:11, color:'#5F7A6A', flexShrink:0 }}>เดือนสำหรับ ประวัติใช้ยา/Return:</div>
          <select value={withdrawalMonth} onChange={e=>setWithdrawalMonth(e.target.value)}
            style={{ fontSize:11, padding:'3px 6px', borderRadius:6, border:'0.5px solid #C8DDD4',
              background:'#F4F7F5', color:'#0F6E56', fontFamily:'inherit', cursor:'pointer', flex:1 }}>
            <option value="all">ทุกเดือน</option>
            {[...new Set(withdrawals.map(w => {
              const ts = w.ts?.toDate ? w.ts.toDate() : new Date(w.ts)
              return ts.toISOString().slice(0,7)
            }))].sort().reverse().map(ym => {
              const [y,mo] = ym.split('-').map(Number)
              const label = new Date(y,mo-1,1).toLocaleDateString('th-TH',{month:'long',year:'numeric'})
              return <option key={ym} value={ym}>{label}</option>
            })}
          </select>
        </div>
        {items.map(item => (
          <div key={item.label} className="row" style={{ cursor:'pointer' }} onClick={item.fn}>
            <div style={{ fontSize:18 }}>📄</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500 }}>{item.label}</div>
              <div style={{ fontSize:11, color:'#8BA898' }}>{item.desc}</div>
            </div>
            <div style={{ fontSize:16, color:'#0F6E56' }}>↓</div>
          </div>
        ))}
      </div>
      <div className="info">CSV รองรับภาษาไทยใน Excel · Firebase เก็บข้อมูลไม่จำกัดปี</div>
    </>
  )
}

/* ═══ SETTING ═══ */
function Setting({ drugs, nurses, db, locationDirs, saveLocDir }) {
  const [editId, setEditId]     = useState(null)
  const [form, setForm]         = useState({ name:'', unit:'amp', par:1, min:1, groupId:'G1', highAlert:false, controlled:false, singleStock:false, alertDays:30, fullDateExp:false, shelfDirectionOverride:'inherit' })
  const [drugSearch, setDrugSearch] = useState('')
  const [newNurse, setNewNurse] = useState('')
  const [saving, setSaving]     = useState(false)
  const [ok, setOk]             = useState('')
  // Location management
  const [locations, setLocations]   = useState(STORAGE_GROUPS)
  const [newLocName, setNewLocName] = useState('')
  const [newLocIcon, setNewLocIcon] = useState('📦')
  const [settingTab, setSettingTab] = useState('drugs') // drugs | nurses | locations
  const [qrDrug, setQrDrug] = useState(null)

  const resetForm = () => setForm({ name:'', unit:'amp', par:1, min:1, groupId:'G1', highAlert:false, controlled:false, singleStock:false, alertDays:30, fullDateExp:false, shelfDirectionOverride:'inherit' })

  const openEdit = d => {
    setEditId(d.docId)
    setForm({ name:d.name, unit:d.unit, par:d.par, min:d.min, groupId:d.groupId,
      highAlert:d.highAlert, controlled:d.controlled, singleStock:d.singleStock||false,
      alertDays:d.alertDays||30, fullDateExp:d.fullDateExp||false,
      shelfDirectionOverride:d.shelfDirectionOverride||'inherit' })
    window.scrollTo(0,0)
  }
  const saveDrug = async () => {
    setSaving(true)
    if (editId) {
      await updateDoc(doc(db, 'drugs', editId), form)
      setOk('แก้ไขสำเร็จ ✓')
    } else {
      const maxId = Math.max(0, ...drugs.map(d => d.id)) + 1
      await setDoc(doc(db, 'drugs', String(maxId)), { id: maxId, ...form })
      setOk('เพิ่มยาสำเร็จ ✓')
    }
    setEditId(null); resetForm(); setSaving(false); setTimeout(() => setOk(''), 2000)
  }
  const deleteDrug = async (docId) => {
    if (!window.confirm('ลบยานี้?')) return
    await deleteDoc(doc(db, 'drugs', docId))
  }
  const addNurse = async () => {
    if (!newNurse.trim()) return
    const snap = await getDocs(collection(db, 'nurses'))
    const maxOrder = Math.max(0, ...snap.docs.map(d => d.data().order || 0)) + 1
    await addDoc(collection(db, 'nurses'), { name: newNurse.trim(), order: maxOrder })
    setNewNurse(''); setOk('เพิ่มพยาบาลสำเร็จ ✓'); setTimeout(() => setOk(''), 2000)
  }
  const deleteNurse = async (name) => {
    if (!window.confirm(`ลบ ${name}?`)) return
    const snap = await getDocs(collection(db, 'nurses'))
    const d = snap.docs.find(x => x.data().name === name)
    if (d) await deleteDoc(doc(db, 'nurses', d.id))
  }
  // Location management (in-memory + STORAGE_GROUPS mutation for session)
  const addLocation = () => {
    if (!newLocName.trim()) return
    const newId = `GX${Date.now()}`
    const colors = ['#0F6E56','#185FA5','#854F0B','#534AB7','#A32D2D','#5F5E5A']
    const color  = colors[locations.length % colors.length]
    const newLoc = { id: newId, name: newLocName.trim(), icon: newLocIcon, color }
    STORAGE_GROUPS.push(newLoc)
    setLocations([...STORAGE_GROUPS])
    setNewLocName(''); setOk('เพิ่ม Location สำเร็จ ✓ (ใช้ได้ใน session นี้)'); setTimeout(() => setOk(''), 3000)
  }

  // Drug list filtered by search
  const dq = drugSearch.toLowerCase()
  const filteredDrugs = dq ? drugs.filter(d => d.name.toLowerCase().includes(dq)) : drugs

  return (
    <>
      {ok && <div className="ok">{ok}</div>}

      {/* Tab bar */}
      <div style={{ display:'flex', gap:6, marginBottom:4 }}>
        {[['drugs','💊 ยา'],['nurses','👤 พยาบาล'],['locations','📍 Locations']].map(([t,l]) => (
          <button key={t} className={`btn${settingTab===t?' primary':''} sm`} style={{ flex:1 }} onClick={() => setSettingTab(t)}>{l}</button>
        ))}
      </div>

      {/* ── TAB: DRUGS ── */}
      {settingTab==='drugs' && (
        <>
          {/* Drug form */}
          <div className="card purple">
            <div className="slbl" style={{ color:'#3C3489' }}>{editId ? 'แก้ไขข้อมูลยา' : 'เพิ่มยาใหม่'}</div>
            <div className="lbl" style={{ color:'#3C3489' }}>ชื่อยา</div>
            <input className="inp" value={form.name} placeholder="เช่น Dopamine 250mg/5ml" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <div className="g2">
              <div>
                <div className="lbl" style={{ color:'#3C3489' }}>หน่วย</div>
                <select className="inp" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                  {['amp','vial','btl','bag','tab','cap','tube'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <div className="lbl" style={{ color:'#3C3489' }}>Location</div>
                <select className="inp" value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}>
                  {STORAGE_GROUPS.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
                </select>
              </div>
            </div>
            <div className="g2">
              <div>
                <div className="lbl" style={{ color:'#3C3489' }}>Par level</div>
                <input className="inp" type="number" min="1" value={form.par} onChange={e => setForm(f => ({ ...f, par: parseInt(e.target.value)||1 }))} />
              </div>
              <div>
                <div className="lbl" style={{ color:'#3C3489' }}>Min stock</div>
                <input className="inp" type="number" min="1" value={form.min} onChange={e => setForm(f => ({ ...f, min: parseInt(e.target.value)||1 }))} />
              </div>
            </div>

            {/* Alert settings */}
            <div style={{ marginTop:8, background:'rgba(83,74,183,.06)', borderRadius:8, padding:'10px 12px', border:'0.5px solid #CECBF6' }}>
              <div style={{ fontSize:11, fontWeight:500, color:'#3C3489', marginBottom:8 }}>การแจ้งเตือน EXP</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div className="lbl" style={{ color:'#3C3489', margin:0, width:180 }}>แจ้งเตือนก่อนหมดอายุ</div>
                <input className="inp" type="number" min="1" max="400" value={form.alertDays}
                  onChange={e => setForm(f => ({ ...f, alertDays: parseInt(e.target.value)||30 }))}
                  style={{ maxWidth:80 }} />
                <div style={{ fontSize:11, color:'#5F7A6A' }}>วัน</div>
              </div>
              <div style={{ fontSize:10, color:'#854F0B' }}>
                🔶 ถึงเวลาแลกคืน: 211–220 วันก่อน EXP (fixed ทุกยา)<br/>
                🔴 เกินเวลาแลก: น้อยกว่า 211 วัน (ยังไม่หมด)
              </div>
            </div>

            <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap' }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer' }}>
                <input type="checkbox" checked={form.highAlert} onChange={e => setForm(f => ({ ...f, highAlert: e.target.checked }))} /> 🚨 High Alert
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer' }}>
                <input type="checkbox" checked={form.controlled} onChange={e => setForm(f => ({ ...f, controlled: e.target.checked }))} /> 🔒 Controlled
              </label>
            </div>

            {/* Single-Stock */}
            <div style={{ marginTop:8, background:'#F4F7F5', borderRadius:8, padding:'10px 12px', border:`0.5px solid ${form.singleStock?'#0F6E56':'#C8DDD4'}` }}>
              <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer' }}>
                <input type="checkbox" checked={form.singleStock} onChange={e => setForm(f => ({ ...f, singleStock: e.target.checked }))} style={{ marginTop:2 }} />
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color: form.singleStock?'#0F6E56':'#1A2E25' }}>Single-Stock Item (สต็อกสูงสุด 1)</div>
                  <div style={{ fontSize:11, color:'#5F7A6A', marginTop:2 }}>ข้าม Low Stock — มีแค่ In Stock หรือ Out of Stock</div>
                </div>
              </label>
            </div>

            {/* Full Date EXP */}
            <div style={{ marginTop:8, background:'#F4F7F5', borderRadius:8, padding:'10px 12px', border:`0.5px solid ${form.fullDateExp?'#185FA5':'#C8DDD4'}` }}>
              <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer' }}>
                <input type="checkbox" checked={form.fullDateExp} onChange={e => setForm(f => ({ ...f, fullDateExp: e.target.checked }))} style={{ marginTop:2 }} />
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color: form.fullDateExp?'#185FA5':'#1A2E25' }}>ระบุวันที่แบบเต็ม (วัน/เดือน/ปี)</div>
                  <div style={{ fontSize:11, color:'#5F7A6A', marginTop:2 }}>สำหรับยาอายุสั้นที่ต้องระบุวันแน่นอน แทนการใช้เดือน/ปี</div>
                </div>
              </label>
            </div>

            {/* Shelf Direction Override */}
            <div style={{ marginTop:8, background:'#F4F7F5', borderRadius:8, padding:'10px 12px', border:'0.5px solid #C8DDD4' }}>
              <div style={{ fontSize:11, fontWeight:500, color:'#1A2E25', marginBottom:8 }}>ทิศทางชั้นวาง (FEFO Direction)</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {[
                  ['inherit', '📍 ใช้ค่าจาก Location (default)'],
                  ['fb',      '🔲 หน้า/หลังชั้น — หน้า EXP ก่อน'],
                  ['ltr',     '→  ซ้าย/ขวา — ซ้าย EXP ก่อน'],
                  ['rtl',     '←  ขวา/ซ้าย — ขวา EXP ก่อน'],
                ].map(([v, lbl]) => (
                  <label key={v} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer',
                    background: form.shelfDirectionOverride===v ? '#E1F5EE' : '#fff',
                    border: `0.5px solid ${form.shelfDirectionOverride===v ? '#9FE1CB' : '#C8DDD4'}`,
                    borderRadius:7, padding:'7px 10px', fontSize:12 }}>
                    <input type="radio" name="shelfDir" value={v} checked={form.shelfDirectionOverride===v}
                      onChange={() => setForm(f => ({ ...f, shelfDirectionOverride: v }))} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button className="btn primary" style={{ flex:1, background:'#534AB7', borderColor:'#3C3489' }}
                onClick={saveDrug} disabled={!form.name || saving}>
                {editId ? 'บันทึกการแก้ไข' : 'เพิ่มยาใหม่'}
              </button>
              {editId && <button className="btn sm" onClick={() => { setEditId(null); resetForm() }}>ยกเลิก</button>}
            </div>
          </div>

          {/* Drug list with search */}
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div className="slbl" style={{ margin:0 }}>รายการยา ({drugs.length})</div>
            </div>
            <div className="sw" style={{ marginBottom:8 }}>
              <svg className="sw-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/></svg>
              <input className="inp" style={{ paddingLeft:30 }} value={drugSearch} placeholder="ค้นหายาเพื่อแก้ไข..." onChange={e => setDrugSearch(e.target.value)} />
            </div>
            {dq ? (
              /* Search results — flat list */
              filteredDrugs.length ? filteredDrugs.map(d => (
                <div key={d.docId} className="row">
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:500 }}>{d.name}</div>
                    <div style={{ fontSize:10, color:'#8BA898' }}>
                      {STORAGE_GROUPS.find(g=>g.id===d.groupId)?.icon} {STORAGE_GROUPS.find(g=>g.id===d.groupId)?.name} · par {d.par} · min {d.min} · {d.unit}
                      {d.singleStock?' · Single':''}
                      {d.fullDateExp?' · FullDate':''}
                    </div>
                  </div>
                  <button onClick={() => setQrDrug(d)} style={{ background:'none', border:'0.5px solid #9FE1CB', color:'#0F6E56', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:12, marginRight:4 }}>📷</button>
                  <button onClick={() => { openEdit(d); setDrugSearch('') }} style={{ background:'none', border:'0.5px solid #C8DDD4', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:12, marginRight:4 }}>✏️</button>
                  <button onClick={() => deleteDrug(d.docId)} style={{ background:'none', border:'0.5px solid #F7C1C1', color:'#A32D2D', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:12 }}>🗑</button>
                </div>
              )) : <div style={{ fontSize:12, color:'#8BA898', padding:'12px 0' }}>ไม่พบยา</div>
            ) : (
              /* Grouped by location */
              STORAGE_GROUPS.map(g => {
                const gDrugs = drugs.filter(d => d.groupId === g.id)
                if (!gDrugs.length) return null
                return (
                  <div key={g.id} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:g.color }}/>
                      <div style={{ fontSize:11, fontWeight:500, color:'#5F7A6A' }}>{g.icon} {g.name}</div>
                    </div>
                    {gDrugs.map(d => (
                      <div key={d.docId} className="row">
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:500 }}>{d.name}</div>
                          <div style={{ fontSize:10, color:'#8BA898' }}>
                            par {d.par} · min {d.min} · {d.unit} · {d.alertDays||30} วัน
                            {d.singleStock?' · Single':''}{d.controlled?' · Ctrl':''}{d.fullDateExp?' · FullDate':''}
                          </div>
                        </div>
                        <button onClick={() => setQrDrug(d)} style={{ background:'none', border:'0.5px solid #9FE1CB', color:'#0F6E56', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:12, marginRight:4 }}>📷</button>
                        <button onClick={() => openEdit(d)} style={{ background:'none', border:'0.5px solid #C8DDD4', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:12, marginRight:4 }}>✏️</button>
                        <button onClick={() => deleteDrug(d.docId)} style={{ background:'none', border:'0.5px solid #F7C1C1', color:'#A32D2D', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:12 }}>🗑</button>
                      </div>
                    ))}
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {/* ── TAB: NURSES ── */}
      {settingTab==='nurses' && (
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div className="slbl" style={{ marginBottom:0 }}>รายชื่อพยาบาล ({nurses.length} คน)</div>
            {nurses.length === 0 && (
              <button className="btn sm warning" onClick={async () => {
                try {
                  const batch = writeBatch(db)
                  DEFAULT_NURSES.forEach((n, i) => {
                    batch.set(doc(db, 'nurses', String(i)), { name: n, order: i })
                  })
                  await batch.commit()
                  alert('✓ โหลดรายชื่อพยาบาลสำเร็จ')
                } catch(e) { alert('เกิดข้อผิดพลาด: ' + e.message) }
              }}>⟳ โหลดรายชื่อ</button>
            )}
          </div>
          {nurses.length === 0 && (
            <div style={{ background:'#FFF3E0', borderRadius:8, padding:'10px 12px', marginBottom:12, fontSize:12, color:'#E65100', borderLeft:'3px solid #E65100' }}>
              ⚠️ ไม่พบรายชื่อพยาบาล — กด "โหลดรายชื่อ" เพื่อโหลดรายชื่อทั้งหมด<br/>
              หรือเพิ่มชื่อพยาบาลด้านล่างได้เลย
            </div>
          )}
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <input className="inp" style={{ flex:1 }} value={newNurse} placeholder="ชื่อพยาบาลใหม่..." onChange={e => setNewNurse(e.target.value)} onKeyDown={e => e.key==='Enter' && addNurse()} />
            <button className="btn primary sm" onClick={addNurse} disabled={!newNurse.trim()}>เพิ่ม</button>
          </div>
          {nurses.map(n => (
            <div key={n} className="row">
              <div style={{ flex:1, fontSize:12 }}>👤 {n}</div>
              <button onClick={() => deleteNurse(n)} style={{ background:'none', border:'0.5px solid #F7C1C1', color:'#A32D2D', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:11 }}>ลบ</button>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: LOCATIONS ── */}
      {settingTab==='locations' && (
        <>
          <div className="info">Locations ที่เพิ่มในหน้านี้จะใช้ได้ใน session ปัจจุบัน หากต้องการถาวรให้แจ้งให้ฉันเพิ่มลงใน code ค่ะ</div>
          <div className="card">
            <div className="slbl">เพิ่ม Location ใหม่</div>
            <div className="lbl">ชื่อ Location</div>
            <input className="inp" value={newLocName} placeholder="เช่น Crash Cart, Ward Fridge..." onChange={e => setNewLocName(e.target.value)} />
            <div className="lbl" style={{ marginTop:8 }}>Icon (emoji)</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', margin:'6px 0 10px' }}>
              {['📦','🟡','🔷','🟠','💜','🗄','❄️','🧊','💊','🩺'].map(ic => (
                <button key={ic} onClick={() => setNewLocIcon(ic)}
                  style={{ fontSize:20, background: newLocIcon===ic?'#E1F5EE':'var(--color-background-secondary)', border:`1.5px solid ${newLocIcon===ic?'#0F6E56':'transparent'}`, borderRadius:8, padding:'4px 8px', cursor:'pointer' }}>
                  {ic}
                </button>
              ))}
            </div>
            <button className="btn primary full" onClick={addLocation} disabled={!newLocName.trim()}>+ เพิ่ม Location</button>
          </div>
          <div className="card">
            <div className="slbl">Locations ทั้งหมด ({STORAGE_GROUPS.length})</div>
            {STORAGE_GROUPS.map(g => {
              const dir = locationDirs[g.id] || g.shelfDirection || 'fb'
              const dirLabel = dir === 'fb' ? 'หน้า/หลัง' : dir === 'ltr' ? 'ซ้าย=ก่อน' : 'ขวา=ก่อน'
              return (
                <div key={g.id} className="row" style={{ flexWrap:'wrap', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:g.color, flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500 }}>{g.icon} {g.name}</div>
                    <div style={{ fontSize:10, color:'#8BA898' }}>{drugs.filter(d=>d.groupId===g.id).length} ยา · {dirLabel}</div>
                  </div>
                  <div style={{ display:'flex', gap:3 }}>
                    {[['fb','หน้า/หลัง'],['ltr','ซ้าย=ก่อน'],['rtl','ขวา=ก่อน']].map(([v,lbl]) => (
                      <button key={v} onClick={() => saveLocDir(g.id, v)}
                        style={{ padding:'3px 7px', borderRadius:6, border:'0.5px solid', fontSize:10, cursor:'pointer', fontFamily:'inherit',
                          background: dir===v ? '#0F6E56' : 'transparent',
                          color: dir===v ? '#fff' : '#5F7A6A',
                          borderColor: dir===v ? '#085041' : '#C8DDD4' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                  {g.id.startsWith('GX') && <span style={{ fontSize:10, color:'#8BA898' }}>session only</span>}
                </div>
              )
            })}
          </div>
        </>
      )}
      {qrDrug && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, width:280, textAlign:'center' }}>
            <div style={{ fontSize:15, fontWeight:500, color:'#0F6E56', marginBottom:4 }}>{qrDrug.name}</div>
            <div style={{ fontSize:11, color:'#8BA898', marginBottom:14 }}>สแกนเพื่อเลือกยานี้ในแอพ</div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrDrug.name)}&margin=10`}
              style={{ width:200, height:200, borderRadius:8, border:'0.5px solid #E0EAE5' }} alt="QR" />
            <div style={{ fontSize:10, color:'#8BA898', margin:'10px 0 14px' }}>ปริ้น sticker ติดที่ช่องวางยา</div>
            <div style={{ display:'flex', gap:8 }}>
              <a href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrDrug.name)}&margin=10`}
                target="_blank" rel="noreferrer"
                style={{ flex:1, padding:'9px', background:'#0F6E56', color:'#fff', borderRadius:8, fontSize:13, fontWeight:500, textDecoration:'none', display:'block' }}>⬇ ดาวน์โหลด</a>
              <button onClick={() => setQrDrug(null)}
                style={{ flex:1, padding:'9px', background:'#F0F4F2', border:'0.5px solid #C8DDD4', borderRadius:8, cursor:'pointer', fontSize:13, color:'#5F7A6A' }}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
