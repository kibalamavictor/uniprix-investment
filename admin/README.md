# Uniprix CMS — Client Guide

Manage website content at **https://www.uniprixinvestment.com/admin/**

---

## Sign in

1. Open `/admin/` on your live site (use **www** — e.g. `https://www.uniprixinvestment.com/admin/`).
2. Enter your CMS username and password.
3. Check **Keep me signed in** to stay logged in for up to 7 days.

If login fails, contact your developer (API credentials or GitHub token may need updating).

---

## How publishing works

1. Edit content in the CMS.
2. Click **Publish changes** (top right).
3. Wait **1–2 minutes** for the site to rebuild automatically.
4. Hard-refresh the live page (or open in a private window) to see updates.

**Important:** Publish saves **only the page you are currently editing**. If you change Home and Projects, publish each one separately.

---

## What to edit where

| CMS section | What it controls |
|-------------|------------------|
| **Site settings** | Site name, SEO, footer phone/email, navigation menu, social links, Formspree form URL |
| **Home** | Homepage hero, services preview, stats, testimonials, project cards, CTA |
| **About us** | About story, stats bar, mission/vision/values, testimonials |
| **Services** | Services page hero, intro, service cards carousel, CTA |
| **Our projects** | All project listings, images, and details |
| **Gallery** | Gallery photos and page headings |
| **Contact us** | Contact page hero, intro text, phone numbers at top of page |
| **Media library** | Upload new images; copy the path into content fields |

### Phone & email

- **Footer** phone and email → **Site settings → Contact details**
- **Contact page** phone numbers → **Contact us**
- **Contact form** submissions → **Site settings → Contact details → formspree**

---

## Images

### Uploading

1. Go to **Media library** → upload an image.
2. Click **Copy path** (e.g. `/media/1234567890-photo.webp`).
3. Paste that path into the image field on the page you are editing.
4. Publish.

Uploaded images appear in the library after the next site rebuild (~1–2 min).

### Page-specific images (already on the site)

Some images live in folders tied to each page. When replacing these, use paths like:

| Page | Example path |
|------|----------------|
| Gallery | `/gallery/assets/images/gallery-1.png` |
| Projects | `/our-projects/assets/images/1/project-1.png` |
| Services | `/services/assets/images/card-image-1.png` |
| About hero | `/about-us/assets/images/hero-background-image.png` |

If an image field shows a path starting with `/gallery/`, `/our-projects/`, etc., keep that same folder pattern when you replace the file.

### Homepage project cards → Projects page

Each card links to a project on the Our Projects page. Link format:

`/our-projects/#project-1` … `/our-projects/#project-6`

Edit the **link** field on each card under **Home → Our Projects**.

---

## Tips

- **Reload** — refreshes content from GitHub without publishing (discards unsaved edits).
- **Export** — downloads a JSON backup of the current page.
- **Dashboard** — overview of content counts and recent publish activity.
- Use **descriptive alt text** on gallery and project images (accessibility and SEO).

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| Changes not on live site | Did you click **Publish changes**? Wait 2 minutes, then hard-refresh. |
| Login fails | Use `www` in the URL. Check username/password with your developer. |
| Image broken after publish | Check the path is correct and the file exists. Re-upload via Media library if needed. |
| Publish error / SHA conflict | Click **Reload**, re-apply your edit, publish again. |
| Form not sending | Verify Formspree URL under **Site settings → Contact details**. |

---

## For developers

- API: `workers/cms-api/` (Cloudflare Worker)
- Config: `admin/config.json`
- Content files: `data/cms/*.json`, `_data/site.json`
- Deploy API after CORS/config changes: `npm run cms:deploy`
- Rotate password: `node scripts/hash-admin-password.mjs 'new-password'` then update Worker secret `CMS_PASSWORD_HASH`
- Setup secrets: `CMS_GITHUB_TOKEN=... CMS_PASSWORD=... ./workers/cms-api/setup-secrets.sh`
