"use client";

import { useState } from "react";
import type { QuestionnaireModeInput } from "@repo/recipes";

type Answers = {
  timeOfDay: string;
  needsHealthy: boolean | null;
  eatingAlone: boolean | null;
  partySize: string;
  allergies: string;
  dietType: "none" | "vegan" | "vegetarian" | null;
  dietaryRestrictions: string;
};

const EMPTY_ANSWERS: Answers = {
  timeOfDay: "",
  needsHealthy: null,
  eatingAlone: null,
  partySize: "",
  allergies: "",
  dietType: null,
  dietaryRestrictions: "",
};

function isStepAnswered(step: number, a: Answers): boolean {
  switch (step) {
    case 0:
      return a.timeOfDay.trim().length > 0;
    case 1:
      return a.needsHealthy !== null;
    case 2:
      return a.eatingAlone !== null && (a.eatingAlone || a.partySize.trim().length > 0);
    case 3:
      return a.allergies.trim().length > 0;
    case 4:
      return a.dietType !== null;
    case 5:
      return a.dietaryRestrictions.trim().length > 0;
    default:
      return false;
  }
}

export function QuestionnaireWizard({
  onSubmit,
  submitting,
}: {
  onSubmit: (input: QuestionnaireModeInput) => void;
  submitting: boolean;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);

  const totalSteps = 6;
  const answered = isStepAnswered(step, answers);

  function next() {
    if (step === totalSteps - 1) {
      onSubmit({
        mode: "questionnaire",
        timeOfDay: answers.timeOfDay.trim(),
        needsHealthy: answers.needsHealthy === true,
        eatingAlone: answers.eatingAlone === true,
        partySize: answers.eatingAlone ? undefined : Number(answers.partySize),
        allergies: answers.allergies.trim(),
        dietType: answers.dietType ?? "none",
        dietaryRestrictions: answers.dietaryRestrictions.trim(),
      });
      return;
    }
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="animate-fade-scale-in flex flex-col gap-4 rounded border border-white/15 p-4">
      <p className="text-xs text-white/50">
        Question {step + 1} of {totalSteps}
      </p>

      {step === 0 && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-white/90">
            What time of the day is it?
          </span>
          <input
            type="text"
            placeholder="e.g. morning, 7pm, lunchtime"
            value={answers.timeOfDay}
            onChange={(e) =>
              setAnswers((a) => ({ ...a, timeOfDay: e.target.value }))
            }
            className="input-dark"
          />
        </label>
      )}

      {step === 1 && (
        <fieldset className="flex flex-col gap-2">
          <span className="text-sm font-medium text-white/90">
            Does the food/dish need to be healthy?
          </span>
          <YesNo
            value={answers.needsHealthy}
            onChange={(v) => setAnswers((a) => ({ ...a, needsHealthy: v }))}
          />
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="flex flex-col gap-3">
          <span className="text-sm font-medium text-white/90">Are you eating alone?</span>
          <YesNo
            value={answers.eatingAlone}
            onChange={(v) => setAnswers((a) => ({ ...a, eatingAlone: v, partySize: v ? "" : a.partySize }))}
          />
          {answers.eatingAlone === false && (
            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/80">
                How many people are eating this food/dish?
              </span>
              <input
                type="number"
                min={1}
                value={answers.partySize}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, partySize: e.target.value }))
                }
                className="input-dark w-32"
              />
            </label>
          )}
        </fieldset>
      )}

      {step === 3 && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-white/90">
            Are you allergic to anything?
          </span>
          <input
            type="text"
            placeholder="e.g. peanuts, shellfish, or 'none'"
            value={answers.allergies}
            onChange={(e) =>
              setAnswers((a) => ({ ...a, allergies: e.target.value }))
            }
            className="input-dark"
          />
        </label>
      )}

      {step === 4 && (
        <fieldset className="flex flex-col gap-2">
          <span className="text-sm font-medium text-white/90">
            Are you a vegan/vegetarian?
          </span>
          <div className="flex gap-2">
            {(["none", "vegetarian", "vegan"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, dietType: v }))}
                className={`rounded px-3 py-1.5 text-sm capitalize transition-transform hover:scale-[1.02] ${
                  answers.dietType === v
                    ? "gradient-button"
                    : "border border-white/20 text-white/70 hover:bg-white/5"
                }`}
              >
                {v === "none" ? "Neither" : v}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 5 && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-white/90">
            Do you have any dietary restrictions? If so, name them.
          </span>
          <input
            type="text"
            placeholder="e.g. gluten-free, low-sodium, or 'none'"
            value={answers.dietaryRestrictions}
            onChange={(e) =>
              setAnswers((a) => ({ ...a, dietaryRestrictions: e.target.value }))
            }
            className="input-dark"
          />
        </label>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="button-outline text-sm disabled:opacity-30"
        >
          Back
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!answered || submitting}
          className="gradient-button px-4 py-1.5 text-sm"
        >
          {step === totalSteps - 1 ? "Generate recipe" : "Next"}
        </button>
      </div>
    </div>
  );
}

function YesNo({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded px-4 py-1.5 text-sm transition-transform hover:scale-[1.02] ${
          value === true ? "gradient-button" : "border border-white/20 text-white/70 hover:bg-white/5"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded px-4 py-1.5 text-sm transition-transform hover:scale-[1.02] ${
          value === false ? "gradient-button" : "border border-white/20 text-white/70 hover:bg-white/5"
        }`}
      >
        No
      </button>
    </div>
  );
}
