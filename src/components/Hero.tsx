"use client";
import React from 'react'

const FeatureCard = ({ title, description, link, imageUrl }: { title: string; description: string; link: string; imageUrl?: string }) => {
  return (
    <a
      href={link}
      className="block bg-cortex-card-bg p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1 border border-cortex-border
                 text-current no-underline focus:outline-none focus:ring-4 focus:ring-cortex-light-blue focus:ring-opacity-50"
      aria-label={`Learn more about ${title}`} // Good for accessibility
    >
      {/* Image */}
      {imageUrl && (
        <div className="mb-6 flex justify-center"> {/* Increased margin-bottom for spacing */}
          <img
            src={imageUrl}
            alt={title}
            className="w-10xl h-10xl object-contain rounded-lg" // Slightly increased image size
            onError={(e) => { e.currentTarget.src = 'https://placehold.co/1080x720/E0E0E0/333333?text=Image'; }} // Fallback image
          />
        </div>
      )}
      <h3 className="text-2xl font-bold text-cortex-dark-blue mb-3">{title}</h3>
      <p className="text-base text-cortex-card-text leading-relaxed">{description}</p>
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
    <div className="min-h-screen bg-blue-900 font-sans text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
          Welcome to <span className="text-blue-400">CortexHub</span>
        </h1>
        <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto mb-8">
          CortexHub is a workspace that thinks with you — powered by LangGraph, Gemini, and real-time RAG agents.
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50">
          Get Started
        </button>
      </section>

      {/* Features Section - Grid of Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
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
      </section>
    </div>
  );
};
  

export default Hero
