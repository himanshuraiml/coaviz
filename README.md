# ⚡ COAViz — Interactive Computer Organization & Architecture Visualizer

[![Release](https://img.shields.io/github/v/release/himanshuraiml/coaviz?style=for-the-badge&color=blue)](https://github.com/himanshuraiml/coaviz/releases/latest)
[![Tauri](https://img.shields.io/badge/Tauri-v2-24c8db?style=for-the-badge&logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-1.77+-dea584?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-729b1b?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**COAViz** is an ultra-lightweight, cross-platform educational visualizer and simulation suite built specifically for **Computer Organization and Architecture (COA)** curricula. Powered by **Tauri v2** and **React 18**, it bridges the gap between textbook hardware concepts and interactive, cycle-accurate visual execution with a minimal resource footprint (~**40 MB RAM**, **4.9 MB installer**).

---

## 📥 Download Desktop App (v1.1.0)

Standalone native installers for macOS and Windows are available on [**GitHub Releases**](https://github.com/himanshuraiml/coaviz/releases/latest):

| Platform | Architecture | Installer Type | Direct Download Link | Size |
|---|---|---|---|---|
| **macOS** | Apple Silicon (`arm64`) | `.dmg` Package | [**Download macOS DMG**](https://github.com/himanshuraiml/coaviz/releases/download/v1.1.0/COAViz_1.1.0_aarch64.dmg) | **~4.9 MB** |
| **Windows** | 64-bit (`x64`) | Setup Installer (`.exe` / `.msi`) | [**Download Windows Setup**](https://github.com/himanshuraiml/coaviz/releases/latest) | **~6 MB** |

### 🔄 Automatic In-App Updates
COAViz includes a built-in background updater. When new versions and algorithm features are released on GitHub, the app automatically downloads update deltas in the background and presents a non-intrusive **"Restart & Install Now"** banner.

#### 🍏 macOS Gatekeeper ("App is damaged") Bypass
Since this release is compiled without an Apple Developer paid certificate, macOS assigns a quarantine attribute to downloaded third-party binaries, displaying a warning: *"COAViz is damaged and can't be opened."*

To run the application, strip the quarantine flag by running the following command in your terminal:

```bash
xattr -cr /Applications/COAViz.app
```
*(If running directly from your Downloads folder, run `xattr -cr ~/Downloads/COAViz.app` instead).*

---

## 🌟 Key Highlights & Features

### 🚀 Ultra-Lightweight Tauri v2 Architecture
- **~70% Less Memory**: Runs at ~35–50 MB RAM at idle vs ~150 MB in traditional wrappers.
- **Instant Cold Launch**: Launches in ~0.3 seconds.
- **Tiny Download Size**: Less than 5 MB download.

### 🏛️ Complete Curriculum Coverage (5 Core Units, 15 Simulators + 60 LMS Sessions)

1. **Unit 1: Computer Arithmetic & IEEE-754**
   - **Booth's Multiplication**: Step-by-step signed 2's complement multiplication with cycle-accurate $A, Q, Q_{-1}$ bit manipulation and arithmetic right shift ($ASR$).
   - **Restoring & Non-Restoring Division**: Micro-operation traces with Accumulator restoration, quotient bit shifts, and sign bit detection.
   - **IEEE-754 Floating-Point Converter**: Interactive 32-bit single-precision decomposition into Sign (1b), Biased Exponent (8b), and Mantissa/Fraction (23b), with subnormal and special value handling ($\pm\infty, \text{NaN}, \pm0$).
   - **Radix Number Systems Sandbox**: Dynamic multi-base conversion (Binary, Octal, Decimal, Hexadecimal, 1's & 2's complement).

2. **Unit 2: Instruction Set & Machine Architecture**
   - **Von Neumann Architecture**: Central bus topology, Fetch-Decode-Execute micro-cycles, Register Transfers ($MAR, MDR, PC, IR, ACC$).
   - **Datapath & Register Transfers**: Visual ALU arithmetic routing, multiplexer bus gating, and control line assertions.
   - **Addressing Modes Visualizer**: Direct, Indirect, Register Direct, Register Indirect, Immediate, Relative, and Indexed effective address ($EA$) computation.

3. **Unit 3: Processor Control Unit & Pipelining**
   - **Hardwired vs Microprogrammed Control Unit**: PLA / Decoder matrix logic vs Control Memory ROM micro-instruction sequencing.
   - **5-Stage CPU Pipeline**: Classic RISC ($IF, ID, EX, MEM, WB$) Space-Time Reservation table, RAW data hazard detection, Forwarding (Bypass Unit) optimization, and Branch Misprediction flush stalls.

4. **Unit 4: Memory Organization & Virtual Memory**
   - **Cache Memory Mapping**: Direct Mapping, 2-Way / 4-Way Set Associative, and Fully Associative address decoding ($Tag, Index, Offset$).
   - **Cache Replacement Policies**: Live access sequence trace with hit/miss ratio analytics for **LRU**, **FIFO**, and **LFU**.
   - **Virtual Memory & Page Translation**: 2-Level Page Table walking, TLB Cache hit/miss resolution, and Page Fault ISR handling.

5. **Unit 5: System Bus & I/O Transfer**
   - **Direct Memory Access (DMA 8237)**: Bus Request ($HRQ$) & Bus Acknowledge ($HLDA$) arbitration, Cycle Stealing vs Burst Transfer modes.
   - **I/O Transfer Modes**: Programmed I/O (busy-wait polling) vs Interrupt-Driven I/O cycle comparison and CPU efficiency telemetry.

---

## 🔬 Interactive Modalities

- ✍️ **Smartboard Whiteboard Overlay**: On-screen transparent annotation canvas with Pen, Highlighter, Laser Pointer, Eraser, Undo/Redo, and PNG export.
- 📊 **Multi-Format Lab Exporter**: 1-click export of any simulation trace to **CSV Spreadsheet**, **Markdown Table**, or **Print / PDF Lab Sheet**.
- 🔀 **Side-by-Side Comparative Mode**: Synchronized dual views comparing algorithms.
- 🎯 **Predict & Verify Practice Challenges**: Interactive active-learning quiz prompts built directly into the simulators.
- ⏱️ **Visual Scrubber Timeline**: Drag-and-click navigation with cycle bookmarks and state-diff visual highlighting.
- ⌨️ **Smartboard & Keyboard Remote Controls**: Global hotkeys (`Space`, `Arrows`, `Home`, `End`, `W`, `F`, `T`, `?`).
- 🎨 **Adaptive Dual Themes**: High-contrast Light Mode and Cyberpunk Dark Mode tailored for lecture halls and smartboards.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or later
- **Rust Toolchain**: `rustc` & `cargo` 1.77+ (Install via [rustup.rs](https://rustup.rs/))
- **npm** or **pnpm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/himanshuraiml/coaviz.git

# Navigate to project directory
cd coaviz

# Install dependencies
npm install
```

### Running Locally

```bash
# Run web version in browser (http://localhost:5173)
npm run dev

# Run native desktop app (Tauri v2)
npm run desktop:dev
```

### Production Packaging

```bash
# Build desktop app for macOS (DMG & .app)
npm run build:mac

# Build desktop app for Windows (NSIS .exe & .msi)
npm run build:win

# Build web production bundle (dist/)
npm run build
```

---

## 🧪 Testing

The engine suite contains **64 unit tests** covering all simulation engines and algorithms:

```bash
# Run all unit tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 📁 Repository Structure

```
coaviz/
├── .github/workflows/      # Automated multi-platform CI release workflow
├── src-tauri/              # Tauri v2 native Rust core & configuration
│   ├── capabilities/       # Security capabilities & permissions
│   ├── src/                # Rust main.rs & lib.rs entrypoints
│   ├── tauri.conf.json     # Window dimensions, updater endpoints & bundle config
│   └── Cargo.toml          # Rust dependencies (tauri v2, updater, process, opener)
├── src/
│   ├── components/
│   │   ├── comparative/    # Side-by-Side comparative analysis components
│   │   ├── lms/            # LMS course viewer & 60-session unit guides
│   │   ├── schematic/      # X-Ray cutaways & clock waveform visualizers
│   │   ├── shell/          # Global Header, ControllerBar, Whiteboard, UpdateBanner
│   │   └── simulators/     # 15 Unit Simulators (Booth, Pipeline, Cache, DMA, etc.)
│   ├── engines/            # Deterministic, cycle-accurate simulation logic
│   │   ├── arithmetic/     # Booth, Division, IEEE-754, Number Systems
│   │   ├── cpu/            # Von Neumann, Datapath, Addressing, Pipeline, Control Unit
│   │   ├── io/             # DMA Controller, I/O Transfer Modes
│   │   └── memory/         # Cache Mapping, Replacement, Virtual Memory
│   ├── hooks/              # usePersistentState, useKeyboardShortcuts, useAutoUpdate
│   ├── types/              # desktop.d.ts type declarations
│   ├── utils/              # exportTrace (CSV, Markdown, PDF)
│   ├── App.tsx             # Root app with lazy-loaded simulator chunks
│   ├── index.css           # Design tokens, variables & animations
│   └── main.tsx            # Vite entry point
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🤝 Contributing

Contributions, feature suggestions, and educational enhancements are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

