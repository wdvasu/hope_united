"use client";

import { useState } from "react";

type Veteran = "YES" | "NO" | "REFUSED";
type Drug =
  | "ALCOHOL"
  | "OPIOIDS_HEROIN"
  | "COCAINE_CRACK"
  | "METHAMPHETAMINE"
  | "MARIJUANA"
  | "OTHER"
  | "REFUSED";
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

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [veteranStatus, setVeteranStatus] = useState<Veteran>("REFUSED");
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [drugOther, setDrugOther] = useState("");
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

  const toggleDrug = (d: Drug) => {
    setDrugs((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const submit = async () => {
    setMessage(null);
    const payload = {
      fullName,
      zipCode,
      veteranStatus,
      drugs,
      drugOther: drugs.includes("OTHER") ? drugOther || null : null,
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
      className={`px-3 py-1 rounded-full border text-sm ${
        selected ? "bg-black text-white" : "bg-white hover:bg-black/5"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">New Participant Registration</h1>

      <section className="space-y-3">
        <h2 className="font-medium">Personal & Contact Info</h2>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          className="w-full border rounded px-3 py-2"
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
          <div className="text-sm text-zinc-700">Veteran Status</div>
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

        <div className="space-y-2">
          <div className="text-sm text-zinc-700">Drug/Substance of Choice (multi)</div>
          <div className="flex flex-wrap gap-2">
            {[
              ["ALCOHOL", "Alcohol"],
              ["OPIOIDS_HEROIN", "Opioids/Heroin"],
              ["COCAINE_CRACK", "Cocaine/Crack"],
              ["METHAMPHETAMINE", "Methamphetamine"],
              ["MARIJUANA", "Marijuana"],
              ["OTHER", "Other"],
              ["REFUSED", "Refused"],
            ].map(([k, label]) => (
              <Chip
                key={k}
                selected={drugs.includes(k as Drug)}
                label={label as string}
                onClick={() => toggleDrug(k as Drug)}
              />
            ))}
          </div>
          {drugs.includes("OTHER") && (
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="If Other, please specify"
              value={drugOther}
              onChange={(e) => setDrugOther(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm text-zinc-700">Sexual Orientation</div>
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
              className="w-full border rounded px-3 py-2"
              placeholder="If Other, please specify"
              value={sexualOther}
              onChange={(e) => setSexualOther(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm text-zinc-700">Gender</div>
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
              className="w-full border rounded px-3 py-2"
              placeholder="If Other, please specify"
              value={genderOther}
              onChange={(e) => setGenderOther(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm text-zinc-700">Race</div>
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
              className="w-full border rounded px-3 py-2"
              placeholder="If Other, please specify"
              value={raceOther}
              onChange={(e) => setRaceOther(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm text-zinc-700">Ethnicity</div>
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
          <div className="text-sm text-zinc-700">County of Residence</div>
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
              className="w-full border rounded px-3 py-2"
              placeholder="If Other OH County, please specify"
              value={countyOther}
              onChange={(e) => setCountyOther(e.target.value)}
            />
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="rounded border p-3 bg-red-50 text-sm">
          I have read and agree to the Facility Waiver.
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={waiver} onChange={(e)=>setWaiver(e.target.checked)} />
          I have read and agree to the Facility Waiver.
        </label>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="E‑Signature (Type Full Name)"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
        />
      </section>

      <button
        className="w-full h-12 rounded bg-indigo-600 text-white font-medium disabled:opacity-50"
        disabled={!fullName || !/^\d{5}$/.test(zipCode) || !waiver || !signature || drugs.length===0}
        onClick={submit}
      >
        Complete Registration & Check‑In
      </button>

      {uid && (
        <div className="rounded border p-3">
          <div className="font-medium">UID</div>
          <div className="text-xl tracking-wider">{uid}</div>
        </div>
      )}
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
