"use client";

import { useEffect, useRef, useState } from "react";
import Diagram from "@/components/Diagram";
import { project } from "@/lib/project";
import { newWork, parseWork, progress, setCompleted, STORAGE_KEY } from "@/lib/state";
import type { Language, Results, StudentContext, Work } from "@/lib/types";

const label = (lang: Language, vi: string, en: string) => lang === "vi" ? vi : en;
export default function Home() {
  const [work, setWork] = useState<Work>(newWork);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"guide" | "chat" | "progress">("guide");
  const [onboarding, setOnboarding] = useState(true);
  const [mode, setMode] = useState<"demo" | "ai" | "unknown">("unknown");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const pending = useRef(false);
  const lang = work.context.language;
  const L = (vi: string, en: string) => label(lang, vi, en);
  const step = project.steps.find(s => s.id === work.currentStep) ?? project.steps[0];
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const saved = parseWork(raw);
        if (saved) { setWork(saved); setOnboarding(false); }
        else if (raw) setNotice("Dữ liệu lưu không hợp lệ hoặc đã cũ; bắt đầu bản mới. / Saved data is invalid or outdated; starting fresh.");
      } catch { setNotice("Không thể đọc bộ nhớ trình duyệt. / Browser storage is unavailable."); }
      setReady(true);
    });
    fetch("/api/tutor").then(r => r.json()).then(data => setMode(data.mode === "ai" ? "ai" : "demo")).catch(() => setMode("unknown"));
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  function update(next: Work) {
    setWork(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { setNotice(L("Không thể lưu trên trình duyệt này.", "Could not save in this browser.")); }
  }
  function updateContext(key: keyof StudentContext, value: string) {
    update({ ...work, context: { ...work.context, [key]: value } });
  }
  function updateResult(key: keyof Results, value: string) {
    update({ ...work, results: { ...work.results, [key]: value } });
  }
  async function ask(question: string) {
    if (!question.trim() || pending.current) return;
    pending.current = true; setBusy(true); setInput("");
    const prior = work.messages.slice(-12).map(m => ({ ...m, text: m.text.slice(0, 2000) }));
    const withQuestion: Work = { ...work, messages: [...work.messages, { role: "user", text: question.slice(0, 2000) }] };
    update(withQuestion);
    try {
      const response = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ context: work.context, stepId: step.id, completed: work.completed, notes: work.notes, messages: prior, question: question.slice(0, 2000) }) });
      const data = await response.json();
      if (!response.ok || typeof data.reply !== "string") throw new Error(data.error || "Tutor unavailable");
      setMode(data.mode);
      setWork(current => {
        const next: Work = { ...current, messages: [...current.messages, { role: "assistant", text: data.reply }] };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Storage errors are shown on the next edit. */ }
        return next;
      });
    } catch { setNotice(L("Gia sư chưa phản hồi. Hãy thử lại; hướng dẫn vẫn dùng được.", "Tutor unavailable. Please try again; the guide remains available.")); }
    finally { pending.current = false; setBusy(false); }
  }
  function removeWork(reset: boolean) {
    if (!window.confirm(reset ? L("Đặt lại toàn bộ tiến độ, ghi chú và kết quả?", "Reset all progress, notes and results?") : L("Xóa dữ liệu BuildLab khỏi trình duyệt này?", "Delete BuildLab data from this browser?"))) return;
    const fresh = newWork();
    if (reset) update(fresh);
    else { try { localStorage.removeItem(STORAGE_KEY); } catch { setNotice(L("Không thể xóa dữ liệu.", "Could not delete data.")); return; } setWork(fresh); }
    setOnboarding(true);
    setNotice(reset ? L("Đã đặt lại.", "Reset complete.") : L("Đã xóa dữ liệu đã lưu.", "Saved data deleted."));
  }
  if (!ready) return <main className="loading">BuildLab · {L("Đang tải…", "Loading…")}</main>;
  return <div className="app">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-icon">✳</span> BuildLab <small>STUDIO</small></a><div className="top-actions"><span className="header-note">{L("Học bằng cách làm", "Learn by making")}</span><button className="language" onClick={() => updateContext("language", lang === "vi" ? "en" : "vi")} aria-label="Change language / Đổi ngôn ngữ">{lang === "vi" ? "VI ◦ EN" : "EN ◦ VI"}</button></div></header>
    <main id="top">
      <section className="hero"><div><div className="eyebrow"><span>✦</span> {L("PHÒNG THÍ NGHIỆM SÁNG TẠO", "THE HANDS-ON LEARNING LAB")}</div><h1>{L("Ý tưởng lớn,", "Big ideas,")}<br/><em>{L("bắt đầu từ đôi tay.", "built by hand.")}</em></h1><p>{project.summary[lang]}</p><div className="hero-tags"><span>✂ {L("Chế tạo", "Make")}</span><span>◉ {L("Khám phá", "Discover")}</span><span>↗ {L("Cải tiến", "Improve")}</span></div></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="art-card"><span>01 / BUILD</span><strong>✳</strong><p>THINK<br/>MAKE<br/>LEARN.</p></div><span className="art-spark">✦</span></div></section>
      <div className="validation"><strong>⚑ {project.validation[lang]}</strong><span>{project.assumptions[lang]}</span></div>
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label={L("Đóng", "Dismiss")}>×</button></div>}
      <section className="setup card">
        <div className="section-heading"><div><span className="kicker">01 / {L("CHUẨN BỊ", "GET READY")}</span><h2>{L("Trước khi bắt đầu", "Before you begin")}</h2><p>{L("Thông tin được lưu trên trình duyệt này. Khi dùng gia sư AI, bối cảnh, ghi chú và hội thoại được gửi tới nhà cung cấp AI; đừng nhập thông tin nhạy cảm.", "Work is stored in this browser. When using the AI tutor, context, notes and conversation are sent to the AI provider; do not enter sensitive information.")}</p></div><button className="secondary" onClick={() => setOnboarding(!onboarding)}>{onboarding ? L("Thu gọn", "Collapse") : L("Chỉnh sửa", "Edit")}</button></div>
        {onboarding && <div className="form-grid">
          <label>{L("Lớp hoặc độ tuổi", "Grade or age range")}<input maxLength={1000} value={work.context.age} onChange={e => updateContext("age", e.target.value)} placeholder={L("Ví dụ: lớp 8", "e.g. Grade 8")}/></label>
          <label>{L("Cách làm việc", "Working style")}<select value={work.context.work} onChange={e => updateContext("work", e.target.value)}><option value="individual">{L("Cá nhân", "Individual")}</option><option value="group">{L("Nhóm", "Group")}</option></select></label>
          <label>{L("Thời gian có sẵn", "Time available")}<input maxLength={1000} value={work.context.time} onChange={e => updateContext("time", e.target.value)} placeholder={L("Ví dụ: 2 giờ", "e.g. 2 hours")}/></label>
          <label>{L("Có người lớn giúp cắt / dùng keo nóng?", "Adult help for cutting / hot glue?")}<select value={work.context.adult} onChange={e => updateContext("adult", e.target.value)}><option value="">{L("Chọn", "Choose")}</option><option value="yes">{L("Có", "Yes")}</option><option value="no">{L("Không", "No")}</option></select></label>
          <label>{L("Vật liệu và dụng cụ có sẵn", "Available materials and tools")}<textarea maxLength={1000} value={work.context.available} onChange={e => updateContext("available", e.target.value)} placeholder={L("Bạn đã có những gì?", "What do you have?")}/></label>
          <label>{L("Mục tiêu hoặc yêu cầu của giáo viên (nếu có)", "Teacher objectives or instructions (optional)")}<textarea maxLength={1000} value={work.context.objectives} onChange={e => updateContext("objectives", e.target.value)}/></label>
          <button className="primary" onClick={() => setOnboarding(false)}>{L("Bắt đầu khám phá", "Start exploring")} →</button>
        </div>}
      </section>
      <section className="journey-heading"><div><span className="kicker">02 / {L("HÀNH TRÌNH CỦA BẠN", "YOUR LEARNING JOURNEY")}</span><h2>{project.title[lang]}</h2><p>{L("Từng bước nhỏ, một ý tưởng lớn.", "Small steps, one big idea.")}</p></div><div className="progress-summary"><strong>{progress(work)}%</strong><span>{work.completed.length}/{project.steps.length} {L("bước hoàn thành", "steps complete")}</span><div className="progress-track"><div style={{ width: `${progress(work)}%` }}/></div></div></section>
      <nav className="mobile-tabs" aria-label={L("Khu vực học", "Learning sections")}>{(["guide","chat","progress"] as const).map(x => <button key={x} className={tab === x ? "active" : ""} onClick={() => setTab(x)}>{x === "guide" ? L("Hướng dẫn", "Guide") : x === "chat" ? L("Gia sư", "Chat") : L("Tiến độ", "Progress")}</button>)}</nav>
      <div className="workspace">
        <aside className={`timeline card ${tab === "progress" ? "mobile-show" : ""}`}><div className="aside-title"><span>{L("LỘ TRÌNH", "YOUR ROADMAP")}</span><strong>10 {L("GIAI ĐOẠN", "PHASES")}</strong></div><div className="timeline-list">{project.steps.map(s => <button key={s.id} className={`timeline-item ${s.id === step.id ? "selected" : ""}`} onClick={() => { update({ ...work, currentStep: s.id }); setTab("guide"); }}><span className="step-dot">{work.completed.includes(s.id) ? "✓" : String(s.number).padStart(2,"0")}</span><span><strong>{s.title[lang]}</strong><small>{s.minutes} {L("phút", "min")}</small></span></button>)}</div>
          <details className="materials"><summary>{L("Danh sách vật liệu", "Materials checklist")}</summary>{project.materials.map(m => <label className="checkline" key={m.id}><input type="checkbox" checked={work.checkedMaterials.includes(m.id)} onChange={e => update({ ...work, checkedMaterials: e.target.checked ? [...work.checkedMaterials, m.id] : work.checkedMaterials.filter(x => x !== m.id) })}/><span><strong>{m.name[lang]}</strong><small>{m.quantity[lang]}</small></span></label>)}</details>
          <details className="materials"><summary>{L("Danh sách chi tiết", "Cutting list")}</summary>{project.parts.map(p => <p key={p.id}><strong>{p.id} ×{p.quantity}</strong> · {p.name[lang]} · {p.dimensions}</p>)}</details>
        </aside>
        <article className={`guide card ${tab === "guide" ? "mobile-show" : ""}`}>
          <div className="step-heading"><div><span className="kicker">{L("GIAI ĐOẠN", "PHASE")} {String(step.number).padStart(2,"0")} / 10</span><h2>{step.title[lang]}</h2><p>{step.objective[lang]}</p></div><span className="time-pill">◷ {step.minutes} {L("phút", "min")}</span></div>
          <div className="requirements"><strong>{L("BẠN CẦN", "YOU'LL NEED")}</strong><span>{step.materialIds.length ? step.materialIds.map(id => project.materials.find(m => m.id === id)?.name[lang]).join(" · ") : L("Sơ đồ và trí tưởng tượng", "The diagram and your imagination")}</span></div>
          <Diagram id={step.diagramId} lang={lang}/>
          <h3>{L("Cùng thực hiện", "Let's make it")}</h3><ol className="actions">{step.actions.map((a,i) => <li key={i}><span>{String(i+1).padStart(2,"0")}</span><p>{a[lang]}</p></li>)}</ol>
          <details className="theory"><summary>✦ {L("Vì sao điều này hoạt động?", "Why does this work?")}</summary><p>{step.why[lang]}</p>{step.conceptIds.map(id => { const c = project.concepts.find(x => x.id === id)!; return <div key={id}><strong>{c.title[lang]}</strong><p>{c.explanation[lang]}</p></div>; })}</details>
          <div className="info-grid"><div><strong>◎ {L("Điều có thể quan sát", "Expected observation")}</strong><p>{step.expected[lang]}</p></div><div><strong>✓ {L("Điểm kiểm tra", "Checkpoint")}</strong><p>{step.checkpoint[lang]}</p></div><div><strong>! {L("Lỗi thường gặp", "Common mistake")}</strong><p>{step.mistake[lang]}</p></div><div><strong>? {L("Câu hỏi suy nghĩ", "Think about it")}</strong><p>{step.question[lang]}</p></div></div>
          <label className="note-label">{L("Ghi chú & quan sát của bạn", "Your notes & observations")}<textarea maxLength={2000} value={work.notes[step.id] || ""} onChange={e => update({ ...work, notes: { ...work.notes, [step.id]: e.target.value } })} placeholder={L("Bạn nhận thấy điều gì?", "What did you notice?")}/></label>
          <label className="complete"><input type="checkbox" checked={work.completed.includes(step.id)} onChange={e => update(setCompleted(work, step.id, e.target.checked))}/><span>{L("Tôi đã hoàn thành bước này", "I completed this step")}</span></label>
          <div className="step-nav"><button className="secondary" disabled={step.number === 1} onClick={() => update({ ...work, currentStep: project.steps[step.number - 2].id })}>← {L("Trước", "Previous")}</button><button className="primary" disabled={step.number === project.steps.length} onClick={() => update({ ...work, currentStep: project.steps[step.number].id })}>{L("Bước tiếp theo", "Next step")} →</button></div>
          <details className="trouble"><summary>{L("Gặp khó khăn? Xem cách khắc phục", "Stuck? Explore troubleshooting")}</summary>{project.troubleshooting.map(item => <div key={item.id}><strong>{item.title[lang]}</strong><p>{item.check[lang]}</p></div>)}</details>
          <section className="report"><span className="kicker">03 / {L("THỬ & SUY NGẪM", "TEST & REFLECT")}</span><h2>{L("Thử thách của bạn", "Your challenge")}</h2><p>{L("Nhặt một vật nhẹ, không vỡ; di chuyển đến đích đã đánh dấu và thả ra. Chỉ ghi kết quả thực tế.", "Pick up a lightweight, nonbreakable object, move it to a marked target and release it. Record only actual results.")}</p><div className="form-grid">{([
            ["object","Vật thử","Object"],["mass","Khối lượng đã đo (nếu có)","Measured mass (if available)"],["start","Điểm bắt đầu","Start position"],["target","Điểm đích","Target position"],["success","Số lần thành công","Successful attempts"],["total","Tổng số lần thử","Total attempts"],["problems","Vấn đề quan sát","Problems observed"],["changes","Thay đổi đã làm","Changes made"],["after","Kết quả sau cải tiến","Results after improvement"],["reflection","Suy ngẫm và bằng chứng","Reflection and evidence"]
          ] as [keyof Results,string,string][]).map(([key,vi,en]) => <label key={key}>{L(vi,en)}<textarea value={work.results[key]} maxLength={2000} onChange={e => updateResult(key,e.target.value)}/></label>)}</div>
            <p>{L("Nước truyền lực thế nào? Bọt khí thay đổi điều gì? Tay dài ảnh hưởng lực nâng ra sao? Điều gì chống lật? Bằng chứng nào cho thấy cải tiến có ích?", "How does water transmit force? What changes with air? How does arm length affect lifting? What prevents tipping? What evidence supports your improvement?")}</p>
            <p><strong>{L("Tự đánh giá:", "Self-assessment:")}</strong> {L("Chế tạo · Điều khiển · Giải thích · Thử nghiệm · Cải tiến. Với mỗi mục: cần hỗ trợ / đang tiến bộ / có thể giải thích bằng chứng.", "Construction · Control · Explanation · Testing · Improvement. For each: needs support / developing / can explain with evidence.")}</p>
          </section>
        </article>
        <aside className={`chat card ${tab === "chat" ? "mobile-show" : ""}`}><div className="chat-header"><span className="bot-icon">✳</span><div><h2>{L("Gia sư BuildLab", "BuildLab tutor")}</h2><p>{L("Người bạn đồng hành của bạn", "Your learning companion")}</p></div><span className="online">●</span></div>
          <div className="mode">{mode === "ai" ? L("Gia sư AI", "AI tutor") : mode === "demo" ? L("DEMO THEO KỊCH BẢN · Không hiểu mọi câu hỏi", "SCRIPTED DEMO · Does not understand arbitrary questions") : L("Đang kiểm tra chế độ gia sư…", "Checking tutor mode…")}</div>
          <div className="chat-messages" aria-live="polite">{work.messages.length === 0 && <div className="bubble assistant">{L("Xin chào! Mình ở đây để cùng bạn khám phá. Hãy chọn một câu hỏi nhanh hoặc chia sẻ điều bạn quan sát được.", "Hello! I’m here to explore with you. Choose a quick question or share what you observed.")}</div>}{work.messages.map((m,i) => <div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}{busy && <div className="bubble assistant">{L("Đang trả lời…", "Thinking…")}</div>}</div>
          <div className="quick"><span>{L("GỢI Ý CÂU HỎI", "QUICK QUESTIONS")}</span><div>{[[L("Giải thích bước", "Explain step"),"Explain step"],[L("Lý thuyết", "Theory"),"Theory"],[L("Gợi ý", "Hint"),"Hint"],[L("Khắc phục", "Troubleshoot"),"Troubleshoot"],[L("Kiểm tra hiểu", "Check understanding"),"Check understanding"]].map(([caption,query]) => <button key={query} disabled={busy} onClick={() => ask(lang === "vi" ? caption : query)}>{caption}</button>)}</div></div>
          <form className="chat-form" onSubmit={e => { e.preventDefault(); void ask(input); }}><label className="sr-only" htmlFor="question">{L("Câu hỏi của bạn", "Your question")}</label><textarea id="question" maxLength={2000} value={input} onChange={e => setInput(e.target.value)} placeholder={L("Hỏi một điều gì đó…", "Ask a question…")}/><button className="primary" disabled={busy || !input.trim()} aria-label={L("Gửi", "Send")}>↑</button></form>
          <label className="suggestion">{L("Ý tưởng dự án tương lai (tùy chọn)", "Future project suggestion (optional)")}<input maxLength={1000} value={work.suggestion} onChange={e => update({ ...work, suggestion: e.target.value })}/></label>
        </aside>
      </div>
      <section className="print-report">
        <h1>BuildLab · {project.title[lang]}</h1><p><strong>{project.validation[lang]}</strong> — {project.assumptions[lang]}</p>
        <h2>{L("Bối cảnh học tập", "Learning context")}</h2><p>{work.context.age} · {work.context.work} · {work.context.time} · {work.context.adult}</p><p>{work.context.available}</p><p>{work.context.objectives}</p>
        <h2>{L("Tiến độ và quan sát", "Progress and observations")} · {progress(work)}%</h2>{project.steps.map(s => <div key={s.id}><strong>{s.number}. {s.title[lang]} — {work.completed.includes(s.id) ? L("đã đánh dấu hoàn thành", "marked complete") : L("chưa đánh dấu hoàn thành", "not marked complete")}</strong><p>{work.notes[s.id] || "—"}</p></div>)}
        <h2>{L("Thử thách và suy ngẫm", "Challenge and reflection")}</h2>{Object.entries(work.results).map(([key,value]) => <p key={key}><strong>{key}: </strong>{value || "—"}</p>)}
      </section>
      <footer className="footer"><div><strong>✳ BuildLab</strong><p>{L("Tò mò là điểm khởi đầu.", "Curiosity is where it starts.")}</p></div><div className="footer-actions"><button onClick={() => { update(work); setNotice(L("Đã lưu trên trình duyệt này.", "Saved in this browser.")); }}>{L("Lưu", "Save")}</button><button onClick={() => { try { const saved = parseWork(localStorage.getItem(STORAGE_KEY)); if (saved) { setWork(saved); setNotice(L("Đã tiếp tục bản lưu.", "Saved work resumed.")); } else setNotice(L("Không có bản lưu hợp lệ.", "No valid saved work.")); } catch { setNotice(L("Không thể đọc dữ liệu đã lưu.", "Could not read saved data.")); } }}>{L("Tiếp tục bản lưu", "Resume saved")}</button><button onClick={() => window.print()}>{L("In báo cáo", "Print report")}</button><button disabled={busy} onClick={() => removeWork(true)}>{L("Đặt lại", "Reset")}</button><button disabled={busy} onClick={() => removeWork(false)}>{L("Xóa dữ liệu", "Delete data")}</button></div></footer>
    </main>
  </div>;
}
