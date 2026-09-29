import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("event") || "evt_mock_01";
  const pointId = searchParams.get("point") || "p1_kolkata";

  const now = new Date();
  const sentIso = now.toISOString();
  const expiresIso = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const identifier = `IN-IMD-VAJRANET-${Date.now()}`;

  // Strict CAP 1.2 XML Schema format (PRD_00 §12 and PRD_C §Phase C6 Task 2)
  const capXml = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${identifier}</identifier>
  <sender>vajranet-prototype@sih26072.gov.in</sender>
  <sent>${sentIso}</sent>
  <status>Exercise</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Met</category>
    <event>Severe Thunderstorm &amp; Lightning Nowcast</event>
    <urgency>Immediate</urgency>
    <severity>Severe</severity>
    <certainty>Observed</certainty>
    <eventCode>
      <valueName>SAME</valueName>
      <value>SVR</value>
    </eventCode>
    <effective>${sentIso}</effective>
    <expires>${expiresIso}</expires>
    <senderName>VajraNet Explainable AI Nowcast Engine</senderName>
    <headline>Severe Thunderstorm &amp; Lightning Threat Approaching ${pointId === "p1_kolkata" ? "Kolkata Metro" : pointId}</headline>
    <description>VajraNet radar extrapolation and ML atmospheric instability analysis indicates an organized convective squall cell approaching at 38-42 km/h from WSW (245 deg). High lightning risk index (LRI 74-92) with peak rain rates exceeding 25 mm/h.</description>
    <instruction>1. Seek substantial indoor shelter immediately. 2. Avoid open fields, tall trees, and electrical fixtures. 3. Observe the 30-30 lightning safety rule.</instruction>
    <area>
      <areaDesc>Gangetic West Bengal Convective Corridor</areaDesc>
      <circle>22.5726,88.3639 25.0</circle>
    </area>
  </info>
</alert>`;

  return new NextResponse(capXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="CAP_${identifier}.xml"`,
    },
  });
}
