---
title: Die 30 Stimmen — und wie die Jesus-Stimme gewählt wurde
summary: Jede Stimme des Modells, warum Charon der Standard ist und wie man ihn ändert.
---

# Die 30 Stimmen — und wie die Jesus-Stimme gewählt wurde

Das Gemini-Live-Modell bringt **30 vorgefertigte Stimmen** mit. Alle sind auf
der Homepage wählbar — jeder kann den Jesus finden, der für ihn richtig
klingt. Die Liste liefert das Backend (`GET /api/config`), Website und diese
Seite können sich also nie widersprechen.

## Der Standard

**Charon** — tief · sachlich — ist der Standard: ruhig, tief, ohne Eile, am
nächsten an der Stimme, die sich die meisten vorstellen. Die stärksten
Herausforderer, falls ein weicherer oder klarerer Charakter gewünscht ist:

| Stimme | Charakter | Wann sie passt |
|---|---|---|
| **Charon** | tief · sachlich | der Standard — ruhige Autorität |
| **Enceladus** | hauchig · sanft | die weichste, intimste Option |
| **Iapetus** | klar · ruhig | Klarheit zuerst, trotzdem warm |
| **Alnilam** | fest · geerdet | mehr Kraft, weniger Weichheit |
| **Sulafat** | warm | die freundlichste Mitte |

Das ganze Set: Charon, Enceladus, Iapetus, Alnilam, Sulafat, Vindemiatrix,
Achernar, Gacrux, Sadaltager, Schedar, Zephyr, Puck, Kore, Fenrir, Leda, Orus,
Aoede, Callirrhoe, Autonoe, Umbriel, Algieba, Despina, Erinome, Algenib,
Rasalgethi, Laomedeia, Pulcherrima, Achird, Zubenelgenubi, Sadachbia.

## Den Standard ändern

Der seitenweite Standard ist eine Zeile in der `.env` des Servers:

`DEFAULT_VOICE=Charon`

Ändern, neu deployen (oder App-Container neu starten), fertig. Die eigene
Auswahl eines Besuchers gewinnt für seine Sitzung immer über den Standard.

## Warum nicht ElevenLabs?

Die naheliegende Frage — vollständig beantwortet in *Betrieb →
Entscheidungslog* (D1). Kurzfassung: Die Stimme hier ist kein separater
Text-zu-Sprache-Schritt, sondern **das Modell selbst, das spricht**. Genau das
macht Unterbrechen, Tonfall und Latenz unter einer Sekunde möglich. Eine
externe Stimme anzuflanschen hieße: transkribieren → Text erzeugen →
synthetisieren — langsamer, mehr bewegliche Teile und eine Monatsrechnung für
etwas, das der aktuelle Stack nativ und ohne Aufpreis kann.
