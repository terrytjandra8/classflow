<div align="center">
  <img src="https://raw.githubusercontent.com/terrytjandra-ipeka/Classboards/main/public/logo.png" alt="ClassBoard Logo" width="200">
  <h1>ClassBoard</h1>
</div>

<p align="center">
  <strong>A real-time collaborative whiteboard for the modern classroom.</strong>
  <br />
  <br />
  <a href="https://classboards.vercel.app/">View Demo</a>
  ·
  <a href="https://github.com/terrytjandra-ipeka/Classboards/issues">Report Bug</a>
  ·
  <a href="https://github.com/terrytjandra-ipeka/Classboards/issues">Request Feature</a>
</p>

---

## About The Project

**ClassBoard** is an interactive, real-time collaborative platform designed to boost engagement and creativity in the classroom. It provides teachers and students with a flexible digital canvas to share ideas, organize thoughts, and facilitate dynamic learning experiences. Whether you're running a brainstorming session, a class debate, or a quick exit ticket, ClassBoard has the tools you need.

### Key Features

- **👩‍🏫 For Teachers:**
  - **Multiple Layouts:** Choose from Wall, Columns, or Canvas layouts.
  - **Real-Time Interaction:** See student posts and comments as they happen.
  - **Powerful Settings:** Control anonymity, moderate content, and manage participation.
  - **Class Management:** View all student work, provide feedback, and manage access.
  - **Grading & Assessment (PRO):** Grade student participation directly on the board.

- **👨‍🎓 For Students:**
  - **Easy Access:** Join with a simple 6-digit code. No account needed.
  - **Rich Content Creation:** Create notes with rich text, images, and links.
  - **Collaborate & Interact:** Comment, react, and draw connections between ideas.
  - **AI-Powered Tools:** Enhance posts with AI-generated ideas and summaries.

### Built With

*   [React](https://reactjs.org/)
*   [Vite](https://vitejs.dev/)
*   [Supabase](https://supabase.io/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [TypeScript](https://www.typescriptlang.org/)

---

## 🚀 Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites

Make sure you have Node.js and npm installed on your machine.
*   **npm**
    ```sh
    npm install npm@latest -g
    ```

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/terrytjandra-ipeka/Classboards.git
    cd Classboards
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up your environment variables:**
    Create a `.env.local` file in the project root and add your Supabase credentials. You can get these from your Supabase project dashboard.

    ```env
    VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

4.  **Run the app:**
    ```sh
    npm run dev
    ```
    The app will be available at `http://localhost:5173` (or the port shown in your terminal).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/terrytjandra-ipeka/Classboards/issues).
