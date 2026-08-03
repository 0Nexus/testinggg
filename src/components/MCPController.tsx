import React, { useState } from 'react';
import { MCPRule, GatewayConfig, PaymentGateway } from '../types';
import { Zap, ShieldCheck, Clock, CheckCircle2, Sliders, AlertTriangle, Play, RefreshCw, Key, ShieldAlert } from 'lucide-react';

interface MCPControllerProps {
  mcpRules: MCPRule[];
  gatewayConfig: GatewayConfig;
  onUpdateGatewayConfig: (config: Partial<GatewayConfig>) => void;
  onToggleRule: (ruleId: string, active: boolean) => void;
}

export const MCPController: React.FC<MCPControllerProps> = ({
  mcpRules,
  gatewayConfig,
  onUpdateGatewayConfig,
  onToggleRule
}) => {
  // Test sandbox state
  const [testAmount, setTestAmount] = useState<number>(45000);
  const [testDurationDays, setTestDurationDays] = useState<number>(180);
  const [testCurrency, setTestCurrency] = useState('GBP');
  const [simulatedResult, setSimulatedResult] = useState<{
    recommendedGateway: PaymentGateway;
    reason: string;
    stripeFee: number;
    airwallexFee: number;
    savings: number;
    authExpired: boolean;
  } | null>(null);

  // Run test simulation
  const handleRunSimulation = () => {
    let gateway: PaymentGateway = 'airwallex';
    let reason = '';

    if (testDurationDays > 90) {
      gateway = 'airwallex';
      reason = `Duration of ${testDurationDays} days exceeds Stripe's 90-day pre-authorization hold limit. Airwallex Direct Debit setup prevents payment failure.`;
    } else {
      gateway = 'stripe';
      reason = `Duration of ${testDurationDays} days is within Stripe's 90-day window. Fast card intent processing.`;
    }

    const stripeFee = Math.round((testAmount * 0.029 + 0.3) * 100) / 100;
    const airwallexFee = Math.round((testAmount * 0.003 + 0.5) * 100) / 100; // Direct Debit low rate
    const savings = Math.max(0, stripeFee - airwallexFee);

    setSimulatedResult({
      recommendedGateway: gateway,
      reason,
      stripeFee,
      airwallexFee,
      savings,
      authExpired: testDurationDays > 90
    });
  };

  return (
    <div id="mcp-controller-container" className="space-y-8 max-w-7xl mx-auto">
      {/* Top Explanation Banner */}
      <div id="mcp-explanation-card" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-[#0057B8] rounded-xl">
            <Zap className="h-6 w-6 text-[#FF7F00]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Multi-Gateway Control Plane (MCP) Architecture</h1>
            <p className="text-xs text-slate-600 font-medium">
              Intelligent multi-provider routing engine resolving payment duration constraints for UK renovation contracts.
            </p>
          </div>
        </div>

        {/* Side-by-side comparison matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Stripe Card */}
          <div id="mcp-matrix-stripe" className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-slate-50 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-black text-slate-900 text-lg">Stripe Connect</span>
                <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded border border-blue-300">
                  Short-Term Escrow
                </span>
              </div>
              <Clock className="h-5 w-5 text-[#0057B8]" />
            </div>

            <ul className="text-xs space-y-2 text-slate-700 font-medium">
              <li className="flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span><strong className="text-amber-800">Auth Limit:</strong> Max 90 days pre-auth hold</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Instant Card &amp; Apple Pay checkout (&le;30d deposit)</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-500">
                <span>Standard Card Fees: 2.9% + £0.30 per transaction</span>
              </li>
            </ul>
          </div>

          {/* Airwallex Card */}
          <div id="mcp-matrix-airwallex" className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50/50 to-slate-50 border border-cyan-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-black text-slate-900 text-lg">Airwallex Direct</span>
                <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded border border-cyan-300">
                  Long-Term Installment Engine
                </span>
              </div>
              <ShieldCheck className="h-5 w-5 text-cyan-600" />
            </div>

            <ul className="text-xs space-y-2 text-slate-700 font-medium">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span><strong className="text-cyan-900">Auth Limit:</strong> Up to 24+ Months BACS Mandate</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Global Multi-Currency virtual bank accounts (BACS, ACH, SEPA)</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-500">
                <span>Direct Debit Fees: 0.3% capped + £0.50 (Save up to 80%)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive MCP Sandbox Simulator */}
      <div id="mcp-sandbox-panel" className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-5 border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="h-5 w-5 text-[#FF7F00]" />
            <h2 className="text-lg font-black text-white">MCP Interactive Routing Simulator</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Test Contract Parameter Routing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contract Amount</label>
            <input
              id="input-sim-amount"
              type="number"
              value={testAmount}
              onChange={e => setTestAmount(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Installment Duration (Days)</label>
            <input
              id="input-sim-days"
              type="number"
              value={testDurationDays}
              onChange={e => setTestDurationDays(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Currency</label>
            <select
              id="select-sim-currency"
              value={testCurrency}
              onChange={e => setTestCurrency(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-bold"
            >
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          <button
            id="btn-run-mcp-sim"
            onClick={handleRunSimulation}
            className="bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg"
          >
            <Play className="h-4 w-4" />
            <span>Evaluate Route</span>
          </button>
        </div>

        {/* Simulation Output */}
        {simulatedResult && (
          <div id="sim-result-card" className="bg-slate-800/90 rounded-xl p-5 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono uppercase">MCP Decision Result:</span>
              {simulatedResult.recommendedGateway === 'airwallex' ? (
                <span className="bg-cyan-500/20 text-cyan-300 font-extrabold text-xs px-3 py-1 rounded-full border border-cyan-400/30">
                  Airwallex Direct Assigned
                </span>
              ) : (
                <span className="bg-blue-500/20 text-blue-300 font-extrabold text-xs px-3 py-1 rounded-full border border-blue-400/30">
                  Stripe Escrow Assigned
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {simulatedResult.reason}
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-700/80">
              <div>
                <span className="text-slate-400 block">Stripe Card Fee:</span>
                <span className="font-mono text-slate-200">£{simulatedResult.stripeFee}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Airwallex Fee:</span>
                <span className="font-mono text-cyan-300 font-bold">£{simulatedResult.airwallexFee}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Fee Difference:</span>
                <span className="font-mono text-emerald-400 font-bold">+£{simulatedResult.savings} Saved</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Rules List */}
      <div id="mcp-rules-table-panel" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">Active Routing Rules Configuration</h2>
            <p className="text-xs text-slate-500 font-medium">Order of evaluation rules applied by the MCP router engine</p>
          </div>
        </div>

        <div className="space-y-3">
          {mcpRules.map((rule, idx) => (
            <div
              key={rule.id}
              id={`mcp-rule-row-${rule.id}`}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-500">#{rule.priority}</span>
                  <span className="font-black text-slate-900 text-sm">{rule.name}</span>
                  {rule.targetGateway === 'airwallex' ? (
                    <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-300">
                      Airwallex
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-300">
                      Stripe
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium">{rule.description}</p>
              </div>

              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    onChange={e => onToggleRule(rule.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0057B8]"></div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

