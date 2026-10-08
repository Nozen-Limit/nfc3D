# Tom Jerald Ferrer — NFC portfolio

A phone-first portfolio built with **React, Vite, and Three.js**. The card is a real 3D object. Scrolling moves the name, role, and number onto it as particles; you can drag to rotate it.

## Run it on your computer

Install [Node.js](https://nodejs.org/) 22 or newer, then run:

```bash
npm ci
npm run dev
```

Open the local address shown by Vite. The generated textures are included in `src/assets/`; the font loads from Google Fonts.

## Publish from your GitHub account

1. Create a GitHub repository and add **the contents of this folder** at the repository root. Keep `.github/workflows/deploy.yml` and `package-lock.json`.
2. In the repository, go to **Settings → Pages → Build and deployment** and select **GitHub Actions** as the source.
3. Push to the `main` branch. The included workflow installs the project, builds it, and publishes it to GitHub Pages.
4. Open the URL shown in **Settings → Pages** on your phone. Test the card's size, scroll sequence, rotation, social links, dialer, and email action.
5. Once you like it, write that URL to your NFC card. Future edits to this repository can update the site while keeping the same NFC URL.

`vite.config.js` uses a relative asset path, so the build works in a normal GitHub Pages repository path. The two projects in “My work” are sample entries until you replace them with real projects. Your Facebook, Instagram, LinkedIn, GitHub, phone, email, and Dampitag links are already included.
