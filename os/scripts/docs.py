"""
Markdown -> HTML for the life-os docs layer.

Standard library only, by design (see ROADMAP.md — architecture decisions).
Supports a deliberately small subset: the input is written by us, so the
parser only needs to handle what we actually write.

    front matter    --- title: ... ---
    headings        # ## ###
    emphasis        **bold**  *italic*  `code`
    links           [text](url)
    lists           - item   /   1. item
    tables          | a | b |
    blockquote      > text
    callouts        ::: good | warn | bad | note ... :::
    rule            ---
"""

import html
import os
import re

CALLOUTS = {"good", "warn", "bad", "note"}


# ── inline ───────────────────────────────────────────────────────────────────

def inline(t):
    """Escape, then apply inline markdown. Order matters: code first."""
    t = html.escape(t, quote=False)
    code = []

    def stash(m):
        code.append(m.group(1))
        return f"\x00{len(code) - 1}\x00"

    t = re.sub(r"`([^`]+)`", stash, t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)",
               r'<a href="\2" target="_blank" rel="noopener">\1</a>', t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", t)
    t = re.sub(r"~~([^~]+)~~", r"<del>\1</del>", t)
    return re.sub(r"\x00(\d+)\x00", lambda m: f"<code>{code[int(m.group(1))]}</code>", t)


def slug(s):
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"[^\w\s-]", "", s.lower()).strip()
    return re.sub(r"[\s_]+", "-", s) or "section"


# ── front matter ─────────────────────────────────────────────────────────────

def front_matter(text):
    meta = {}
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end > 0:
            for line in text[3:end].strip().splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    meta[k.strip()] = v.strip()
            text = text[end + 4:]
    return meta, text.lstrip("\n")


# ── block parser ─────────────────────────────────────────────────────────────

def render(text):
    """Return (html, toc) where toc is a list of {id, text, level}."""
    lines = text.split("\n")
    out, toc = [], []
    i, n = 0, len(lines)

    def table(start):
        rows, j = [], start
        while j < n and lines[j].lstrip().startswith("|"):
            rows.append([c.strip() for c in lines[j].strip().strip("|").split("|")])
            j += 1
        if len(rows) < 2 or not set(rows[1][0].strip()) <= set("-: "):
            return None, start
        head, body = rows[0], rows[2:]
        h = "".join(f"<th>{inline(c)}</th>" for c in head)
        b = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>"
                    for r in body)
        return f"<div class=\"d-tw\"><table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>", j

    while i < n:
        ln = lines[i]
        s = ln.strip()

        if not s:
            i += 1
            continue

        # callout
        m = re.match(r"^:::\s*(\w+)\s*(.*)$", s)
        if m and m.group(1) in CALLOUTS:
            kind, rest = m.group(1), m.group(2)
            body, i = [], i + 1
            while i < n and lines[i].strip() != ":::":
                body.append(lines[i])
                i += 1
            i += 1
            inner, _ = render("\n".join(body))
            title = f"<div class=\"d-cal-t\">{inline(rest)}</div>" if rest else ""
            out.append(f'<div class="d-cal cal-{kind}">{title}{inner}</div>')
            continue

        # heading
        m = re.match(r"^(#{1,4})\s+(.*)$", s)
        if m:
            lvl, txt = len(m.group(1)), inline(m.group(2))
            sid = slug(m.group(2))
            if lvl in (2, 3):
                toc.append({"id": sid, "text": re.sub(r"<[^>]+>", "", txt), "level": lvl})
            out.append(f'<h{lvl} id="{sid}">{txt}</h{lvl}>')
            i += 1
            continue

        # rule
        if re.fullmatch(r"-{3,}|\*{3,}", s):
            out.append("<hr>")
            i += 1
            continue

        # table
        if s.startswith("|"):
            t, j = table(i)
            if t:
                out.append(t)
                i = j
                continue

        # blockquote
        if s.startswith(">"):
            body = []
            while i < n and lines[i].strip().startswith(">"):
                body.append(lines[i].strip()[1:].lstrip())
                i += 1
            inner, _ = render("\n".join(body))
            out.append(f"<blockquote>{inner}</blockquote>")
            continue

        # lists
        m = re.match(r"^([-*]|\d+\.)\s+(.*)$", s)
        if m:
            ordered = not m.group(1) in ("-", "*")
            items = []
            while i < n:
                mm = re.match(r"^\s*([-*]|\d+\.)\s+(.*)$", lines[i])
                if not mm:
                    break
                if (not mm.group(1) in ("-", "*")) != ordered:
                    break
                items.append(mm.group(2))
                i += 1
            tag = "ol" if ordered else "ul"
            li = "".join(f"<li>{inline(x)}</li>" for x in items)
            out.append(f"<{tag}>{li}</{tag}>")
            continue

        # paragraph
        body = []
        while i < n and lines[i].strip() and not re.match(
                r"^\s*(#{1,4}\s|[-*]\s|\d+\.\s|\||>|:::|-{3,}$)", lines[i]):
            body.append(lines[i].strip())
            i += 1
        if body:
            out.append(f"<p>{inline(' '.join(body))}</p>")
        else:
            i += 1

    return "\n".join(out), toc


# ── collection ───────────────────────────────────────────────────────────────

# Section dir -> default category shown in the Documentation tab. READMEs are
# included too: in jesus-os they carry the section's standing state.
SECTIONS = [
    ("00-Plan", "Plan & Roadmap"),
    ("10-Product", "Product"),
    ("20-Knowledge", "Knowledge & Tuning"),
    ("30-Tech", "Tech"),
    ("docs", "Operating"),
]


def first_h1(body):
    m = re.search(r"^#\s+(.+)$", body, re.M)
    return re.sub(r"[*`]", "", m.group(1)).strip() if m else None


def load_docs(root):
    """Read every section's *.md -> a list of doc dicts, ordered by category."""
    docs = []
    # "How Hey Jesus works" articles lead the Documentation tab regardless of
    # which section directory they live in.
    cat_rank = {"How Hey Jesus works": -1}
    cat_rank.update({c: i for i, (_, c) in enumerate(SECTIONS)})

    # German companions: `name.de.md` next to `name.md` becomes the same doc's
    # de-layer (title_de/summary_de/html_de/toc_de), never a separate entry.
    for dirname, category in SECTIONS:
        base = os.path.join(root, dirname)
        if not os.path.isdir(base):
            continue
        for dirpath, dirs, files in os.walk(base):
            dirs[:] = [d for d in dirs if d != "archive"]
            for fn in sorted(files):
                if not fn.endswith(".md") or fn.startswith("_") or fn.endswith(".de.md"):
                    continue
                path = os.path.join(dirpath, fn)
                with open(path, encoding="utf-8") as f:
                    meta, body = front_matter(f.read())
                body_html, toc = render(body)
                rel = os.path.relpath(path, root).replace(os.sep, "/")
                is_readme = fn.lower() == "readme.md"
                doc = {
                    "id": rel[:-3],
                    "title": meta.get("title") or first_h1(body)
                             or (category if is_readme
                                 else fn[:-3].replace("-", " ").title()),
                    "summary": meta.get("summary", ""),
                    "category": meta.get("category", category),
                    "audience": meta.get("audience", ""),
                    "order": int(meta.get("order", 50 if is_readme else 99)),
                    "updated": meta.get("updated", ""),
                    "html": body_html,
                    "toc": toc,
                    "words": len(body.split()),
                }
                de_path = path[:-3] + ".de.md"
                if os.path.exists(de_path):
                    with open(de_path, encoding="utf-8") as f:
                        meta_de, body_de = front_matter(f.read())
                    html_de, toc_de = render(body_de)
                    doc.update({
                        "title_de": meta_de.get("title") or first_h1(body_de) or doc["title"],
                        "summary_de": meta_de.get("summary", doc["summary"]),
                        "html_de": html_de,
                        "toc_de": toc_de,
                        "words_de": len(body_de.split()),
                    })
                docs.append(doc)

    docs.sort(key=lambda d: (cat_rank.get(d["category"], 99), d["order"], d["title"]))
    return docs
