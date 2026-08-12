---
title: Woher Jesus sein Wissen hat — und wie man ihn tunt
summary: Der Wissensordner von A bis Z - was die Dateien tun, wie man sie im Wissen-Tab bearbeitet und was gutes Tuning ausmacht.
---

# Woher Jesus sein Wissen hat — und wie man ihn tunt

Alles, was Jesus „mit Absicht weiß", liegt in **einem Ordner mit einfachen
Textdateien** auf dem Server. Keine Datenbank, kein Training, keine Magie:
lesbare Dateien, die jeder im Team öffnen, ändern und verstehen kann.

## Das Denkmodell

Das KI-Modell hinter Hey Jesus spricht bereits jede Sprache und hat eine Welt
an Text gelesen — aber es weiß nicht, *wer es sein soll*. Genau das liefert
der Wissensordner. Zu Beginn **jedes Gesprächs**:

1. liest der Server jede `.md`- und `.txt`-Datei im Ordner, **alphabetisch**,
2. überspringt `README.md` (Doku für Menschen, nicht für ihn),
3. fügt alles zu einem langen Text zusammen — der **Systeminstruktion** — und
   übergibt sie dem Modell vor dem ersten Wort des Besuchers.

Die Systeminstruktion ist der innere Kompass des Modells: Sie formt, wer er
ist, wie er spricht und was er als wahr behandelt. Sie ist kein Skript — er
sagt sie nicht auf — eher eine *Regieanweisung für den Charakter*.

::: good Änderungen wirken sofort
Datei speichern (im Wissen-Tab oder auf der Festplatte) — und das **nächste
Gespräch** auf der Website nutzt sie bereits. Kein Neustart, kein Deployment.
Laufende Gespräche behalten die Instruktion, mit der sie begonnen haben.
:::

## Was heute im Ordner liegt

| Datei | Rolle |
|---|---|
| `00-persona.md` | Wer er ist: Geist der Evangelien, Ehrlichkeit über sein KI-Sein, Grenzen (keine Medizin-/Rechtsberatung, Krise → echte Hilfe), niemals verurteilend |
| `10-conversation-style.md` | Sprachstil fürs Hören: 2–4 Sätze, keine Listen, Fragen und Gleichnisse statt Vorträge, hoffnungsvolle Abschlüsse |

Die Nummerierung ist die Reihenfolge: `00-` lädt vor `10-` vor `20-`. Persona
zuerst, Stil danach, Wissen dahinter — spätere Dateien bauen auf früheren auf.

## Der Wissen-Tab — Dateien verwalten ohne Code

Der Tab **Wissen** in diesem Dashboard ist ein Live-Fenster in genau diesen
Ordner:

- **Lesen**: Datei anklicken und exakt sehen, was Jesus gesagt bekommt.
- **Ändern**: Text anpassen, *Speichern* drücken — die Statuszeile bestätigt,
  ab dem nächsten Gespräch gilt der neue Stand.
- **Hinzufügen**: *Neue Datei*, Name wie `20-trost-in-trauer.md` vergeben,
  schreiben, speichern.
- **Löschen**: entfernt die Datei; Jesus vergisst ihren Inhalt beim nächsten
  Gespräch.

Der Balken unter der Dateiliste zeigt das **Prompt-Budget**: ~200.000
Zeichen. Dateien, die es sprengen würden, werden übersprungen (Markierung
*nicht geladen*) — das Budget hält seine Antworten schnell.

## Was man schreibt — Tuning, das funktioniert

- **Themenanleitungen** — wie er mit Trauer, Angst, Ehe, Vergebung umgehen
  soll. Als Regieanweisung schreiben, nicht als Aufsatz: *„Wenn jemand vom
  Verlust eines Menschen spricht: zuerst anerkennen, nie zum Trost eilen.
  Psalm 34,19 und Johannes 11,35 passen hier."*
- **Bibeltext-Pakete** — Kernpassagen, die er präzise zitieren soll, mit
  Stellenangabe. Gemeinfreie Übersetzungen (Luther 1912, King James, World
  English Bible) dürfen kapitelweise hinein.
- **Persona-Feinschliff** — mehr Humor? Mehr Ernst? Kürzere Antworten?
  `10-conversation-style.md` anpassen; ein klarer Satz schlägt drei vage.
- **Saisonales** — eine Advents- oder Osterdatei zur Saison anlegen, danach
  löschen.

Deutsch oder Englisch (oder beides) — seine Antworten folgen ohnehin der
Sprache des **Besuchers**. Schreibe, was du am besten gegenlesen kannst.

## Grenzen, ehrlich benannt

Das Budget (~200k Zeichen) fasst viel Anleitung, aber **nicht die ganze
Bibel** (~4,3 Mio. Zeichen). Bis der Retrieval-Schritt kommt (siehe *Plan &
Roadmap*), zitiert er aus dem, was das Modell ohnehin kennt, plus dem, was
diese Dateien präzise festnageln. Muss ein bestimmter Vers immer wortgetreu
sitzen: den Vers in eine Datei legen.
