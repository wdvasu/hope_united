"use client";

import { useEffect, useState } from "react";

type Veteran = "YES" | "NO" | "REFUSED";
type Sexual = "HETEROSEXUAL" | "GAY_LESBIAN" | "BISEXUAL" | "OTHER" | "REFUSED";
type Gender = "FEMALE" | "MALE" | "TRANSGENDER" | "NON_BINARY" | "OTHER" | "REFUSED";
type Race =
  | "WHITE"
  | "BLACK_AFRICAN_AMERICAN"
  | "ASIAN"
  | "AMERICAN_INDIAN_ALASKA_NATIVE"
  | "NATIVE_HAWAIIAN_PACIFIC_ISLANDER"
  | "OTHER"
  | "REFUSED";
type Ethnicity = "HISPANIC_LATINO" | "NOT_HISPANIC_LATINO" | "REFUSED";
type County =
  | "SUMMIT"
  | "STARK"
  | "PORTAGE"
  | "CUYAHOGA"
  | "OTHER_OH_COUNTY"
  | "OUT_OF_STATE"
  | "REFUSED";

const STORAGE_KEY = ["hopeunited", "register", "draft", "v1"].join(":");

export default function RegisterPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [fullName, setFullName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [veteranStatus, setVeteranStatus] = useState<Veteran>("REFUSED");
  const [sexualOrientation, setSexual] = useState<Sexual>("REFUSED");
  const [sexualOther, setSexualOther] = useState("");
  const [gender, setGender] = useState<Gender>("REFUSED");
  const [genderOther, setGenderOther] = useState("");
  const [race, setRace] = useState<Race>("REFUSED");
  const [raceOther, setRaceOther] = useState("");
  const [ethnicity, setEthnicity] = useState<Ethnicity>("REFUSED");
  const [county, setCounty] = useState<County>("REFUSED");
  const [countyOther, setCountyOther] = useState("");
  const [waiver, setWaiver] = useState(false);
  const [signature, setSignature] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [waiverOpen, setWaiverOpen] = useState(false);
  const [waiverShownOnce, setWaiverShownOnce] = useState(false);

  // removed: drugs selection

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setTimeout(() => {
          setFullName(data.fullName || "");
          setZipCode(data.zipCode || "");
          setBirthYear(data.birthYear || "");
          setVeteranStatus(data.veteranStatus || "REFUSED");
          // removed: drugs
          setSexual(data.sexualOrientation || "REFUSED");
          setSexualOther(data.sexualOther || "");
          setGender(data.gender || "REFUSED");
          setGenderOther(data.genderOther || "");
          setRace(data.race || "REFUSED");
          setRaceOther(data.raceOther || "");
          setEthnicity(data.ethnicity || "REFUSED");
          setCounty(data.county || "REFUSED");
          setCountyOther(data.countyOther || "");
          setWaiver(!!data.waiverAgreed);
          setSignature(data.eSignatureName || "");
        }, 0);
      }
    } catch {}
  }, []);

  // Auth gate check
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        setAuthed(res.ok);
      } catch {
        setAuthed(false);
      }
    })();
  }, []);

  // Persist draft on changes (debounced via microtask)
  useEffect(() => {
    const payload = {
      fullName,
      zipCode,
      birthYear,
      veteranStatus,
      sexualOrientation,
      sexualOther,
      gender,
      genderOther,
      race,
      raceOther,
      ethnicity,
      county,
      countyOther,
      waiverAgreed: waiver,
      eSignatureName: signature,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
  }, [fullName, zipCode, birthYear, veteranStatus, sexualOrientation, sexualOther, gender, genderOther, race, raceOther, ethnicity, county, countyOther, waiver, signature]);

  const submit = async () => {
    setMessage(null);
    const payload = {
      fullName,
      zipCode,
      birthYear,
      veteranStatus,
      sexualOrientation,
      sexualOther: sexualOrientation === "OTHER" ? sexualOther || null : null,
      gender,
      genderOther: gender === "OTHER" ? genderOther || null : null,
      race,
      raceOther: race === "OTHER" ? raceOther || null : null,
      ethnicity,
      county,
      countyOther: county === "OTHER_OH_COUNTY" ? countyOther || null : null,
      waiverAgreed: waiver === true,
      eSignatureName: signature,
      eSignatureAt: new Date().toISOString(),
    };
    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const j = await res.json();
    if (!res.ok) {
      setMessage(j.error || "Submission failed");
    } else {
      setUid(j.uid);
      setMessage("Registration saved.");
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      // Reset the form to blanks/defaults after successful submit
      setFullName("");
      setZipCode("");
      setVeteranStatus("REFUSED");
      setSexual("REFUSED");
      setSexualOther("");
      setGender("REFUSED");
      setGenderOther("");
      setRace("REFUSED");
      setRaceOther("");
      setEthnicity("REFUSED");
      setCounty("REFUSED");
      setCountyOther("");
      setWaiver(false);
      setSignature("");
    }
  };

  const Chip = ({
    selected,
    label,
    onClick,
  }: {
    selected: boolean;
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-base transition-colors ${
        selected
          ? "bg-foreground text-background border-foreground"
          : "bg-transparent border-foreground/30 text-foreground hover:bg-foreground/5"
      }`}
    >
      {label}
    </button>
  );

  if (authed === false) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Please login</h1>
        <p className="text-foreground/70">This tablet must be enrolled and logged in before registering participants.</p>
        <a className="inline-block px-4 py-2 rounded bg-black text-white" href="/login">Go to Login</a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 text-[18px]">
      <h1 className="text-2xl font-semibold">New Participant Registration</h1>

      <section className="space-y-3">
        <h2 className="font-medium">Personal & Contact Info</h2>
        <input
          className="w-full border rounded px-4 py-3 bg-background text-foreground placeholder:text-foreground/50 border-foreground/20"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input className="w-full border rounded px-4 py-3 bg-background text-foreground placeholder:text-foreground/50 border-foreground/20" placeholder="Birth Year (YYYY)" inputMode="numeric" value={birthYear} onChange={(e)=>setBirthYear(e.target.value.replace(/[^0-9]/g,'').slice(0,4))} />
        <input
          className="w-full border rounded px-4 py-3 bg-background text-foreground placeholder:text-foreground/50 border-foreground/20"
          placeholder="Zip Code (5 digits)"
          inputMode="numeric"
          pattern="^\\d{5}$"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value.replace(/[^0-9]/g, "").slice(0,5))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Demographic Data (for Grant Funding)</h2>
        <div className="space-y-2">
          <div className="text-base text-foreground/80">Veteran Status</div>
          <div className="flex flex-wrap gap-2">
            {["YES", "NO", "REFUSED"].map((v) => (
              <Chip
                key={v}
                selected={veteranStatus === v}
                label={v}
                onClick={() => setVeteranStatus(v as Veteran)}
              />
            ))}
          </div>
        </div>

        {/* Drug/Substance question removed per request */}

        <div className="space-y-2">
          <div className="text-base text-foreground/80">Sexual Orientation</div>
          <div className="flex flex-wrap gap-2">
            {[
              ["HETEROSEXUAL", "Heterosexual"],
              ["GAY_LESBIAN", "Gay or Lesbian"],
              ["BISEXUAL", "Bisexual"],
              ["OTHER", "Other"],
              ["REFUSED", "Refused"],
            ].map(([k, label]) => (
              <Chip
                key={k}
                selected={sexualOrientation === (k as Sexual)}
                label={label as string}
                onClick={() => setSexual(k as Sexual)}
              />
            ))}
          </div>
          {sexualOrientation === "OTHER" && (
            <input
              className="w-full border rounded px-4 py-3 bg-background text-foreground placeholder:text-foreground/50 border-foreground/20"
              placeholder="If Other, please specify"
              value={sexualOther}
              onChange={(e) => setSexualOther(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="text-base text-foreground/80">Gender</div>
          <div className="flex flex-wrap gap-2">
            {[
              ["FEMALE", "Female"],
              ["MALE", "Male"],
              ["TRANSGENDER", "Transgender"],
              ["NON_BINARY", "Non-Binary"],
              ["OTHER", "Other"],
              ["REFUSED", "Refused"],
            ].map(([k, label]) => (
              <Chip
                key={k}
                selected={gender === (k as Gender)}
                label={label as string}
                onClick={() => setGender(k as Gender)}
              />
            ))}
          </div>
          {gender === "OTHER" && (
            <input
              className="w-full border rounded px-4 py-3 bg-background text-foreground placeholder:text-foreground/50 border-foreground/20"
              placeholder="If Other, please specify"
              value={genderOther}
              onChange={(e) => setGenderOther(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="text-base text-foreground/80">Race</div>
          <div className="flex flex-wrap gap-2">
            {[
              ["WHITE", "White"],
              ["BLACK_AFRICAN_AMERICAN", "Black or African American"],
              ["ASIAN", "Asian"],
              ["AMERICAN_INDIAN_ALASKA_NATIVE", "American Indian/Alaska Native"],
              ["NATIVE_HAWAIIAN_PACIFIC_ISLANDER", "Native Hawaiian/Pacific Islander"],
              ["OTHER", "Other"],
              ["REFUSED", "Refused"],
            ].map(([k, label]) => (
              <Chip
                key={k}
                selected={race === (k as Race)}
                label={label as string}
                onClick={() => setRace(k as Race)}
              />
            ))}
          </div>
          {race === "OTHER" && (
            <input
              className="w-full border rounded px-4 py-3 bg-background text-foreground placeholder:text-foreground/50 border-foreground/20"
              placeholder="If Other, please specify"
              value={raceOther}
              onChange={(e) => setRaceOther(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="text-base text-foreground/80">Ethnicity</div>
          <div className="flex flex-wrap gap-2">
            {[
              ["HISPANIC_LATINO", "Hispanic or Latino"],
              ["NOT_HISPANIC_LATINO", "Not Hispanic or Latino"],
              ["REFUSED", "Refused"],
            ].map(([k, label]) => (
              <Chip
                key={k}
                selected={ethnicity === (k as Ethnicity)}
                label={label as string}
                onClick={() => setEthnicity(k as Ethnicity)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-base text-foreground/80">County of Residence</div>
          <div className="flex flex-wrap gap-2">
            {[
              ["SUMMIT", "Summit"],
              ["STARK", "Stark"],
              ["PORTAGE", "Portage"],
              ["CUYAHOGA", "Cuyahoga"],
              ["OTHER_OH_COUNTY", "Other OH County"],
              ["OUT_OF_STATE", "Out of State"],
              ["REFUSED", "Refused"],
            ].map(([k, label]) => (
              <Chip
                key={k}
                selected={county === (k as County)}
                label={label as string}
                onClick={() => setCounty(k as County)}
              />
            ))}
          </div>
          {county === "OTHER_OH_COUNTY" && (
            <input
              className="w-full border rounded px-4 py-3 bg-background text-foreground placeholder:text-foreground/50 border-foreground/20"
              placeholder="If Other OH County, please specify"
              value={countyOther}
              onChange={(e) => setCountyOther(e.target.value)}
            />
          )}
        </div>
      </section>

      <section className="space-y-3">
        <label className="flex items-center gap-2 text-base">
          <input
            type="checkbox"
            checked={waiver}
            onChange={(e)=>{
              const checked = e.target.checked;
              setWaiver(checked);
              if (checked && !waiverShownOnce) {
                setWaiverOpen(true);
                setWaiverShownOnce(true);
              }
            }}
          />
          I have read and agree to the
          <button type="button" className="underline text-indigo-600 hover:text-indigo-700" onClick={()=>setWaiverOpen(true)}>
            Facility Waiver
          </button>
          .
        </label>
        <input
          className="w-full border rounded px-4 py-3 bg-background text-foreground placeholder:text-foreground/50 border-foreground/20"
          placeholder="E‑Signature (Type Full Name)"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
        />
      </section>

      <button
        className="w-full h-14 rounded bg-indigo-600 text-white font-medium disabled:opacity-50"
        disabled={!fullName || !/^\d{5}$/.test(zipCode) || birthYear.length!==4 || !waiver || !signature}
        onClick={submit}
      >
        Complete Registration & Check‑In
      </button>

      {uid && (
        <div className="rounded border border-foreground/20 p-3">
          <div className="font-medium">UID</div>
          <div className="text-xl tracking-wider">{uid}</div>
        </div>
      )}
      {message && <p className="text-sm">{message}</p>}

      {waiverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setWaiverOpen(false)} />
          <div role="dialog" aria-modal="true" className="relative z-10 w-[min(92vw,720px)] max-h-[80vh] overflow-auto rounded-lg bg-background text-foreground shadow-lg border border-foreground/20 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold">Tyler&apos;s Redemption Place Facility Waiver</h3>
              <button type="button" onClick={()=>setWaiverOpen(false)} className="px-3 py-1 rounded border">Close</button>
            </div>
            <div className="space-y-3 leading-relaxed text-base">
              <p>
                I, the participant, understand and agree that my use of the facilities (gym, sauna, cold plunge, salt cave, and premises) is voluntary and done at my own risk. I release Tyler&apos;s Redemption Place and its staff from all liability for any injuries or accidents that may occur while on the premises. I acknowledge that I have read and understood this waiver.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
