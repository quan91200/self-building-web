# Self-Building Portfolio Website

## Description
A dynamic developer portfolio website featuring a unique "self-building" effect. The application mimics a code editor environment where markdown content is progressively typed out in a left panel, while simultaneously rendering a live, styled preview of the portfolio in the right panel. This offering showcases interactive UI/UX design with real-time markdown rendering, syntax highlighting, and theme customization.

## Tech Stack
- **Framework**: [React](https://react.dev/) v19 (via [Vite](https://vitejs.dev/))
- **Styling**: Vanilla CSS (Custom animations, layouts, and themes)
- **Markdown Rendering**: [react-markdown](https://github.com/remarkjs/react-markdown)
- **Syntax Highlighting**: [prismjs](https://prismjs.com/)
- **Icons**: [lucide-react](https://lucide.dev/)
- **Linting**: ESLint

## Folder Structure
```text
self-building-web/
├── public/              # Static assets and icons
├── src/
│   ├── assets/          # Project images and media files
│   ├── App.css          # Main stylesheet covering layout, themes, and animations
│   ├── App.jsx          # Core application component containing logic for:
│   │                      - Typing animation engine
│   │                      - Split-pane layout (Editor vs Preview)
│   │                      - Theme switching (e.g., matrix, cyberpunk)
│   ├── index.css        # Global base styles and resets
│   ├── main.jsx         # Application entry point
│   └── portfolio.md     # The raw markdown source content for the portfolio
├── index.html           # HTML entry point
├── package.json         # Project dependencies and scripts
└── vite.config.js       # Vite configuration
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd self-building-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
