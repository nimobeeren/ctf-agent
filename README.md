# CTF Agent

This is an AI agent that completes Capture-The-Flag (CTF) challenges.

## Installation

1. Install [Node.js](https://nodejs.org/) 24.

2. Install dependencies:

```sh
npm install
```

3. Copy the `.env.example` file to `.env` and fill in the missing environment variables:

```sh
cp .env.example .env
```

## Usage

Read a challenge from a text file:

```sh
node main.ts challenges/ctflearn-88.md
```

Note: you need Node.js 24 to run TypeScript files without a build step.
