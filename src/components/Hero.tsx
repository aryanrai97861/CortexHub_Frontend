"use client";
import React from 'react'
import Image from 'next/image';

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
};

const FeatureCard = ({ title, description, link, imageUrl }: { title: string; description: string; link: string; imageUrl?: string }) => {
  return (
    <a
      href={link}
      className="group block bg-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border border-white/20 hover:border-blue-400/50
                 text-current no-underline focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50 relative overflow-hidden"
      aria-label={`Learn more about ${title}`} // Good for accessibility
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-blue-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Image */}
        {imageUrl && (
          <div className="mb-8 flex justify-center overflow-hidden rounded-2xl"> {/* Increased margin-bottom for spacing */}
            <Image
              src={imageUrl}
              alt={title}
              width={1024}
              height={786}
              className="w-full h-48 sm:h-56 object-cover rounded-2xl transform group-hover:scale-110 transition-transform duration-700" // Slightly increased image size
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/1080x720/E0E0E0/333333?text=Image'; }} // Fallback image
            />
          </div>
        )}
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">{title}</h3>
        <p className="text-base sm:text-lg text-blue-100 leading-relaxed group-hover:text-white transition-colors duration-300">{description}</p>

        {/* Arrow icon */}
        <div className="mt-6 flex items-center text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
          <span className="text-sm font-medium mr-2">Explore</span>
          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </a>
  );
};


const Hero = () => {
  const featureData = [
    {
      title: "Solo Users",
      description: "Stay focused. Write notes, drop PDFs, and get intelligent summaries & tasks — all in one place.",
      link: "/SoleUser",
      imageUrl: "/SoleAgent.jpg",
    },
    {
      title: "Team Collaboration",
      description: "Share insights, collaborate on documents, and streamline workflows with your team seamlessly.",
      link: "/TeamCollaborations",
      imageUrl: "/Team.jpg",
    },
    {
      title: "Developers & AI Agents",
      description: "Build custom AI agents, integrate with APIs, and extend CortexHub's capabilities with ease.",
      link: "/Ai-Agents",
      imageUrl: "/Agent.jpg",
    },
    {
      title: "Researchers & Analysts",
      description: "Process large datasets, generate reports, and uncover hidden patterns with advanced tools.",
      link: "/UniversalReader",
      imageUrl: "/knowledge.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 font-sans text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-5xl mx-auto">
          {/* Floating badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-medium mb-8 animate-bounce">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
            Powered by AI • Real-time RAG • LangGraph
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            Welcome to <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent animate-pulse">CortexHub</span>
          </h1>
          <p className="text-xl sm:text-2xl text-blue-100 max-w-4xl mx-auto mb-12 leading-relaxed">
            CortexHub is a <span className="text-blue-300 font-semibold">workspace that thinks with you</span> — powered by LangGraph, Gemini, and real-time RAG agents.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center">
            <button
              onClick={scrollToFeatures}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-full text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 overflow-hidden"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button className="px-8 py-4 border-2 border-blue-400 text-blue-300 hover:text-white hover:bg-blue-400/20 font-semibold rounded-full text-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-16 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">10K+</div>
              <div className="text-sm text-blue-200">Documents Processed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">500+</div>
              <div className="text-sm text-blue-200">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">99.9%</div>
              <div className="text-sm text-blue-200">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">24/7</div>
              <div className="text-sm text-blue-200">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Grid of Cards */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Choose Your <span className="text-blue-400">Workspace</span>
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Tailored experiences for every type of user and workflow
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {featureData.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                link={feature.link}
                imageUrl={feature.imageUrl}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};


export default Hero
