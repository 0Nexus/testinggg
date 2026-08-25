import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { TidyCorpLogo } from './TidyCorpLogo';

// Photorealistic Human Realism Generated Assets
import ukRenovationHeroImg from '../assets/images/uk_renovation_hero_1786446306023.jpg';
import ukBathroomRenovationImg from '../assets/images/uk_bathroom_renovation_1786447192323.jpg';
import ukLivingRoomRenovationImg from '../assets/images/uk_livingroom_renovation_1786447205954.jpg';
import ukLoftExtensionImg from '../assets/images/uk_loft_extension_1786447218269.jpg';

import verifiedBuilderImg from '../assets/images/verified_uk_builder_1786446320820.jpg';
import dreamWallImg from '../assets/images/dream_wall_livingroom_1786446336669.jpg';
import escrowSafetyImg from '../assets/images/escrow_payment_safety_1786446346602.jpg';

import {
  Shield,
  Zap,
  CheckCircle2,
  Lock,
  Building2,
  FileText,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  Award,
  Users,
  Percent,
  Check,
  Scale,
  Code,
  HardHat,
  Eye,
  Camera,
  Bot,
  HelpCircle,
  LogIn,
  UserPlus,
  Coins,
  Flame,
  ArrowUpRight,
  Activity,
  CheckCircle,
  XCircle,
  Globe,
  Terminal,
  ShieldAlert,
  Sliders,
  DollarSign,
  Sun,
  Moon
} from 'lucide-react';

interface LandingPageProps {
  currentUser: User | null;
  onNavigateTab: (tab: 'urgent_ai' | 'quoting_agent' | 'pricing' | 'dashboard' | 'projects' | 'contractors' | 'compliance' | 'mcp' | 'checkout') => void;
  onOpenAuthModal?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenCookieSettings?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onNavigateTab,
  onOpenAuthModal,
  theme = 'light',
  onToggleTheme,
  onOpenCookieSettings
}) => {
  const [sdkCopied, setSdkCopied] = useState(false);

  // 4-Slide Photorealistic Human Realism Hero Carousel
  const heroSlides = [
    {
      image: ukRenovationHeroImg,
      title: 'Sunlit Kitchen Renovation',
      location: 'Kensington, London • £45,000 Milestone Escrow',
      tag: 'Slide 1/4: Sunlit Kitchen'
    },
    {
      image: ukBathroomRenovationImg,
      title: 'Luxury Marble Bathroom Suite',
      location: 'Richmond, Surrey • Gas Safe & Water Safety Verified',
      tag: 'Slide 2/4: Luxury Bathroom'
    },
    {
      image: ukLivingRoomRenovationImg,
      title: 'Living Room & Garden Bi-Folds',
      location: 'Oxford, UK • AI Vision Inspection Complete',
      tag: 'Slide 3/4: Living Area'
    },
    {
      image: ukLoftExtensionImg,
      title: 'Architectural Rear Glass Extension',
      location: 'Bristol, UK • Building Safety Act Golden Thread',
      tag: 'Slide 4/4: Glass Extension'
    }
  ];

  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextHeroSlide = () => {
    setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevHeroSlide = () => {
    setCurrentHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const copySDK = () => {
    navigator.clipboard.writeText('<script src="https://cdn.tdysecure.com/sdk/v2/tdy-bootstrap.js" data-client-key="tdy_live_8f3c9b1d" async></script>');
    setSdkCopied(true);
    setTimeout(() => setSdkCopied(false), 2500);
  };

  const handleFeatureAccess = (targetTab: 'urgent_ai' | 'quoting_agent' | 'pricing' | 'dashboard' | 'projects' | 'contractors' | 'compliance' | 'mcp' | 'checkout') => {
    if (!currentUser) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
    } else {
      onNavigateTab(targetTab);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 font-sans antialiased">
      
      {/* PUBLIC HEADER (Only visible when user is NOT logged in) */}
      {!currentUser && (
        <header className="sticky top-0 z-50 bg-[#0A1128]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <TidyCorpLogo className="h-10 w-10" showText={true} />
            </div>

            {/* Public Header Nav */}
            <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-slate-300">
              <button onClick={() => handleFeatureAccess('urgent_ai')} className="hover:text-cyan-400 transition-colors flex items-center space-x-1">
                <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span>Urgent AI Repair</span>
              </button>
              <button onClick={() => handleFeatureAccess('quoting_agent')} className="hover:text-cyan-400 transition-colors flex items-center space-x-1">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>AI Construction Quote</span>
              </button>
              <button onClick={() => handleFeatureAccess('compliance')} className="hover:text-cyan-400 transition-colors flex items-center space-x-1">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                <span>Compliance Matrix</span>
              </button>
              <button onClick={() => handleFeatureAccess('pricing')} className="hover:text-cyan-400 transition-colors flex items-center space-x-1">
                <Coins className="h-3.5 w-3.5 text-emerald-400" />
                <span>SaaS Tiers &amp; Pricing</span>
              </button>
            </nav>

            {/* Auth CTAs & Theme Switcher */}
            <div className="flex items-center space-x-3">
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all flex items-center space-x-1.5 border border-slate-700"
                  title={theme === 'dark' ? 'Switch to Magazine Light Mode' : 'Switch to Outdoor Site Dark Mode (#0A1128)'}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-400" />
                      <span className="hidden sm:inline text-[10px] font-bold text-amber-300">Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-cyan-300" />
                      <span className="hidden sm:inline text-[10px] font-bold text-cyan-200">Outdoor Site Dark</span>
                    </>
                  )}
                </button>
              )}

              {onOpenAuthModal && (
                <>
                  <button
                    onClick={onOpenAuthModal}
                    className="text-xs font-bold text-slate-200 hover:text-white px-3 py-2 rounded-xl transition-all"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={onOpenAuthModal}
                    className="bg-gradient-to-r from-[#0057B8] to-[#00A8FF] hover:from-blue-600 hover:to-cyan-500 text-white font-black px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center space-x-1.5"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Register Portal</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-20">

        {/* 1. HERO SECTION (PDF Pages 1 & 2) */}
        <section className="relative bg-[#0F172A] border border-slate-800/80 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0057B8]/25 blur-3xl pointer-events-none rounded-full"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#FF7F00]/20 blur-3xl pointer-events-none rounded-full"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-[#0057B8]/20 border border-[#0057B8]/50 text-cyan-300 px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span>Tidy Corporation Ltd • Operating System</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                We are architecting the <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-[#FF7F00] bg-clip-text text-transparent">AI-Intelligent</span> Operating System
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 font-medium max-w-2xl leading-relaxed">
                The next-generation framework for property care. Property Secured. Payments Streamlined. Trust Verified.
              </p>

              {/* Quick Feature Badges */}
              <div className="flex flex-wrap gap-3 text-xs font-mono font-bold pt-2">
                <span className="px-3.5 py-2 rounded-xl bg-[#0A1128] border border-slate-800 text-emerald-400 flex items-center space-x-2 shadow-inner">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Ring-Fenced Milestone Escrow</span>
                </span>
                <span className="px-3.5 py-2 rounded-xl bg-[#0A1128] border border-slate-800 text-cyan-300 flex items-center space-x-2 shadow-inner">
                  <Bot className="h-4 w-4 text-cyan-400" />
                  <span>AI Smart Repair Assistant</span>
                </span>
                <span className="px-3.5 py-2 rounded-xl bg-[#0A1128] border border-slate-800 text-amber-400 flex items-center space-x-2 shadow-inner">
                  <Lock className="h-4 w-4 text-amber-400" />
                  <span>Tamper-Proof Building Safety Log</span>
                </span>
              </div>

              {/* Hero CTAs */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => handleFeatureAccess('urgent_ai')}
                  className="bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black px-7 py-4 rounded-2xl text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center space-x-2"
                >
                  <Zap className="h-4 w-4 fill-current text-slate-950" />
                  <span>Try Urgent AI Repair</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleFeatureAccess('quoting_agent')}
                  className="bg-[#0057B8] hover:bg-blue-600 text-white font-black px-7 py-4 rounded-2xl text-sm shadow-xl shadow-blue-500/20 transition-all flex items-center space-x-2"
                >
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  <span>AI Construction Quote</span>
                </button>

                {!currentUser && onOpenAuthModal && (
                  <button
                    onClick={onOpenAuthModal}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-6 py-4 rounded-2xl text-sm transition-all flex items-center space-x-2"
                  >
                    <LogIn className="h-4 w-4 text-slate-400" />
                    <span>Portal Sign In / Register</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hero Visual Card / Platform Preview Mockup */}
            <div className="lg:col-span-5 bg-[#0A1128] border border-slate-800/90 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden group">
              {/* Photorealistic 4-Slide Interactive Hero Image Carousel */}
              <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-800 group/carousel">
                <img
                  src={heroSlides[currentHeroSlide].image}
                  alt={heroSlides[currentHeroSlide].title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-all duration-700 brightness-90 group-hover/carousel:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128] via-[#0A1128]/30 to-transparent"></div>
                
                {/* Top Badge Overlay */}
                <div className="absolute top-3 left-3 bg-[#0A1128]/90 backdrop-blur-md text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1.5 shadow-md">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>{heroSlides[currentHeroSlide].tag}</span>
                </div>

                {/* Bottom Caption Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div className="bg-[#0A1128]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 max-w-[70%] space-y-0.5">
                    <div className="text-white text-xs font-black truncate">
                      {heroSlides[currentHeroSlide].title}
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 truncate">
                      {heroSlides[currentHeroSlide].location}
                    </div>
                  </div>

                  {/* Carousel Indicator Dots */}
                  <div className="flex items-center space-x-1.5 bg-[#0A1128]/85 backdrop-blur-md p-1.5 rounded-full border border-slate-700/80">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentHeroSlide(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentHeroSlide ? 'w-5 bg-[#FF7F00]' : 'w-2 bg-slate-500 hover:bg-slate-300'
                        }`}
                        title={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Left Arrow Button */}
                <button
                  onClick={prevHeroSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-slate-950/70 hover:bg-[#FF7F00] text-white border border-slate-700 flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md"
                  title="Previous Project Photo"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Right Arrow Button */}
                <button
                  onClick={nextHeroSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-slate-950/70 hover:bg-[#FF7F00] text-white border border-slate-700 flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md"
                  title="Next Project Photo"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[11px] font-mono text-slate-400 ml-1">TidyCorp OS v3.2</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full uppercase font-bold">
                  100% Live Compliance
                </span>
              </div>

              {/* Interactive Preview Cards */}
              <div className="space-y-2.5 font-mono text-xs">
                <div className="bg-[#0F172A] p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between cursor-pointer hover:border-cyan-500/40 transition-all" onClick={() => handleFeatureAccess('checkout')}>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Active Escrow Tally</span>
                    <span className="text-white font-black text-base">£758,210.00</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                    90-Day Custodial
                  </span>
                </div>

                <div className="bg-[#0F172A] p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between cursor-pointer hover:border-amber-500/40 transition-all" onClick={() => handleFeatureAccess('compliance')}>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Awaab's Law Triage</span>
                    <span className="text-amber-400 font-bold text-xs sm:text-sm">12 New Reports (24h SLA)</span>
                  </div>
                  <span className="px-2 py-1 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] font-bold">
                    Auto-Dispatched
                  </span>
                </div>
              </div>

              <div className="pt-2 text-center">
                <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest font-bold">
                  TidySecurePay: Automated Funds Release &amp; Audit Trail
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. THE MARKET OPPORTUNITY & £14B TRUST DEFICIT (PDF Pages 3, 4, 5) */}
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-[#FF7F00] uppercase tracking-wider">
              UK Residential Housing RMI Sector
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Market Structure &amp; The £14 Billion "Trust Deficit"
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              The UK residential housing stock of 25.8M dwellings represents a massive economic engine, with £60B spent annually on RMI (£40B directly to tradespeople). Yet consistent demand is paralyzed by a pervasive lack of trust.
            </p>
          </div>

          {/* Big Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-2 hover:border-emerald-500/40 transition-all">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 block">£60 Billion</span>
              <span className="text-xs font-mono font-bold text-slate-200 block uppercase">Total Annual RMI Spend</span>
              <p className="text-slate-400 text-xs">
                Direct residential repair, maintenance, and improvement spend across the United Kingdom.
              </p>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-2 hover:border-cyan-500/40 transition-all">
              <span className="text-3xl sm:text-4xl font-black text-cyan-300 block">25.8 Million</span>
              <span className="text-xs font-mono font-bold text-slate-200 block uppercase">English Housing Stock</span>
              <p className="text-slate-400 text-xs">
                64% Owner-Occupied (16.3M), 19% Private Rented (4.9M), 16% Social Housing (4.2M).
              </p>
            </div>

            <div className="bg-[#0F172A] border border-rose-900/60 bg-rose-950/20 rounded-3xl p-6 space-y-2 hover:border-rose-500/60 transition-all">
              <span className="text-3xl sm:text-4xl font-black text-rose-400 block">£14.3 Billion</span>
              <span className="text-xs font-mono font-bold text-rose-300 block uppercase">Lost Every 5 Years</span>
              <p className="text-rose-200/80 text-xs">
                Wasted on unreliable, unvetted "cowboy builders" and non-compliant workmanship.
              </p>
            </div>

            <div className="bg-[#0F172A] border border-amber-900/60 bg-amber-950/20 rounded-3xl p-6 space-y-2 hover:border-amber-500/60 transition-all">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 block">17% Insolvency</span>
              <span className="text-xs font-mono font-bold text-amber-300 block uppercase">Industry Failure Rate</span>
              <p className="text-amber-200/80 text-xs">
                Trade SMB business failures caused by late payments, dispute fatigue, and admin overhead.
              </p>
            </div>
          </div>

          {/* Quantifying the Crisis Breakdown */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <div className="space-y-1.5">
              <span className="text-3xl font-black text-rose-400 block">58%</span>
              <span className="font-bold text-white block">Rogue Trade Victims</span>
              <p className="text-slate-400">Consumers who have suffered from a rogue tradesperson. Only 52% trust professionals.</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-3xl font-black text-amber-400 block">37%</span>
              <span className="font-bold text-white block">Renovation Anxiety</span>
              <p className="text-slate-400">Homeowners who have delayed planned renovations due to anxiety and fear of cowboy builders.</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-3xl font-black text-cyan-300 block">10 Hours</span>
              <span className="font-bold text-white block">Weekly Admin Loss</span>
              <p className="text-slate-400">Time lost weekly by trade SMBs chasing £6,984 in late payments.</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-3xl font-black text-emerald-400 block">Only 37%</span>
              <span className="font-bold text-white block">Formal Itemized Quotes</span>
              <p className="text-slate-400">Of consumers ever receive a formal, legally itemized written quotation.</p>
            </div>
          </div>
        </section>

        {/* 3. THE REGULATORY SQUEEZE & £40,000 COMPLIANCE TRAP (PDF Pages 6, 7, 8, 9, 29) */}
        <section className="bg-[#0F172A] border border-rose-900/50 rounded-3xl p-8 sm:p-12 space-y-8 relative overflow-hidden">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center space-x-2 bg-rose-950 border border-rose-800 text-rose-300 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>Statutory Legislative Pressure</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              There's a new landlord penalty of up to <span className="text-rose-400">£40,000</span>...
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              ...for missing a repair deadline you didn't even know existed. Five critical legislative updates are reshaping compliance, liability, and asset management standards across the UK property sector.
            </p>
          </div>

          {/* 5 Legislative Mandates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#0A1128] p-6 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase block">01. Renters' Rights Act 2025</span>
              <h3 className="text-base font-black text-white">Section 8 &amp; Ledger Audit</h3>
              <p className="text-slate-400 text-xs">
                Commencing May 1, 2026. Abolishes Section 21 evictions and requires a clean chronological rent &amp; repair ledger. Penalties up to £40,000 per breach.
              </p>
            </div>

            <div className="bg-[#0A1128] p-6 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase block">02. Awaab's Law (HHSRS)</span>
              <h3 className="text-base font-black text-white">Strict Hazard Timeframes</h3>
              <p className="text-slate-400 text-xs">
                Mandates strict timelines for Category 1 hazards: 24h Emergency Triage, 10 Days Investigation, 3 Days Report, 5 Days Remedial Safety.
              </p>
            </div>

            <div className="bg-[#0A1128] p-6 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase block">03. Building Safety Act 2022</span>
              <h3 className="text-base font-black text-white">Digital "Golden Thread"</h3>
              <p className="text-slate-400 text-xs">
                Demands a digital "Golden Thread" of safety info for Higher-Risk Buildings (HRBs). Safety asset modifications must be immutably recorded.
              </p>
            </div>

            <div className="bg-[#0A1128] p-6 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase block">04. Decarbonization &amp; MEES</span>
              <h3 className="text-base font-black text-white">EPC Rating C Mandate</h3>
              <p className="text-slate-400 text-xs">
                Requires privately rented properties to achieve an EPC rating C by October 2030. Non-compliance penalties rise up to £30,000 per breach.
              </p>
            </div>

            <div className="bg-[#0A1128] p-6 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase block">05. BS 8214:2026 Fire Safety</span>
              <h3 className="text-base font-black text-white">Fire Door &amp; CDM Liability</h3>
              <p className="text-slate-400 text-xs">
                March 2026 revision treats fire doors as integrated assemblies. Enforces 5mm max threshold gaps and places CDM designer liability on installers.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#0057B8]/30 to-[#FF7F00]/20 p-6 rounded-2xl border border-[#0057B8]/50 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase block">Automated SLA Engine</span>
                <h3 className="text-base font-black text-white mt-1">Zero-Penalties Guarantee</h3>
                <p className="text-slate-300 text-xs mt-1">
                  Tidy Corp converts complex housing codes into automated countdown triggers and locked escrow workflows.
                </p>
              </div>
              <button
                onClick={() => handleFeatureAccess('compliance')}
                className="bg-[#0057B8] hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center space-x-2"
              >
                <span>View Compliance Matrix</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* 4. THE TIDY CORP DUAL-FLAGSHIP ECOSYSTEM (PDF Pages 10 & 11) */}
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              The Tidy Corp Ecosystem
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Two Core Engines. One Complete Solution.
            </h2>
            <p className="text-slate-300 text-sm">
              An integrated framework aligning automated intelligence with secure milestone-driven financial clearing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ENGINE 1: THE BRAIN - TIDY CORP AI SECURE */}
            <div className="bg-[#0F172A] border border-slate-800/90 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-[#0057B8] transition-all shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-mono font-bold uppercase">
                    Engine 1: The Brain
                  </span>
                  <Cpu className="h-6 w-6 text-cyan-400" />
                </div>

                <h3 className="text-2xl font-black text-white">Tidy Corp AI Secure</h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Autonomous multi-agent intelligence orchestrating property inspection, trade vetting, and construction quotation in seconds.
                </p>

                <ul className="space-y-3 text-xs text-slate-300 font-medium pt-2">
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Multi-agent AI mesh:</strong> Coordinates dynamic real-time communication between tenants, landlords, and contractors.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Automated job-scoping:</strong> Converts site photos/videos into itemized Bills of Quantities (BoQ).</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>W3C Digital Credentials:</strong> Cross-references Gas Safe, NICEIC, and insurance policies in &lt;30s.</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleFeatureAccess('quoting_agent')}
                className="w-full bg-[#0A1128] hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 font-black py-3 rounded-2xl text-xs transition-all flex items-center justify-center space-x-2"
              >
                <span>Test AI Quoting Engine</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* ENGINE 2: THE VAULT - TIDY SECURE PAY */}
            <div className="bg-[#0F172A] border border-slate-800/90 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-[#FF7F00] transition-all shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-xs font-mono font-bold uppercase">
                    Engine 2: The Vault
                  </span>
                  <Lock className="h-6 w-6 text-amber-400" />
                </div>

                <h3 className="text-2xl font-black text-white">Tidy Secure Pay</h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  FCA-compliant milestone escrow gateway and payment clearing layer safeguarding capital up to 90 days.
                </p>

                <ul className="space-y-3 text-xs text-slate-300 font-medium pt-2">
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Dual-rail milestone payments:</strong> Aligns payouts directly with verified project progress milestones.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Integrated escrow gateway:</strong> Holds consumer deposits securely inside ring-fenced accounts.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>48-Hour Auto-Approval Gate:</strong> Guarantees contractor cash flow unless an evidence dispute is raised.</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleFeatureAccess('checkout')}
                className="w-full bg-[#0A1128] hover:bg-slate-800 text-amber-300 border border-amber-800/60 font-black py-3 rounded-2xl text-xs transition-all flex items-center justify-center space-x-2"
              >
                <span>Explore Escrow Gateway</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* STAGE TRUTH LEDGER BAR */}
          <div className="bg-[#0A1128] border border-purple-900/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-xs font-mono font-bold uppercase">
                The Stage Truth Ledger
              </span>
              <h4 className="text-lg font-black text-white">Write-Only Cryptographic PostgreSQL Log</h4>
              <p className="text-slate-400 text-xs max-w-2xl">
                An append-only cryptographic ledger (<code className="text-cyan-300">tdy_stage_truth_ledger</code>) locking every milestone, agreement, and site photo with SHA-256 hashes. Unalterable evidence for insurance and legal standards.
              </p>
            </div>

            <button
              onClick={() => handleFeatureAccess('mcp')}
              className="bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-700 font-bold px-5 py-3 rounded-2xl text-xs shrink-0 transition-all flex items-center space-x-2"
            >
              <Code className="h-4 w-4 text-purple-400" />
              <span>Audit MCP Rules</span>
            </button>
          </div>
        </section>

        {/* 5. TRUST OVERLAY VS MONOLITHIC SAAS (PDF Page 15) */}
        <section className="bg-[#0F172A] border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Product Vision &amp; Value Proposition
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Tidy Secure Pay: The Trust-as-a-Service Overlay
            </h2>
            <p className="text-slate-300 text-sm">
              A lightweight, embeddable fintech utility engineered to bridge the RMI trust gap. It acts as a modular overlay on your existing tools instead of requiring costly systems migration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* TRADITIONAL MONOLITHIC SAAS */}
            <div className="bg-[#0A1128] border border-rose-900/40 p-8 rounded-3xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                  Traditional Monolithic SaaS
                </span>
                <h3 className="text-xl font-black text-white">High-Friction Migration Risk</h3>
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>90-Day Churn Risk:</strong> Complex organizational shifts trigger user fatigue and early adoption failure.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Multi-Week Onboarding:</strong> Requires deep database restructuring, staff retraining, and operational downtime.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>High Setup Complexity:</strong> Forces teams to abandon functional, familiar CRMs for bloated feature sets.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* TIDY SECURE PAY OVERLAY */}
            <div className="bg-[#0A1128] border border-emerald-800/60 p-8 rounded-3xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Tidy Secure Pay &lt;One-Line SDK&gt;
                </span>
                <h3 className="text-xl font-black text-white">Modular "Trust Overlay"</h3>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Zero Displacement:</strong> Keeps your current CRM, invoice templates, or accounting stack entirely intact.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Milestone Escrow:</strong> Secures consumer funds, releasing them dynamically upon certified completion.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Auto-Compliance Gates:</strong> Enforces digital checkpoints so regulatory &amp; quality standards are verified.</span>
                  </li>
                </ul>
              </div>

              {/* SDK Snippet Box */}
              <div className="bg-[#0A1128] border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs font-mono">
                <code className="text-cyan-300 truncate mr-2">
                  &lt;script src="https://cdn.tdysecure.com/sdk/v2/tdy-bootstrap.js" ... /&gt;
                </code>
                <button
                  onClick={copySDK}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all"
                >
                  {sdkCopied ? 'Copied!' : 'Copy SDK'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 6. ASYNCHRONOUS AI MESH (PDF Page 23) */}
        <section className="bg-[#0F172A] border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              #AIMESH Technology Stack
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              An Asynchronous AI Mesh Powered by Google Cloud
            </h2>
            <p className="text-slate-300 text-sm">
              A distributed network of specialized autonomous agents executing high-fidelity verification, scoping, and adjudication tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#0A1128] p-6 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">01. Vetting Agent</span>
              <h3 className="text-base font-black text-white">License Verification</h3>
              <p className="text-slate-400 text-xs">
                Verifies Gas Safe, NICEIC, and FENSA credentials autonomously in under 30 seconds.
              </p>
            </div>

            <div className="bg-[#0A1128] p-6 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">02. Job-Scoping Agent</span>
              <h3 className="text-base font-black text-white">Visual BoQ Engine</h3>
              <p className="text-slate-400 text-xs">
                Converts submitted site photos and videos directly into a structured, itemized Bill of Quantities.
              </p>
            </div>

            <div className="bg-[#0A1128] p-6 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">03. Quoting Agent</span>
              <h3 className="text-base font-black text-white">Market Pricing Indexer</h3>
              <p className="text-slate-400 text-xs">
                Cross-references localized merchant pricing networks to match materials with current index standards.
              </p>
            </div>

            <div className="bg-[#0A1128] p-6 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase">04. Dispute Agent</span>
              <h3 className="text-base font-black text-white">Visual Resolution Gate</h3>
              <p className="text-slate-400 text-xs">
                Resolves quality disputes by running differential computer vision scans on photos within a 120-minute SLA.
              </p>
            </div>
          </div>
        </section>

        {/* 6.5 HUMAN REALISM VISUAL SHOWCASE (PDF Pages 1, 5, 6, 8) */}
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-[#FF7F00] uppercase tracking-wider flex items-center justify-center space-x-1.5">
              <Camera className="h-4 w-4 text-amber-400" />
              <span>Human Realism Visual Design Framework</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Authentic UK Property Care in Action
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Replacing generic stock art and sterile software diagrams with photorealistic imagery of modern UK homes, certified trade professionals, and live Tidy Corp app interfaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Gallery Item 1: Modern Kitchen Renovation */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl overflow-hidden hover:border-cyan-500/50 transition-all group flex flex-col justify-between shadow-xl">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={ukRenovationHeroImg}
                  alt="Modern Sunlit UK Kitchen Renovation"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#0A1128]/90 backdrop-blur-md text-cyan-300 border border-cyan-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  Completed Scope
                </div>
              </div>
              <div className="p-5 space-y-2">
                <h3 className="text-sm font-extrabold text-white">Sunlit Kitchen Renovation</h3>
                <p className="text-slate-400 text-xs">
                  Pristine finish with verified milestone sign-offs and automatic building safety records.
                </p>
              </div>
            </div>

            {/* Gallery Item 2: Verified UK Builder */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all group flex flex-col justify-between shadow-xl">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={verifiedBuilderImg}
                  alt="Verified UK Trade Engineer"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#0A1128]/90 backdrop-blur-md text-amber-300 border border-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  Certified Trade Pro
                </div>
              </div>
              <div className="p-5 space-y-2">
                <h3 className="text-sm font-extrabold text-white">Digital Skill Passport</h3>
                <p className="text-slate-400 text-xs">
                  Gas Safe, NICEIC, and insurance credentials checked autonomously in under 30 seconds.
                </p>
              </div>
            </div>

            {/* Gallery Item 3: Dream Wall Visualizer */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all group flex flex-col justify-between shadow-xl">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dreamWallImg}
                  alt="Dream Wall AI Interior Remodel Concept"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#0A1128]/90 backdrop-blur-md text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  Interactive AI Tool
                </div>
              </div>
              <div className="p-5 space-y-2">
                <h3 className="text-sm font-extrabold text-white">Dream Wall 3D Concept</h3>
                <p className="text-slate-400 text-xs">
                  Instant visual room transformation converting text ideas into itemized material lists.
                </p>
              </div>
            </div>

            {/* Gallery Item 4: Escrow Payment Safety */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all group flex flex-col justify-between shadow-xl">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={escrowSafetyImg}
                  alt="On-Site Escrow Deposit Confirmation"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#0A1128]/90 backdrop-blur-md text-purple-300 border border-purple-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  FCA Compliant Vault
                </div>
              </div>
              <div className="p-5 space-y-2">
                <h3 className="text-sm font-extrabold text-white">Tidy Secure Escrow</h3>
                <p className="text-slate-400 text-xs">
                  Ring-fenced milestone deposits protected with 3-second hold gesture &amp; Face ID.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. REAL-WORLD STAKEHOLDER IMPACT & TABS (PDF Page 31) */}
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Built for Every Stakeholder
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Real-World Impact Across the Built Environment
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0F172A] border border-slate-800/90 rounded-3xl overflow-hidden hover:border-cyan-500/50 transition-all shadow-xl group">
              <div className="h-36 overflow-hidden relative">
                <img
                  src={dreamWallImg}
                  alt="Homeowner Sarah"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent"></div>
              </div>
              <div className="p-6 space-y-3 pt-2">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">01. Homeowner</span>
                    <h3 className="text-lg font-black text-white">Sarah</h3>
                  </div>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Uses AI Dreamwall to visualize her kitchen remodel, deposits funds into escrow, and approves payments stress-free upon verified milestone delivery.
                </p>
              </div>
            </div>

            <div className="bg-[#0F172A] border border-slate-800/90 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all shadow-xl group">
              <div className="h-36 overflow-hidden relative">
                <img
                  src={verifiedBuilderImg}
                  alt="Tradesperson Brian"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent"></div>
              </div>
              <div className="p-6 space-y-3 pt-2">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 shrink-0">
                    <HardHat className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">02. Skilled Tradesperson</span>
                    <h3 className="text-lg font-black text-white">Brian</h3>
                  </div>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Onboards via the Centralized Notification Hub, embeds <code className="text-cyan-300">tdy-bootstrap.js</code> on his site, and receives instant 48-hour auto-payouts.
                </p>
              </div>
            </div>

            <div className="bg-[#0F172A] border border-slate-800/90 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all shadow-xl group">
              <div className="h-36 overflow-hidden relative">
                <img
                  src={escrowSafetyImg}
                  alt="Housing Manager Olivia"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent"></div>
              </div>
              <div className="p-6 space-y-3 pt-2">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">03. Housing Manager</span>
                    <h3 className="text-lg font-black text-white">Olivia</h3>
                  </div>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Manages 500+ residential units on a desktop command center, achieving 100% statutory compliance and zero Housing Ombudsman fines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. SAAS SUBSCRIPTIONS & CREDITS OVERVIEW (PDF Page 33 & 34) */}
        <section className="bg-[#0F172A] border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              Transparent Monetization
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Flexible SaaS Subscriptions &amp; Tidy Credits
            </h2>
            <p className="text-slate-300 text-sm">
              Standardized compute, multi-agent reasoning, and compliance logging tokenomics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* JOURNEYMAN PRO */}
            <div className="bg-[#0A1128] border border-slate-800 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase block">01. Contractor &amp; Pro</span>
                <h3 className="text-xl font-black text-white">Journeyman Pro</h3>
                <span className="text-2xl font-black text-white block">£80.30 <span className="text-xs font-normal text-slate-400">/ mo</span></span>
                <p className="text-slate-400 text-xs">
                  100,000 Credits included. Stage Truth Ledger access, Xero/QuickBooks sync, CIS tax engine.
                </p>
              </div>
              <button
                onClick={() => handleFeatureAccess('pricing')}
                className="w-full bg-[#0057B8] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
              >
                Select Journeyman Pro
              </button>
            </div>

            {/* LANDLORD PORTFOLIO */}
            <div className="bg-[#0A1128] border border-amber-800/80 p-6 rounded-3xl space-y-4 flex flex-col justify-between shadow-lg shadow-amber-500/10">
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block">02. Landlord &amp; Portfolio</span>
                <h3 className="text-xl font-black text-white">Essential &amp; Pro</h3>
                <span className="text-2xl font-black text-amber-400 block">From £16.50 <span className="text-xs font-normal text-slate-400">/ mo</span></span>
                <p className="text-slate-400 text-xs">
                  Essential Landlord (£16.50/mo), Professional Portfolio (£99/mo). Open Banking rent reconciliation, Awaab's Law engine.
                </p>
              </div>
              <button
                onClick={() => handleFeatureAccess('pricing')}
                className="w-full bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all"
              >
                Select Landlord Tier
              </button>
            </div>

            {/* TIDY CREDITS */}
            <div className="bg-[#0A1128] border border-slate-800 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">03. Compute Power</span>
                <h3 className="text-xl font-black text-white">Tidy Credits</h3>
                <span className="text-2xl font-black text-emerald-400 block">£10.00 <span className="text-xs font-normal text-slate-400">per 20,000 credits</span></span>
                <p className="text-slate-400 text-xs">
                  10 credits: Chat triage • 50 credits: Visual BoQ scoping • 250 credits: Regulatory legal audit runs.
                </p>
              </div>
              <button
                onClick={() => handleFeatureAccess('pricing')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition-all"
              >
                Top Up Credits
              </button>
            </div>
          </div>
        </section>

        {/* 9. BOTTOM CTA BANNER (PDF Pages 32 & 35) */}
        <section className="bg-gradient-to-r from-[#0057B8] via-[#0088FF] to-[#FF7F00] rounded-3xl p-8 sm:p-12 text-slate-950 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-mono font-black uppercase">
              SECURE PAYMENTS FOR HOME REPAIRS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950">
              Try Tidy Corp on your next project.
            </h2>
            <p className="text-slate-950/90 font-bold text-sm">
              Secure. Compliant. Verified. Trusted. Let's build something tidy together.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="bg-slate-950 hover:bg-slate-900 text-white font-black px-7 py-4 rounded-2xl text-xs transition-all shadow-xl flex items-center space-x-2"
              >
                <LogIn className="h-4 w-4 text-cyan-400" />
                <span>Get Started / Register</span>
              </button>
            )}

            <button
              onClick={() => handleFeatureAccess('urgent_ai')}
              className="bg-white hover:bg-slate-100 text-slate-950 font-black px-7 py-4 rounded-2xl text-xs transition-all shadow-xl flex items-center space-x-2"
            >
              <span>Launch Urgent AI Repair</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-800/80 pt-8 pb-12 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span>© 2026 Tidy Corporation Ltd • Company Registration: 16530001</span>
            {onOpenCookieSettings && (
              <button
                onClick={onOpenCookieSettings}
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
              >
                Cookie &amp; Privacy Preferences
              </button>
            )}
          </div>
          <div className="flex items-center space-x-6">
            <a href="mailto:enquiries@tidycorp.co.uk" className="hover:text-cyan-400 transition-colors">enquiries@tidycorp.co.uk</a>
            <a href="https://tidycorp.co.uk" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">tidycorp.co.uk</a>
          </div>
        </footer>

      </div>
    </div>
  );
};
