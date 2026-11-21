/**
 * Ornamen Islami digambar secara programatik.
 * Semua bentuk SVG dihitung di sini agar tajam di semua resolusi dan
 * berkas HTML tetap ringkas. Warna mengikuti `currentColor`.
 */

let uid = 0;
const n = (v) => Math.round(v * 1000) / 1000;
const pt = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [n(cx + r * Math.cos(a)), n(cy + r * Math.sin(a))];
};

/* Bintang berujung 8 (dua bintang berujung 4 yang diputar 45°). */
function star8(cx, cy, outer, inner = null) {
  const ri = inner ?? outer * 0.42;
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? outer : ri;
    const [x, y] = pt(cx, cy, r, (i * 360) / 16);
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

/* Bintang kilau berujung 4 dengan sisi cekung. */
export function star4({ className = "" } = {}) {
  return `<svg viewBox="0 0 24 24" class="${className}" aria-hidden="true">
    <path d="M12 .6c.9 6.4 4.1 9.6 10.4 10.4.5.1.5.9 0 1C16.1 12.9 12.9 16.1 12 22.4c-.1.5-.9.5-1 0-.9-6.3-4.1-9.5-10.4-10.4-.5-.1-.5-.9 0-1C6.9 10.2 10.1 7 11 0.6c.1-.5.9-.5 1 0Z"
      fill="currentColor" opacity=".9"/>
  </svg>`;
}

/* Roset / mandala geometris. */
export function rosette({ petals = 16, dots = 24, rings = true, className = "" } = {}) {
  const cx = 120, cy = 120;
  let g = "";

  if (rings) {
    g += `<circle cx="${cx}" cy="${cy}" r="114" fill="none" stroke="currentColor" stroke-width=".8" stroke-dasharray="1.5 7" opacity=".8"/>`;
    g += `<circle cx="${cx}" cy="${cy}" r="106" fill="none" stroke="currentColor" stroke-width=".9"/>`;
  }

  for (let i = 0; i < dots; i++) {
    const [x, y] = pt(cx, cy, 99, (i * 360) / dots);
    g += `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 2.4 : 1.3}" fill="currentColor" opacity=".75"/>`;
  }

  for (let i = 0; i < petals; i++) {
    g += `<ellipse cx="${cx}" cy="${cy - 62}" rx="11" ry="38" fill="none" stroke="currentColor" stroke-width=".85"
      transform="rotate(${n((i * 360) / petals)} ${cx} ${cy})" opacity=".9"/>`;
  }

  g += `<circle cx="${cx}" cy="${cy}" r="52" fill="none" stroke="currentColor" stroke-width=".8" opacity=".85"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="46" fill="none" stroke="currentColor" stroke-width=".5" stroke-dasharray="2 6" opacity=".8"/>`;
  g += `<polygon points="${star8(cx, cy, 34, 15)}" fill="none" stroke="currentColor" stroke-width=".9" opacity=".9"/>`;
  g += `<polygon points="${star8(cx, cy, 18, 8)}" fill="currentColor" opacity=".22"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="currentColor" opacity=".7"/>`;

  return `<svg viewBox="0 0 240 240" class="${className}" preserveAspectRatio="xMidYMid meet" role="presentation">${g}</svg>`;
}

/* Pembatas floral dengan bintang di tengah. */
export function divider({ className = "" } = {}) {
  const s = 340;
  const star = star8(120, 20, 10.5, 4.6);
  return `<svg viewBox="0 0 240 40" class="${className}" preserveAspectRatio="xMidYMid meet" role="presentation">
    <g fill="none" stroke="currentColor" stroke-width=".9" stroke-linecap="round">
      <path class="draw" d="M8 20H82" stroke-dasharray="${s}"/>
      <path class="draw" d="M158 20H232" stroke-dasharray="${s}"/>
      <path class="draw" d="M8 20c-4.4 0-7-2.6-7-6 0-3 2.2-5 5-5 2.4 0 4.2 1.6 4.2 3.8 0 1.9-1.4 3.2-3.1 3.2" stroke-dasharray="${s}"/>
      <path class="draw" d="M232 20c4.4 0 7-2.6 7-6 0-3-2.2-5-5-5-2.4 0-4.2 1.6-4.2 3.8 0 1.9 1.4 3.2 3.1 3.2" stroke-dasharray="${s}"/>
    </g>
    <g class="orn-star" fill="none" stroke="currentColor" stroke-width=".9">
      <polygon points="${star}"/>
      <polygon points="${star8(120, 20, 5, 2)}" fill="currentColor" stroke="none" opacity=".85"/>
      <path d="M96 20h12M132 20h12" stroke-linecap="round"/>
      <circle cx="92" cy="20" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="148" cy="20" r="1.5" fill="currentColor" stroke="none"/>
    </g>
  </svg>`;
}

/* Sulur sudut (dipakai di sampul). */
export function corner({ className = "" } = {}) {
  const cx = 30, cy = 30;
  let arcs = "";
  [0, 1, 2, 3].forEach((i) => {
    const r = 44 + i * 26;
    arcs += `<path d="M${cx} ${cy + r} A${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="currentColor" stroke-width="${i === 0 ? 1 : 0.8}" opacity="${1 - i * 0.16}"/>`;
  });
  let dots = "";
  for (let i = 1; i < 9; i++) {
    const a = (i * 90) / 9;
    const r = 44;
    const [x, y] = [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
    dots += `<circle cx="${n(x)}" cy="${n(y)}" r="1.6" fill="currentColor" opacity=".7"/>`;
  }
  let petals = "";
  for (let i = 0; i < 4; i++) {
    const a = 18 + i * 17;
    const rad = (a * Math.PI) / 180;
    const r = 92;
    const x = cx + r * Math.cos(rad), y = cy + r * Math.sin(rad);
    petals += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="4.5" ry="13" fill="none" stroke="currentColor" stroke-width=".8"
      transform="rotate(${n(a + 90)} ${n(x)} ${n(y)})" opacity=".75"/>`;
  }
  return `<svg viewBox="0 0 220 220" class="${className}" role="presentation">
    <g>${arcs}${dots}${petals}
      <polygon points="${star8(30, 30, 13, 5.5)}" fill="currentColor" opacity=".55"/>
    </g>
  </svg>`;
}

/* Bulan sabit + bintang. */
export function crescent({ className = "" } = {}) {
  const id = `moon-${++uid}`;
  return `<svg viewBox="0 0 200 200" class="${className}" role="presentation">
    <defs>
      <mask id="${id}">
        <rect width="200" height="200" fill="#fff"/>
        <circle cx="136" cy="86" r="74" fill="#000"/>
      </mask>
    </defs>
    <circle cx="102" cy="104" r="78" fill="currentColor" mask="url(#${id})"/>
    <path d="M150 44c.7 4.9 3.2 7.4 8.1 8.1.4.1.4.7 0 .8-4.9.7-7.4 3.2-8.1 8.1-.1.4-.7.4-.8 0-.7-4.9-3.2-7.4-8.1-8.1-.4-.1-.4-.7 0-.8 4.9-.7 7.4-3.2 8.1-8.1.1-.4.7-.4.8 0Z" fill="currentColor" opacity=".85"/>
    <circle cx="44" cy="52" r="2.6" fill="currentColor" opacity=".6"/>
    <circle cx="62" cy="26" r="1.8" fill="currentColor" opacity=".5"/>
    <circle cx="36" cy="150" r="2" fill="currentColor" opacity=".45"/>
  </svg>`;
}

/* Lengkung mihrab. */
export function arch({ className = "" } = {}) {
  return `<svg viewBox="0 0 100 120" class="${className}" role="presentation">
    <g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round">
      <path d="M10 112V54c0-22 18-40 40-40s40 18 40 40v58"/>
      <path d="M18 112V56c0-17.7 14.3-32 32-32s32 14.3 32 32v56" stroke-width=".7" opacity=".7"/>
      <path d="M4 112h92" stroke-linecap="round"/>
      <path d="M50 24c-2.6 0-4.6-2-4.6-4.4 0-2.3 1.8-4.1 4-4.1 2 0 3.6 1.4 3.6 3.2"/>
    </g>
    <circle cx="50" cy="76" r="9" fill="none" stroke="currentColor" stroke-width=".9" opacity=".6"/>
    <polygon points="${star8(50, 76, 5, 2.2)}" fill="currentColor" opacity=".55"/>
  </svg>`;
}

/* Ikon kecil untuk kartu acara. */
export const icons = {
  ring: `<svg viewBox="0 0 48 48" role="presentation"><g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">
      <circle cx="19" cy="29" r="10"/><circle cx="30" cy="29" r="10" opacity=".75"/>
      <path d="M24 8.5 29 16h-10l5-7.5Z"/><path d="M19 19v-3h10v3" opacity=".6"/></g></svg>`,
  cup: `<svg viewBox="0 0 48 48" role="presentation"><g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 16h22l-1.8 12.5A6.5 6.5 0 0 1 26.8 34h-5.6a6.5 6.5 0 0 1-6.4-5.5L13 16Z"/>
      <path d="M35 18.5c3.6 0 5.4 2 5.4 4.6 0 3-2.2 5-5.8 4.6"/>
      <path d="M19 38h12" opacity=".7"/>
      <path d="M24 8v4M20 10.5 24 12l4-1.5" opacity=".6"/></g></svg>`,
};

const BUILDERS = { rosette, divider, corner, crescent, arch, star4 };

/** Sisipkan semua ornamen ke elemen `[data-orn]` di dalam `root`. */
export function injectOrnaments(root = document) {
  root.querySelectorAll("[data-orn]").forEach((el) => {
    const build = BUILDERS[el.dataset.orn];
    if (!build) return;
    el.innerHTML = build({ className: el.dataset.ornClass || "" });
    if (el.dataset.orn !== "divider") el.setAttribute("aria-hidden", "true");
  });
}

export default { injectOrnaments, rosette, divider, corner, crescent, arch, star4, icons };
