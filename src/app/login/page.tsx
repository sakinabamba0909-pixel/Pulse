'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const FONT_URL = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,200;1,9..144,300;1,9..144,400&display=swap";

const P = {
  bg:       "#F2EBE6",
  green:    "#C2DC80", greenDark: "#7A9E35",
  pink:     "#EA9CAF", pinkDark:  "#B85A74",
  orchid:   "#D56989", orchidDark:"#8F3552",
  lilac:    "#F3EEF1",
  ink:      "#2D2026",
  inkSoft:  "#6B5860",
  inkMuted: "#A8949C",
  inkFaint: "#D4C8CD",
};

/* ══ GANZFELD ══ */
function GanzfeldLight() {
  const ref = useRef<HTMLCanvasElement>(null);
  const phase = useRef(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    function resize() { c!.width = window.innerWidth; c!.height = window.innerHeight; }
    resize();
    window.addEventListener("resize", resize);
    function hsl(h: number, s: number, l: number, a: number) { return `hsla(${h},${s}%,${l}%,${a})`; }
    function draw() {
      phase.current += 0.0008;
      const t = phase.current;
      const d = Math.sin(t) * 6;
      const d2 = Math.cos(t * 0.7) * 5;
      const W = c!.width, H = c!.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
      ([
        [W*0.15,H*0.10,W*0.70,330+d,62,88,0.38,0.10],
        [W*0.82,H*0.20,W*0.60,80+d2,52,85,0.28,0.07],
        [W*0.50,H*0.95,W*0.65,355-d,58,87,0.26,0.06],
        [W*0.55,H*0.48,W*0.35,300+d2,46,86,0.18,0.00],
      ] as number[][]).forEach((a) => {
        const g = ctx.createRadialGradient(a[0],a[1],0,a[0],a[1],a[2]);
        g.addColorStop(0,   hsl(a[3],a[4],a[5],a[6]));
        g.addColorStop(0.5, hsl(a[3],a[4],a[5],a[7]));
        g.addColorStop(1,   "transparent");
        ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      });
      frame.current = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(frame.current); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

/* ══ SPLASH ORB ══ */
function SplashOrb() {
  const ref = useRef<HTMLCanvasElement>(null);
  const anim = useRef<number>(0);
  const t = useRef(0);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    const S = c.width;

    function draw() {
      t.current += 0.018;
      const T = t.current;
      ctx.clearRect(0,0,S,S);
      const cx=S/2, cy=S/2, r=S*0.38;

      // outer glow
      const gOuter = ctx.createRadialGradient(cx,cy,0,cx,cy,S*0.5);
      gOuter.addColorStop(0,"rgba(213,105,137,0.12)");
      gOuter.addColorStop(0.6,"rgba(234,156,175,0.06)");
      gOuter.addColorStop(1,"transparent");
      ctx.fillStyle=gOuter; ctx.beginPath(); ctx.arc(cx,cy,S*0.5,0,Math.PI*2); ctx.fill();

      // shimmer rings
      for(let i=0;i<3;i++){
        const angle=T*(0.4+i*0.15)+(i*Math.PI*2/3);
        const rx=cx+Math.cos(angle)*r*0.18;
        const ry=cy+Math.sin(angle)*r*0.18;
        const shimR=r*(0.92+Math.sin(T*0.9+i)*0.04);
        const gShim=ctx.createRadialGradient(rx,ry,0,cx,cy,shimR);
        const colors=[
          ["rgba(234,156,175,","rgba(213,105,137,"],
          ["rgba(194,220,128,","rgba(234,156,175,"],
          ["rgba(213,105,137,","rgba(194,220,128,"],
        ];
        gShim.addColorStop(0,   colors[i][0]+"0.0)");
        gShim.addColorStop(0.5, colors[i][1]+"0.05)");
        gShim.addColorStop(0.75,colors[i][0]+"0.18)");
        gShim.addColorStop(1,   colors[i][1]+"0.0)");
        ctx.fillStyle=gShim; ctx.beginPath(); ctx.arc(cx,cy,shimR,0,Math.PI*2); ctx.fill();
      }

      // main body
      const wobble=Math.sin(T*1.1)*0.025;
      const gMain=ctx.createRadialGradient(
        cx-r*0.18+Math.sin(T*0.7)*r*0.06,
        cy-r*0.14+Math.cos(T*0.9)*r*0.04,
        0,cx,cy,r*(1+wobble)
      );
      gMain.addColorStop(0,"rgba(243,225,230,0.95)");
      gMain.addColorStop(0.25,"rgba(234,156,175,0.88)");
      gMain.addColorStop(0.55,"rgba(213,105,137,0.82)");
      gMain.addColorStop(0.78,"rgba(194,220,128,0.45)");
      gMain.addColorStop(1,"rgba(194,220,128,0.0)");
      ctx.fillStyle=gMain;
      ctx.beginPath(); ctx.arc(cx,cy,r*(1+wobble),0,Math.PI*2); ctx.fill();

      // inner light
      const gInner=ctx.createRadialGradient(cx-r*0.2,cy-r*0.2,0,cx,cy,r*0.55);
      gInner.addColorStop(0,"rgba(255,242,245,0.7)");
      gInner.addColorStop(0.5,"rgba(255,242,245,0.15)");
      gInner.addColorStop(1,"transparent");
      ctx.fillStyle=gInner; ctx.beginPath(); ctx.arc(cx,cy,r*0.55,0,Math.PI*2); ctx.fill();

      // specks
      for(let j=0;j<5;j++){
        const specAngle=T*(0.2+j*0.08)+j*1.26;
        const specR=r*(0.6+Math.sin(T*0.5+j)*0.2);
        const specX=cx+Math.cos(specAngle)*specR;
        const specY=cy+Math.sin(specAngle)*specR;
        const specColors=["rgba(194,220,128,","rgba(234,156,175,","rgba(213,105,137,","rgba(243,238,241,","rgba(212,164,122,"];
        ctx.beginPath();
        ctx.arc(specX,specY,2.5+Math.sin(T+j)*1.2,0,Math.PI*2);
        ctx.fillStyle=specColors[j%specColors.length]+"0.55)";
        ctx.fill();
      }

      anim.current=requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(anim.current); };
  }, []);

  return <canvas ref={ref} width={280} height={280} style={{ width:280, height:280 }} />;
}

/* ══ TYPEWRITER ══ */
function TypeWriter({ text, speed = 45 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState("");
  const idx = useRef(0);
  useEffect(() => {
    idx.current = 0; setShown("");
    const iv = setInterval(() => {
      if (idx.current < text.length) { setShown(text.slice(0, idx.current + 1)); idx.current++; }
      else clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return <span>{shown}<span style={{ opacity: shown.length < text.length ? 1 : 0, color: P.orchid, transition: "opacity 0.3s" }}>|</span></span>;
}

/* ══════════════════════════════════════════
   MAIN LOGIN PAGE — 3 screens:
   splash | login | signup
══════════════════════════════════════════ */
export default function LoginPage() {
  const [phase, setPhase] = useState(0);
  const [screen, setScreen] = useState<"splash" | "login" | "signup">("splash");

  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Splash entrance sequence
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (screen === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else setMessage('Check your email for a confirmation link!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else { router.push('/'); router.refresh(); }
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const ANIM = `
    *{box-sizing:border-box;margin:0;padding:0}
    ::selection{background:rgba(213,105,137,0.2);color:#2D2026}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes orbUp{from{opacity:0;transform:translateY(30px) scale(0.88)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes nameSlide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes tagSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes btnsIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes glowPulse{0%,100%{opacity:.45}50%{opacity:1}}
    @keyframes dotFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
    button{font-family:'Outfit',sans-serif}
    button:active{transform:scale(0.97)}
    input:focus{outline:none;border-color:rgba(213,105,137,0.5)!important}
  `;

  /* ── LOGIN / SIGNUP SCREEN ── */
  if (screen === "login" || screen === "signup") {
    const isSignUp = screen === "signup";
    return (
      <div style={{ height:"100vh", display:"flex", fontFamily:"'Outfit',sans-serif" }}>
        <link href={FONT_URL} rel="stylesheet" />
        <style>{ANIM}</style>
        <GanzfeldLight />
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", zIndex:1, padding:"0 32px" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"100%", maxWidth:400 }}>
            <SplashOrb />
            <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:40, fontWeight:200, color:P.ink, letterSpacing:-1.2, marginTop:8, marginBottom:32, animation:"fadeUp 0.6s ease both" }}>
              Pulse
            </h1>

            {/* Google */}
            <button onClick={handleGoogleAuth} style={{
              width:"100%", padding:"14px 20px", borderRadius:16,
              background:"rgba(255,255,255,0.72)", border:"1px solid rgba(45,32,38,0.1)",
              backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              fontSize:14, fontWeight:400, color:P.ink, cursor:"pointer", marginBottom:12,
              animation:"fadeUp 0.5s ease 0.1s both", fontFamily:"'Outfit',sans-serif",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:14, width:"100%", marginBottom:12, animation:"fadeUp 0.5s ease 0.15s both" }}>
              <div style={{ flex:1, height:1, background:"rgba(45,32,38,0.08)" }} />
              <span style={{ fontSize:11, color:P.inkMuted, fontWeight:300 }}>or</span>
              <div style={{ flex:1, height:1, background:"rgba(45,32,38,0.08)" }} />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} style={{ width:"100%" }}>
              <input
                placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width:"100%", padding:"13px 16px", borderRadius:14, border:"1px solid rgba(45,32,38,0.1)", background:"rgba(255,255,255,0.65)", backdropFilter:"blur(12px)", fontSize:14, color:P.ink, fontFamily:"'Outfit',sans-serif", marginBottom:10, animation:"fadeUp 0.5s ease 0.2s both" }}
              />
              <input
                placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                style={{ width:"100%", padding:"13px 16px", borderRadius:14, border:"1px solid rgba(45,32,38,0.1)", background:"rgba(255,255,255,0.65)", backdropFilter:"blur(12px)", fontSize:14, color:P.ink, fontFamily:"'Outfit',sans-serif", marginBottom:16, animation:"fadeUp 0.5s ease 0.22s both" }}
              />

              {error && (
                <div style={{ padding:"10px 14px", borderRadius:12, marginBottom:14, background:"rgba(213,105,137,0.10)", border:"1px solid rgba(213,105,137,0.25)" }}>
                  <p style={{ fontSize:13, color:P.orchid }}>{error}</p>
                </div>
              )}
              {message && (
                <div style={{ padding:"10px 14px", borderRadius:12, marginBottom:14, background:"rgba(194,220,128,0.15)", border:"1px solid rgba(194,220,128,0.3)" }}>
                  <p style={{ fontSize:13, color:P.greenDark }}>{message}</p>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width:"100%", padding:"14px", borderRadius:16,
                background: loading ? "rgba(213,105,137,0.25)" : `linear-gradient(135deg,${P.orchid},${P.pink})`,
                color: loading ? P.inkMuted : "white", border:"none", fontSize:15, fontWeight:500, cursor: loading ? "default" : "pointer",
                boxShadow: loading ? "none" : "0 4px 24px rgba(213,105,137,0.35)",
                animation:"fadeUp 0.5s ease 0.28s both", fontFamily:"'Outfit',sans-serif",
              }}>
                {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign in'}
              </button>
            </form>

            <p style={{ fontSize:12, color:P.inkMuted, marginTop:20, fontWeight:300, animation:"fadeUp 0.5s ease 0.32s both" }}>
              {isSignUp ? 'Already have an account? ' : 'No account? '}
              <span
                style={{ color:P.orchid, cursor:"pointer", fontWeight:500 }}
                onClick={() => { setScreen(isSignUp ? "login" : "signup"); setError(''); setMessage(''); }}
              >
                {isSignUp ? 'Sign in' : 'Create one \u2192'}
              </span>
            </p>

            <button onClick={() => setScreen("splash")} style={{ marginTop:32, background:"none", border:"none", fontSize:11, color:P.inkFaint, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
              \u2190 Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     MAIN SPLASH SCREEN
  ══════════════════════════════════════ */
  return (
    <div style={{ height:"100vh", display:"flex", fontFamily:"'Outfit',sans-serif", overflow:"hidden" }}>
      <link href={FONT_URL} rel="stylesheet" />
      <style>{ANIM}</style>
      <GanzfeldLight />

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", zIndex:1, padding:"0 32px" }}>

        {/* Floating color dots */}
        {phase >= 1 && (
          <div style={{ position:"absolute", top:"50%", left:"50%", width:400, height:400, marginLeft:-200, marginTop:-200, pointerEvents:"none" }}>
            {[
              { color:P.green, x:-170, y:-80, size:8, delay:"0.2s", dur:"3.2s" },
              { color:P.pink, x:160, y:-110, size:6, delay:"0.5s", dur:"4.1s" },
              { color:P.orchid, x:-140, y:120, size:10, delay:"0.1s", dur:"3.7s" },
              { color:P.green, x:150, y:100, size:5, delay:"0.4s", dur:"4.5s" },
              { color:P.pink, x:-60, y:-150, size:7, delay:"0.3s", dur:"3.9s" },
              { color:"#D4A47A", x:90, y:140, size:6, delay:"0.6s", dur:"4.3s" },
            ].map((d, i) => (
              <div key={i} style={{
                position:"absolute", left:"50%", top:"50%",
                marginLeft:d.x, marginTop:d.y,
                width:d.size, height:d.size, borderRadius:"50%",
                background:d.color, opacity:0.5,
                animation: `dotFloat ${d.dur} ease ${d.delay} infinite, fadeIn 0.8s ease ${d.delay} both`,
              }} />
            ))}
          </div>
        )}

        {/* Orb */}
        <div style={{ animation: phase >= 0 ? "orbUp 1.1s cubic-bezier(0.22,1,0.36,1) both" : "none", marginBottom:-8 }}>
          <SplashOrb />
        </div>

        {/* Wordmark */}
        {phase >= 1 && (
          <h1 style={{
            fontFamily:"'Fraunces',serif", fontSize:68, fontWeight:200,
            letterSpacing:-3, color:P.ink, lineHeight:1, marginBottom:4,
            animation:"nameSlide 0.8s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            Pulse
          </h1>
        )}

        {/* Tagline */}
        {phase >= 2 && (
          <p style={{
            fontSize:15, fontWeight:300, color:P.inkMuted, letterSpacing:0.2, marginBottom:0,
            animation:"tagSlide 0.7s cubic-bezier(0.22,1,0.36,1) both", textAlign:"center",
          }}>
            <TypeWriter text="Your life, beautifully organised." speed={38} />
          </p>
        )}

        {/* Palette dots */}
        {phase >= 2 && (
          <div style={{ display:"flex", gap:7, marginTop:20, marginBottom:0, animation:"fadeIn 0.6s ease 0.3s both" }}>
            {[P.green, P.pink, P.orchid, "#D4A47A", P.lilac].map((c, i) => (
              <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:c, opacity:0.65, animation:`dotFloat ${3+i*0.4}s ease ${i*0.1}s infinite` }} />
            ))}
          </div>
        )}

        {/* Buttons */}
        {phase >= 3 && (
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"center",
            gap:12, marginTop:44, width:"100%", maxWidth:320,
            animation:"btnsIn 0.7s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            <button onClick={() => setScreen("signup")} style={{
              width:"100%", padding:"16px 28px", borderRadius:20,
              background:`linear-gradient(135deg,${P.orchid},${P.pink})`,
              color:"white", border:"none", fontSize:15, fontWeight:500, letterSpacing:0.1, cursor:"pointer",
              boxShadow:"0 6px 28px rgba(213,105,137,0.38), 0 2px 8px rgba(213,105,137,0.2)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            }}>
              Get started
              <span style={{ fontSize:14, opacity:0.8, animation:"glowPulse 2.5s ease infinite" }}>{'\u2726'}</span>
            </button>

            <button onClick={() => setScreen("login")} style={{
              width:"100%", padding:"14px 28px", borderRadius:20,
              background:"rgba(255,255,255,0.55)", backdropFilter:"blur(16px)",
              border:"1px solid rgba(45,32,38,0.10)",
              color:P.inkSoft, fontSize:14, fontWeight:300, cursor:"pointer",
            }}>
              I already have an account
            </button>

            <p style={{ fontSize:11, color:P.inkFaint, fontWeight:300, marginTop:4, textAlign:"center", lineHeight:1.6 }}>
              By continuing you agree to the<br />
              <span style={{ color:P.inkMuted, cursor:"pointer" }}>Terms of Service</span>
              &nbsp;&middot;&nbsp;
              <span style={{ color:P.inkMuted, cursor:"pointer" }}>Privacy Policy</span>
            </p>
          </div>
        )}

        {/* Loading dots before phase 3 */}
        {phase < 3 && phase >= 2 && (
          <div style={{ display:"flex", gap:6, marginTop:44 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:P.orchid, opacity:0.4, animation:`glowPulse 1s ease ${i*0.2}s infinite` }} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom credit */}
      {phase >= 3 && (
        <div style={{ position:"absolute", bottom:24, left:0, right:0, textAlign:"center", zIndex:1, animation:"fadeIn 0.6s ease 0.5s both" }}>
          <p style={{ fontSize:10, color:P.inkFaint, fontWeight:300, letterSpacing:0.3 }}>Made with care by Pulse</p>
        </div>
      )}
    </div>
  );
}
