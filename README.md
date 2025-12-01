# UE5 Blueprint Studio

A professional, AI-powered Unreal Engine 5 Blueprint Viewer and Editor. This tool allows you to visualize, analyze, and generate UE5 Blueprints using advanced AI models.

![UE5 Blueprint Studio](./public/logo.png)

## Features

- **AI-Powered Generation**: Describe gameplay mechanics in plain English, and the AI generates the corresponding Blueprint nodes.
- **Multi-Model Support**: Supports OpenAI (GPT-4), Anthropic (Claude), and Google (Gemini) models.
- **Real-time Visualization**: Instantly view and interact with generated Blueprints.
- **Copy & Paste**: Seamlessly copy Blueprints from the editor and paste them directly into Unreal Engine 5.
- **Interactive Chat**: Refine your logic through a conversational interface.
- **Client-Side Architecture**: Your API keys are stored locally in your browser for security.

## Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Icons**: Lucide React
- **State Management**: React Hooks, Local Storage
- **Blueprint Core**: [ueblueprint](https://github.com/barsdeveloper/ueblueprint)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/blueprint-ai-studio.git
   cd blueprint-ai-studio
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   bun dev
   ```

4. Open your browser and navigate to `http://localhost:8080`.

## Usage

1. **Landing Page**: Enter a prompt describing the functionality you want (e.g., "Create a double jump system").
2. **Editor**: The AI will generate the Blueprint. You can view the nodes in the viewer panel.
3. **Refine**: Use the chat panel to ask for modifications or explanations.
4. **Export**: Click the "Copy" button in the chat or viewer to copy the Blueprint code, then paste it into a Blueprint graph in Unreal Engine 5.

## Configuration

To use the AI features, you need to configure your API keys:

1. Click the **Settings** icon in the chat panel.
2. Select your preferred provider (OpenAI, Anthropic, or Google).
3. Enter your API key.
4. (Optional) Configure the model and other parameters.

## Connect

- **Instagram**: [@_brar219_](https://instagram.com/_brar219_) | [@_tempstox_](https://instagram.com/_tempstox_)
- **YouTube**: [@tempstox](https://youtube.com/@tempstox)

## License

**Personal Use License**

This software is intended for individual, non-commercial use only. It does not permit any form of financial gain, public distribution, or commercial application.

If you intend to use this content for business, public, or commercial purposes, a commercial license must be obtained instead.
