# 🛡️ IdenVault – Decentralized Academic Identity

<!-- ![IdenVault Banner](public/assets/landing.png) -->
> **Final Year Project (2025/2026)** > **Multimedia University (MMU)** > *A Decentralized Self-Sovereign Identity Framework For Academic & Student Credentials On The Ethereum Blockchain*

## 📖 Overview

**IdenVault** is a next-generation decentralized application (dApp) that allows academic institutions to issue tamper-proof digital credentials directly to a student's blockchain wallet.

Unlike traditional PDF certificates, IdenVault credentials are **verifiable**, **portable**, and **owned by the student**. The platform features a high-fidelity "Cyber-Institutional" UI, real-time QR scanning, and a mock blockchain consensus layer for demonstration purposes.

## ✨ Key Features

### 🎓 For Students (The Wallet)
* **Secure Login:** Authenticate via MetaMask (Hardware Wallet aesthetic).
* **Credential Wallet:** View degrees, transcripts, and awards in a visual card grid.
* **Detail View:** Inspect blockchain metadata (Transaction Hash, Block Timestamp).
* **Sharing:** Generate time-sensitive QR codes for third-party verification.

### 🏛️ For Institutions (The Issuer)
* **Dashboard:** Track all issued credentials and their active status.
* **Issuance Portal:** Mint new credentials with metadata (GPA, Expiry) and attach supporting documents (IPFS simulation).
* **Revocation:** Admin controls to revoke credentials in case of error or fraud.

### 🔍 For Verifiers (Employers/Public)
* **Instant Verification:** Verify credentials via Reference ID or QR Scan.
* **AR Scanner:** Custom-built HUD scanner for mobile/camera devices.
* **AI Assistant:** Generates technical interview questions based on the verified credential using a simulated AI agent.

### ⚖️ Governance (Admin)
* **System Oversight:** Monitor total system throughput.
* **Allowlist:** Approve or Block issuer smart contract addresses.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Animations:** [Framer Motion](https://www.framer.com/motion/) (Page transitions, micro-interactions)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Web3:** Ethers.js / Context API (MetaMask Integration)
* **Utilities:** `html5-qrcode` (Scanner), `clsx` (Dynamic classes)

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
* Node.js (v18 or higher)
* MetaMask Browser Extension

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/kpharthiban/idenvault-fyp-frontend.git
    cd idenvault-fyp
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🎮 Usage Guide

### 1. Student Flow
* Click **"I am a Student"** on the landing page.
* Connect your MetaMask wallet.
* Browse your credentials and click **"Share"** to generate a QR code.

### 2. Issuer Flow
* Click **"I am an Issuer"** on the landing page.
* Connect a different wallet account (or the same one).
* Navigate to **"Issue New"** to fill out the credential form.

### 3. Admin Flow (Governance)
To access the Admin Dashboard, you must set your wallet address as the Admin.
1.  Open `src/context/AuthContext.tsx`.
2.  Locate the line: `const ADMIN_WALLET_ADDRESS = "..."`.
3.  Replace the string with your MetaMask wallet address.
4.  Reconnect your wallet. You will now see the **Admin Dashboard** link in the sidebar.

---

<!-- ## 📸 Screenshots

| Student Wallet | Verification Portal |
|:---:|:---:|
| ![Student](public/assets/dashboard.png) | ![Verify](public/assets/verify.png) |
| *Manage digital assets* | *Public verification check* |

| AR Scanner | Issuer Console |
|:---:|:---:|
| ![Scanner](public/assets/scanner.png) | ![Issuer](public/assets/issuer.png) |
| *Futuristic QR HUD* | *Minting & Management* |

--- -->

## 🔮 Future Roadmap

* [ ] **Smart Contract Integration:** Replace mock logic with Solidity contracts (Sepolia Testnet).
* [ ] **IPFS Storage:** Store actual PDF files on Pinata/IPFS.
* [ ] **Verifiable Credentials (VC):** Implement W3C standard DID format.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---


**Developed with ❤️ by [Pharthiban Kumarhesan]** *Faculty of Computing & Informatics, Multimedia University*
