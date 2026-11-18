"use client";

/**
 * Shuttle App – หน้าเดียวจบ (UI ครบ 7 หน้าจอ + รูปรถ SVG + เชื่อม Google Apps Script)
 * ไม่ต้องใช้ Tailwind / DaisyUI / ไฟล์รูปใน public
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

/* ───────── Types ───────── */
type Vehicle = { id: string; name: string; desc: string; price: number; max: number };
type Driver = { name: string; car: string; rating: number };
type Recent = { name: string; sub: string };
type Status = "ongoing" | "done" | "cancelled";
type Booking = { id: string; fare: number; seats: number; vehicle: string; driver: Driver };
type Trip = { id: string; from: string; to: string; v: string; n: number; fare: number; st: Status; d: string };
type Screen = "home" | "select" | "track" | "done" | "trips" | "tix" | "prof";
type SheetItem =
  | { k: "row"; i: string; t: string; s?: string; c?: string; fn: () => void }
  | { k: "btn"; b: string; cls?: string; fn: () => void }
  | { k: "node"; node: ReactNode };

/* ───────── Google Apps Script API ───────── */
const GAS_URL =
  process.env.NEXT_PUBLIC_GAS_URL ??
  "https://script.google.com/macros/s/AKfycbw6yXnk3owJGL3rXCA9dbosLeoVI71vcVAL4mNuqZRY1vvNSKBZQ-hD55bJU2_LAaeGXA/exec";

async function gasGet<T>(action: string): Promise<T> {
  const r = await fetch(`${GAS_URL}?action=${action}`);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j as T;
}
async function gasPost<T>(action: string, payload: object): Promise<T> {
  // text/plain = simple request → ไม่ต้องทำ CORS preflight
  const r = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j as T;
}

/* ───────── ข้อมูลตั้งต้น / สำรอง ───────── */
const DRIVER: Driver = { name: "คุณสมชาย", car: "รถตู้สีขาว · กข 1234", rating: 4.9 };
const FALLBACK = {
  vehicles: [
    { id: "van", name: "รถตู้ร่วม", desc: "8 ที่นั่ง · 15 นาที", price: 60, max: 8 },
    { id: "bus", name: "มินิบัส", desc: "20 ที่นั่ง · 22 นาที", price: 40, max: 20 },
    { id: "private", name: "รถส่วนตัว", desc: "4 ที่นั่ง · 8 นาที", price: 150, max: 4 },
  ] as Vehicle[],
  recent: [
    { name: "บ้าน", sub: "ที่อยู่ที่บันทึกไว้" },
    { name: "ที่ทำงาน", sub: "ที่อยู่ที่บันทึกไว้" },
    { name: "สถานีขนส่ง", sub: "เดินทางล่าสุด" },
  ] as Recent[],
};
const SEED: Trip[] = [
  { id: "BK24110301", from: "บ้าน", to: "ที่ทำงาน", v: "รถตู้ร่วม", n: 1, fare: 60, st: "done", d: "3 พ.ย. 2026" },
  { id: "BK24102812", from: "บ้าน", to: "สถานีขนส่ง", v: "มินิบัส", n: 2, fare: 80, st: "done", d: "28 ต.ค. 2026" },
  { id: "BK24101507", from: "ที่ทำงาน", to: "บ้าน", v: "รถส่วนตัว", n: 1, fare: 150, st: "cancelled", d: "15 ต.ค. 2026" },
];
const PM = ["พร้อมเพย์", "เงินสด", "บัตรเครดิต •••• 4242"];
const ETA = 4;
const VC = ["#2563eb", "#f97316", "#16a34a"];
const REC_C = ["#fde68a", "#bbf7d0", "#e9d5ff"];
const REPLIES = ["รับทราบครับ", "ได้เลยครับ อีกไม่กี่นาทีถึงแล้วครับ", "ขอบคุณครับ"];
const NAV: { l: string; s: Screen; c: string }[] = [
  { l: "หน้าหลัก", s: "home", c: "#2563eb" },
  { l: "การเดินทาง", s: "trips", c: "#fdba74" },
  { l: "ตั๋วของฉัน", s: "tix", c: "#d8b4fe" },
  { l: "โปรไฟล์", s: "prof", c: "#5eead4" },
];

/* ───────── Styles ───────── */
const CSS = `
.sh{min-height:100dvh;background:var(--page);color:var(--fg);font-size:15px;--bg:#fff;--fg:#0f172a;--mut:#475569;--line:#93c5fd;--soft:#eff6ff;--p:#2563eb;--pt:#fff;--ok:#16a34a;--or:#f97316;--er:#b91c1c;--page:linear-gradient(160deg,#dbeafe,#ede9fe 50%,#fce7f3);box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
.sh *{box-sizing:border-box}
.app{max-width:390px;margin:0 auto;min-height:100dvh;background:var(--bg);position:relative;overflow:hidden;display:flex;flex-direction:column}
@media(min-width:600px){.app{height:882px;min-height:0;margin:24px auto;border-radius:28px;box-shadow:0 20px 60px #0004}}
.s{display:flex;flex:1;flex-direction:column;min-height:0}
.map{position:relative;flex:none;background:#dbeafe;overflow:hidden}.map svg{position:absolute;inset:0;width:100%;height:100%}
.card{border:1.5px solid var(--line);border-radius:14px;padding:14px 16px;background:var(--bg)}
.row{display:flex;align-items:center;gap:12px}.b{margin-left:auto;font-weight:700}.sub{color:var(--mut);font-size:13px}
.dot{width:16px;height:16px;border-radius:50%;border:2px solid var(--ok);flex:none}.dot.d{background:var(--or);border-color:var(--or)}
.sheet{margin-top:-24px;position:relative;background:var(--bg);border-radius:24px 24px 0 0;border-top:1.5px solid var(--line);padding:20px;display:flex;flex-direction:column;gap:12px;flex:1}
.sh button{font:inherit;cursor:pointer}
.cta{height:52px;border:0;border-radius:12px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-weight:700;font-size:16px;width:100%}
.cta:disabled{opacity:.6}
.gh{height:44px;border-radius:12px;background:var(--bg);border:1.5px solid var(--p);color:var(--p);font-weight:600;font-size:14px;flex:1}
.circ{width:44px;height:44px;border-radius:50%;border:1.5px solid var(--p);background:var(--bg);color:var(--p);font-size:18px;flex:none}
.h{padding:48px 20px 12px;display:flex;align-items:center;gap:12px;font-weight:700;font-size:18px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff}.h .circ{background:#ffffff33;border-color:#fff;color:#fff}
.rec{display:flex;align-items:center;gap:12px;padding:8px;border:0;background:none;color:inherit;text-align:left;border-radius:12px;width:100%}.rec:hover{background:var(--soft)}
.ic{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#0f172a;flex:none}
.veh{display:flex;align-items:center;gap:12px;border:2px solid var(--line);border-radius:14px;padding:10px 14px;cursor:pointer}.veh.on{border-color:var(--p);background:var(--soft)}
.veh input{position:absolute;opacity:0;pointer-events:none}
.nav{display:flex;border-top:1.5px solid var(--line);padding:8px 8px 20px;font-size:12px;color:var(--mut)}.nav div{flex:1;text-align:center}.nav i{display:block;width:24px;height:24px;border-radius:6px;margin:0 auto 4px}
.steps{display:flex;gap:6px}.steps div{flex:1;font-size:11px;text-align:center;color:var(--mut)}.steps div:before{content:"";display:block;height:6px;border-radius:3px;background:#bfdbfe;margin-bottom:4px}.steps .on:before{background:var(--ok)}
.st{font-size:28px;background:none;border:0;color:#cbd5e1;padding:2px}.st.on{color:#f59e0b}
.sh textarea,.sh input.in{font:inherit;color:var(--fg);background:var(--bg)}

.nav button{flex:1;border:0;background:none;color:var(--mut);font-size:12px;padding:0}.nav button.on{color:var(--p);font-weight:700}
.ov{position:absolute;inset:0;background:#0006;display:none;align-items:flex-end;z-index:20}.ov.on{display:flex}
.sheetm{background:var(--bg);width:100%;border-radius:24px 24px 0 0;padding:20px 20px 28px;display:flex;flex-direction:column;gap:10px;max-height:85%;overflow:auto}
.ov.full{align-items:stretch;background:var(--bg)}
.msgs{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:8px}
.msg{max-width:80%;padding:8px 12px;border-radius:14px;background:var(--soft)}.msg.me{align-self:flex-end;background:var(--p);color:var(--pt)}
.chip{border:1.5px solid var(--p);background:var(--bg);color:var(--p);border-radius:999px;padding:6px 12px;font-size:13px;white-space:nowrap}
.call{background:#1e3a8a!important;color:#fff;flex-direction:column;align-items:center!important;justify-content:center;gap:12px;text-align:center}
.call button{width:64px;height:64px;border-radius:50%;border:0;background:#ffffff33;color:#fff;font-size:13px}.call button[aria-pressed=true]{background:#fff;color:#1e3a8a}.call .end{background:#dc2626}
.sw{width:46px;height:26px;border-radius:13px;border:0;background:#94a3b8;position:relative;flex:none}.sw:after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.15s}.sw.on{background:var(--p)}.sw.on:after{left:23px}
.chp{font-size:12px;font-weight:700;padding:2px 10px;border-radius:999px;background:#dbeafe;color:#1e3a8a}.chp.d{background:#bbf7d0;color:#14532d}.chp.c{background:#fecaca;color:#7f1d1d}
.hc{flex:1;border:1.5px solid #ffffff00;border-radius:14px;padding:8px 2px;display:flex;flex-direction:column;align-items:center;gap:2px;color:inherit;font-size:13px}
.sheet:before{content:"";width:44px;height:5px;border-radius:3px;background:linear-gradient(90deg,#f97316,#ec4899,#7c3aed);align-self:center;flex:none}
.s .card{background:linear-gradient(135deg,#2563eb14,#ec489914),var(--bg)}
.danger{color:var(--er)!important;border-color:var(--er)!important}
.lst{padding:0 20px;flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px}

.sh.dk{--bg:#0f172a;--fg:#f1f5f9;--mut:#cbd5e1;--line:#1d4ed8;--soft:#1e293b;--p:#60a5fa;--pt:#0f172a;--ok:#4ade80;--or:#fb923c;--er:#fca5a5;--page:#020617}
.toast{position:absolute;top:16px;left:50%;transform:translateX(-50%);background:#1e3a8a;color:#fff;padding:10px 16px;border-radius:12px;font-size:14px;z-index:30;white-space:nowrap}
.off{background:#f97316;color:#0f172a;font-size:12px;font-weight:600;text-align:center;padding:4px 12px}
`;

/* ───────── รูปภาพ (inline SVG) ───────── */
function VehSvg({ i, w }: { i: number; w: number }) {
  const bodies = [
    <g key="0">
      <path d="M8 56V28q0-10 10-10h50q8 0 14 8l20 14q6 4 6 12v4q0 4-4 4H12q-4 0-4-4z" fill="#2563eb" />
      <path d="M16 26h14v16H16zM34 26h16v16H34zM54 26h16v16H54z" fill="#dbeafe" />
      <path d="M76 26l16 12H76z" fill="#dbeafe" />
      <rect x="8" y="46" width="104" height="4" fill="#1d4ed8" />
      <rect x="104" y="48" width="8" height="5" rx="2" fill="#fde68a" />
      <circle cx="30" cy="60" r="10" fill="#0f172a" /><circle cx="30" cy="60" r="4" fill="#94a3b8" />
      <circle cx="88" cy="60" r="10" fill="#0f172a" /><circle cx="88" cy="60" r="4" fill="#94a3b8" />
    </g>,
    <g key="1">
      <rect x="6" y="14" width="108" height="46" rx="10" fill="#f97316" />
      <g fill="#ffedd5"><rect x="12" y="22" width="16" height="16" rx="2" /><rect x="32" y="22" width="16" height="16" rx="2" /><rect x="52" y="22" width="16" height="16" rx="2" /><rect x="72" y="22" width="16" height="16" rx="2" /><path d="M92 22h14q4 0 4 4v12H92z" /></g>
      <rect x="6" y="44" width="108" height="5" fill="#c2410c" />
      <rect x="104" y="50" width="8" height="5" rx="2" fill="#fde68a" />
      <circle cx="30" cy="60" r="10" fill="#0f172a" /><circle cx="30" cy="60" r="4" fill="#94a3b8" />
      <circle cx="90" cy="60" r="10" fill="#0f172a" /><circle cx="90" cy="60" r="4" fill="#94a3b8" />
    </g>,
    <g key="2">
      <path d="M10 56v-12q0-6 6-8l14-4 14-14q3-3 8-3h22q6 0 10 4l12 13 12 3q8 2 8 10v11q0 4-4 4H14q-4 0-4-4z" fill="#16a34a" />
      <path d="M46 20h20q3 0 5 2l9 12H42z" fill="#dcfce7" />
      <rect x="10" y="48" width="100" height="4" fill="#15803d" />
      <rect x="104" y="44" width="8" height="5" rx="2" fill="#fde68a" />
      <circle cx="32" cy="58" r="10" fill="#0f172a" /><circle cx="32" cy="58" r="4" fill="#94a3b8" />
      <circle cx="88" cy="58" r="10" fill="#0f172a" /><circle cx="88" cy="58" r="4" fill="#94a3b8" />
    </g>,
  ];
  return (
    <svg viewBox="0 0 120 80" width={w} height={Math.round((w * 2) / 3)} style={{ flex: "none" }} role="img" aria-label={FALLBACK.vehicles[i % 3].name}>
      <ellipse cx="60" cy="72" rx="48" ry="4" fill="#0f172a" opacity=".15" />
      {bodies[i % 3]}
    </svg>
  );
}
const vIdx = (name: string) => Math.max(0, FALLBACK.vehicles.findIndex((x) => x.name === name));

function MapSvg({ van = false }: { van?: boolean }) {
  return (
    <svg viewBox="0 0 390 470" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <path d="M0 380C100 340 200 420 390 360V470H0Z" fill="#93c5fd" />
      <rect x="100" y="130" width="60" height="50" rx="6" fill="#bbf7d0" />
      <rect x="260" y="270" width="60" height="60" rx="6" fill="#fde68a" />
      <rect x="10" y="20" width="70" height="90" rx="6" fill="#bfdbfe" />
      <rect x="180" y="20" width="60" height="90" rx="6" fill="#c7d2fe" />
      <rect x="10" y="200" width="70" height="50" rx="6" fill="#fbcfe8" />
      <g stroke="#fff" strokeWidth="14" fill="none"><path d="M-10 120H400" /><path d="M-10 260H400" /><path d="M90-10V400" /><path d="M250-10V400" /></g>
      <g stroke="#fff" strokeWidth="6"><path d="M-10 190H400" /><path d="M170-10V400" /><path d="M330-10V400" /></g>
      <path d="M100 300C150 260 200 250 270 190" stroke="#f97316" strokeWidth="4" strokeDasharray="8 6" fill="none" />
      <circle cx="100" cy="300" r="10" fill="#16a34a" stroke="#fff" strokeWidth="3" />
      <rect x="261" y="181" width="18" height="18" rx="4" fill="#f97316" stroke="#fff" strokeWidth="3" />
      {van && (
        <g>
          <rect x="-14" y="-9" width="28" height="18" rx="5" fill="#2563eb" stroke="#fff" strokeWidth="2" />
          <rect x="-9" y="-5" width="18" height="6" rx="1.5" fill="#dbeafe" />
          <animateMotion dur="14s" repeatCount="indefinite" path="M270 190C200 250 150 260 100 300" />
        </g>
      )}
    </svg>
  );
}
function DriverSvg({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" style={{ borderRadius: "50%", flex: "none" }} role="img" aria-label="รูปคนขับ">
      <rect width="96" height="96" fill="#bfdbfe" />
      <path d="M10 96c3-22 20-30 38-30s35 8 38 30z" fill="#1d4ed8" />
      <rect x="42" y="52" width="12" height="16" rx="4" fill="#d9a066" />
      <ellipse cx="48" cy="40" rx="17" ry="19" fill="#e8b27d" />
      <path d="M30 36c0-14 10-20 18-20s18 6 18 20c-4-8-10-11-18-11s-14 3-18 11z" fill="#1e293b" />
      <circle cx="42" cy="42" r="2" fill="#1e293b" /><circle cx="54" cy="42" r="2" fill="#1e293b" />
    </svg>
  );
}
function Qr({ id }: { id: string }) {
  const cells: ReactNode[] = [];
  let k = 0;
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++) {
      k = (k * 31 + id.charCodeAt((i * 9 + j) % id.length) + i * j) % 97;
      if (k % 2) cells.push(<rect key={i * 9 + j} x={j * 8} y={i * 8} width="8" height="8" />);
    }
  return <svg viewBox="0 0 72 72" width="120" height="120" fill="currentColor" role="img" aria-label="QR ตั๋ว">{cells}</svg>;
}
const Chip = ({ st }: { st: Status }) => (
  <span className={`chp ${st === "done" ? "d" : st === "cancelled" ? "c" : ""}`}>{st === "done" ? "สำเร็จ" : st === "cancelled" ? "ยกเลิก" : "กำลังเดินทาง"}</span>
);
const Switch = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
  <button className={`sw${on ? " on" : ""}`} role="switch" aria-checked={on} aria-label={label} onClick={onClick} />
);

/* ───────── Page ───────── */
export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const screenRef = useRef<Screen>("home");
  const [vehicles, setVehicles] = useState<Vehicle[]>(FALLBACK.vehicles);
  const [recent, setRecent] = useState<Recent[]>(FALLBACK.recent);
  const [offline, setOffline] = useState(false);
  const [from, setFrom] = useState("ตำแหน่งปัจจุบัน");
  const [to, setTo] = useState("");
  const [sel, setSel] = useState(0);
  const [seats, setSeats] = useState(1);
  const [pm, setPm] = useState(0);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [hist, setHist] = useState<Trip[]>(SEED);
  const [busy, setBusy] = useState(false);
  const [t, setT] = useState(0);
  const [rate, setRate] = useState(5);
  const [comment, setComment] = useState("");
  const [toast, setToast] = useState("");
  const [sheet, setSheet] = useState<{ title: string; items: SheetItem[] } | null>(null);
  const [chat, setChat] = useState(false);
  const [msgs, setMsgs] = useState<{ m: string; me?: boolean }[]>([{ m: "สวัสดีครับ กำลังไปรับนะครับ" }]);
  const [cin, setCin] = useState("");
  const [call, setCall] = useState<{ sec: number; mute: boolean; spk: boolean } | null>(null);
  const [dark, setDark] = useState(false);
  const [noti, setNoti] = useState(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyIdx = useRef(0);
  const msgBox = useRef<HTMLDivElement | null>(null);

  const v = vehicles[sel] ?? vehicles[0];
  const ongoing = status === "ongoing" && booking;

  const go = (s: Screen) => { screenRef.current = s; setScreen(s); setSheet(null); };
  const say = (m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };
  const close = () => setSheet(null);
  const patchTrip = (id: string, st: Status) => setHist((h) => h.map((x) => (x.id === id ? { ...x, st } : x)));

  useEffect(() => {
    gasGet<typeof FALLBACK>("init").then((d) => { setVehicles(d.vehicles); setRecent(d.recent); }).catch(() => setOffline(true));
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setDark(true);
  }, []);

  /* จำลองการเดินทาง: นับถอยหลัง ETA → กำลังเดินทาง → ถึงที่หมาย (ทำงานต่อแม้ออกจากหน้าติดตาม) */
  const bid = ongoing ? booking.id : null;
  useEffect(() => {
    if (!bid) return;
    setT(0);
    const id = setInterval(() => setT((x) => x + 1), 2000);
    return () => clearInterval(id);
  }, [bid]);

  useEffect(() => {
    if (!booking || status !== "ongoing" || t < ETA + 3) return;
    const id = setTimeout(() => {
      setStatus("done");
      patchTrip(booking.id, "done");
      gasPost("updateBooking", { id: booking.id, status: "completed" }).catch(() => {});
      if (screenRef.current === "track") go("done");
      else say("ถึงที่หมายแล้ว · ดูใบเสร็จที่หน้าการเดินทาง");
    }, 1200);
    return () => clearTimeout(id);
  }, [t, status, booking]);

  useEffect(() => { msgBox.current?.scrollTo({ top: 1e5 }); }, [msgs, chat]);

  useEffect(() => {
    if (!call) return;
    const id = setInterval(() => setCall((c) => (c ? { ...c, sec: c.sec + 1 } : c)), 1000);
    return () => clearInterval(id);
  }, [!!call]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ───── actions ───── */
  const startBooking = () => {
    if (ongoing) { say("คุณมีการเดินทางที่กำลังดำเนินอยู่"); return go("track"); }
    if (!to.trim()) return say("กรุณาระบุจุดหมาย");
    go("select");
  };

  const confirm = async () => {
    setBusy(true);
    let b: Booking;
    try {
      b = await gasPost<Booking>("createBooking", { from, to, vehicle: v.id, seats });
    } catch {
      b = { id: "BK" + Date.now().toString().slice(-8), fare: v.price * seats, seats, vehicle: v.name, driver: DRIVER };
      setOffline(true);
    }
    const d = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
    setHist((h) => [{ id: b.id, from, to, v: b.vehicle, n: b.seats, fare: b.fare, st: "ongoing", d }, ...h]);
    setBooking(b); setStatus("ongoing"); setT(0); setBusy(false); go("track");
  };

  const cancel = () =>
    setSheet({
      title: "ยกเลิกการจอง?",
      items: [
        { k: "node", node: <div className="sub">การจองนี้จะไม่ถูกเรียกเก็บเงิน</div> },
        { k: "btn", b: "ยืนยันยกเลิก", cls: "gh danger", fn: () => {
            if (booking) { patchTrip(booking.id, "cancelled"); gasPost("updateBooking", { id: booking.id, status: "cancelled" }).catch(() => {}); }
            setStatus("cancelled"); say("ยกเลิกการจองแล้ว"); go("home"); } },
        { k: "btn", b: "ไม่ยกเลิก", cls: "cta", fn: close },
      ],
    });

  const finish = async () => {
    if (booking) await gasPost("updateBooking", { id: booking.id, status: "rated", rating: rate, comment }).catch(() => {});
    say("ขอบคุณสำหรับคะแนน!");
    setComment(""); setTo(""); setSeats(1); setRate(5); go("home");
  };

  const receipt = (h: Trip) =>
    setSheet({
      title: "ใบเสร็จ " + h.id,
      items: [
        { k: "node", node: <div style={{ textAlign: "center" }}><VehSvg i={vIdx(h.v)} w={120} /></div> },
        { k: "node", node: (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
            <div className="row">สถานะ<span className="b"><Chip st={h.st} /></span></div>
            <div className="row">จุดหมาย<b className="b">{h.to}</b></div>
            <div className="row">รถ · ที่นั่ง<b className="b">{h.v} · {h.n}</b></div>
            <div className="row">ค่าโดยสาร<b className="b">฿{h.fare}</b></div>
            <div className="row">ชำระด้วย<b className="b">{PM[pm]}</b></div>
            <div className="row">วันที่<b className="b">{h.d}</b></div>
          </div>) },
        { k: "btn", b: "ส่งใบเสร็จทางอีเมล", fn: () => { close(); say("ส่งใบเสร็จแล้ว"); } },
        { k: "btn", b: "ปิด", cls: "cta", fn: close },
      ],
    });

  const paySheet = () =>
    setSheet({
      title: "ช่องทางชำระเงิน",
      items: PM.map((n, i) => ({ k: "row" as const, i: ["฿", "฿", "▭"][i], t: n, s: i === pm ? "ใช้งานอยู่" : "", c: ["#bbf7d0", "#fde68a", "#e9d5ff"][i], fn: () => { setPm(i); close(); } })),
    });

  const pickSheet = () =>
    setSheet({
      title: "เลือกจุดรับ",
      items: ["ตำแหน่งปัจจุบัน", "บ้าน", "ที่ทำงาน"].map((n, i) => ({ k: "row" as const, i: n[0], t: n, c: REC_C[i], fn: () => { setFrom(n); close(); } })),
    });

  const helpSheet = () =>
    setSheet({
      title: "ศูนย์ช่วยเหลือ",
      items: [
        { k: "row", i: "☎", t: "โทรฝ่ายบริการลูกค้า", s: "1234 · ทุกวัน 06:00–22:00", fn: () => { close(); say("กำลังโทร 1234 (จำลอง)"); } },
        { k: "row", i: "✉", t: "ส่งอีเมลถึงเรา", s: "help@shuttle.example", c: "#fde68a", fn: () => { close(); say("เปิดอีเมล (จำลอง)"); } },
        { k: "btn", b: "ปิด", fn: close },
      ],
    });

  const logout = () =>
    setSheet({
      title: "ออกจากระบบ?",
      items: [
        { k: "btn", b: "ออกจากระบบ", cls: "gh danger", fn: () => { setBooking(null); setStatus(null); say("ออกจากระบบแล้ว"); go("home"); } },
        { k: "btn", b: "ยกเลิก", cls: "cta", fn: close },
      ],
    });

  const send = (txt?: string) => {
    const m = (txt ?? cin).trim();
    if (!m) return;
    setMsgs((x) => [...x, { m, me: true }]);
    setCin("");
    setTimeout(() => setMsgs((x) => [...x, { m: REPLIES[replyIdx.current++ % 3] }]), 900);
  };

  const share = () => {
    const u = `${location.href.split("#")[0]}#${booking?.id ?? "trip"}`;
    navigator.clipboard?.writeText(u).then(() => say("คัดลอกลิงก์เส้นทางแล้ว"), () => say("ลิงก์: " + u)) ?? say("ลิงก์: " + u);
  };

  const pickVehicle = (i: number) => { setSel(i); setSeats((s) => Math.min(s, vehicles[i].max)); startBooking(); };

  const phase = t < ETA ? `รถถึงใน ${ETA - t} นาที` : t < ETA + 3 ? "กำลังเดินทางไปยังจุดหมาย" : "ถึงที่หมายแล้ว";
  const mm = (n: number) => String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0");

  const NavBar = ({ cur }: { cur: Screen }) => (
    <nav className="nav" aria-label="เมนูหลัก">
      {NAV.map((x) => (
        <button key={x.s} className={x.s === cur ? "on" : ""} onClick={() => go(x.s)}><i style={{ background: x.c }} />{x.l}</button>
      ))}
    </nav>
  );

  return (
    <div className={`sh${dark ? " dk" : ""}`}>
      <style>{CSS}</style>
      <main className="app">
        {offline && <div className="off" role="status">เชื่อมต่อ Apps Script ไม่ได้ · ใช้ข้อมูลตัวอย่าง</div>}

        {/* 1 หน้าหลัก */}
        {screen === "home" && (
          <section className="s">
            <div className="map" style={{ height: 380 }}><MapSvg /></div>
            <div className="card" style={{ position: "absolute", left: 20, right: 20, top: 48, boxShadow: "0 6px 20px #0003", display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="row" onClick={pickSheet} style={{ border: 0, background: "none", color: "inherit", padding: 0, textAlign: "left" }}>
                <span className="dot" /><span>{from}</span><span className="b sub">เปลี่ยน ›</span>
              </button>
              <div style={{ borderTop: "1px solid #bfdbfe" }} />
              <label className="row"><span className="dot d" />
                <input className="in" value={to} onChange={(e) => setTo(e.target.value)} placeholder="คุณจะไปที่ไหน?" aria-label="จุดหมาย" style={{ border: 0, outline: 0, width: "100%", fontWeight: 700 }} />
              </label>
            </div>
            <div className="sheet">
              <b style={{ fontSize: 17 }}>เลือกรถที่ใช้บ่อย</b>
              <div className="row" style={{ gap: 8, alignItems: "stretch" }}>
                {vehicles.map((x, i) => (
                  <button key={x.id} className="hc" onClick={() => pickVehicle(i)} style={{ background: `linear-gradient(160deg,${VC[i % 3]}44,${VC[i % 3]}11)`, borderColor: VC[i % 3] }}>
                    <VehSvg i={i} w={84} /><b>{x.name}</b><span className="sub">฿{x.price}</span>
                  </button>
                ))}
              </div>
              <b style={{ fontSize: 17 }}>จุดหมายล่าสุด</b>
              <div>
                {recent.map((r, i) => (
                  <button key={r.name} className="rec" onClick={() => setTo(r.name)}>
                    <span className="ic" style={{ background: REC_C[i % 3] }}>{r.name[0]}</span>
                    <span>{r.name}<br /><span className="sub">{r.sub}</span></span>
                  </button>
                ))}
              </div>
              <button className="cta" style={{ marginTop: "auto" }} onClick={startBooking}>จองรถรับส่ง</button>
            </div>
            <NavBar cur="home" />
          </section>
        )}

        {/* 2 เลือกรถ */}
        {screen === "select" && (
          <section className="s">
            <div className="h"><button className="circ" onClick={() => go("home")} aria-label="ย้อนกลับ">←</button>เลือกรถรับส่ง</div>
            <div style={{ padding: "12px 20px 0", display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto" }}>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="row"><span className="dot" />{from}</div>
                <div className="row"><span className="dot d" /><b>{to}</b></div>
              </div>
              <div className="map" style={{ height: 130, borderRadius: 14 }}><MapSvg /></div>
              <b style={{ fontSize: 17 }}>ประเภทรถ</b>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {vehicles.map((x, i) => (
                  <label key={x.id} className={`veh${i === sel ? " on" : ""}`} style={{ background: `linear-gradient(90deg,${VC[i % 3]}33,transparent)`, borderColor: i === sel ? VC[i % 3] : "var(--line)" }}>
                    <input type="radio" name="v" checked={i === sel} onChange={() => { setSel(i); setSeats((s) => Math.min(s, x.max)); }} />
                    <VehSvg i={i} w={84} />
                    <div><b>{x.name}</b><div className="sub">{x.desc}</div></div>
                    <b className="b">฿{x.price}</b>
                  </label>
                ))}
              </div>
              <div className="row">
                <span>จำนวนที่นั่ง</span>
                <div className="row b" style={{ gap: 14 }}>
                  <button className="circ" aria-label="ลด" style={{ width: 36, height: 36 }} onClick={() => setSeats((s) => Math.max(1, s - 1))}>−</button>
                  <span>{seats}</span>
                  <button className="circ" aria-label="เพิ่ม" style={{ width: 36, height: 36 }} onClick={() => (seats < v.max ? setSeats(seats + 1) : say("ที่นั่งเต็มสำหรับรถประเภทนี้"))}>+</button>
                </div>
              </div>
              <button className="card row" onClick={paySheet} style={{ textAlign: "left", color: "inherit", font: "inherit" }}>
                <span>ชำระด้วย</span><b className="b">{PM[pm]} ›</b>
              </button>
            </div>
            <div style={{ padding: "16px 20px 28px", borderTop: "1.5px solid var(--line)" }}>
              <button className="cta" disabled={busy} onClick={confirm}>{busy ? "กำลังจอง…" : `ยืนยันการจอง · ฿${v.price * seats}`}</button>
            </div>
          </section>
        )}

        {/* 3 ติดตามรถ */}
        {screen === "track" && booking && (
          <section className="s">
            <div className="map" style={{ height: 400 }}>
              <MapSvg van />
              <button className="circ" onClick={() => go("home")} aria-label="ย้อนกลับ" style={{ position: "absolute", left: 20, top: 48, zIndex: 2 }}>←</button>
            </div>
            <div className="sheet">
              <div className="row"><b style={{ fontSize: 20 }} aria-live="polite">{status === "cancelled" ? "ยกเลิกแล้ว" : phase}</b><span className="b sub">#{booking.id}</span></div>
              <div className="steps">
                <div className="on">ยืนยัน</div><div className="on">รถกำลังมา</div>
                <div className={t >= ETA ? "on" : ""}>กำลังเดินทาง</div><div className={t >= ETA + 3 ? "on" : ""}>ถึงที่หมาย</div>
              </div>
              <div className="card row">
                <DriverSvg />
                <div><b>{booking.driver.name} <span style={{ color: "#b45309" }}>{booking.driver.rating} ★</span></b><div className="sub">{booking.driver.car}</div></div>
                <span className="b"><VehSvg i={vIdx(booking.vehicle)} w={84} /></span>
              </div>
              <div className="row">
                <button className="gh" style={{ color: "var(--ok)", borderColor: "var(--ok)" }} onClick={() => setCall({ sec: 0, mute: false, spk: false })}>โทร</button>
                <button className="gh" style={{ color: "#a855f7", borderColor: "#a855f7" }} onClick={() => setChat(true)}>แชท</button>
                <button className="gh" style={{ color: "var(--or)", borderColor: "var(--or)" }} onClick={share}>แชร์เส้นทาง</button>
              </div>
              <button className="gh" style={{ flex: "none", marginTop: "auto", color: "var(--er)", borderColor: "var(--er)" }} onClick={cancel}>ยกเลิกการจอง</button>
            </div>
          </section>
        )}

        {/* 4 ถึงที่หมาย */}
        {screen === "done" && booking && (
          <section className="s">
            <div style={{ textAlign: "center", padding: "64px 0 16px" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#16a34a", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" aria-hidden><path d="M5 12l5 5 9-10" /></svg>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>ถึงที่หมายแล้ว</div>
              <div className="sub">ขอบคุณที่ใช้บริการ</div>
            </div>
            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
                <div className="row">ค่าโดยสาร<b className="b">฿{booking.fare}</b></div>
                <div className="row">รถ · ที่นั่ง<b className="b">{booking.vehicle} · {booking.seats} ที่นั่ง</b></div>
                <div className="row">ชำระด้วย<b className="b">{PM[pm]}</b></div>
              </div>
              <b style={{ textAlign: "center", fontSize: 17 }}>ให้คะแนนการเดินทาง</b>
              <div style={{ textAlign: "center" }}>
                {[1, 2, 3, 4, 5].map((n) => <button key={n} className={`st${n <= rate ? " on" : ""}`} aria-label={`${n} ดาว`} onClick={() => setRate(n)}>★</button>)}
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="เขียนความคิดเห็น (ไม่บังคับ)" aria-label="ความคิดเห็น"
                style={{ height: 90, border: "1.5px solid var(--line)", borderRadius: 14, padding: 12, resize: "none" }} />
            </div>
            <div style={{ padding: "16px 20px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="cta" onClick={finish}>เสร็จสิ้น</button>
              <button className="gh" style={{ flex: "none" }} onClick={() => { const h = hist.find((x) => x.id === booking.id); if (h) receipt(h); }}>ดูใบเสร็จ</button>
            </div>
          </section>
        )}

        {/* 5 การเดินทาง */}
        {screen === "trips" && (
          <section className="s">
            <div className="h">การเดินทางของฉัน</div>
            <div className="lst" style={{ paddingTop: 12 }}>
              {hist.map((h) => (
                <button key={h.id} className="card row" onClick={() => (h.st === "ongoing" ? go("track") : receipt(h))} style={{ textAlign: "left", color: "inherit", font: "inherit" }}>
                  <VehSvg i={vIdx(h.v)} w={64} />
                  <div><b>ไป{h.to}</b><div className="sub">{h.d} · {h.v} · ฿{h.fare}</div></div>
                  <span className="b"><Chip st={h.st} /></span>
                </button>
              ))}
            </div>
            <NavBar cur="trips" />
          </section>
        )}

        {/* 6 ตั๋วของฉัน */}
        {screen === "tix" && (
          <section className="s">
            <div className="h">ตั๋วของฉัน</div>
            <div className="lst" style={{ paddingTop: 12 }}>
              {ongoing ? (
                <>
                  <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <VehSvg i={vIdx(booking.vehicle)} w={130} />
                    <b>{booking.vehicle} · {booking.seats} ที่นั่ง</b>
                    <div className="sub">{from} → {to}</div>
                    <Qr id={booking.id} />
                    <div className="sub">#{booking.id} · ฿{booking.fare}</div>
                  </div>
                  <button className="cta" onClick={() => go("track")}>ติดตามรถ</button>
                  <button className="gh" style={{ flex: "none", color: "var(--er)", borderColor: "var(--er)" }} onClick={cancel}>ยกเลิกการจอง</button>
                </>
              ) : (
                <div className="card" style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
                  <b>ยังไม่มีตั๋วที่ใช้งานอยู่</b><span className="sub">จองรถเพื่อรับตั๋วของคุณ</span>
                  <button className="cta" onClick={() => go("home")}>จองรถรับส่ง</button>
                </div>
              )}
            </div>
            <NavBar cur="tix" />
          </section>
        )}

        {/* 7 โปรไฟล์ */}
        {screen === "prof" && (
          <section className="s">
            <div className="h">โปรไฟล์</div>
            <div className="lst" style={{ paddingTop: 12 }}>
              <div className="row" style={{ padding: "4px 0" }}>
                <svg width="64" height="64" viewBox="0 0 96 96" style={{ borderRadius: "50%" }} aria-hidden>
                  <rect width="96" height="96" fill="#bfdbfe" /><circle cx="48" cy="38" r="16" fill="#1d4ed8" /><path d="M12 96c3-22 20-30 36-30s33 8 36 30z" fill="#1d4ed8" />
                </svg>
                <div><b style={{ fontSize: 18 }}>ผู้ใช้ตัวอย่าง</b><div className="sub">081-234-5678</div></div>
              </div>
              <button className="card row" onClick={paySheet} style={{ textAlign: "left", color: "inherit", font: "inherit" }}>ช่องทางชำระเงิน<span className="b">{PM[pm]} ›</span></button>
              <div className="card row">โหมดมืด<span className="b"><Switch on={dark} label="โหมดมืด" onClick={() => setDark(!dark)} /></span></div>
              <div className="card row">การแจ้งเตือน<span className="b"><Switch on={noti} label="การแจ้งเตือน" onClick={() => setNoti(!noti)} /></span></div>
              <button className="card row" onClick={helpSheet} style={{ textAlign: "left", color: "inherit", font: "inherit" }}>ศูนย์ช่วยเหลือ<span className="b">›</span></button>
              <button className="gh" style={{ flex: "none", color: "var(--er)", borderColor: "var(--er)" }} onClick={logout}>ออกจากระบบ</button>
            </div>
            <NavBar cur="prof" />
          </section>
        )}

        {/* Bottom sheet */}
        {sheet && (
          <div className="ov on" onClick={(e) => e.target === e.currentTarget && close()}>
            <div className="sheetm" role="dialog" aria-label={sheet.title}>
              <b style={{ fontSize: 18 }}>{sheet.title}</b>
              {sheet.items.map((it, i) =>
                it.k === "node" ? <div key={i}>{it.node}</div>
                : it.k === "btn" ? <button key={i} className={it.cls ?? "gh"} style={{ flex: "none" }} onClick={it.fn}>{it.b}</button>
                : <button key={i} className="rec" onClick={it.fn}>
                    <span className="ic" style={{ background: it.c ?? "#bfdbfe" }}>{it.i}</span>
                    <span>{it.t}<br /><span className="sub">{it.s}</span></span>
                  </button>
              )}
            </div>
          </div>
        )}

        {/* แชท */}
        {chat && (
          <div className="ov on full">
            <div className="h" style={{ paddingTop: 20 }}><button className="circ" onClick={() => setChat(false)} aria-label="ปิดแชท">←</button>แชทกับ{booking?.driver.name ?? "คนขับ"}</div>
            <div className="msgs" ref={msgBox}>
              {msgs.map((m, i) => <div key={i} className={`msg${m.me ? " me" : ""}`}>{m.m}</div>)}
            </div>
            <div style={{ display: "flex", gap: 6, padding: "0 16px 8px", overflowX: "auto" }}>
              {["ฉันรออยู่หน้าบ้าน", "เปลี่ยนจุดรับได้ไหม", "ขอบคุณครับ"].map((q) => <button key={q} className="chip" onClick={() => send(q)}>{q}</button>)}
            </div>
            <div className="row" style={{ padding: "8px 16px 24px" }}>
              <input className="in" value={cin} onChange={(e) => setCin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="พิมพ์ข้อความ…" aria-label="ข้อความ"
                style={{ flex: 1, height: 44, border: "1.5px solid var(--line)", borderRadius: 22, padding: "0 16px", font: "inherit" }} />
              <button className="circ" onClick={() => send()} aria-label="ส่ง">➤</button>
            </div>
          </div>
        )}

        {/* โทร */}
        {call && (
          <div className="ov on full call">
            <DriverSvg size={96} />
            <div style={{ fontSize: 22, fontWeight: 700 }}>{booking?.driver.name ?? "คนขับ"}</div>
            <div>{call.sec < 2 ? "กำลังโทร…" : mm(call.sec - 2)}</div>
            <div className="row" style={{ gap: 16, marginTop: 24 }}>
              <button aria-pressed={call.mute} onClick={() => setCall({ ...call, mute: !call.mute })}>ปิดเสียง</button>
              <button aria-pressed={call.spk} onClick={() => setCall({ ...call, spk: !call.spk })}>ลำโพง</button>
              <button className="end" onClick={() => setCall(null)}>วางสาย</button>
            </div>
          </div>
        )}

        {toast && <div className="toast" role="status">{toast}</div>}
      </main>
    </div>
  );
}