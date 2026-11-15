"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArmDiagram } from "./ArmDiagram";
import { GUIDE, getStep } from "../lib/guide";
import { localizedConcepts, localizedMaterials, localizedQuantities, localizedRequirements, localizeStep, text } from "../lib/i18n";
import { createWork, markStep, progressPercent, restoreWork, saveWork, STORAGE_KEY } from "../lib/progress";
import type { ChatMessage, Language, StudentWork, TestResults } from "../lib/models";

const reflections = [
  { id: "syringe", vi: "Làm thế nào việc đẩy một xi-lanh làm xi-lanh kia chuyển động?", en: "How does pushing one syringe move another?" },
  { id: "air", vi: "Điều gì thay đổi khi có không khí trong ống?", en: "What changes when there is air in the tube?" },
  { id: "reach", vi: "Tay dài hơn ảnh hưởng việc nâng như thế nào?", en: "How does a longer arm affect lifting?" },
  { id: "base", vi: "Điều gì giúp đế không bị lật?", en: "What helps prevent tipping?" },
  { id: "evidence", vi: "Thay đổi nào cải thiện mô hình, và bằng chứng nào hỗ trợ điều đó?", en: "Which change improved your model, and what evidence supports it?" },
];

const rubricRows = {
  vi: [
    { criterion: "Lắp ráp", levels: ["Cần kiểm tra lại một số bộ phận.", "Khung chắc, chốt thẳng hàng và chuyển động tự do.", "Gia cố phù hợp và giải thích được cách khung chống cong/lật."] },
    { criterion: "Điều khiển", levels: ["Chưa ghép đúng cả ba mạch.", "C1, C2, C3 điều khiển đúng khớp.", "Điều khiển nhẹ, có kiểm soát và dừng an toàn."] },
    { criterion: "Giải thích", levels: ["Nêu tên một bộ phận.", "Giải thích nước truyền chuyển động qua xi-lanh.", "Giải thích áp suất, đòn bẩy và giới hạn của mô hình."] },
    { criterion: "Thử nghiệm", levels: ["Ghi một lần thử.", "Giữ nhiệm vụ giống nhau và đếm kết quả.", "Ghi vấn đề và so sánh trước/sau cải tiến."] },
    { criterion: "Cải tiến", levels: ["Đề xuất một thay đổi.", "Thay đổi một yếu tố và ghi kết quả.", "Dùng bằng chứng để đánh giá thay đổi."] },
  ],
  en: [
    { criterion: "Construction", levels: ["Some parts need another check.", "Frame is steady, pivots align, and joints move freely.", "Reinforcement is purposeful and its effect on bending/stability is explained."] },
    { criterion: "Control", levels: ["Not all three circuits are mapped yet.", "C1, C2, and C3 operate the intended joints.", "Movements are gentle, controlled, and stopped safely."] },
    { criterion: "Explanation", levels: ["Names one part.", "Explains how water transfers syringe movement.", "Explains pressure, levers, and model limitations."] },
    { criterion: "Testing", levels: ["Records one attempt.", "Keeps the task consistent and counts outcomes.", "Records issues and compares before/after improvement."] },
    { criterion: "Improvement", levels: ["Suggests a change.", "Changes one feature and records the result.", "Uses evidence to evaluate the change."] },
  ],
} as const;

const quickKeys = ["explainStep", "showTheory", "hint", "troubleshoot", "checkUnderstanding"] as const;
const quickPrompts: Record<Language, string[]> = {
  vi: ["Giải thích bước hiện tại bằng lời dễ hiểu.", "Giải thích lý thuyết áp dụng cho bước này.", "Cho tôi một gợi ý nhỏ, đừng làm thay tôi.", "Giúp tôi xử lý sự cố. Hỏi điều cần biết trước khi kết luận.", "Hãy hỏi tôi một câu để kiểm tra hiểu biết."],
  en: ["Explain this step more simply.", "Explain the theory used in this step.", "Give me a small hint without doing it for me.", "Help me troubleshoot. Ask what you need before diagnosing.", "Ask me one question to check my understanding."],
};

const timeChoices = [
  { value: "1 hour", en: "1 hour", vi: "1 giờ" },
  { value: "2–3 hours", en: "2–3 hours", vi: "2–3 giờ" },
  { value: "More than 3 hours", en: "More than 3 hours", vi: "Hơn 3 giờ" },
];

const resultFields: { id: keyof TestResults; key: "object" | "mass" | "startPosition" | "targetPosition" | "successfulAttempts" | "totalAttempts" | "problems" | "changes" | "afterChange" }[] = [
  { id: "object", key: "object" }, { id: "mass", key: "mass" }, { id: "start", key: "startPosition" }, { id: "target", key: "targetPosition" },
  { id: "successfulAttempts", key: "successfulAttempts" }, { id: "totalAttempts", key: "totalAttempts" },
  { id: "problems", key: "problems" }, { id: "changes", key: "changes" }, { id: "afterChange", key: "afterChange" },
];

export function Workbench() {
  const [work, setWork] = useState<StudentWork>(() => createWork());
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [persistenceEnabled, setPersistenceEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"guide" | "chat" | "progress">("guide");
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [tutorMode, setTutorMode] = useState<"demo" | "ai">("demo");
  const sendingRef = useRef(false);
  const language = work.context.language;
  const t = (key: Parameters<typeof text>[1]) => text(language, key);
  const step = useMemo(() => localizeStep(getStep(work.currentStep), language), [work.currentStep, language]);
  const percent = progressPercent(work.completedSteps);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setWork(restoreWork(window.localStorage.getItem(STORAGE_KEY)));
      } catch {
        setWork(createWork());
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !persistenceEnabled) return;
    const timer = window.setTimeout(() => {
      try {
        saveWork(work, window.localStorage);
        setSaved(true);
      } catch {
        setSaved(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ready, persistenceEnabled, work]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    let active = true;
    void fetch("/api/tutor")
      .then((response) => response.ok ? response.json() as Promise<{ mode?: string }> : null)
      .then((result) => {
        if (active && result?.mode === "ai") setTutorMode("ai");
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  function update(patch: Partial<StudentWork>) {
    setPersistenceEnabled(true);
    setWork((current) => ({ ...current, ...patch }));
  }

  function updateContext(patch: Partial<StudentWork["context"]>) {
    setPersistenceEnabled(true);
    setWork((current) => ({ ...current, context: { ...current.context, ...patch } }));
  }

  function setStep(stepId: string) {
    setPersistenceEnabled(true);
    update({ currentStep: stepId });
    setActiveTab("guide");
  }

  function toggleMaterial(id: string, checked: boolean) {
    setPersistenceEnabled(true);
    const checkedMaterials = checked ? [...new Set([...work.checkedMaterials, id])] : work.checkedMaterials.filter((item) => item !== id);
    const materialsAvailable = checked ? [...new Set([...work.context.materialsAvailable, id])] : work.context.materialsAvailable.filter((item) => item !== id);
    const material = GUIDE.materials.find((item) => item.id === id);
    const toolsAvailable = material?.category === "tool"
      ? checked ? [...new Set([...work.context.toolsAvailable, id])] : work.context.toolsAvailable.filter((item) => item !== id)
      : work.context.toolsAvailable;
    setWork((current) => ({ ...current, checkedMaterials, context: { ...current.context, materialsAvailable, toolsAvailable } }));
  }

  function completeStep() {
    update(markStep(work, step.id, !work.completedSteps.includes(step.id)));
  }

  function reset() {
    if (!window.confirm(t("resetConfirm"))) return;
    const fresh = createWork();
    setPersistenceEnabled(true);
    setWork(fresh);
    setChatError("");
    setTutorMode("demo");
    try { saveWork(fresh, window.localStorage); setSaved(true); } catch { setSaved(false); }
  }

  function removeSavedWork() {
    if (!window.confirm(t("deleteConfirm"))) return;
    const fresh = createWork();
    setPersistenceEnabled(false);
    setWork(fresh);
    setSaved(false);
    setChatError("");
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { setSaved(false); }
  }

  function saveNow() {
    setPersistenceEnabled(true);
    try {
      saveWork(work, window.localStorage);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  function resumeWork() {
    setPersistenceEnabled(true);
    try {
      setWork(restoreWork(window.localStorage.getItem(STORAGE_KEY)));
    } catch {
      setWork(createWork());
    }
    setActiveTab("guide");
  }

  async function sendQuestion(question = chatInput) {
    const trimmed = question.trim();
    if (!trimmed || sendingRef.current || trimmed.length > 1200) return;
    sendingRef.current = true;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "student", text: trimmed };
    const priorHistory = work.chat;
    setPersistenceEnabled(true);
    setWork((current) => ({ ...current, chat: [...current.chat, userMessage].slice(-40) }));
    setChatInput("");
    setChatError("");
    setSending(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          stepId: step.id,
          language,
          context: work.context,
          materials: work.context.materialsAvailable,
          completedSteps: work.completedSteps,
          observations: Object.fromEntries(Object.entries(work.observations).filter(([, value]) => value.trim()).slice(-3).map(([id, value]) => [id, value.slice(0, 400)])),
          notes: work.notes.slice(0, 1200),
          testResults: Object.fromEntries(Object.entries(work.testResults).map(([key, value]) => [key, value.slice(0, 200)])),
          reflection: Object.fromEntries(Object.entries(work.reflection).map(([key, value]) => [key, value.slice(0, 300)])),
          history: priorHistory.slice(-8).map((message) => ({ role: message.role, text: message.text })),
        }),
      });
      const result = await response.json() as { reply?: string; mode?: "demo" | "ai"; error?: string };
      if (!response.ok || !result.reply) throw new Error(result.error || t("error"));
      setTutorMode(result.mode === "ai" ? "ai" : "demo");
      const tutorMessage: ChatMessage = { id: crypto.randomUUID(), role: "tutor", text: result.reply };
      setWork((current) => ({
        ...current,
        chat: [...current.chat, tutorMessage].slice(-40),
      }));
    } catch (error) {
      setChatError(error instanceof Error ? error.message : t("error"));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function updateResult(field: keyof TestResults, value: string) {
    update({ testResults: { ...work.testResults, [field]: value } });
  }

  const activeStepIndex = GUIDE.steps.findIndex((item) => item.id === step.id);
  const missingRequired = GUIDE.materials.filter((material) => !work.context.materialsAvailable.includes(material.id));

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="BuildLab home"><span className="brand-icon" aria-hidden="true">B</span><span>Build<span className="brand-accent">Lab</span></span></a>
        <div className="top-actions">
          <label className="language-control"><span className="sr-only">{t("language")}</span><select value={language} onChange={(event) => updateContext({ language: event.target.value as Language })}><option value="vi">🇻🇳 Tiếng Việt</option><option value="en">🇬🇧 English</option></select></label>
          <span className="save-status"><span className="save-dot" />{saved ? t("saved") : "—"}</span>
          <button type="button" className="button button-quiet" onClick={saveNow}>{t("saveNow")}</button>
          <button type="button" className="button button-quiet" onClick={resumeWork}>{t("resume")}</button>
          <button type="button" className="button button-quiet" onClick={reset}>{t("reset")}</button>
          <button type="button" className="button button-quiet" onClick={removeSavedWork}>{t("delete")}</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">{t("tagline")}</span>
          <h1>{language === "vi" ? "Cánh tay robot thủy lực bằng bìa cứng" : "Hydraulic Cardboard Robotic Arm"}</h1>
          <p>{t("intro")}</p>
          <div className="hero-badges"><span className="badge badge-prototype">⚠ {t("prototype")}</span><span className="badge badge-demo">{tutorMode === "ai" ? `✦ ${t("ai")}` : `◎ ${t("demo")}`}</span></div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><span className="hero-syringe syringe-a">╱╲</span><span className="hero-syringe syringe-b">╲╱</span><span className="hero-water">≈</span><span className="hero-joint">●</span><span className="hero-arm arm-a" /><span className="hero-arm arm-b" /><span className="hero-grip">⌁</span></div>
      </section>
      <details className="design-overview" open>
        <summary><strong>{language === "vi" ? "Thiết kế tham chiếu và giả định" : "Reference design and assumptions"}</strong><span className="summary-chevron">⌄</span></summary>
        <div>
          <p>{language === "vi" ? "Mô hình có ba chuyển động điều khiển bằng tay:" : "The model has three manually controlled movements:"} {GUIDE.movements.map((movement, index) => <span key={movement}>{index > 0 ? " · " : ""}{language === "vi" ? ["Vai nâng/hạ", "Khuỷu gập/duỗi", "Kẹp mở/đóng"][index] : movement}</span>)}</p>
          <ul>{GUIDE.designAssumptions.map((assumption, index) => <li key={assumption}>{language === "vi" ? [
            "Hình vẽ chỉ mang tính sơ đồ, không theo tỷ lệ. Kích thước là điểm khởi đầu, chưa phải mẫu đã thử nghiệm.",
            "Tay dùng xi-lanh không kim 10 mL điều khiển bằng tay và nước; không có động cơ, điện tử hay điều khiển tự động.",
            "Ba mạch riêng điều khiển nâng vai, gập khuỷu và kẹp đơn giản. Đế không xoay.",
            "Dùng xi-lanh và ống cùng cỡ. Thể tích danh định không cho biết diện tích pít-tông; không có tải trọng nào được bảo đảm.",
            "Độ dày bìa, đầu nối xi-lanh và hình học liên kết khác nhau. Lắp thử và điều chỉnh chốt trước khi đục lỗ cuối.",
          ][index] : assumption}</li>)}</ul>
        </div>
      </details>

      <details className="learner-panel">
        <summary><span className="learner-icon">✳</span><span><strong>{t("studentSetup")}</strong><small>{work.context.grade} · {work.context.workMode === "group" ? t("group") : t("individual")} · {timeChoices.find((choice) => choice.value === work.context.timeAvailable)?.[language]}</small></span><span className="summary-chevron">⌄</span></summary>
        <div className="learner-fields">
          <label>{t("grade")}<input value={work.context.grade} onChange={(event) => updateContext({ grade: event.target.value })} maxLength={40} /></label>
          <label>{t("workMode")}<select value={work.context.workMode} onChange={(event) => updateContext({ workMode: event.target.value as "individual" | "group" })}><option value="individual">{t("individual")}</option><option value="group">{t("group")}</option></select></label>
          <label>{t("availableTime")}<select value={work.context.timeAvailable} onChange={(event) => updateContext({ timeAvailable: event.target.value })}>{timeChoices.map((choice) => <option key={choice.value} value={choice.value}>{choice[language]}</option>)}</select></label>
          <label className="teacher-field">{t("teacher")}<textarea value={work.context.teacherInstructions} onChange={(event) => updateContext({ teacherInstructions: event.target.value.slice(0, 500) })} maxLength={500} rows={2} placeholder="…" /></label>
          <label className="adult-check"><input type="checkbox" checked={work.context.adultHelp} onChange={(event) => updateContext({ adultHelp: event.target.checked })} /><span>{t("adultHelp")}</span></label>
        </div>
      </details>

      <nav className="mobile-tabs" aria-label="Workspace sections">
        {(["guide", "chat", "progress"] as const).map((tab) => <button type="button" key={tab} className={activeTab === tab ? "mobile-tab active" : "mobile-tab"} onClick={() => setActiveTab(tab)}>{t(tab === "guide" ? "guide" : tab === "chat" ? "chat" : "tabProgress")}</button>)}
      </nav>

      <div className="workspace">
        <aside className={`sidebar mobile-section ${activeTab !== "guide" ? "mobile-hidden" : ""}`}>
          <section className="progress-card">
            <div className="progress-heading"><span>{t("progress")}</span><strong>{percent}%</strong></div>
            <div className="progress-track" role="progressbar" aria-label={t("progress")} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div>
            <p>{work.completedSteps.length}/{GUIDE.steps.length} {t("completed")}</p>
          </section>

          <section className="sidebar-section">
            <h2>{t("allSteps")}</h2>
            <ol className="step-list">
              {GUIDE.steps.map((item, index) => {
                const localizedStep = localizeStep(item, language);
                const completed = work.completedSteps.includes(item.id);
                return <li key={item.id}><button type="button" className={`step-link ${step.id === item.id ? "selected" : ""}`} onClick={() => setStep(item.id)} aria-current={step.id === item.id ? "step" : undefined}>
                  <span className={`step-number ${completed ? "done" : ""}`}>{completed ? "✓" : String(index + 1).padStart(2, "0")}</span><span className="step-link-text"><span>{localizedStep.phase.split(" · ")[0]}</span><strong>{localizedStep.title}</strong></span>
                </button></li>;
              })}
            </ol>
          </section>

          <details className="sidebar-section material-disclosure" open>
            <summary><h2>{t("materials")}</h2><span className="summary-chevron">⌄</span></summary>
            <p className="section-hint">{t("inventory")}</p>
            <div className="material-list">
              {GUIDE.materials.map((material) => {
                const localized = localizedMaterials[material.id];
                return <label className="material-item" key={material.id}>
                  <input type="checkbox" checked={work.checkedMaterials.includes(material.id)} onChange={(event) => toggleMaterial(material.id, event.target.checked)} />
                  <span><strong>{language === "vi" ? localized?.name : material.name}</strong><small>{language === "vi" ? localizedQuantities[material.id] : material.quantity}</small><small>{language === "vi" ? localized?.notes : material.notes}</small></span>
                </label>;
              })}
            </div>
            <p className="material-warning"><strong>{t("materialsHelp")}</strong><br />{language === "vi" ? "Bìa carton sóng có thể thay bằng bao bì sóng cứng, cần ghép đôi và kiểm tra lại chốt do khác độ dày. Có thể dùng bu-lông ngắn kèm vòng đệm thay chốt giấy khi có người lớn hỗ trợ." : "Stiff corrugated packaging can replace cardboard; double it and recheck pivots because thickness varies. A short bolt with washers can replace split pins with adult help."}<br />{language === "vi" ? "Ống và xi-lanh phải khớp chặt; không thay cỡ khác nếu chưa kiểm tra tương thích." : "Tubing and syringes must fit securely; do not substitute a different size without checking compatibility."}</p>
            {missingRequired.length > 0 && <p className="small-muted">{language === "vi" ? `${missingRequired.length} mục chưa được đánh dấu là có sẵn.` : `${missingRequired.length} items not marked available.`}</p>}
          </details>

          <section className="sidebar-section circuit-card">
            <h2>{t("circuits")}</h2>
            {GUIDE.circuits.map((circuit, index) => <div className="circuit-row" key={circuit.id}><span className={`circuit-dot ${circuit.id.toLowerCase()}`} /><span><strong>{language === "vi" ? [`C1 · xanh dương · vai`, `C2 · cam · khuỷu`, `C3 · xanh lá · kẹp`][index] : circuit.label}</strong><small>{circuit.controller} → {circuit.actuator} → {language === "vi" ? [`vai P1`, `khuỷu P2`, `kẹp P3`][index] : circuit.joint}</small></span></div>)}
          </section>
        </aside>

        <main className={`guide-pane mobile-section ${activeTab !== "guide" ? "mobile-hidden" : ""}`}>
          <div className="step-topline"><span className="eyebrow">{step.phase}</span><span className="time-chip">◷ {step.minutes} {t("minutes")}</span></div>
          <div className="step-title-row"><div><p className="step-count">{t("step")} {String(activeStepIndex + 1).padStart(2, "0")} / {String(GUIDE.steps.length).padStart(2, "0")}</p><h2>{step.title}</h2></div>{work.completedSteps.includes(step.id) && <span className="complete-chip">✓ {t("completed")}</span>}</div>
          <p className="step-objective"><strong>{t("objective")}:</strong> {step.objective}</p>
          <ArmDiagram diagram={step.diagram} language={language} />
          <div className="step-requirements"><h3>{t("materialsTools")}</h3><div className="requirement-tags">{step.required.map((item) => <span className="requirement-tag" key={item}>{language === "vi" ? localizedRequirements[item] ?? item : item}</span>)}</div></div>
          <section className="instruction-section"><h3>{t("actions")}</h3><ol className="action-list">{step.actions.map((action, index) => <li key={action}><span className="action-index">{index + 1}</span><span>{action}</span></li>)}</ol></section>
          {step.dimensions && <div className="dimension-note"><span>↔</span><p><strong>{t("dimensions")}</strong><br />{step.dimensions}</p></div>}
          <details className="theory-card"><summary><span className="theory-icon">✳</span><strong>{t("why")}</strong><span className="summary-chevron">⌄</span></summary><p>{step.why}</p><h4>{t("theory")}</h4><p>{step.theory}</p><div className="concept-details">{step.concepts.map((id) => {
            const concept = GUIDE.concepts.find((item) => item.id === id);
            if (!concept) return null;
            const translated = localizedConcepts[id];
            return <section key={id}><strong>{language === "vi" ? translated?.name : concept.name}</strong>{concept.formula && <code>{concept.formula}</code>}<p>{language === "vi" ? translated?.explanation : concept.explanation}</p></section>;
          })}</div></details>
          <div className="checkpoint-grid"><section><span className="mini-label">◎ {t("expected")}</span><p>{step.expected}</p></section><section><span className="mini-label">✓ {t("checkpoint")}</span><p>{step.checkpoint}</p></section></div>
          <details className="mistake-card"><summary><span>⚑</span><strong>{t("mistakes")}</strong><span className="summary-chevron">⌄</span></summary><div>{step.mistakes.map((item) => <p key={item.issue}><strong>{item.issue}</strong><br />{item.remedy}</p>)}</div></details>
          <TroubleshootingPanel language={language} title={t("troubleshootingPanel")} />
          <div className="understanding-question"><span className="question-icon">?</span><p><span className="mini-label">{t("question")}</span><strong>{step.question}</strong></p><button type="button" className="button button-outline small-button" onClick={() => { setActiveTab("chat"); void sendQuestion(quickPrompts[language][4]); }}>{t("checkUnderstanding")}</button></div>
          <label className="observation-label">{t("observations")}<textarea rows={3} maxLength={4000} value={work.observations[step.id] ?? ""} onChange={(event) => update({ observations: { ...work.observations, [step.id]: event.target.value } })} placeholder={t("observationPlaceholder")} /></label>
          <div className="step-controls"><button type="button" className="button button-quiet" onClick={() => setStep(GUIDE.steps[Math.max(0, activeStepIndex - 1)].id)} disabled={activeStepIndex === 0}>← {t("previous")}</button><button type="button" className={`button ${work.completedSteps.includes(step.id) ? "button-complete" : "button-primary"}`} onClick={completeStep}>{work.completedSteps.includes(step.id) ? <>✓ {t("markUndone")}</> : <>✓ {t("markDone")}</>}</button><button type="button" className="button button-quiet" onClick={() => setStep(GUIDE.steps[Math.min(GUIDE.steps.length - 1, activeStepIndex + 1)].id)} disabled={activeStepIndex === GUIDE.steps.length - 1}>{t("next")} →</button></div>

          {step.id === "step-10" && <ChallengePanel work={work} language={language} t={t} updateResult={updateResult} update={(patch) => update(patch)} />}
        </main>

        <aside className={`chat-pane mobile-section ${activeTab !== "chat" ? "mobile-hidden" : ""}`}>
          <div className="chat-heading"><div className="tutor-avatar">✳</div><div><h2>{t("tutor")}</h2><span className={tutorMode === "ai" ? "chat-mode mode-ai" : "chat-mode"}>{tutorMode === "ai" ? t("ai") : t("demo")}</span></div><span className="online-dot" aria-hidden="true" /></div>
          <p className="chat-intro">{t("tutorIntro")}</p>
          <fieldset className="quick-actions"><legend className="sr-only">{language === "vi" ? "Câu hỏi nhanh" : "Quick questions"}</legend>{quickKeys.map((key, index) => <button type="button" key={key} className="quick-action" onClick={() => void sendQuestion(quickPrompts[language][index])} disabled={sending}>{t(key)}</button>)}</fieldset>
          <div className="chat-messages" aria-live="polite">
            {work.chat.length === 0 && <div className="chat-empty"><span className="chat-empty-icon">✳</span><strong>{language === "vi" ? "Bắt đầu bằng một câu hỏi" : "Start with a question"}</strong><p>{language === "vi" ? "Gia sư dùng bước hiện tại, ghi chú và tiến độ của bạn để gợi ý." : "The tutor uses your current step, notes, and progress to guide you."}</p></div>}
            {work.chat.map((message) => <div className={`message ${message.role === "student" ? "student-message" : "tutor-message"}`} key={message.id}><span className="message-author">{message.role === "student" ? (language === "vi" ? "Bạn" : "You") : "✳ BuildLab"}</span><p>{message.text}</p></div>)}
            {sending && <div className="message tutor-message loading-message"><span className="message-author">✳ BuildLab</span><p>{t("thinking")} <span className="typing-dots">•••</span></p></div>}
            {chatError && <p className="chat-error" role="alert">{chatError}</p>}
          </div>
          {tutorMode === "demo" && <p className="demo-notice">ⓘ {t("noAI")}</p>}
          <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); void sendQuestion(); }}>
            <label htmlFor="chat-input" className="sr-only">{t("ask")}</label>
            <textarea id="chat-input" value={chatInput} maxLength={1200} rows={2} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendQuestion(); } }} placeholder={t("ask")} />
            <button type="submit" className="send-button" disabled={sending || !chatInput.trim()} aria-label={t("send")}>↑</button>
          </form>
          <p className="chat-footnote">{language === "vi" ? "Enter để gửi · Shift+Enter xuống dòng" : "Enter to send · Shift+Enter for a new line"}</p>
        </aside>

        <div className={`mobile-progress mobile-section ${activeTab !== "progress" ? "mobile-hidden" : ""}`}>
          <section className="progress-card"><div className="progress-heading"><span>{t("progress")}</span><strong>{percent}%</strong></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><p>{work.completedSteps.length}/{GUIDE.steps.length} {t("completed")}</p></section>
          <section className="safety-card"><h2>{t("safe")}</h2><p>{language === "vi" ? "Dùng xi-lanh không kim và chỉ dùng nước. Bảo vệ mặt bàn. Tránh ngón tay khỏi khớp. Dừng nếu ống tuột, bìa rách hoặc khớp kẹt. Nhờ người lớn hỗ trợ dao thủ công và keo nóng." : "Use needleless syringes and water only. Protect the work surface. Keep fingers clear of joints. Stop if tubing detaches, cardboard tears, or a joint jams. Get adult help for craft knives and hot glue."}</p></section>
          <section className="reflection-card"><h2>{t("notes")}</h2><textarea rows={4} maxLength={2000} value={work.notes} onChange={(event) => update({ notes: event.target.value })} placeholder={t("notesPlaceholder")} /></section>
          <button type="button" className="button button-outline print-button" onClick={() => window.print()}>{t("downloadPrint")}</button>
          <p className="future-note">✦ {t("futureProject")}: {language === "vi" ? "hãy để lại đề xuất trong ghi chú dự án." : "leave your idea in project notes."}</p>
        </div>
      </div>
      <footer className="footer-note"><span>BuildLab <span className="brand-accent">✳</span></span><span>{t("prototype")} · {language === "vi" ? "Hướng dẫn tham khảo, chưa được kiểm chứng vật lý." : "Reference guide; not physically validated."}</span></footer>
    </div>
  );
}

function ChallengePanel({ work, language, t, updateResult, update }: {
  work: StudentWork;
  language: Language;
  t: (key: Parameters<typeof text>[1]) => string;
  updateResult: (field: keyof TestResults, value: string) => void;
  update: (patch: Partial<StudentWork>) => void;
}) {
  return <section className="challenge-panel">
    <div className="challenge-header"><span className="challenge-icon">◎</span><div><span className="eyebrow">{t("challenge")}</span><h3>{language === "vi" ? "Thử thách gắp và đặt" : "Pick-and-place challenge"}</h3></div></div>
    <p>{language === "vi" ? "Chọn một vật nhẹ, không vỡ; di chuyển từ vị trí đã đánh dấu đến đích. Dừng nếu đế nhấc, kết cấu rách hoặc khớp kẹt." : "Pick a lightweight, non-breakable object and move it from a marked start to a target. Stop if the base lifts, structure tears, or a joint jams."}</p>
    <div className="result-grid">{resultFields.map(({ id, key }) => <label key={id} className={["problems", "changes", "afterChange"].includes(id) ? "result-wide" : ""}>{t(key)}<input maxLength={200} value={work.testResults[id]} onChange={(event) => updateResult(id, event.target.value)} /></label>)}</div>
    <p className="small-muted">{language === "vi" ? "Không điền số liệu giả định. Để trống khối lượng nếu chưa đo." : "Do not enter invented results. Leave mass blank if not measured."}</p>
    <h3 className="reflection-title">{t("reflection")}</h3>
    <div className="reflection-questions">{reflections.map((question) => <label key={question.id}><span>{language === "vi" ? question.vi : question.en}</span><textarea rows={2} maxLength={300} value={work.reflection[question.id] ?? ""} onChange={(event) => update({ reflection: { ...work.reflection, [question.id]: event.target.value } })} /></label>)}</div>
    <h3 className="reflection-title">{t("rubric")}</h3>
    <div className="rubric-grid">{rubricRows[language].map((row) => <article key={row.criterion}><strong>{row.criterion}</strong><div>{(language === "vi" ? ["Bắt đầu", "Đạt mục tiêu", "Vững vàng"] : ["Getting started", "On track", "Strong evidence"]).map((level, index) => <p key={level}><span>{level}</span>{row.levels[index]}</p>)}</div></article>)}</div>
    <button type="button" className="button button-outline print-button" onClick={() => window.print()}>{t("report")}</button>
  </section>;
}

function TroubleshootingPanel({ language, title }: { language: Language; title: string }) {
  const vi = language === "vi";
  const entries = [
    { title: vi ? "Có bọt khí hoặc phản hồi mềm" : "Air bubbles or soft response", symptom: vi ? "Bạn thấy bọt hoặc điều khiển có cảm giác đàn hồi." : "You see bubbles or the control feels springy.", checks: vi ? ["Kiểm tra đầu nối ướt có khe hở không.", "Khi chưa gắn tải, hướng ống để bọt nổi lên rồi xả nước chậm.", "Nối lại đầu vòi khi còn ướt và thử hành trình ngắn."] : ["Check wet connections for gaps.", "With the actuator unloaded, orient the tube so bubbles rise and flush slowly.", "Reconnect wet nozzle ends and test a short stroke."] },
    { title: vi ? "Xi-lanh di chuyển nhưng khớp không" : "Syringe moves but the joint does not", symptom: vi ? "Bộ điều khiển di chuyển nhưng khớp không nhúc nhích." : "The controller moves but the joint does not.", checks: vi ? ["Xác nhận nhãn điều khiển và truyền động thuộc cùng mạch.", "Kiểm tra thân xi-lanh có được cố định và pít-tông có nối với thanh không.", "Kiểm tra chốt bị kẹt và pít-tông có chạm giới hạn không."] : ["Confirm controller and actuator labels match.", "Check that the actuator barrel is fixed and its plunger is linked.", "Check for a binding pivot or syringe travel limit."] },
    { title: vi ? "Rò nước hoặc ống tuột" : "Leak or detached tubing", symptom: vi ? "Nước nhỏ giọt hoặc ống tuột khỏi vòi." : "Water drips or the tube comes off its nozzle.", checks: vi ? ["Dừng và lau khô; không đẩy mạnh hơn.", "Kiểm tra ống có khớp chặt mà không bị nứt.", "Thay cặp ống/xi-lanh không khớp; không tự đổi cỡ."] : ["Stop and dry the area; do not push harder.", "Check the tube fits securely without splitting.", "Replace a mismatched tube/syringe pair; do not silently substitute sizes."] },
    { title: vi ? "Đế bị nghiêng" : "Base tips", symptom: vi ? "B1 nhấc khỏi bàn hoặc mô hình nghiêng." : "B1 lifts from the table or the model leans.", checks: vi ? ["Dừng thử và bỏ vật khỏi kẹp.", "Thu cánh tay vào giữa đế.", "Gia cố hoặc mở rộng đế; thử lại khi không có tải."] : ["Stop and remove the object.", "Bring the arm over the base.", "Reinforce or widen the base; retest unloaded."] },
    { title: vi ? "Khớp bị kẹt" : "A joint jams", symptom: vi ? "Chốt không xoay, thanh cọ sát hoặc bìa rách." : "A pivot will not turn, a link scrapes, or cardboard tears.", checks: vi ? ["Dừng đẩy bộ điều khiển.", "Kiểm tra chốt thẳng hàng và nới nhẹ.", "Gia cố bìa rách trước khi thử; nhờ người lớn hỗ trợ."] : ["Stop pushing the controller.", "Check pivot alignment and slightly loosen the fastener.", "Reinforce torn cardboard before retesting; ask an adult for help."] },
  ];
  return <details className="troubleshooting-panel"><summary><strong>{title}</strong><span className="summary-chevron">⌄</span></summary><div>{entries.map((entry) => <article key={entry.title}><h4>{entry.title}</h4><p>{entry.symptom}</p><ul>{entry.checks.map((check) => <li key={check}>{check}</li>)}</ul></article>)}</div></details>;
}
