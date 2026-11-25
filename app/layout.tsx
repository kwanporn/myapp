"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Prompt, Sarabun } from "next/font/google";

const prompt = Prompt({ subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"] });
const sarabun = Sarabun({ subsets: ["thai", "latin"], weight: ["400", "500", "700"] });

/* ───────────── helpers ───────────── */

const pad = (n: number, l = 2) => String(n).padStart(l, "0");
const MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const WEEKDAYS = ["อา","จ","อ","พ","พฤ","ศ","ส"];

function useStored<T>(key: string, init: T) {
  const [v, setV] = useState<T>(init);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const s = localStorage.getItem(key);
      if (s) setV(JSON.parse(s) as T);
    } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key, v, ready]);
  return [v, setV] as const;
}

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(t);
  }, []);
  return now;
}

type W = Window & { webkitAudioContext?: typeof AudioContext };

function useBeeper() {
  const ctx = useRef<AudioContext | null>(null);
  const unlock = useCallback(() => {
    if (!ctx.current) {
      const C = window.AudioContext || (window as W).webkitAudioContext;
      if (C) ctx.current = new C();
    }
    ctx.current?.resume();
  }, []);
  const beep = useCallback((freq = 880, dur = 0.18) => {
    const c = ctx.current;
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = freq;
    o.connect(g);
    g.connect(c.destination);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  }, []);
  return { unlock, beep };
}

function tzParts(d: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { h: Number(p.hour) % 24, m: Number(p.minute), s: Number(p.second) };
}

/* ───────────── 1. เวลา ───────────── */

const ZONES = [
  { tz: "Asia/Bangkok", name: "กรุงเทพฯ" },
  { tz: "Asia/Tokyo", name: "โตเกียว" },
  { tz: "Europe/London", name: "ลอนดอน" },
  { tz: "America/New_York", name: "นิวยอร์ก" },
  { tz: "Australia/Sydney", name: "ซิดนีย์" },
];

function TimeTab({ now }: { now: Date | null }) {
  if (!now) return <div className="panel">กำลังโหลด…</div>;
  const main = tzParts(now, "Asia/Bangkok");
  const dateStr = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
  const R = 118;
  const C = 2 * Math.PI * R;
  const secFrac = (main.s + (now.getMilliseconds() / 1000)) / 60;
  return (
    <>
      <section className="hero">
        <svg viewBox="0 0 280 280" className="ring" aria-hidden>
          <circle cx="140" cy="140" r={R} className="ring-bg" />
          <circle cx="140" cy="140" r={R} className="ring-fg" strokeDasharray={C} strokeDashoffset={C * (1 - secFrac)} transform="rotate(-90 140 140)" />
        </svg>
        <div className="hero-text">
          <div className={`big ${prompt.className}`}>{pad(main.h)}:{pad(main.m)}</div>
          <div className="sec">{pad(main.s)} วินาที</div>
        </div>
      </section>
      <p className="date">{dateStr}</p>
      <h2>เวลาทั่วโลก</h2>
      <div className="zones">
        {ZONES.map((z) => {
          const p = tzParts(now, z.tz);
          const day = new Intl.DateTimeFormat("th-TH", { timeZone: z.tz, weekday: "short", day: "numeric", month: "short" }).format(now);
          return (
            <div className="zone" key={z.tz}>
              <div><b>{z.name}</b><span className="muted">{day}</span></div>
              <div className={`zt ${prompt.className}`}>{pad(p.h)}:{pad(p.m)}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ───────────── 2. ผลบอล ───────────── */

const LEAGUES = [
  { id: "eng.1", name: "พรีเมียร์ลีก" },
  { id: "esp.1", name: "ลาลีกา" },
  { id: "ger.1", name: "บุนเดสลีกา" },
  { id: "ita.1", name: "เซเรีย อา" },
  { id: "uefa.champions", name: "แชมเปียนส์ลีก" },
  { id: "tha.1", name: "ไทยลีก" },
];

interface EspnComp { homeAway: string; score?: string; team: { displayName: string; logo?: string } }
interface EspnEvent {
  id: string;
  date: string;
  status: { displayClock?: string; type: { state: string; shortDetail: string } };
  competitions: { competitors: EspnComp[] }[];
}
interface Match { id: string; home: string; away: string; hs: string; as: string; state: string; detail: string; time: string; hl?: string; al?: string }

const SAMPLE: Match[] = [
  { id: "s1", home: "Liverpool", away: "Arsenal", hs: "2", as: "1", state: "post", detail: "FT", time: "" },
  { id: "s2", home: "Man City", away: "Chelsea", hs: "1", as: "1", state: "in", detail: "67'", time: "" },
  { id: "s3", home: "Tottenham", away: "Newcastle", hs: "", as: "", state: "pre", detail: "", time: "22:30" },
];

function FootballTab() {
  const [league, setLeague] = useState(LEAGUES[0].id);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [demo, setDemo] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`);
      if (!r.ok) throw new Error("bad");
      const j = (await r.json()) as { events?: EspnEvent[] };
      const list: Match[] = (j.events ?? []).map((e) => {
        const cs = e.competitions[0].competitors;
        const h = cs.find((c) => c.homeAway === "home") ?? cs[0];
        const a = cs.find((c) => c.homeAway === "away") ?? cs[1];
        const t = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", hour12: false, day: "numeric", month: "short" }).format(new Date(e.date));
        return {
          id: e.id, home: h.team.displayName, away: a.team.displayName,
          hs: h.score ?? "", as: a.score ?? "", state: e.status.type.state,
          detail: e.status.type.state === "in" ? e.status.displayClock ?? "" : e.status.type.shortDetail,
          time: t, hl: h.team.logo, al: a.team.logo,
        };
      });
      setMatches(list);
      setDemo(false);
    } catch {
      setMatches(SAMPLE);
      setDemo(true);
    }
  }, [league]);

  useEffect(() => {
    setMatches(null);
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <>
      <div className="chips">
        {LEAGUES.map((l) => (
          <button key={l.id} className={`chip ${league === l.id ? "on" : ""}`} onClick={() => setLeague(l.id)}>{l.name}</button>
        ))}
      </div>
      {demo && <p className="note">โหลดข้อมูลจริงไม่ได้ จึงแสดงข้อมูลตัวอย่าง</p>}
      {matches === null && <div className="panel">กำลังโหลดผลบอล…</div>}
      {matches?.length === 0 && <div className="panel">ลีกนี้ไม่มีนัดในช่วงนี้</div>}
      <div className="list">
        {matches?.map((m) => (
          <div className="match" key={m.id}>
            <div className="team">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {m.hl ? <img src={m.hl} alt="" width={28} height={28} /> : <span className="logo-ph" />}
              <span>{m.home}</span>
            </div>
            <div className="score">
              {m.state === "pre" ? <span className="muted">{m.time}</span> : <span className={prompt.className}>{m.hs} - {m.as}</span>}
              <small className={m.state === "in" ? "live" : "muted"}>{m.state === "in" ? `● ${m.detail}` : m.state === "post" ? "จบการแข่งขัน" : ""}</small>
            </div>
            <div className="team right">
              <span>{m.away}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {m.al ? <img src={m.al} alt="" width={28} height={28} /> : <span className="logo-ph" />}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ───────────── 3. จับเวลา ───────────── */

function fmtSW(ms: number) {
  const c = Math.floor(ms / 10) % 100;
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000);
  return `${pad(m)}:${pad(s)}.${pad(c)}`;
}

function StopwatchTab({ beep }: { beep: (f?: number, d?: number) => void }) {
  const [mode, setMode] = useState<"sw" | "cd">("sw");
  // stopwatch
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const base = useRef(0);
  useEffect(() => {
    if (!running) return;
    base.current = Date.now() - elapsed;
    const t = setInterval(() => setElapsed(Date.now() - base.current), 33);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // countdown
  const [cdMin, setCdMin] = useState(5);
  const [cdLeft, setCdLeft] = useState(300);
  const [cdRun, setCdRun] = useState(false);
  const endAt = useRef(0);
  useEffect(() => {
    if (!cdRun) return;
    endAt.current = Date.now() + cdLeft * 1000;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setCdLeft(left);
      if (left === 0) {
        setCdRun(false);
        [0, 300, 600].forEach((d) => setTimeout(() => beep(988, 0.25), d));
      }
    }, 200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cdRun]);

  return (
    <>
      <div className="seg">
        <button className={mode === "sw" ? "on" : ""} onClick={() => setMode("sw")}>จับเวลา</button>
        <button className={mode === "cd" ? "on" : ""} onClick={() => setMode("cd")}>นับถอยหลัง</button>
      </div>
      {mode === "sw" ? (
        <>
          <div className={`digits ${prompt.className}`}>{fmtSW(elapsed)}</div>
          <div className="btnrow">
            <button className="btn ghost" onClick={() => { if (running) setLaps((l) => [elapsed, ...l]); else { setElapsed(0); setLaps([]); } }}>
              {running ? "บันทึกรอบ" : "รีเซ็ต"}
            </button>
            <button className={`btn ${running ? "stop" : "go"}`} onClick={() => setRunning((r) => !r)}>{running ? "หยุด" : elapsed ? "เริ่มต่อ" : "เริ่ม"}</button>
          </div>
          <div className="list">
            {laps.map((l, i) => (
              <div className="lap" key={i}>
                <span>รอบที่ {laps.length - i}</span>
                <span>{fmtSW(l - (laps[i + 1] ?? 0))}</span>
                <span className="muted">{fmtSW(l)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className={`digits ${prompt.className}`}>{pad(Math.floor(cdLeft / 60))}:{pad(cdLeft % 60)}</div>
          {!cdRun && (
            <div className="chips center">
              {[1, 3, 5, 10, 25].map((m) => (
                <button key={m} className={`chip ${cdMin === m ? "on" : ""}`} onClick={() => { setCdMin(m); setCdLeft(m * 60); }}>{m} นาที</button>
              ))}
            </div>
          )}
          <div className="btnrow">
            <button className="btn ghost" onClick={() => { setCdRun(false); setCdLeft(cdMin * 60); }}>รีเซ็ต</button>
            <button className={`btn ${cdRun ? "stop" : "go"}`} onClick={() => { if (cdLeft === 0) setCdLeft(cdMin * 60); setCdRun((r) => !r); }}>{cdRun ? "หยุด" : "เริ่ม"}</button>
          </div>
        </>
      )}
    </>
  );
}

/* ───────────── 4. นาฬิกาปลุก ───────────── */

interface Alarm { id: string; time: string; label: string; on: boolean }

function AlarmTab({ alarms, setAlarms, unlock, beep }: {
  alarms: Alarm[]; setAlarms: (f: (a: Alarm[]) => Alarm[]) => void; unlock: () => void; beep: (f?: number, d?: number) => void;
}) {
  const [time, setTime] = useState("07:00");
  const [label, setLabel] = useState("");
  const sorted = [...alarms].sort((a, b) => a.time.localeCompare(b.time));
  return (
    <>
      <div className="panel form">
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`timein ${prompt.className}`} aria-label="เวลาปลุก" />
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ชื่อ เช่น ตื่นไปทำงาน" aria-label="ชื่อการปลุก" />
        <button className="btn go" onClick={() => {
          unlock();
          if (!time) return;
          setAlarms((a) => [...a, { id: crypto.randomUUID(), time, label: label.trim() || "นาฬิกาปลุก", on: true }]);
          setLabel("");
        }}>เพิ่มการปลุก</button>
        <button className="btn ghost" onClick={() => { unlock(); beep(); }}>ทดสอบเสียง</button>
      </div>
      {sorted.length === 0 && <div className="panel muted">ยังไม่มีการปลุก ตั้งเวลาแล้วกดเพิ่ม</div>}
      <div className="list">
        {sorted.map((a) => (
          <div className={`alarm ${a.on ? "" : "off"}`} key={a.id}>
            <div>
              <div className={`at ${prompt.className}`}>{a.time}</div>
              <div className="muted">{a.label} · ทุกวัน</div>
            </div>
            <div className="alarm-actions">
              <button className={`switch ${a.on ? "on" : ""}`} role="switch" aria-checked={a.on} aria-label="เปิด/ปิด" onClick={() => setAlarms((l) => l.map((x) => (x.id === a.id ? { ...x, on: !x.on } : x)))} />
              <button className="link" onClick={() => setAlarms((l) => l.filter((x) => x.id !== a.id))}>ลบ</button>
            </div>
          </div>
        ))}
      </div>
      <p className="note">เสียงปลุกจะดังเมื่อเปิดหน้านี้ค้างไว้ในเบราว์เซอร์เท่านั้น</p>
    </>
  );
}

/* ───────────── 5. ปฏิทิน ───────────── */

function CalendarTab({ now }: { now: Date | null }) {
  const today = now ?? new Date();
  const [ym, setYm] = useState<{ y: number; m: number } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [notes, setNotes] = useStored<Record<string, string>>("clock.notes", {});
  const cur = ym ?? { y: today.getFullYear(), m: today.getMonth() };
  const first = new Date(cur.y, cur.m, 1).getDay();
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const key = (d: number) => `${cur.y}-${pad(cur.m + 1)}-${pad(d)}`;
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const go = (delta: number) => {
    const d = new Date(cur.y, cur.m + delta, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() });
  };
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <>
      <div className="calhead">
        <button className="btn ghost sm" onClick={() => go(-1)} aria-label="เดือนก่อน">‹</button>
        <h2 className={prompt.className}>{MONTHS[cur.m]} {cur.y + 543}</h2>
        <button className="btn ghost sm" onClick={() => go(1)} aria-label="เดือนถัดไป">›</button>
      </div>
      <div className="cal">
        {WEEKDAYS.map((w, i) => <div key={w} className={`wd ${i === 0 ? "sun" : ""}`}>{w}</div>)}
        {cells.map((d, i) =>
          d === null ? <div key={i} /> : (
            <button key={i} className={`day ${key(d) === todayKey ? "today" : ""} ${sel === key(d) ? "sel" : ""} ${(first + d - 1) % 7 === 0 ? "sun" : ""}`} onClick={() => setSel(key(d))}>
              {d}
              {notes[key(d)] && <i className="dot" />}
            </button>
          )
        )}
      </div>
      {sel ? (
        <div className="panel">
          <b>{Number(sel.slice(8))} {MONTHS[Number(sel.slice(5, 7)) - 1]} {Number(sel.slice(0, 4)) + 543}</b>
          <textarea value={notes[sel] ?? ""} placeholder="จดบันทึกหรือนัดหมายของวันนี้" rows={3}
            onChange={(e) => { const v = e.target.value; setNotes((n) => { const c = { ...n }; if (v) c[sel] = v; else delete c[sel]; return c; }); }} />
        </div>
      ) : <p className="note">แตะวันที่เพื่อจดบันทึก</p>}
      <button className="link" onClick={() => { setYm(null); setSel(todayKey); }}>กลับไปวันนี้</button>
    </>
  );
}

/* ───────────── 6. สภาพอากาศ ───────────── */

const PLACES = [
  { name: "สุโขทัย", lat: 17.0056, lon: 99.8264 },
  { name: "กรุงเทพฯ", lat: 13.7563, lon: 100.5018 },
  { name: "เชียงใหม่", lat: 18.7883, lon: 98.9853 },
  { name: "ภูเก็ต", lat: 7.8804, lon: 98.3923 },
];

interface Wx {
  current: { temperature_2m: number; relative_humidity_2m: number; apparent_temperature: number; weather_code: number; wind_speed_10m: number };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[] };
}

function wmo(c: number): [string, string] {
  if (c === 0) return ["☀️", "ท้องฟ้าแจ่มใส"];
  if (c <= 2) return ["🌤️", "มีเมฆบางส่วน"];
  if (c === 3) return ["☁️", "เมฆมาก"];
  if (c <= 48) return ["🌫️", "หมอก"];
  if (c <= 57) return ["🌦️", "ฝนปรอย"];
  if (c <= 67) return ["🌧️", "ฝนตก"];
  if (c <= 77) return ["❄️", "หิมะ"];
  if (c <= 82) return ["🌧️", "ฝนซู่"];
  return ["⛈️", "พายุฝนฟ้าคะนอง"];
}

function WeatherTab() {
  const [place, setPlace] = useState(PLACES[0]);
  const [wx, setWx] = useState<Wx | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let dead = false;
    setWx(null);
    setErr(false);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
    fetch(url).then((r) => r.json()).then((j: Wx) => { if (!dead) setWx(j); }).catch(() => { if (!dead) setErr(true); });
    return () => { dead = true; };
  }, [place]);

  const locate = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setPlace({ name: "ตำแหน่งของฉัน", lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setErr(true)
    );
  };

  return (
    <>
      <div className="chips">
        {PLACES.map((p) => <button key={p.name} className={`chip ${place.name === p.name ? "on" : ""}`} onClick={() => setPlace(p)}>{p.name}</button>)}
        <button className={`chip ${place.name === "ตำแหน่งของฉัน" ? "on" : ""}`} onClick={locate}>ตำแหน่งของฉัน</button>
      </div>
      {err && <div className="panel">โหลดสภาพอากาศไม่ได้ ลองใหม่อีกครั้ง</div>}
      {!wx && !err && <div className="panel">กำลังโหลด…</div>}
      {wx && (
        <>
          <section className="panel wnow">
            <div className="wicon">{wmo(wx.current.weather_code)[0]}</div>
            <div>
              <div className={`wtemp ${prompt.className}`}>{Math.round(wx.current.temperature_2m)}°</div>
              <div>{wmo(wx.current.weather_code)[1]} · {place.name}</div>
              <div className="muted">รู้สึกเหมือน {Math.round(wx.current.apparent_temperature)}° · ความชื้น {wx.current.relative_humidity_2m}% · ลม {Math.round(wx.current.wind_speed_10m)} กม./ชม.</div>
            </div>
          </section>
          <h2>พยากรณ์ 7 วัน</h2>
          <div className="list">
            {wx.daily.time.map((d, i) => {
              const dt = new Date(d + "T12:00:00");
              return (
                <div className="fday" key={d}>
                  <span>{i === 0 ? "วันนี้" : new Intl.DateTimeFormat("th-TH", { weekday: "short", day: "numeric", month: "short" }).format(dt)}</span>
                  <span>{wmo(wx.daily.weather_code[i])[0]}</span>
                  <span className="muted">ฝน {wx.daily.precipitation_probability_max[i] ?? 0}%</span>
                  <span><b>{Math.round(wx.daily.temperature_2m_max[i])}°</b> <span className="muted">{Math.round(wx.daily.temperature_2m_min[i])}°</span></span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/* ───────────── 7. กราฟหุ้น ───────────── */

const STOCKS = [
  { s: "SET", base: 1420 },
  { s: "PTT", base: 33 },
  { s: "AOT", base: 58 },
  { s: "CPALL", base: 56 },
  { s: "ADVANC", base: 290 },
];
const N = 60;

function StocksTab() {
  const [series, setSeries] = useState<Record<string, number[]>>({});
  const [sym, setSym] = useState("SET");

  useEffect(() => {
    const init: Record<string, number[]> = {};
    STOCKS.forEach(({ s, base }) => {
      let v = base;
      init[s] = Array.from({ length: N }, () => (v = Math.max(1, v * (1 + (Math.random() - 0.5) * 0.012))));
    });
    setSeries(init);
    const t = setInterval(() => {
      setSeries((prev) => {
        const next: Record<string, number[]> = {};
        for (const k of Object.keys(prev)) {
          const arr = prev[k];
          const last = arr[arr.length - 1];
          next[k] = [...arr.slice(1), Math.max(1, last * (1 + (Math.random() - 0.5) * 0.012))];
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const data = series[sym];
  if (!data) return <div className="panel">กำลังโหลด…</div>;
  const W = 640, H = 260, P = 8;
  const min = Math.min(...data), max = Math.max(...data);
  const x = (i: number) => P + (i / (N - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - min) / (max - min || 1)) * (H - 2 * P);
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const chg = data[N - 1] - data[0];
  const pct = (chg / data[0]) * 100;
  const up = chg >= 0;
  const col = up ? "var(--up)" : "var(--down)";
  const dp = data[N - 1] < 100 ? 2 : 1;

  return (
    <>
      <div className="chips">
        {STOCKS.map(({ s }) => <button key={s} className={`chip ${sym === s ? "on" : ""}`} onClick={() => setSym(s)}>{s}</button>)}
      </div>
      <div className="panel">
        <div className="price">
          <span className={`wtemp ${prompt.className}`}>{data[N - 1].toFixed(dp)}</span>
          <b style={{ color: col }}>{up ? "▲" : "▼"} {Math.abs(chg).toFixed(dp)} ({pct.toFixed(2)}%)</b>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`กราฟราคา ${sym}`}>
          <defs>
            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={col} stopOpacity="0.25" />
              <stop offset="1" stopColor={col} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} className="grid" />)}
          <path d={`${line} L${x(N - 1)},${H} L${x(0)},${H} Z`} fill="url(#fill)" />
          <path d={line} fill="none" stroke={col} strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx={x(N - 1)} cy={y(data[N - 1])} r="4.5" fill={col} />
        </svg>
        <div className="muted between"><span>ต่ำสุด {min.toFixed(dp)}</span><span>สูงสุด {max.toFixed(dp)}</span></div>
      </div>
      <p className="note">ข้อมูลนี้เป็นข้อมูลจำลองเพื่อสาธิต ไม่ใช่ราคาจริง ต้องการราคาจริงให้ดึงจาก API ตลาดหลักทรัพย์ผ่าน API route ของคุณเอง</p>
    </>
  );
}

/* ───────────── หน้าหลัก ───────────── */

const TABS = [
  { id: "time", label: "เวลา", icon: "🕒" },
  { id: "football", label: "ผลบอล", icon: "⚽" },
  { id: "stopwatch", label: "จับเวลา", icon: "⏱️" },
  { id: "alarm", label: "ปลุก", icon: "⏰" },
  { id: "calendar", label: "ปฏิทิน", icon: "📅" },
  { id: "weather", label: "อากาศ", icon: "🌤️" },
  { id: "stocks", label: "หุ้น", icon: "📈" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [tab, setTab] = useState<TabId>("time");
  const now = useNow();
  const { unlock, beep } = useBeeper();
  const [alarms, setAlarms] = useStored<Alarm[]>("clock.alarms", []);
  const [ringing, setRinging] = useState<Alarm | null>(null);
  const lastMin = useRef("");

  useEffect(() => {
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [unlock]);

  useEffect(() => {
    if (!now) return;
    const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const k = `${now.toDateString()} ${hhmm}`;
    if (lastMin.current === k) return;
    lastMin.current = k;
    const hit = alarms.find((a) => a.on && a.time === hhmm);
    if (hit) setRinging(hit);
  }, [now, alarms]);

  useEffect(() => {
    if (!ringing) return;
    const ring = () => { beep(880, 0.2); setTimeout(() => beep(1175, 0.2), 250); };
    ring();
    const t = setInterval(ring, 900);
    return () => clearInterval(t);
  }, [ringing, beep]);

  return (
    <div className={`app ${sarabun.className}`}>
      <style>{CSS}</style>
      <nav className="nav" aria-label="เมนูหลัก">
        <div className={`brand ${prompt.className}`}>นาฬิกา</div>
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)} aria-current={tab === t.id}>
            <span aria-hidden>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      <main className="main">
        <h1 className={prompt.className}>{TABS.find((t) => t.id === tab)?.label}</h1>
        {tab === "time" && <TimeTab now={now} />}
        {tab === "football" && <FootballTab />}
        {tab === "stopwatch" && <StopwatchTab beep={beep} />}
        {tab === "alarm" && <AlarmTab alarms={alarms} setAlarms={setAlarms} unlock={unlock} beep={beep} />}
        {tab === "calendar" && <CalendarTab now={now} />}
        {tab === "weather" && <WeatherTab />}
        {tab === "stocks" && <StocksTab />}
      </main>
      {ringing && (
        <div className="overlay" role="alertdialog" aria-label="นาฬิกาปลุก">
          <div className="ringbox">
            <div className={`big ${prompt.className}`}>{ringing.time}</div>
            <p>{ringing.label}</p>
            <button className="btn stop" onClick={() => setRinging(null)}>ปิดเสียง</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── สไตล์ ───────────── */

const CSS = `
:root{--bg:#e9ede8;--panel:#f7f8f5;--ink:#17231f;--muted:#5b6b64;--line:#cbd3cc;--teal:#0e6b5c;--amber:#e0a030;--red:#c23b4e;--up:#1b8a4b;--down:#c23b4e}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink)}
.app{min-height:100dvh;display:grid;grid-template-columns:200px 1fr}
.nav{position:sticky;top:0;height:100dvh;padding:24px 14px;display:flex;flex-direction:column;gap:4px;border-right:1px solid var(--line)}
.brand{font-size:22px;font-weight:700;padding:0 12px 18px;color:var(--teal)}
.tab{display:flex;gap:10px;align-items:center;padding:10px 12px;border:0;background:none;border-radius:10px;font:inherit;font-size:16px;color:var(--muted);cursor:pointer;text-align:left}
.tab:hover{background:#dfe6df}
.tab.on{background:var(--ink);color:#fff}
.tab:focus-visible,.btn:focus-visible,.chip:focus-visible,.day:focus-visible,.switch:focus-visible{outline:3px solid var(--amber);outline-offset:2px}
.main{max-width:720px;width:100%;padding:28px 24px 60px}
h1{font-size:28px;margin:0 0 18px;font-weight:600}
h2{font-size:18px;margin:26px 0 10px;font-weight:600}
.muted{color:var(--muted)}
.note{color:var(--muted);font-size:14px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px;margin:10px 0}
.list{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.between{display:flex;justify-content:space-between;font-size:14px;margin-top:6px}
.center{justify-content:center}

.hero{position:relative;width:min(300px,80vw);aspect-ratio:1;margin:8px auto 0}
.ring{width:100%;height:100%}
.ring-bg{fill:none;stroke:var(--line);stroke-width:8}
.ring-fg{fill:none;stroke:var(--teal);stroke-width:8;stroke-linecap:round}
.hero-text{position:absolute;inset:0;display:grid;place-content:center;text-align:center}
.big{font-size:64px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1}
.sec{color:var(--muted);margin-top:8px}
.date{text-align:center;font-size:18px;margin:14px 0 0}
.zones{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.zone{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}
.zone div:first-child{display:flex;flex-direction:column}
.zt{font-size:26px;font-weight:600;font-variant-numeric:tabular-nums}

.chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.chip{border:1px solid var(--line);background:var(--panel);padding:7px 14px;border-radius:99px;font:inherit;cursor:pointer;color:var(--ink)}
.chip.on{background:var(--teal);border-color:var(--teal);color:#fff}
.match{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.team{display:flex;align-items:center;gap:8px;font-weight:500}
.team.right{justify-content:flex-end;text-align:right}
.logo-ph{width:28px;height:28px;border-radius:50%;background:var(--line);flex:none}
.score{text-align:center;display:flex;flex-direction:column;min-width:76px}
.score span{font-size:22px;font-weight:600}
.live{color:var(--red);font-weight:700}

.seg{display:inline-flex;background:#dfe6df;border-radius:10px;padding:3px;margin-bottom:8px}
.seg button{border:0;background:none;padding:8px 18px;border-radius:8px;font:inherit;cursor:pointer;color:var(--muted)}
.seg button.on{background:var(--panel);color:var(--ink);font-weight:700}
.digits{font-size:clamp(48px,14vw,92px);font-weight:600;text-align:center;font-variant-numeric:tabular-nums;margin:18px 0}
.btnrow{display:flex;gap:14px;justify-content:center;margin-bottom:18px}
.btn{border:0;border-radius:99px;padding:12px 26px;font:inherit;font-weight:700;cursor:pointer;color:#fff}
.btn.go{background:var(--teal)}
.btn.stop{background:var(--red)}
.btn.ghost{background:#dfe6df;color:var(--ink)}
.btn.sm{padding:6px 16px;font-size:20px}
.lap{display:grid;grid-template-columns:1fr auto auto;gap:18px;padding:10px 14px;background:var(--panel);border-radius:10px;font-variant-numeric:tabular-nums}

.form{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
input[type=text],input[type=time],textarea{font:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink)}
input[type=text]{flex:1;min-width:160px}
.timein{font-size:24px;font-weight:600}
textarea{width:100%;margin-top:8px;resize:vertical}
.alarm{display:flex;justify-content:space-between;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 16px}
.alarm.off{opacity:.55}
.at{font-size:32px;font-weight:600;font-variant-numeric:tabular-nums}
.alarm-actions{display:flex;gap:14px;align-items:center}
.switch{width:46px;height:26px;border-radius:99px;border:0;background:var(--line);position:relative;cursor:pointer}
.switch::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .15s}
.switch.on{background:var(--teal)}
.switch.on::after{transform:translateX(20px)}
.link{background:none;border:0;color:var(--teal);font:inherit;cursor:pointer;text-decoration:underline;padding:4px 0}

.calhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.calhead h2{margin:0;font-size:22px}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.wd{text-align:center;color:var(--muted);padding:6px 0;font-size:14px}
.sun{color:var(--red)}
.day{position:relative;aspect-ratio:1;border:1px solid transparent;border-radius:10px;background:var(--panel);font:inherit;font-size:17px;cursor:pointer}
.day.today{background:var(--teal);color:#fff}
.day.sel{border-color:var(--ink)}
.dot{position:absolute;bottom:6px;left:50%;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:var(--amber)}

.wnow{display:flex;gap:18px;align-items:center}
.wicon{font-size:64px}
.wtemp{font-size:52px;font-weight:600;line-height:1}
.fday{display:grid;grid-template-columns:1.3fr auto 1fr auto;gap:14px;align-items:center;padding:10px 14px;background:var(--panel);border-radius:10px}
.price{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.chart{width:100%;height:auto;margin-top:10px}
.grid{stroke:var(--line);stroke-dasharray:4 5}

.overlay{position:fixed;inset:0;background:rgba(23,35,31,.88);display:grid;place-items:center;z-index:50}
.ringbox{background:var(--panel);border-radius:20px;padding:36px 44px;text-align:center}
.ringbox p{font-size:20px;margin:14px 0 22px}
@media (prefers-reduced-motion:no-preference){.ringbox{animation:pulse 1s ease-in-out infinite}}
@keyframes pulse{50%{transform:scale(1.04)}}

@media (max-width:720px){
  .app{grid-template-columns:1fr;padding-bottom:70px}
  .nav{position:fixed;inset:auto 0 0 0;height:auto;flex-direction:row;padding:6px;background:var(--panel);border-right:0;border-top:1px solid var(--line);z-index:20;justify-content:space-around}
  .brand{display:none}
  .tab{flex-direction:column;gap:2px;font-size:11px;padding:6px 4px;flex:1;align-items:center;text-align:center}
  .main{padding:20px 16px}
  .big{font-size:52px}
}
`;