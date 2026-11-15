import { project } from "@/lib/project";
import type { Language } from "@/lib/types";

export default function Diagram({ id, lang }: { id: string; lang: Language }) {
  const diagram = project.diagrams.find(d => d.id === id)!;
  return <figure className="diagram">
    <figcaption><strong>{diagram.title[lang]}</strong><span>{lang === "vi" ? "Sơ đồ minh họa · không theo tỷ lệ" : "Schematic · not to scale"}</span></figcaption>
    <svg viewBox="0 0 640 260" role="img" aria-label={`${diagram.title[lang]}: ${diagram.description[lang]}`}>
      <title>{diagram.title[lang]}</title><desc>{diagram.description[lang]}</desc>
      <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#087e82" /></marker></defs>
      {id === "pieces" ? <>
        <rect x="25" y="35" width="160" height="100" rx="4" fill="#d9b786"/><text x="35" y="65">B1 ×1</text><text x="35" y="90">30 × 20 cm</text>
        <rect x="215" y="35" width="76" height="100" rx="4" fill="#eacb9d"/><text x="222" y="65">S1 ×2</text><text x="220" y="90">12 × 8</text>
        <rect x="320" y="35" width="260" height="38" rx="4" fill="#d9b786"/><text x="330" y="60">A1 ×2 · 24 × 4 cm</text>
        <rect x="320" y="95" width="130" height="30" rx="4" fill="#eacb9d"/><text x="330" y="116">J1 ×1 · 6 × 2</text>
        <rect x="320" y="145" width="130" height="30" rx="4" fill="#eacb9d"/><text x="330" y="166">J2 ×1 · 6 × 2</text>
        <rect x="475" y="100" width="75" height="60" rx="4" fill="#f3dfbf"/><text x="482" y="135">G1 ×6</text>
      </> : id === "circuit" ? <>
        <text x="30" y="45">C1 · H1</text><rect x="30" y="55" width="110" height="35" rx="5" fill="#b4e1dc" stroke="#087e82" strokeWidth="3"/><path d="M140 72 H450" stroke="#087e82" strokeWidth="8"/><rect x="450" y="55" width="110" height="35" rx="5" fill="#b4e1dc" stroke="#087e82" strokeWidth="3"/><text x="460" y="80">X1 → P1</text>
        <text x="30" y="155">C2 · H2</text><rect x="30" y="165" width="110" height="35" rx="5" fill="#f7d8a8" stroke="#b9631c" strokeWidth="3"/><path d="M140 182 H450" stroke="#b9631c" strokeWidth="8" strokeDasharray="12 5"/><rect x="450" y="165" width="110" height="35" rx="5" fill="#f7d8a8" stroke="#b9631c" strokeWidth="3"/><text x="460" y="190">X2 → P2</text>
        <text x="205" y="110">{lang === "vi" ? "Ống kín chứa nước" : "Sealed water-filled tubing"}</text><text x="205" y="230">{lang === "vi" ? "Hai mạch riêng" : "Two separate circuits"}</text>
      </> : <>
        <rect x="35" y="200" width="400" height="25" rx="4" fill="#d4aa73"/><text x="50" y="219">B1</text>
        <path d="M120 200 L150 95 L185 200 Z" fill="#e9c99b" stroke="#8c6438" strokeWidth="3"/><text x="125" y="185">S1 ×2</text>
        <path d="M165 105 L430 55 L438 82 L170 132 Z" fill="#d9b786" stroke="#8c6438" strokeWidth="3"/><text x="270" y="92">A1 ×2</text>
        <path d="M430 70 L455 150" stroke="#8c6438" strokeWidth="15"/><text x="460" y="145">J1</text>
        <path d="M418 73 L390 145" stroke="#c99353" strokeWidth="15"/><text x="350" y="150">J2</text>
        <circle cx="165" cy="118" r="7" fill="#243f43"/><text x="140" y="102">P1</text><circle cx="418" cy="73" r="7" fill="#243f43"/><text x="400" y="52">P2</text>
        <path d="M200 200 L215 168 L230 200 Z" fill="#e9c99b" stroke="#8c6438" strokeWidth="2"/><path d="M215 170 L250 108" stroke="#087e82" strokeWidth="12"/><circle cx="215" cy="170" r="5" fill="#243f43"/><circle cx="250" cy="108" r="5" fill="#243f43"/><text x="190" y="195">M1a</text><text x="235" y="145">M1b · X1</text>
        <path d="M330 88 L395 110" stroke="#b9631c" strokeWidth="9"/><text x="300" y="125">M2a · X2 · M2b</text>
        <path d="M205 50 Q250 15 300 30" fill="none" stroke="#087e82" strokeWidth="3" markerEnd="url(#arrow)"/><path d="M370 165 Q400 185 430 170" fill="none" stroke="#087e82" strokeWidth="3" markerEnd="url(#arrow)"/>
      </>}
    </svg>
    <p>{diagram.description[lang]}</p>
  </figure>;
}
