import React, { useState } from 'react';
import { TidyCorpLogo } from './TidyCorpLogo';
import { ArrowLeft, Home, ShieldAlert, FileWarning, Lock, RefreshCw, ChevronDown, ChevronUp, Mail } from 'lucide-react';

export type ErrorStatusCode = 403 | 404 | 500 | 503;

interface ErrorPageProps {
  statusCode?: ErrorStatusCode;
  path?: string;
  title?: string;
  message?: string;
  errorDetails?: string;
  theme?: 'light' | 'dark';
  onReturnHome: () => void;
  onGoBack?: () => void;
  onOpenPricing?: () => void;
  onOpenPartners?: () => void;
  onResetError?: () => void;
}

const ERROR_COPY: Record<
  ErrorStatusCode,
  {
    label: string;
    defaultTitle: string;
    defaultMessage: string;
    guidance: string;
  }
> = {
  404: {
    label: 'Route Not Found',
    defaultTitle: 'We could not find that page.',
    defaultMessage:
      'The link may be outdated, moved during a recent platform update, or entered with an unrecognised path.',
    guidance: 'Return to the Tidy Corporation home portal or jump directly to one of the verified sections below.'
  },
  403: {
    label: 'Access Restricted',
    defaultTitle: 'You do not have permission to view this area.',
    defaultMessage:
      'This escrow workspace or compliance record requires an authorised homeowner, contractor, or administrator session.',
    guidance: 'Sign in with an authorised account or return to the main overview.'
  },
  500: {
    label: 'Unexpected Application Error',
    defaultTitle: 'Something went wrong while rendering this view.',
    defaultMessage:
      'An unexpected runtime fault interrupted this page. Your escrow records and active project data remain safely stored.',
    guidance: 'Reload the workspace or return to the home page to continue.'
  },
  503: {
    label: 'Service Temporarily Unavailable',
    defaultTitle: 'This service is briefly offline for maintenance.',
    defaultMessage:
      'We are completing a scheduled update to our UK escrow and compliance gateways. Normal access resumes shortly.',
    guidance: 'Try refreshing in a moment or return to the home page.'
  }
};

export const ErrorPage: React.FC<ErrorPageProps> = ({
  statusCode = 404,
  path,
  title,
  message,
  errorDetails,
  theme = 'dark',
  onReturnHome,
  onGoBack,
  onOpenPricing,
  onOpenPartners,
  onResetError
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const copy = ERROR_COPY[statusCode] || ERROR_COPY[404];
  const isLight = theme === 'light';

  const StatusIcon =
    statusCode === 403 ? Lock : statusCode === 500 || statusCode === 503 ? ShieldAlert : FileWarning;

  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    } else {
      onReturnHome();
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0A1128] text-slate-100'
      }`}
    >
      {/* Top Bar: 3 clean zones */}
      <header
        className={`border-b px-6 sm:px-10 py-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0A1128] border-slate-800/80'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={onReturnHome}
            className={`text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
              isLight ? '[&_span]:text-slate-900' : ''
            }`}
          >
            <TidyCorpLogo className="h-8 w-8" showText={true} />
          </button>

          <nav
            aria-label="Primary recovery navigation"
            className={`hidden md:flex items-center gap-6 text-sm font-medium ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={onReturnHome}
              className="hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Overview
            </button>
            {onOpenPricing && (
              <button
                type="button"
                onClick={onOpenPricing}
                className="hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Pricing
              </button>
            )}
            {onOpenPartners && (
              <button
                type="button"
                onClick={onOpenPartners}
                className="hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Partners
              </button>
            )}
            <a
              href="mailto:enquiries@tidycorp.co.uk"
              className="hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Support
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onReturnHome}
              className="px-4 py-2 rounded-lg bg-[#0057B8] hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 sm:py-24">
        <div className="w-full max-w-4xl">
          <div
            className={`rounded-2xl border p-8 sm:p-12 ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-[#0F172A] border-slate-800 shadow-xl'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left Column: Status Code & Primary Explanation */}
              <div className="lg:col-span-7 space-y-6">
                <div
                  className={`flex flex-wrap items-center gap-2 text-xs font-medium ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  <span className="font-mono tabular-nums font-semibold text-[#FF7F00]">
                    HTTP {statusCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{copy.label}</span>
                  {path && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono truncate max-w-[240px]" title={path}>
                        {path}
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-baseline gap-4">
                    <span
                      className={`font-mono tabular-nums text-5xl sm:text-6xl font-bold tracking-tight ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {statusCode}
                    </span>
                    <StatusIcon
                      className="h-7 w-7 text-[#FF7F00] shrink-0"
                      aria-hidden="true"
                    />
                  </div>

                  <h1
                    className={`text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-balance ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {title || copy.defaultTitle}
                  </h1>

                  <p
                    className={`text-sm sm:text-base leading-relaxed max-w-prose ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {message || copy.defaultMessage}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onReturnHome}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0057B8] hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Home className="h-4 w-4" aria-hidden="true" />
                    <span>Return to Home</span>
                  </button>

                  {onResetError ? (
                    <button
                      type="button"
                      onClick={onResetError}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isLight
                          ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                          : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
                      }`}
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      <span>Reload Workspace</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBack}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isLight
                          ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                          : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
                      }`}
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      <span>Go Back</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Helpful Verified Destinations */}
              <div
                className={`lg:col-span-5 lg:border-l lg:pl-8 space-y-5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <h2
                    className={`text-sm font-semibold ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    Helpful Destinations
                  </h2>
                  <p
                    className={`text-xs leading-relaxed ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {copy.guidance}
                  </p>
                </div>

                <div
                  className={`divide-y border-t border-b ${
                    isLight
                      ? 'divide-slate-200 border-slate-200'
                      : 'divide-slate-800 border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={onReturnHome}
                    className={`w-full py-3 flex items-center justify-between text-left text-sm transition-colors cursor-pointer ${
                      isLight
                        ? 'text-slate-700 hover:text-[#0057B8]'
                        : 'text-slate-200 hover:text-white'
                    }`}
                  >
                    <span className="font-medium">UK Renovation Escrow Overview</span>
                    <span className="text-xs text-[#FF7F00]">Open</span>
                  </button>

                  {onOpenPricing && (
                    <button
                      type="button"
                      onClick={onOpenPricing}
                      className={`w-full py-3 flex items-center justify-between text-left text-sm transition-colors cursor-pointer ${
                        isLight
                          ? 'text-slate-700 hover:text-[#0057B8]'
                          : 'text-slate-200 hover:text-white'
                      }`}
                    >
                      <span className="font-medium">Subscriptions &amp; Tidy Credits</span>
                      <span className="text-xs text-[#FF7F00]">View</span>
                    </button>
                  )}

                  {onOpenPartners && (
                    <button
                      type="button"
                      onClick={onOpenPartners}
                      className={`w-full py-3 flex items-center justify-between text-left text-sm transition-colors cursor-pointer ${
                        isLight
                          ? 'text-slate-700 hover:text-[#0057B8]'
                          : 'text-slate-200 hover:text-white'
                      }`}
                    >
                      <span className="font-medium">PartnerStack Partner Programme</span>
                      <span className="text-xs text-[#FF7F00]">Join</span>
                    </button>
                  )}

                  <a
                    href="mailto:enquiries@tidycorp.co.uk"
                    className={`w-full py-3 flex items-center justify-between text-left text-sm transition-colors ${
                      isLight
                        ? 'text-slate-700 hover:text-[#0057B8]'
                        : 'text-slate-200 hover:text-white'
                    }`}
                  >
                    <span className="font-medium inline-flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      <span>enquiries@tidycorp.co.uk</span>
                    </span>
                    <span className="text-xs text-slate-400">Contact</span>
                  </a>
                </div>
              </div>
            </div>

            {errorDetails && (
              <div
                className={`mt-8 pt-6 border-t ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowDetails(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                    isLight
                      ? 'text-slate-500 hover:text-slate-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {showDetails ? (
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
                </button>
                {showDetails && (
                  <pre
                    className={`mt-3 p-4 rounded-lg text-xs font-mono overflow-x-auto ${
                      isLight
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-[#0A1128] text-slate-300 border border-slate-800'
                    }`}
                  >
                    {errorDetails}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer
        className={`border-t px-6 sm:px-10 py-6 text-xs ${
          isLight
            ? 'border-slate-200 text-slate-500 bg-white'
            : 'border-slate-800/80 text-slate-400 bg-[#0A1128]'
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Tidy Corporation Ltd · Company Registration: 16530001</span>
          <a
            href="mailto:enquiries@tidycorp.co.uk"
            className="hover:underline underline-offset-4"
          >
            enquiries@tidycorp.co.uk
          </a>
        </div>
      </footer>
    </div>
  );
};
