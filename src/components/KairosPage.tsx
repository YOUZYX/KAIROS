"use client";

import { useEffect, useRef, useState } from "react";

const translations = {
  dr: {
    step1Label: "Lidentité",
    step2Label: "Détails",
    step3Label: "Talent",
    step4Label: "Motivation",
    fullName: "SMIYA / LKNIYA",
    fullNamePh: "Dkhel smiytek kamla...",
    fullNameErr: "3afak dkhel smiytek kamla",
    email: "Email",
    emailPh: "Dkhel l'email dyalek...",
    emailErr: "3afak dkhel email s7i7",
    phone: "NMRA",
    phonePh: "Dkhel num dyalek...",
    phoneErr: "3afak dkhel num dyalek",
    studyField: "filière",
    studyFieldPh: "gestion/dev/...",
    studyFieldErr: "3afak dkhel majal dyalek",
    talent: "TALENT",
    talentDefault: "-- Khtar Talent dyalk --",
    talentOther: "Haja khra (ktb lt7t)",
    talentErr: "3afak khtar talent dyalk",
    otherTalent: "Hdded talent",
    otherTalentPh: "Ashno howa talent dyalk?",
    otherTalentErr: "3afak hdded talent dyalk",
    motivation: "3LACH BGHITI DKHAL L KAIROS ?",
    motivationPh: "...",
    motivationErr: "3afak goul lina 3lach bghiti dkhl l kairos",
    prev: "RJE3",
    next: "ZIID",
    submit: "SIFT",
    successTitle: "TAMAM !",
    successMsg: "Talab dyalek tsift...",
  },
} as const;

const scriptURL = process.env.NEXT_PUBLIC_SHEETS_URL ?? "";

if (!scriptURL) {
  throw new Error("Sheets_URL is not set");
}

export default function KairosPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const t = translations.dr;

  useEffect(() => {
    // Attempt autoplay (may be blocked by browser)
    const audio = bgMusicRef.current;
    if (!audio) return;
    audio.volume = 0.4;
    audio
      .play()
      .then(() => setMusicPlaying(true))
      .catch(() => setMusicPlaying(false));

    // Resume audio on first user interaction if blocked
    const resumeAudio = () => {
      if (!audio) return;
      if (!musicPlaying) {
        audio
          .play()
          .then(() => setMusicPlaying(true))
          .catch(() => {});
      }
    };
    document.addEventListener("click", resumeAudio, { once: true });
    return () => document.removeEventListener("click", resumeAudio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateOtherTalentVisibility(value: string) {
    const group = document.getElementById("otherTalentGroup") as HTMLDivElement | null;
    const input = document.getElementById("otherTalent") as HTMLInputElement | null;
    if (!group || !input) return;
    if (value === "other") {
      group.style.display = "block";
      input.setAttribute("required", "");
    } else {
      group.style.display = "none";
      input.removeAttribute("required");
      input.value = "";
      group.classList.remove("error");
    }
  }

  function validateStep(step: number) {
    let isValid = true;
    const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!stepEl) return false;
    const groups = stepEl.querySelectorAll(".form-group");

    groups.forEach((group) => {
      group.classList.remove("error");
      const input = group.querySelector("input, select, textarea") as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
        | null;
      if (!input) return;

      // skip hidden otherTalent group
      const otherGroup = input.closest("#otherTalentGroup") as HTMLDivElement | null;
      if (otherGroup && otherGroup.style.display === "none") return;

      if (input.hasAttribute("required")) {
        if ((input as HTMLInputElement).type === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test((input as HTMLInputElement).value.trim())) {
            group.classList.add("error");
            isValid = false;
          }
        } else if (input.tagName === "SELECT") {
          if (!(input as HTMLSelectElement).value) {
            group.classList.add("error");
            isValid = false;
          }
        } else {
          if (!(input as HTMLInputElement | HTMLTextAreaElement).value.trim()) {
            group.classList.add("error");
            isValid = false;
          }
        }
      }
    });

    return isValid;
  }

  function showSuccessAndReset() {
    const overlay = document.getElementById("successOverlay");
    overlay?.classList.add("show");

    window.setTimeout(() => {
      overlay?.classList.remove("show");
      const form = document.getElementById("joinForm") as HTMLFormElement | null;
      form?.reset();
      const otherGroup = document.getElementById("otherTalentGroup") as HTMLDivElement | null;
      if (otherGroup) otherGroup.style.display = "none";
      setCurrentStep(1);
      setSubmitting(false);
    }, 8000);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setSubmitting(true);

    const talentValue = (document.getElementById("talent") as HTMLSelectElement | null)?.value ?? "";
    const otherTalent = (document.getElementById("otherTalent") as HTMLInputElement | null)?.value.trim() ?? "";
    const finalTalent = talentValue === "other" ? otherTalent : talentValue;

    const formData = new FormData();
    formData.append("fullName", (document.getElementById("fullName") as HTMLInputElement).value.trim());
    formData.append("email", (document.getElementById("email") as HTMLInputElement).value.trim());
    formData.append("phone", (document.getElementById("phone") as HTMLInputElement).value.trim());
    formData.append("studyField", (document.getElementById("studyField") as HTMLInputElement).value.trim());
    formData.append("talent", finalTalent);
    formData.append("motivation", (document.getElementById("motivation") as HTMLTextAreaElement).value.trim());

    try {
      // keep no-cors (Apps Script + redirects), still writes to Sheets
      await fetch(scriptURL, { method: "POST", body: formData, mode: "no-cors" });
      showSuccessAndReset();
    } catch (err) {
      // keep same behavior: re-enable submit
      // eslint-disable-next-line no-console
      console.error("Submit error:", err);
      setSubmitting(false);
    }
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(4, s + 1));
  }

  function prevStep() {
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  function toggleSound() {
    const audio = bgMusicRef.current;
    if (!audio) return;
    if (musicPlaying) {
      audio.pause();
      setMusicPlaying(false);
    } else {
      audio
        .play()
        .then(() => setMusicPlaying(true))
        .catch(() => setMusicPlaying(false));
    }
  }

  return (
    <>
      {/* SVG Filters for wavy distortion */}
      <svg className="svg-filters" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="wavy">
            <feTurbulence type="turbulence" baseFrequency="0.015 0.04" numOctaves={3} seed={2} result="turbulence">
              <animate
                attributeName="baseFrequency"
                values="0.015 0.04;0.02 0.06;0.015 0.04"
                dur="6s"
                repeatCount="indefinite"
              />
              <animate attributeName="seed" values="2;8;2" dur="4s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale={6} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="wavyStrong">
            <feTurbulence type="turbulence" baseFrequency="0.02 0.06" numOctaves={2} seed={5} result="turbulence">
              <animate
                attributeName="baseFrequency"
                values="0.02 0.06;0.03 0.08;0.02 0.06"
                dur="3s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale={10} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="scanlines" />
      <div className="noise" />
      <div className="vignette" />
      <div className="background-glitch" aria-hidden="true" />

      <div className="glitch-slice glitch-slice-1" />
      <div className="glitch-slice glitch-slice-2" />
      <div className="glitch-slice glitch-slice-3" />

      <audio ref={bgMusicRef} id="bgMusic" src="/assets/background_music.mp3" loop preload="auto" />

      <button className={`sound-toggle ${musicPlaying ? "active" : ""}`} id="soundToggle" title="Toggle Sound" onClick={toggleSound}>
        <svg className="sound-icon sound-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: musicPlaying ? "block" : "none" }}>
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
        <svg className="sound-icon sound-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: musicPlaying ? "none" : "block" }}>
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      </button>

      <main className="hero">
        <div className="hero-content">
          <img src="/assets/fulllogo.png" alt="KAIROS Logo" className="logo" />
          {/* <img src=\"/assets/kairos.png\" alt=\"KAIROS\" className=\"kairos-title\" /> */}
          <img src="/assets/tagline.png" alt="كولاب jUST كلوب ما كلوبش" className="tagline-img" />
        </div>

        <div className="form-container">
          <div className="stepper-header">
            <div className={`step-indicator ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`} data-step="1">
              <div className="step-number">1</div>
              <span className="step-label">{t.step1Label}</span>
            </div>
            <div className="step-line" />
            <div className={`step-indicator ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`} data-step="2">
              <div className="step-number">2</div>
              <span className="step-label">{t.step2Label}</span>
            </div>
            <div className="step-line" />
            <div className={`step-indicator ${currentStep === 3 ? "active" : currentStep > 3 ? "completed" : ""}`} data-step="3">
              <div className="step-number">3</div>
              <span className="step-label">{t.step3Label}</span>
            </div>
            <div className="step-line" />
            <div className={`step-indicator ${currentStep === 4 ? "active" : ""}`} data-step="4">
              <div className="step-number">4</div>
              <span className="step-label">{t.step4Label}</span>
            </div>
          </div>

          <form id="joinForm" noValidate onSubmit={onSubmit}>
            <div className={`form-step ${currentStep === 1 ? "active" : ""}`} data-step="1">
              <div className="form-group">
                <label htmlFor="fullName">{t.fullName}</label>
                <input type="text" id="fullName" name="fullName" required placeholder={t.fullNamePh} />
                <span className="error-msg">{t.fullNameErr}</span>
              </div>
              <div className="form-group">
                <label htmlFor="email">{t.email}</label>
                <input type="email" id="email" name="email" required placeholder={t.emailPh} />
                <span className="error-msg">{t.emailErr}</span>
              </div>
            </div>

            <div className={`form-step ${currentStep === 2 ? "active" : ""}`} data-step="2">
              <div className="form-group">
                <label htmlFor="phone">{t.phone}</label>
                <input type="tel" id="phone" name="phone" required placeholder={t.phonePh} />
                <span className="error-msg">{t.phoneErr}</span>
              </div>
              <div className="form-group">
                <label htmlFor="studyField">{t.studyField}</label>
                <input type="text" id="studyField" name="studyField" required placeholder={t.studyFieldPh} />
                <span className="error-msg">{t.studyFieldErr}</span>
              </div>
            </div>

            <div className={`form-step ${currentStep === 3 ? "active" : ""}`} data-step="3">
              <div className="form-group">
                <label htmlFor="talent">{t.talent}</label>
                <select
                  id="talent"
                  name="talent"
                  required
                  defaultValue=""
                  onChange={(e) => updateOtherTalentVisibility(e.target.value)}
                >
                  <option value="">{t.talentDefault}</option>
                  <option value="arts_plastiques">الفنون التشكيلية / Arts plastiques</option>
                  <option value="theatre_cinema">المسرح والسينما / Théâtre et cinéma</option>
                  <option value="musique_chant">الموسيقى والغناء / Musique et chant</option>
                  <option value="ecriture_lecture_poesie">الشعر، الكتابة والقراءة / Écriture, lecture et poésie</option>
                  <option value="organisation_logistique">التنظيم واللوجستيك / Organisation et logistique</option>
                  <option value="design_photo_montage">التصميم، التصوير والمونتاج / Design, photographie et montage</option>
                  <option value="other">{t.talentOther}</option>
                </select>
                <span className="error-msg">{t.talentErr}</span>
              </div>
              <div className="form-group" id="otherTalentGroup" style={{ display: "none" }}>
                <label htmlFor="otherTalent">{t.otherTalent}</label>
                <input type="text" id="otherTalent" name="otherTalent" placeholder={t.otherTalentPh} />
                <span className="error-msg">{t.otherTalentErr}</span>
              </div>
            </div>

            <div className={`form-step ${currentStep === 4 ? "active" : ""}`} data-step="4">
              <div className="form-group">
                <label htmlFor="motivation">{t.motivation}</label>
                <textarea id="motivation" name="motivation" rows={5} required placeholder={t.motivationPh} />
                <span className="error-msg">{t.motivationErr}</span>
              </div>
            </div>

            <div className="form-nav">
              <button type="button" className="btn btn-prev" onClick={prevStep} style={{ display: currentStep === 1 ? "none" : "inline-block" }}>
                {t.prev}
              </button>
              <button type="button" className="btn btn-next" onClick={nextStep} style={{ display: currentStep === 4 ? "none" : "inline-block" }}>
                {t.next}
              </button>
              <button type="submit" className="btn btn-submit" style={{ display: currentStep === 4 ? "inline-block" : "none" }} disabled={submitting}>
                {submitting ? "..." : t.submit}
              </button>
            </div>
          </form>
        </div>

        <div className="success-overlay" id="successOverlay">
          <div className="success-box">
            {/* <div className="success-icon">&#10003;</div>
            <h2>{t.successTitle}</h2>
            <p>{t.successMsg}</p> */}
            <img src="/assets/done.png" alt="Success"/>
          </div>
        </div>
      </main>
    </>
  );
}

