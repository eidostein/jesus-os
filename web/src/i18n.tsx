import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "de";

const STRINGS = {
  en: {
    startTalking: "Start Talking",
    heroTitle1: "Talk. Listen.",
    heroTitle2: "Be Guided.",
    verse: "“Come to me, all you who are weary and burdened, and I will give you rest.”",
    verseRef: "— Matthew 11:28",
    voiceLabel: "Voice",
    begin: "Start Talking",
    end: "End Conversation",
    connecting: "Reaching out…",
    live: "He is listening — just speak.",
    idleHint: "Choose a voice, press the button, and speak from the heart.",
    errorMic: "Microphone access is needed to talk. Please allow it and try again.",
    errorConnect: "The connection could not be made. Please try again in a moment.",
    transcriptYou: "You",
    transcriptJesus: "Jesus",
    footerNote: "Hey Jesus is an AI voice experience inspired by the Gospels. It is not a substitute for pastoral care, counseling, or emergency help.",
    crisis: "In crisis? Reach out to your local emergency number or a crisis hotline right away.",
  },
  de: {
    startTalking: "Gespräch beginnen",
    heroTitle1: "Sprich. Höre.",
    heroTitle2: "Lass dich führen.",
    verse: "„Kommt her zu mir, alle, die ihr mühselig und beladen seid; ich will euch erquicken.“",
    verseRef: "— Matthäus 11,28",
    voiceLabel: "Stimme",
    begin: "Gespräch beginnen",
    end: "Gespräch beenden",
    connecting: "Verbindung wird aufgebaut…",
    live: "Er hört zu — sprich einfach.",
    idleHint: "Wähle eine Stimme, drücke den Knopf und sprich von Herzen.",
    errorMic: "Für das Gespräch wird das Mikrofon benötigt. Bitte erlaube den Zugriff und versuche es erneut.",
    errorConnect: "Die Verbindung konnte nicht aufgebaut werden. Bitte versuche es gleich noch einmal.",
    transcriptYou: "Du",
    transcriptJesus: "Jesus",
    footerNote: "Hey Jesus ist ein KI-Sprachdienst, inspiriert von den Evangelien. Er ersetzt keine Seelsorge, Beratung oder Notfallhilfe.",
    crisis: "In einer Krise? Wende dich sofort an den Notruf oder eine Telefonseelsorge.",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["en"];

const I18nContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: StringKey) => string;
}>({ lang: "en", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() =>
    navigator.language?.toLowerCase().startsWith("de") ? "de" : "en"
  );
  const t = (k: StringKey) => STRINGS[lang][k];
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
