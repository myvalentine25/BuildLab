import type { DiagramId } from "../lib/models.ts";

const colors = { C1: "#3887d6", C2: "#e58a31", C3: "#42a574" };

export function ArmDiagram({ diagram, language }: { diagram: DiagramId; language: "en" | "vi" }) {
  const vi = language === "vi";
  const descriptions: Record<DiagramId, string> = vi ? {
    overview: "Tổng quan sơ đồ: đế B1, trụ B2, thanh trên A1, cẳng tay A2, một ngón kẹp G1 cố định và một ngón G1 chuyển động quanh P3; P1 là vai, P2 là khuỷu. Đế không xoay.",
    cutting: "Bản vẽ cắt có nhãn và kích thước: hai B1 18 × 18 cm, B2 12 × 18 cm, hai lớp A1 20 × 4 cm, hai lớp A2 16 × 4 cm và hai ngón G1 8 × 2 cm.",
    pivots: "Vị trí chốt P1 giữa B2 và A1, P2 giữa A1/A2, P3 nối đầu A2 với ngón kẹp G1 chuyển động. Ngón G1 còn lại được cố định vào A2.",
    circuit: "Ba mạch có nhãn và màu riêng: C1 xanh dương S1 nối S2 đến vai P1; C2 cam S3 nối S4 đến khuỷu P2; C3 xanh lá S5 nối S6 đến kẹp P3.",
    mapping: "Ánh xạ bộ điều khiển đến khớp: C1 S1 đến S2 điều khiển P1 vai; C2 S3 đến S4 điều khiển P2 khuỷu; C3 S5 đến S6 điều khiển P3 kẹp.",
    actuators: "Vị trí thân xi-lanh truyền động: S2/C1 qua P1, S4/C2 qua P2, S6/C3 nối với ngón G1 chuyển động quanh P3; mỗi thân cố định và pít-tông nối với bộ phận chuyển động.",
  } : {
    overview: "Schematic overview: base B1, tower B2, upper link A1, forearm A2, one fixed G1 gripper finger and one G1 finger that pivots at P3; P1 is the shoulder and P2 is the elbow. The base does not rotate.",
    cutting: "Labeled cut diagram: two B1 pieces at 18 × 18 cm, B2 at 12 × 18 cm, two A1 layers at 20 × 4 cm, two A2 layers at 16 × 4 cm, and two G1 fingers at 8 × 2 cm.",
    pivots: "Pivot locations: P1 connects B2 and A1, P2 connects A1/A2, and P3 attaches the moving G1 finger to the A2 tip. The other G1 finger is fixed to A2.",
    circuit: "Three labeled, separately colored circuits: blue C1 connects S1 to S2 at shoulder P1; orange C2 connects S3 to S4 at elbow P2; green C3 connects S5 to S6 at gripper P3.",
    mapping: "Controller-to-joint map: C1 S1 to S2 operates shoulder P1; C2 S3 to S4 operates elbow P2; C3 S5 to S6 operates gripper P3.",
    actuators: "Actuator barrel positions: S2/C1 across P1, S4/C2 across P2, and S6/C3 drives the moving G1 finger at P3; each barrel is fixed while its plunger links to the moving part.",
  };
  const alt = descriptions[diagram];
  return (
    <figure className="diagram-card">
      <svg viewBox="0 0 760 340" role="img" aria-labelledby={`diagram-title-${diagram}`} aria-describedby={`diagram-desc-${diagram}`}>
        <title id={`diagram-title-${diagram}`}>{vi ? "Sơ đồ lắp ráp tay robot" : "Robotic arm assembly diagram"}</title>
        <desc id={`diagram-desc-${diagram}`}>{alt}</desc>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#728096" /></marker>
        </defs>
        {diagram === "cutting" ? <CuttingDiagram vi={vi} /> : diagram === "circuit" ? <CircuitDiagram vi={vi} /> : diagram === "pivots" ? <PivotDiagram vi={vi} /> : diagram === "mapping" ? <MappingDiagram vi={vi} /> : <ArmOverview vi={vi} actuators={diagram === "actuators"} />}
      </svg>
      <figcaption>{vi ? "Sơ đồ minh họa — không theo tỷ lệ. Mã bộ phận và mạch giống với danh sách vật liệu." : "Schematic only — not to scale. Part and circuit IDs match the material list."}</figcaption>
    </figure>
  );
}

function ArmOverview({ vi, actuators }: { vi: boolean; actuators: boolean }) {
  return <>
    <rect x="54" y="277" width="270" height="28" rx="8" fill="#d9b477" stroke="#9e7440" strokeWidth="3" />
    <path d="M150 274 L158 161 L215 161 L230 274 Z" fill="#ecd7ad" stroke="#9e7440" strokeWidth="4" />
    <text x="169" y="227" className="svg-label">B2</text><text x="76" y="300" className="svg-label">B1 · 18 × 18 cm</text>
    <path d="M187 170 L357 98" stroke="#b88a52" strokeWidth="25" strokeLinecap="round" /><text x="264" y="112" className="svg-label">A1 · 20 cm</text>
    <path d="M357 98 L487 164" stroke="#d0a16a" strokeWidth="22" strokeLinecap="round" /><text x="411" y="104" className="svg-label">A2 · 16 cm</text>
    <circle cx="187" cy="170" r="13" fill="#fff" stroke="#30455b" strokeWidth="5" /><text x="140" y="150" className="svg-label">P1</text>
    <circle cx="357" cy="98" r="12" fill="#fff" stroke="#30455b" strokeWidth="5" /><text x="335" y="75" className="svg-label">P2</text>
    <circle cx="487" cy="164" r="11" fill="#fff" stroke="#30455b" strokeWidth="5" />
    <path d="M487 164 L535 140 M473 172 L533 198" stroke="#b88a52" strokeWidth="9" strokeLinecap="round" />
    <text x="544" y="142" className="svg-small">{vi ? "G1 chuyển động" : "G1 moving"}</text><text x="544" y="204" className="svg-small">{vi ? "G1 cố định" : "G1 fixed"}</text><text x="470" y="150" className="svg-small">P3</text>
    {actuators && <>
      <rect x="187" y="194" width="85" height="22" rx="8" fill="#dcecff" stroke={colors.C1} strokeWidth="3" /><text x="208" y="210" className="svg-small">S2 · C1</text>
      <rect x="340" y="122" width="76" height="20" rx="8" fill="#ffead5" stroke={colors.C2} strokeWidth="3" /><text x="357" y="137" className="svg-small">S4 · C2</text>
      <rect x="459" y="198" width="68" height="18" rx="8" fill="#def3e8" stroke={colors.C3} strokeWidth="3" /><text x="469" y="212" className="svg-small">S6 · C3</text>
      <path d="M525 198 Q548 173 541 151" fill="none" stroke={colors.C3} strokeWidth="3" strokeDasharray="5 4" markerEnd="url(#arrow)" />
    </>}
    <path d="M151 149 Q125 126 152 108" fill="none" stroke="#728096" strokeWidth="3" markerEnd="url(#arrow)" /><path d="M384 76 Q405 59 422 77" fill="none" stroke="#728096" strokeWidth="3" markerEnd="url(#arrow)" />
    <text x="577" y="86" className="svg-small">{vi ? "3 chuyển động bằng tay" : "3 manual movements"}</text>
    <text x="577" y="108" className="svg-small">{vi ? "Đế không xoay" : "Base does not rotate"}</text>
  </>;
}

function CuttingDiagram({ vi }: { vi: boolean }) {
  const pieces = [
    { x: 40, y: 58, w: 142, h: 142, id: "B1", size: "18 × 18 cm (×2)" },
    { x: 210, y: 58, w: 142, h: 88, id: "B2", size: "12 × 18 cm (×1)" },
    { x: 380, y: 58, w: 210, h: 42, id: "A1", size: "20 × 4 cm (×2)" },
    { x: 380, y: 128, w: 168, h: 42, id: "A2", size: "16 × 4 cm (×2)" },
    { x: 380, y: 198, w: 84, h: 28, id: "G1", size: "8 × 2 cm (×2)" },
  ];
  return <>
    {pieces.map((piece) => <g key={piece.id}><rect x={piece.x} y={piece.y} width={piece.w} height={piece.h} rx="5" fill="#f3e4c9" stroke="#aa8050" strokeWidth="3" /><text x={piece.x + 10} y={piece.y + 22} className="svg-label">{piece.id}</text><text x={piece.x + 10} y={piece.y + piece.h + 22} className="svg-small">{piece.size}</text></g>)}
    <path d="M44 255 H340" stroke="#728096" strokeWidth="2" strokeDasharray="7 6" /><text x="44" y="282" className="svg-small">{vi ? "Gấp B2 thành nẹp tam giác" : "Fold B2 into a triangular brace"}</text>
    <text x="515" y="270" className="svg-small">{vi ? "Kích thước là điểm khởi đầu" : "Dimensions are starting points"}</text>
  </>;
}

function PivotDiagram({ vi }: { vi: boolean }) {
  return <>
    <path d="M80 270 L122 104 L174 104 L208 270 Z" fill="#ecd7ad" stroke="#9e7440" strokeWidth="4" /><text x="122" y="203" className="svg-label">B2</text>
    <path d="M151 136 L379 78" stroke="#b88a52" strokeWidth="28" strokeLinecap="round" /><text x="234" y="82" className="svg-label">A1</text>
    <path d="M379 78 L531 158" stroke="#d0a16a" strokeWidth="24" strokeLinecap="round" /><text x="432" y="98" className="svg-label">A2</text>
    {[[151, 136, "P1"], [379, 78, "P2"], [531, 158, "P3"]].map(([x, y, id]) => <g key={id as string}><circle cx={x as number} cy={y as number} r="12" fill="white" stroke="#30455b" strokeWidth="5" /><text x={(x as number) - 25} y={(y as number) - 20} className="svg-label">{id}</text></g>)}
    <path d="M531 158 L582 136 M509 170 L580 196" stroke="#b88a52" strokeWidth="9" strokeLinecap="round" />
    <text x="584" y="138" className="svg-small">{vi ? "G1 di động" : "G1 moving"}</text><text x="584" y="201" className="svg-small">{vi ? "G1 cố định" : "G1 fixed"}</text>
    <text x="62" y="310" className="svg-small">{vi ? "Fastener vừa đủ lỏng để xoay" : "Fastener loose enough to rotate"}</text>
    <text x="432" y="251" className="svg-small">{vi ? "P2 cách đầu mỗi thanh 2 cm" : "P2: 2 cm from each link end"}</text>
  </>;
}

function CircuitDiagram({ vi }: { vi: boolean }) {
  return <>
    <text x="50" y="40" className="svg-label">{vi ? "Bộ điều khiển (tay)" : "Controller (hand)"}</text><text x="526" y="40" className="svg-label">{vi ? "Bộ truyền động (khớp)" : "Actuator (joint)"}</text>
    {[
      { y: 88, id: "C1", a: "S1", b: "S2", color: colors.C1, label: vi ? "vai · P1" : "shoulder · P1" },
      { y: 170, id: "C2", a: "S3", b: "S4", color: colors.C2, label: vi ? "khuỷu · P2" : "elbow · P2" },
      { y: 252, id: "C3", a: "S5", b: "S6", color: colors.C3, label: vi ? "kẹp · P3" : "gripper · P3" },
    ].map((row) => <g key={row.id}><text x="28" y={row.y + 7} className="svg-label">{row.id}</text><rect x="135" y={row.y - 20} width="90" height="38" rx="10" fill="#fff" stroke={row.color} strokeWidth="4" /><text x="158" y={row.y + 5} className="svg-label">{row.a}</text><path d={`M225 ${row.y - 1} C310 ${row.y - 1} 382 ${row.y - 1} 470 ${row.y - 1}`} fill="none" stroke={row.color} strokeWidth="6" /><text x="319" y={row.y - 10} className="svg-small">{vi ? "ống nước" : "water tube"}</text><rect x="470" y={row.y - 20} width="90" height="38" rx="10" fill="#fff" stroke={row.color} strokeWidth="4" /><text x="493" y={row.y + 5} className="svg-label">{row.b}</text><text x="576" y={row.y + 5} className="svg-small">{row.label}</text></g>)}
    <text x="132" y="316" className="svg-small">{vi ? "Mỗi cặp có một ống riêng, vừa khít và đầy nước" : "One snug, water-filled tube per matched pair"}</text>
  </>;
}

function MappingDiagram({ vi }: { vi: boolean }) {
  return <>
    <text x="42" y="46" className="svg-label">{vi ? "Bộ điều khiển" : "Controllers"}</text>
    <text x="551" y="46" className="svg-label">{vi ? "Khớp được điều khiển" : "Controlled joint"}</text>
    {[
      { y: 104, c: "C1 · S1→S2", p: "P1 · shoulder / vai", color: colors.C1 },
      { y: 184, c: "C2 · S3→S4", p: "P2 · elbow / khuỷu", color: colors.C2 },
      { y: 264, c: "C3 · S5→S6", p: "P3 · gripper / kẹp", color: colors.C3 },
    ].map((row) => <g key={row.c}><rect x="56" y={row.y - 25} width="172" height="48" rx="12" fill="#fff" stroke={row.color} strokeWidth="3" /><text x="73" y={row.y + 5} className="svg-label">{row.c}</text><path d={`M230 ${row.y} H516`} stroke={row.color} strokeWidth="5" markerEnd="url(#arrow)" /><text x="535" y={row.y + 5} className="svg-label">{row.p}</text></g>)}
    <text x="130" y="322" className="svg-small">{vi ? "Thử từng bộ điều khiển một; dừng nếu bị kẹt" : "Test one controller at a time; stop if jammed"}</text>
  </>;
}
