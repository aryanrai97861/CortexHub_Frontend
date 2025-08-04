# CortexHub Frontend

## Overview
CortexHub is an intelligent knowledge management platform that helps users organize, analyze, and extract insights from their documents using AI. The frontend is built with Next.js and provides a modern, responsive user interface.

## Features
- Interactive knowledge graph visualization
- Document upload and management
- AI-powered document analysis
- Real-time collaboration tools
- Responsive design for all devices
- Intuitive user interface
- Secure authentication

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Components**: React, Tailwind CSS
- **State Management**: Redux Toolkit
- **Data Visualization**: D3.js
- **Form Handling**: React Hook Form
- **API Client**: Axios

## Prerequisites
- Node.js (v18 or later)
- npm or yarn
- CortexHub Backend (see backend README for setup)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cortexhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   # Add other environment variables as needed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   The application will be available at [http://localhost:3000]

## Project Structure

```
src/
├── app/                    # App router pages
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Authenticated routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/                # Basic UI components
│   ├── knowledgeGraph/    # Knowledge graph components
│   └── documents/         # Document management components
├── lib/                   # Utility functions
├── store/                 # Redux store and slices
└── types/                 # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Development Guidelines

1. **Component Development**
   - Create components in the `components` directory
   - Use TypeScript for type safety
   - Follow the project's Tailwind CSS conventions

2. **State Management**
   - Use Redux for global state
   - Keep component state local when possible
   - Use Redux Toolkit for slice creation

3. **Styling**
   - Use Tailwind CSS utility classes
   - Create reusable component variants when needed
   - Maintain consistent spacing and typography