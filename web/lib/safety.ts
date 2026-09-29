// lib/safety.ts - Personas and safety steps according to PRD_00 §8 and PRD_C §Phase C4/C5

export type PersonaType = "general" | "farmer" | "commuter" | "event";

export interface SafetyStep {
  title: string;
  desc: string;
  urgent: boolean;
}

export const PERSONA_SAFETY_STEPS: Record<PersonaType, { label: string; steps: SafetyStep[] }> = {
  general: {
    label: "General Public",
    steps: [
      { title: "Move Indoors Immediately", desc: "Seek shelter in a substantial, fully enclosed building or metal-topped vehicle.", urgent: true },
      { title: "Avoid Electrical Appliances", desc: "Do not touch corded phones, plugged-in electronics, or plumbing fixtures.", urgent: false },
      { title: "Stay Away From Windows", desc: "Windows and glass doors can shatter in strong squall winds.", urgent: false },
      { title: "30-30 Rule", desc: "Stay indoors for at least 30 minutes after the last thunderclap.", urgent: false }
    ]
  },
  farmer: {
    label: "Farmer / Agriculturalist",
    steps: [
      { title: "Clear the Open Field Immediately", desc: "You are the tallest point in an open field. Drop tools and head to concrete shelter.", urgent: true },
      { title: "Never Shelter Under Isolated Trees", desc: "Isolated trees are lightning conductors and cause ground-current fatalities.", urgent: true },
      { title: "Secure Livestock in Low Areas", desc: "Move animals away from wire fences and metal poles.", urgent: false },
      { title: "Shut Down Irrigation Pumps", desc: "Disconnect power lines to borewells and electrical equipment.", urgent: false }
    ]
  },
  commuter: {
    label: "Commuter / Traveler",
    steps: [
      { title: "Pull Over 2-Wheelers Immediately", desc: "Bikes offer zero lightning protection. Seek shelter in a shop, fuel station, or building.", urgent: true },
      { title: "Cars Are Safe Havens", desc: "Stay inside hardtop cars with windows rolled up (Faraday cage effect). Avoid touching metal frames.", urgent: false },
      { title: "Beware Waterlogging & Falling Trees", desc: "Squalls bring violent wind gusts (up to 70 km/h). Avoid underpasses and large trees.", urgent: false }
    ]
  },
  event: {
    label: "Event Organiser",
    steps: [
      { title: "Halt Outdoor Activities", desc: "Trigger venue emergency evacuation protocols now. Direct crowds to sturdy indoor structures.", urgent: true },
      { title: "Ground Temporary Metal Stages", desc: "Isolate high-voltage sound rigs, generators, and temporary metallic scaffolding.", urgent: true },
      { title: "Broadcast Public Address Warning", desc: "Inform attendees calmly with clear designated shelter routes.", urgent: false }
    ]
  }
};
