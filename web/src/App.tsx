import { Button } from "@/components/ui/button";
import { StarLogo } from "@/components/StarLogo";
import { TalkSection } from "@/components/TalkSection";
import { useI18n } from "@/i18n";
import heroImage from "@/assets/hero.jpg";

export default function App() {
  const { t, lang, setLang } = useI18n();

  const scrollToTalk = () => {
    document.getElementById("talk")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="relative overflow-x-clip">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="container flex items-center justify-between gap-3 py-4 sm:py-5">
          <a href="/" className="flex min-w-0 items-center gap-2 text-gold sm:gap-2.5">
            <StarLogo className="size-6 shrink-0 sm:size-7" />
            <span className="truncate font-serif text-xl font-semibold tracking-wide sm:text-2xl">
              HeyJesus.ai
            </span>
          </a>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToTalk}
              className="h-9 rounded-full border-gold/60 bg-transparent px-4 text-gold hover:bg-gold/10 hover:text-gold-bright sm:h-10 sm:px-5"
            >
              {/* Short label on phones so the header never wraps or overlaps */}
              <span className="sm:hidden">{t("startTalkingShort")}</span>
              <span className="hidden sm:inline">{t("startTalking")}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Language"
              onClick={() => setLang(lang === "en" ? "de" : "en")}
              className="rounded-full border-border bg-transparent text-foreground/80 hover:bg-accent"
            >
              {lang === "en" ? "DE" : "EN"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="relative mx-auto max-w-4xl">
          <img
            src={heroImage}
            alt=""
            className="mx-auto w-full max-w-2xl select-none [mask-image:radial-gradient(ellipse_75%_85%_at_50%_40%,black_55%,transparent_100%)]"
            draggable={false}
          />
          {/* Blend image into background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,var(--background)_95%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="container relative z-10 -mt-28 pb-16 text-center sm:-mt-36">
          <h1 className="font-serif text-5xl font-medium tracking-tight text-balance sm:text-7xl">
            {t("heroTitle1")} <span className="text-gold">{t("heroTitle2")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-serif text-lg italic text-foreground/85 sm:text-xl">
            {t("verse")}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{t("verseRef")}</p>
        </div>
      </section>

      <TalkSection />

      {/* Footer */}
      <footer className="border-t border-border/30 py-10">
        <div className="container flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 text-gold/80">
            <StarLogo className="size-5" />
            <span className="font-serif text-lg">HeyJesus.ai</span>
          </div>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{t("footerNote")}</p>
          <p className="max-w-xl text-xs text-muted-foreground/80">{t("crisis")}</p>
        </div>
      </footer>
    </div>
  );
}
