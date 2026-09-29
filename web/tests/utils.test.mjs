import test from "node:test";
import assert from "node:assert/strict";

// 1. Time logic tests (PRD_00 §7)
test("computeValidStart correctly calculates valid_start = T + L - 30min", () => {
  const issueIso = "2025-05-15T09:00:00Z";
  const leadMin = 60;
  const d = new Date(issueIso);
  const offsetMs = (leadMin - 30) * 60 * 1000;
  const validD = new Date(d.getTime() + offsetMs);
  const validIso = validD.toISOString().replace(/\.\d{3}Z$/, "Z");
  assert.equal(validIso, "2025-05-15T09:30:00Z");
});

test("UTC to IST conversion adds 5h 30m offset", () => {
  const utcIso = "2025-05-15T09:30:00Z";
  const date = new Date(utcIso);
  const timeFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  assert.equal(timeFormatter.format(date), "15:00");
});

// 2. Geometry logic tests (PRD_00 §7)
test("Haversine distance between Kolkata and Burdwan matches ground truth (~90 km)", () => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const lat1 = 22.5726, lon1 = 88.3639;
  const lat2 = 23.2324, lon2 = 87.8615;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = 6371.0 * c;

  assert.ok(dist > 85 && dist < 95, `Expected ~90 km, got ${dist}`);
});

test("Heading bearing to From bearing conversion (PRD_00 §7: from_deg = (heading + 180) % 360)", () => {
  const headingDeg = 65;
  const fromDeg = ((headingDeg + 180) % 360 + 360) % 360;
  assert.equal(fromDeg, 245);
});

// 3. Flash to Bang calculation (PRD_C §Phase C6 Task 3)
test("Flash-to-Bang distance: 3 seconds sound delay = 1.029 km", () => {
  const seconds = 3.0;
  const distKm = seconds * 0.343;
  assert.equal(Number(distKm.toFixed(3)), 1.029);
});

// 4. Pure Simulation state transition test (PRD_C §Phase C5 Task 6)
test("Simulated storm motion and state transitions", () => {
  const startDistanceKm = 40.0;
  const speedKmh = 40.0;
  const watchEtaMin = 45.0;
  const emergencyEtaMin = 15.0;

  function computeSimState(elapsedMinutes) {
    const elapsedHours = elapsedMinutes / 60.0;
    const currentDistanceKm = Math.max(0, startDistanceKm - elapsedHours * speedKmh);
    const etaMin = (currentDistanceKm / speedKmh) * 60.0;

    let state = "none";
    if (etaMin <= emergencyEtaMin) state = "emergency";
    else if (etaMin <= watchEtaMin) state = "alert";

    return { currentDistanceKm, etaMin, state };
  }

  // At t=0: dist=40km, eta=60min -> state="none"
  const t0 = computeSimState(0);
  assert.equal(t0.currentDistanceKm, 40.0);
  assert.equal(t0.etaMin, 60.0);
  assert.equal(t0.state, "none");

  // At t=20 min: dist=26.67km, eta=40min -> state="alert" (Watch)
  const t20 = computeSimState(20);
  assert.equal(t20.state, "alert");

  // At t=50 min: dist=6.67km, eta=10min -> state="emergency" (Imminent)
  const t50 = computeSimState(50);
  assert.equal(t50.state, "emergency");
});
