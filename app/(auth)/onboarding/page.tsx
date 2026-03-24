'use client'
import React from 'react'
import { useRef, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AVATARS, COUNTRIES } from '@/lib/constants'
import Image from 'next/image'

function fireConfetti() {
  if (typeof window === 'undefined') return
  const cols = ['#C9A227','#FFD700','#B8962E','#4DCFB4','#6B9FD4','#D46FAA']
  const w = document.createElement('div')
  w.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;'
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('div')
    const c = cols[i % cols.length], sz = (5 + Math.random() * 8) + 'px'
    p.style.cssText = `position:absolute;width:${sz};height:${sz};background:${c};border-radius:${Math.random()>.5?'50%':'3px'};left:${Math.random()*100}%;top:-20px;animation:confetti ${2+Math.random()*2}s ease-in ${Math.random()*.8}s forwards`
    w.appendChild(p)
  }
  document.body.appendChild(w)
  setTimeout(() => w.parentNode?.removeChild(w), 5000)
}

export default function OnboardingPage() {
  const router   = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const formRef = useRef({
    name: '', photo: '', avatarId: '', designation: '', country: 'IN',
    gender: '', age: '', disclaimerAgreed: true, isPodcaster: false, isGuest: false,
  })
  const [, tick] = useState(0)
  const f = formRef.current
  const set = (k: string, v: unknown) => { (formRef.current as Record<string, unknown>)[k] = v; tick(n => n+1) }

  const cobj = COUNTRIES.find(c => c.code === f.country) || COUNTRIES[0]
  const N = 6
  const dots = Array.from({length: N}, (_, i) => (
    <div key={i} className={`ob-dot ${i+1===step?'active':i+1<step?'done':'idle'}`}
      style={{width: i+1===step ? 26 : 10}} />
  ))

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader()
    r.onload = e2 => set('photo', e2.target?.result as string)
    r.readAsDataURL(file)
  }

  async function finish() {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:                f.name,
        designation:         f.designation,
        country:             cobj.name,
        country_flag:        cobj.flag,
        gender:              f.gender,
        age_range:           f.age,
        avatar_id:           f.avatarId || null,
        is_podcaster:        f.isPodcaster,
        is_guest:            f.isGuest,
        disclaimer_agreed:   true,
        onboarding_complete: true,
      }),
    })
    fireConfetti()
    router.replace('/app')
  }

  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <div className="ob-wrap">
      <div className="orb orb1" /><div className="orb orb3" />
      <div className="ob-card">
        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
          <Image src="/podhub-logo.png" alt="Podhub" width={110} height={30}
            style={{ mixBlendMode:'screen', filter:'brightness(1.4)' }} />
        </div>
        <div className="ob-dots">{dots}</div>
        {children}
      </div>
    </div>
  )

  if (step === 1) return (
    <Wrap>
      <div className="ob-title">Before you step in</div>
      <div className="ob-sub">Read and agree to our Portal Terms.</div>
      <div className="disc-scroll">
        <p style={{fontWeight:600,fontSize:12,color:'var(--gold2)',marginBottom:8}}>PODHUB LISTENER PORTAL TERMS</p>
        <p style={{fontSize:11,lineHeight:1.75,marginBottom:8}}>This portal is operated by Healthy Mind by Avik, a global mental wellness podcast network founded by Avik Chakraborty.</p>
        <p style={{fontSize:11,lineHeight:1.75,marginBottom:6}}><strong>Points &amp; Rewards:</strong> Earned by genuine listening (minimum 5 minutes per episode), confirmed social follows, and successful referrals. Cash prizes are monthly. Fraudulent activity results in disqualification.</p>
        <p style={{fontSize:11,lineHeight:1.75,marginBottom:6}}><strong>Privacy:</strong> We do not sell your data. Request deletion anytime.</p>
        <p style={{fontSize:11,lineHeight:1.75}}><strong>Communications:</strong> You consent to programme-related emails. Unsubscribe anytime.</p>
      </div>
      <label className="disc-check-row">
        <input type="checkbox" checked={f.disclaimerAgreed} onChange={e => set('disclaimerAgreed', e.target.checked)} />
        <span style={{fontSize:12,color:'var(--text2)',lineHeight:1.65}}>I have read and agree to the Podhub Listener Portal Terms.</span>
      </label>
      <div className="ob-actions">
        <button className="btn btn-gold" style={{flex:1}} onClick={() => setStep(2)} disabled={!f.disclaimerAgreed}>
          I Agree — Continue
        </button>
      </div>
    </Wrap>
  )

  if (step === 2) return (
    <Wrap>
      <div className="ob-title">Build your profile</div>
      <div className="ob-sub">Upload a photo or pick an avatar.</div>
      <div style={{display:'flex',gap:14,marginBottom:14,alignItems:'center'}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:'var(--navy3)',border:'2px dashed var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden',flexShrink:0}}
          onClick={() => document.getElementById('ob-photo')?.click()}>
          {f.photo ? <img src={f.photo} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" />
            : <span style={{fontSize:22,color:'var(--text3)'}}>📷</span>}
        </div>
        <input id="ob-photo" type="file" accept="image/*" style={{display:'none'}} onChange={handlePhoto} />
        <div style={{fontSize:12,color:'var(--text3)'}}>Tap to upload photo</div>
      </div>
      <div style={{fontSize:10,color:'var(--text3)',marginBottom:7,letterSpacing:'.06em',textTransform:'uppercase'}}>Or choose an avatar</div>
      <div className="av-grid">
        {AVATARS.map(av => (
          <div key={av.id} className={`av-opt${f.avatarId===av.id&&!f.photo?' picked':''}`}
            style={{background:av.bg}} onClick={() => { set('avatarId', av.id); set('photo', '') }}>
            {av.emoji}
          </div>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:9,marginTop:14}}>
        <input placeholder="Full name *" value={f.name} onChange={e => set('name', e.target.value)}
          style={{width:'100%',background:'var(--navy3)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:9,padding:'10px 13px',fontSize:13,fontFamily:'var(--sans)',outline:'none'}} />
        <input placeholder="What you do (Coach, Therapist, Founder...)" value={f.designation} onChange={e => set('designation', e.target.value)}
          style={{width:'100%',background:'var(--navy3)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:9,padding:'10px 13px',fontSize:13,fontFamily:'var(--sans)',outline:'none'}} />
      </div>
      <div className="ob-actions">
        <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
        <button className="btn btn-gold" style={{flex:1}} onClick={() => setStep(3)} disabled={!f.name.trim()}>Continue</button>
      </div>
    </Wrap>
  )

  if (step === 3) return (
    <Wrap>
      <div className="ob-title">About you</div>
      <div className="ob-sub">Personalises your experience.</div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <select value={f.country} onChange={e => set('country', e.target.value)}>
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
        </select>
        <select value={f.gender} onChange={e => set('gender', e.target.value)}>
          <option value="">Gender (optional)</option>
          {['Male','Female','Non-binary','Prefer not to say'].map(g => <option key={g}>{g}</option>)}
        </select>
        <select value={f.age} onChange={e => set('age', e.target.value)}>
          <option value="">Age range (optional)</option>
          {['Under 18','18-25','26-35','36-45','46-55','56+','Prefer not to say'].map(a => <option key={a}>{a}</option>)}
        </select>
      </div>
      <div className="ob-actions">
        <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
        <button className="btn btn-gold" style={{flex:1}} onClick={() => setStep(4)}>Continue</button>
      </div>
    </Wrap>
  )

  if (step === 4) return (
    <Wrap>
      <div className="ob-title">Your role</div>
      <div className="ob-sub">Select all that apply.</div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {[{k:'isPodcaster',t:'🎙 I am a Podcaster',s:'I host or co-host a show'},{k:'isGuest',t:'🎤 I am a Guest / Speaker',s:'I appear on podcasts as a guest'}].map(item => (
          <div key={item.k}
            style={{background:'var(--navy3)',border:`1.5px solid ${(f as Record<string,unknown>)[item.k]?'var(--gold)':'var(--border)'}`,borderRadius:13,padding:13,cursor:'pointer'}}
            onClick={() => set(item.k, !(f as Record<string,unknown>)[item.k])}>
            <div style={{fontWeight:500,marginBottom:3}}>{item.t}</div>
            <div style={{fontSize:12,color:'var(--text3)'}}>{item.s}</div>
          </div>
        ))}
      </div>
      <div className="ob-actions">
        <button className="btn btn-ghost" onClick={() => setStep(3)}>Back</button>
        <button className="btn btn-gold" style={{flex:1}} onClick={() => setStep(5)}>Continue</button>
      </div>
    </Wrap>
  )

  if (step === 5) return (
    <Wrap>
      <div className="ob-title">Stay in the loop</div>
      <div className="ob-sub">Notifications are on by default.</div>
      <div style={{background:'var(--navy3)',borderRadius:12,padding:16,marginBottom:14}}>
        {[['📧','Weekly Episode Digest','Every Friday'],['🏆','Monthly Leaderboard Results','1st of every month']].map(([ico,t,s]) => (
          <div key={t} style={{display:'flex',gap:10,marginBottom:12}}>
            <span style={{fontSize:20}}>{ico}</span>
            <div><div style={{fontWeight:500,fontSize:14}}>{t}</div><div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{s}</div></div>
          </div>
        ))}
      </div>
      <div className="ob-actions">
        <button className="btn btn-ghost" onClick={() => setStep(4)}>Back</button>
        <button className="btn btn-gold" style={{flex:1}} onClick={() => setStep(6)}>Continue</button>
      </div>
    </Wrap>
  )

  if (step === 6) {
    const av2 = AVATARS.find(a => a.id === f.avatarId)
    return (
      <Wrap>
        <div style={{textAlign:'center'}}>
          <div className="welcome-char-wrap">
            <span className="welcome-char">🧑</span>
            <span className="welcome-char-hand">👋</span>
            <span className="welcome-sparkle1">✨</span>
            <span className="welcome-sparkle2">⭐</span>
            <span className="welcome-sparkle3">💫</span>
          </div>
          <div className="ob-title" style={{textAlign:'center'}}>Welcome, {f.name || 'friend'}!</div>
          <div className="ob-sub" style={{textAlign:'center',marginBottom:18}}>Your profile is live. 50 welcome points are yours.</div>
          <div style={{background:'var(--navy3)',borderRadius:14,padding:14,marginBottom:20,display:'flex',alignItems:'center',gap:12,textAlign:'left'}}>
            <div style={{width:48,height:48,borderRadius:'50%',border:'2px solid var(--gold)',background:av2?av2.bg:'var(--navy4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,overflow:'hidden',flexShrink:0}}>
              {f.photo ? <img src={f.photo} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : av2 ? av2.emoji : f.name[0]?.toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:14}}>{f.name}</div>
              <div style={{color:'var(--text3)',fontSize:12}}>{f.designation || 'Listener'}</div>
              <div style={{fontSize:12,marginTop:2}}>{cobj.flag} {cobj.name}{f.gender ? ` · ${f.gender}` : ''}{f.age ? ` · ${f.age}` : ''}</div>
            </div>
            <div style={{textAlign:'center',flexShrink:0}}>
              <div style={{fontFamily:'var(--serif)',fontSize:22,fontWeight:700,background:'var(--goldgrad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>50</div>
              <div style={{fontSize:10,color:'var(--text3)'}}>welcome pts</div>
            </div>
          </div>
          <button className="btn btn-gold" style={{width:'100%',padding:14,fontSize:15}} onClick={finish} disabled={saving}>
            {saving ? 'Setting up...' : 'Enter the Podhub ✨'}
          </button>
        </div>
      </Wrap>
    )
  }
  return null
}
