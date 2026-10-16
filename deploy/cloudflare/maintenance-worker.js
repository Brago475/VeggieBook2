// VeggieBook2 maintenance worker for veggiebook2.com and admin.veggiebook2.com.
// Passes every request to the origin. If the origin is down, serves the maintenance page.
// Set the variable MAINTENANCE to "on" in the Worker settings to show the page on purpose.

const DOWN_STATUSES = new Set([502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 527, 530]);

export default {
  async fetch(request, env) {
    const forced = String(env.MAINTENANCE || "").toLowerCase() === "on";
    if (forced) return maintenance(request);

    try {
      const response = await fetch(request);
      if (DOWN_STATUSES.has(response.status)) return maintenance(request);
      return response;
    } catch {
      return maintenance(request);
    }
  },
};

function maintenance(request) {
  const url = new URL(request.url);
  const headers = {
    "Cache-Control": "no-store",
    "Retry-After": "300",
  };

  if (url.pathname.startsWith("/api/")) {
    return new Response(
      JSON.stringify({ code: "maintenance", error: "VeggieBook is getting a short update. Please try again soon.", status: 503 }),
      { status: 503, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  const accept = request.headers.get("Accept") || "";
  if (request.method !== "GET" || !accept.includes("text/html")) {
    return new Response("Service unavailable", { status: 503, headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
  }

  const isAdmin = url.hostname.startsWith("admin.");
  return new Response(page(isAdmin), {
    status: 503,
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}

function page(isAdmin) {
  const badge = isAdmin ? `<span class="badge">ADMIN</span>` : "";

  const headlines = isAdmin
    ? `<h1>We will be right back</h1>`
    : `<h1>We will be right back</h1><p class="sub" lang="es">Volvemos pronto</p>`;

  const notes = isAdmin
    ? `<div class="note">
        <p>The admin site is getting a short update. All research data is safe. Please check back soon.</p>
      </div>`
    : `<div class="note">
        <span class="tag">EN</span>
        <p>VeggieBook is getting a short update. Your books are safe. Please check back soon.</p>
      </div>
      <div class="note" lang="es">
        <span class="tag">ES</span>
        <p>VeggieBook se está actualizando. Tus libros están a salvo. Vuelve a visitarnos en un rato.</p>
      </div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${isAdmin ? "VeggieBook Admin" : "VeggieBook"}: We will be right back</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:#fff;color:#14140f;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;display:flex;flex-direction:column;min-height:100vh}
.top{position:relative;overflow:hidden;background:#8cc63e;min-height:56vh;padding:48px 20px 40px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;text-align:center}
.brand{display:flex;align-items:center;gap:10px}
.name{font-size:34px;font-weight:800;color:#fff}
.badge{font-size:12px;font-weight:800;letter-spacing:.12em;color:#fff;background:#d93025;border-radius:6px;padding:4px 8px}
.leaf{position:absolute;fill:#fff}
.leaf.a{left:6%;top:28px;width:64px;height:64px;opacity:.25;animation:float 5s ease-in-out infinite}
.leaf.b{right:7%;top:64px;width:48px;height:48px;opacity:.22;animation:float 6s ease-in-out infinite;animation-delay:1.2s}
.row{display:flex;align-items:flex-end;justify-content:center;gap:14px}
.veg{display:flex;flex-direction:column;align-items:center;gap:4px}
.veg svg{animation:hop 2.4s ease-in-out infinite;transform-origin:50% 100%}
.shadow{width:40px;height:8px;border-radius:50%;background:#14140f;opacity:.25;animation:shadow 2.4s ease-in-out infinite}
.d1{animation-delay:-2.4s!important}.d2{animation-delay:-2.22s!important}.d3{animation-delay:-2.04s!important}.d4{animation-delay:-1.86s!important}.d5{animation-delay:-1.68s!important}
h1{margin:0;font-size:clamp(28px,5vw,44px);font-weight:800;line-height:1.1}
.sub{margin:6px 0 0;font-size:clamp(24px,4vw,36px);font-weight:800;line-height:1.1;color:#2f5d2f}
.dots{display:flex;gap:8px}
.dot{width:10px;height:10px;border-radius:5px;background:#fff;opacity:.25;animation:pulse 1.4s ease-in-out infinite}
.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
.notes{width:100%;max-width:820px;margin:0 auto;padding:32px 20px;display:flex;flex-wrap:wrap;gap:24px 40px}
.notes.single{justify-content:center;text-align:center}
.note{flex:1 1 300px;display:flex;flex-direction:column;gap:8px}
.note p{margin:0;font-size:17px;line-height:1.55}
.tag{align-self:flex-start;font-size:12px;font-weight:800;letter-spacing:.1em;color:#2f5d2f;background:#e3f0d6;border-radius:999px;padding:4px 10px}
footer{margin-top:auto;padding:20px;font-size:13px;color:#4a4a42;text-align:center;border-top:1px solid #eeeee8}
@keyframes hop{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-26px) rotate(-6deg)}55%{transform:translateY(0) rotate(4deg)}70%{transform:translateY(-8px) rotate(0)}}
@keyframes shadow{0%,100%{transform:scaleX(1);opacity:.28}30%{transform:scaleX(.6);opacity:.12}55%{transform:scaleX(1);opacity:.28}70%{transform:scaleX(.85);opacity:.2}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes pulse{0%,20%{opacity:.25}50%{opacity:1}80%,100%{opacity:.25}}
@media (max-width:420px){.row{gap:10px}.veg svg{width:48px;height:62px}.name{font-size:30px}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
</head>
<body>
<main class="top">
<svg class="leaf a" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z"/></svg>
<svg class="leaf b" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z"/></svg>
<div class="brand"><span class="name">VeggieBook</span>${badge}</div>
<div class="row" aria-hidden="true">
<div class="veg"><svg class="d1" width="56" height="72" viewBox="0 0 56 72"><path d="M28 70 L14 22 Q28 14 42 22 Z" fill="#f28c28"/><path d="M20 34h10M18 46h9M22 58h7" stroke="#d9711a" stroke-width="2.5" stroke-linecap="round"/><path d="M28 20 Q22 6 14 4 M28 20 Q28 4 30 0 M28 20 Q36 6 44 6" stroke="#3f8f3a" stroke-width="4" fill="none" stroke-linecap="round"/></svg><div class="shadow d1"></div></div>
<div class="veg"><svg class="d2" width="64" height="72" viewBox="0 0 64 72"><rect x="27" y="40" width="10" height="30" rx="4" fill="#7fb24a"/><circle cx="20" cy="30" r="14" fill="#3f8f3a"/><circle cx="44" cy="30" r="14" fill="#3f8f3a"/><circle cx="32" cy="18" r="16" fill="#4ea347"/><circle cx="26" cy="14" r="4" fill="#6cc04a"/><circle cx="40" cy="24" r="4" fill="#6cc04a"/></svg><div class="shadow d2"></div></div>
<div class="veg"><svg class="d3" width="64" height="72" viewBox="0 0 64 72"><circle cx="32" cy="42" r="28" fill="#e2463b"/><ellipse cx="22" cy="34" rx="6" ry="9" fill="#ff7a6e" opacity="0.6"/><path d="M32 16 L26 8 M32 16 L38 8 M32 16 L22 18 M32 16 L42 18 M32 16 L32 4" stroke="#3f8f3a" stroke-width="4" stroke-linecap="round"/></svg><div class="shadow d3"></div></div>
<div class="veg"><svg class="d4" width="52" height="72" viewBox="0 0 52 72"><ellipse cx="26" cy="36" rx="14" ry="30" fill="#f4c542"/><path d="M18 20h16M16 30h20M16 40h20M18 50h16" stroke="#e0a91f" stroke-width="2.5" stroke-linecap="round"/><path d="M12 70 Q4 40 18 18 Q16 46 26 70 Z" fill="#7fb24a"/><path d="M40 70 Q48 40 34 18 Q36 46 26 70 Z" fill="#5f9a3a"/></svg><div class="shadow d4"></div></div>
<div class="veg"><svg class="d5" width="56" height="72" viewBox="0 0 56 72"><path d="M28 18 C46 18 50 44 40 60 C34 70 22 70 16 60 C6 44 10 18 28 18 Z" fill="#7b4a9e"/><ellipse cx="22" cy="40" rx="4" ry="10" fill="#9a6bbd" opacity="0.7"/><path d="M16 20 Q28 10 40 20 Q34 26 28 22 Q22 26 16 20 Z" fill="#3f8f3a"/><path d="M28 14 L30 4" stroke="#3f8f3a" stroke-width="4" stroke-linecap="round"/></svg><div class="shadow d5"></div></div>
</div>
<div>${headlines}</div>
<div class="dots" aria-hidden="true"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
</main>
<section class="notes${isAdmin ? " single" : ""}">
${notes}
</section>
<footer>VeggieBook2, Kean University</footer>
</body>
</html>`;
}