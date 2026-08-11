import React, { useState } from "react";
import { Panel, Stat, Chip, Bar } from "../components/primitives.jsx";
import { SCORE_CATS, EVIDENCE, UNDERSTANDING_STAGES, stageFor } from "../data/learningStages.js";
import { QUIZ } from "../data/quiz.js";

export function ColdScore({ app }) {
  const { state, setState } = app;
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(false);

  const avg = SCORE_CATS.reduce((s, c) => s + state.scores[c.k], 0) / SCORE_CATS.length;
  const stage = stageFor(avg);

  const grade = () => {
    setGraded(true);
    const bump = {};
    QUIZ.forEach((q, i) => {
      const right = answers[i] === q.correct;
      bump[q.cat] = (bump[q.cat] || 0) + (right ? 5 : -2);
    });
    setState((s) => {
      const ns = { ...s.scores };
      Object.entries(bump).forEach(([k, d]) => { ns[k] = Math.max(0, Math.min(100, ns[k] + d)); });
      return { ...s, scores: ns, quizRuns: s.quizRuns + 1 };
    });
  };
  const startQuiz = () => { setQuiz(true); setAnswers({}); setGraded(false); };
  const correctCount = QUIZ.filter((q, i) => answers[i] === q.correct).length;

  return (
    <div className="space-y-5">
      <Panel title="Overall understanding" right={<Chip tone={stage >= 5 ? "green" : stage >= 3 ? "amber" : "neutral"}>{UNDERSTANDING_STAGES[stage]}</Chip>}>
        <div className="split-d">
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>
              You are at <span className="green">{UNDERSTANDING_STAGES[stage]}</span> on Foundation Property Trust.
            </h2>
            <p className="dim text-sm mb-5" style={{ lineHeight: 1.7, maxWidth: 620 }}>
              COLD status is never awarded for portfolio returns. It is awarded when you can explain the business,
              calculate the cash, name the risks, produce a value, and hold that reasoning steady across scenarios that
              are designed to unsettle it.
            </p>
            <div className="flex flex-wrap" style={{ gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
              {UNDERSTANDING_STAGES.map((s, i) => (
                <div key={s} style={{ flex: "1 1 110px", background: i === stage ? "var(--green-wash)" : "var(--panel)", padding: "12px 10px", textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: i <= stage ? "var(--green)" : "var(--dimmer)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mono" style={{ fontSize: 11, marginTop: 5, color: i === stage ? "var(--tx)" : i < stage ? "var(--dim)" : "var(--dimmer)" }}>{s}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center" style={{ minWidth: 200 }}>
            <div className="label mb-2">Composite</div>
            <div className="mono" style={{ fontSize: 52, lineHeight: 1, letterSpacing: "-0.03em" }}>{Math.round(avg)}</div>
            <div className="mono dimmer mt-2" style={{ fontSize: 11 }}>out of 100</div>
            <button className="btn btn-primary mt-5" style={{ width: "100%" }} onClick={startQuiz}>Test my understanding</button>
            <div className="mono dimmer mt-2" style={{ fontSize: 10 }}>{state.quizRuns} attempt{state.quizRuns === 1 ? "" : "s"} recorded</div>
          </div>
        </div>
      </Panel>

      {quiz && (
        <Panel title="Knowledge check" right={graded ? <Chip tone={correctCount >= 5 ? "green" : "amber"}>{correctCount} of {QUIZ.length} correct</Chip> : <Chip>{Object.keys(answers).length} of {QUIZ.length} answered</Chip>}>
          <div className="space-y-6">
            {QUIZ.map((q, i) => (
              <div key={i}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="mono dimmer" style={{ fontSize: 10, marginTop: 4 }}>{String(i + 1).padStart(2, "0")}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, lineHeight: 1.5 }}>{q.q}</div>
                    <div className="label mt-1.5">{SCORE_CATS.find((c) => c.k === q.cat).name}</div>
                  </div>
                </div>
                <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", background: "var(--line)", border: "1px solid var(--line)", marginLeft: 26 }}>
                  {q.a.map((opt, oi) => {
                    const chosen = answers[i] === oi;
                    const isRight = graded && oi === q.correct;
                    const isWrong = graded && chosen && oi !== q.correct;
                    return (
                      <button key={oi} disabled={graded} onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                        className="text-left mono"
                        style={{ background: isRight ? "var(--green-wash)" : isWrong ? "var(--red-wash)" : chosen ? "var(--panel-2)" : "var(--panel)",
                          border: "none", padding: "12px 14px", fontSize: 12, lineHeight: 1.5, cursor: graded ? "default" : "pointer",
                          color: isRight ? "var(--green)" : isWrong ? "var(--red)" : chosen ? "var(--tx)" : "var(--dim)" }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {graded && (
                  <div className="mono dim mt-3" style={{ fontSize: 11, lineHeight: 1.65, marginLeft: 26 }}>
                    <span className="green">{"└ "}</span>{q.why}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="rowline mt-6 pt-4 flex gap-3 flex-wrap">
            {!graded ? (
              <button className="btn btn-primary" disabled={Object.keys(answers).length < QUIZ.length} onClick={grade}>Grade my answers</button>
            ) : (
              <>
                <button className="btn" onClick={startQuiz}>Retake</button>
                <button className="btn" onClick={() => setQuiz(null)}>Close</button>
                <span className="mono dimmer" style={{ fontSize: 11, alignSelf: "center" }}>Category scores updated.</span>
              </>
            )}
          </div>
        </Panel>
      )}

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
        {SCORE_CATS.map((c) => {
          const v = state.scores[c.k];
          const tone = v >= 75 ? "green" : v >= 50 ? "amber" : "red";
          return (
            <Panel key={c.k} title={c.name} right={<Chip tone={tone}>{v} / 100</Chip>}>
              <p className="dim text-sm mb-4" style={{ lineHeight: 1.6 }}>{c.asks}</p>
              <Bar pct={v} tone={tone} />
              <div className="label mt-5 mb-3">Evidence needed to raise this</div>
              <ul className="space-y-3">
                {EVIDENCE[c.k].map((e, i) => (
                  <li key={i} className="flex gap-3 text-sm dim" style={{ lineHeight: 1.55 }}>
                    <span className="mono dimmer" style={{ fontSize: 10, marginTop: 3 }}>{String(i + 1).padStart(2, "0")}</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
