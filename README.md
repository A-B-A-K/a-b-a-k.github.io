# late night notes — personal site

A cozy dark single-page site for GitHub Pages (Jekyll). The design lives
in `_layouts/default.html` + `assets/`; **you edit content in markdown
and data files and never touch HTML.**

## What you edit

| I want to change...          | Edit this file                | Format   |
|------------------------------|-------------------------------|----------|
| About me text                | `_includes/about.md`          | markdown |
| The "now" timeline           | `_includes/now.md`            | markdown |
| Writing list                 | `_includes/writing.md`        | markdown |
| Comfy corner greeting        | `_includes/corner-note.md`    | markdown |
| Site title / links           | `_config.yml`                 | yaml     |

Markdown works as usual: `**bold**` renders in warm amber, links get the
glow, paragraphs space themselves.

### Adding a "now" timeline entry

Each entry in `_includes/now.md` is a `##` date heading (rendered in
amber mono with the trailing line) followed by the role and a one-liner:

```markdown
## oct ’25 — now

**Amazon, Berlin** — machine learning engineer, recommender systems
*building recommender systems*
```

### Adding a writing entry

Each entry in `_includes/writing.md` is a small definition list:
date, then the linked title, then an italic blurb. Newest goes on top.

```markdown
17 aug ’26
: [Serving is half the work](https://your-link)
  *what nobody tells you about putting embedding models in production*
```

The list is fully manual — you decide what appears, nothing is fetched
automatically.

## Deploying to GitHub Pages

1. Create a GitHub repo named `USERNAME.github.io`, push this folder.
2. In `_config.yml`, set `substack_url` and `linkedin_url`.
3. Repo Settings → Pages → deploy from branch `main`.

## Local preview

```bash
./serve.sh
# → http://localhost:4000, rebuilds on save, auto-refreshes the browser
```

(Requires `gem install bundler jekyll` once.)

## Currently parked

The fridge guestbook (notes visitors leave) is disabled until there is a
good anonymous-write backend. Its markup sits in a `{% comment %}` block
in `_layouts/default.html`, its styles are still in `main.css`, and the
sample notes live in `_data/guestbook.yml` — remove the comment wrapper
to bring it back.

## Design tweaks (when you feel like it)

- Colors: CSS variables at the top of `assets/css/main.css` (`--bg`,
  `--amber`, ...).
- Widgets (weather, diorama, radio shuffle, mouse glow): `assets/js/main.js`.
- Layout / rooms / tabs: `_layouts/default.html`.
