import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceOrb } from "@/components/VoiceOrb";
import { LiveClient, type LiveStatus, type TranscriptEntry } from "@/lib/live-client";
import { useI18n } from "@/i18n";

export function TalkSection() {
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<LiveStatus>("idle");
  const [errorKey, setErrorKey] = useState<"errorMic" | "errorConnect" | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const clientRef = useRef<LiveClient | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript]);

  useEffect(() => () => clientRef.current?.stop(), []);

  const getLevels = useCallback(() => {
    return clientRef.current?.getLevels() ?? { mic: 0, out: 0 };
  }, []);

  const handleStart = async () => {
    setErrorKey(null);
    setTranscript([]);
    const client = new LiveClient({
      onStatus: (s, detail) => {
        setStatus(s);
        if (s === "error") setErrorKey(detail === "mic" ? "errorMic" : "errorConnect");
      },
      onTranscript: (entry) => {
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          // The Live API streams transcription fragments; glue same-role pieces together.
          if (last && last.role === entry.role) {
            return [...prev.slice(0, -1), { ...last, text: last.text + entry.text }];
          }
          return [...prev, entry];
        });
      },
    });
    clientRef.current = client;
    // No voice is sent — the server speaks with its configured voice (Algieba).
    await client.start(lang);
  };

  const handleStop = () => {
    clientRef.current?.stop();
    clientRef.current = null;
    setStatus("idle");
  };

  const live = status === "live";
  const connecting = status === "connecting";

  return (
    <section id="talk" className="container scroll-mt-6 pb-24">
      {/* Framed orb — the "viewfinder" card from the design */}
      <div className="relative mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card/40 glow-gold">
        {/* Corner brackets */}
        {[
          "top-4 left-4 border-t-2 border-l-2 rounded-tl-lg",
          "top-4 right-4 border-t-2 border-r-2 rounded-tr-lg",
          "bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg",
          "bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg",
        ].map((pos) => (
          <span key={pos} className={`pointer-events-none absolute size-6 border-gold ${pos}`} />
        ))}

        <div className="aspect-[4/3] sm:aspect-[16/10]">
          <VoiceOrb getLevels={getLevels} active={live} />
        </div>

        {/* Static below the orb on phones; overlaid on the orb's lower edge on larger screens */}
        <div className="flex flex-col items-center gap-4 p-5 pb-12 pt-0 sm:absolute sm:inset-x-0 sm:bottom-0 sm:p-8">
          <p className="text-center text-sm text-muted-foreground" role="status">
            {connecting ? t("connecting") : live ? t("live") : errorKey ? t(errorKey) : t("idleHint")}
          </p>

          {live || connecting ? (
            <Button
              variant="outline"
              size="lg"
              onClick={handleStop}
              className="w-full max-w-xs border-gold/50 text-gold hover:bg-gold/10 sm:w-auto"
            >
              {connecting ? <Loader2 className="animate-spin" /> : <Square />}
              {t("end")}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleStart}
              className="w-full max-w-xs bg-gold text-primary-foreground hover:bg-gold-bright sm:w-auto"
            >
              <Mic />
              {t("begin")}
            </Button>
          )}
        </div>
      </div>

      {transcript.length > 0 && (
        <div
          ref={transcriptRef}
          className="mx-auto mt-6 max-h-64 max-w-3xl space-y-3 overflow-y-auto rounded-2xl border border-border/40 bg-card/30 p-5 text-sm"
        >
          {transcript.map((entry, i) => (
            <p key={i} className="leading-relaxed">
              <span className={entry.role === "model" ? "text-gold" : "text-muted-foreground"}>
                {entry.role === "model" ? t("transcriptJesus") : t("transcriptYou")}:
              </span>{" "}
              {entry.text}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
