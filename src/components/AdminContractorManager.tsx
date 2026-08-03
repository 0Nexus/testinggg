import React, { useState, useEffect } from 'react';
import { VettedContractor } from '../types';
import { Plus, UserCheck, Shield, Award, Star, Phone, Mail, Clock, MapPin, Edit3, Check, Trash2, Globe } from 'lucide-react';
import { WebContractorDiscoveryModal } from './WebContractorDiscoveryModal';

export const AdminContractorManager: React.FC = () => {
  const [contractors, setContractors] = useState<VettedContractor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showWebDiscoveryModal, setShowWebDiscoveryModal] = useState<boolean>(false);

  // New Contractor Form State
  const [formData, setFormData] = useState<Partial<VettedContractor>>({
    name: '',
    companyName: '',
    tradeType: 'Emergency Plumbing, Boilers & Water Leaks',
    hourlyRateGBP: 80,
    fixedQuoteEstimateGBP: 500,
    availability: 'Immediate (Within 2 hrs)',
    phone: '+44 20 7946 0999',
    email: '',
    certifications: ['Gas Safe Registered', 'TrustMark Approved'],
    bio: '',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewCount: 50,
    completedJobsCount: 100,
    distanceMiles: 2.5
  });

  const [certInput, setCertInput] = useState('');

  const fetchContractors = () => {
    setIsLoading(true);
    fetch('/api/contractors')
      .then(res => res.json())
      .then(data => {
        setContractors(data);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleSaveContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchContractors();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-[#0057B8]/10 text-[#0057B8] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Shield className="h-3.5 w-3.5" />
            <span>Admin Portal Database</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">External Vetted Contractors Database</h1>
          <p className="text-slate-500 text-xs mt-1">Manage, add, and seed pre-vetted specialists suggested by the AI agent to homeowners.</p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowWebDiscoveryModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-3 rounded-2xl text-xs flex items-center space-x-2 shadow-md transition-all border border-slate-700"
          >
            <Globe className="h-4 w-4 text-cyan-400" />
            <span>Scrape Online &amp; Invite (Google)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#0057B8] hover:bg-blue-700 text-white font-black px-5 py-3 rounded-2xl text-xs flex items-center space-x-2 shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Contractor</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">Loading contractor database...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contractors.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img src={c.avatarUrl} alt={c.name} className="h-12 w-12 rounded-xl object-cover border border-slate-200" />
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{c.name}</h3>
                    <span className="text-xs text-slate-500 font-bold block">{c.companyName}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 font-mono block">£{c.hourlyRateGBP}/hr</span>
                  <span className="text-[10px] text-slate-400">Fixed: ~£{c.fixedQuoteEstimateGBP}</span>
                </div>
              </div>

              <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Trade Category:</span>
                  <span className="text-[#0057B8]">{c.tradeType}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Rating / Reviews:</span>
                  <span className="font-bold flex items-center space-x-1">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span>{c.rating} ({c.reviewCount} reviews &bull; {c.completedJobsCount} jobs)</span>
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Availability:</span>
                  <span className="font-bold text-emerald-600">{c.availability}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {c.certifications.map((cert, idx) => (
                  <span key={idx} className="bg-blue-50 text-[#0057B8] text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">Add External Vetted Contractor</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveContractor} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contractor Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#0057B8]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Trade Name</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#0057B8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trade Specialty</label>
                  <input
                    type="text"
                    required
                    value={formData.tradeType}
                    onChange={e => setFormData({ ...formData, tradeType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#0057B8]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hourly Rate (£)</label>
                  <input
                    type="number"
                    required
                    value={formData.hourlyRateGBP}
                    onChange={e => setFormData({ ...formData, hourlyRateGBP: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#0057B8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trade Certifications (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Gas Safe Registered, NICEIC Approved, RICS Surveyor"
                  value={formData.certifications?.join(', ')}
                  onChange={e => setFormData({ ...formData, certifications: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#0057B8]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bio / Profile Description</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#0057B8]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0057B8] hover:bg-blue-700 text-white font-black py-3 rounded-2xl shadow-lg transition-all"
              >
                Save Contractor to Database
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Web Contractor Discovery Modal */}
      <WebContractorDiscoveryModal
        isOpen={showWebDiscoveryModal}
        onClose={() => {
          setShowWebDiscoveryModal(false);
          fetchContractors();
        }}
        initialTradeCategory="Emergency Plumbing, Boilers & Water Leaks"
        initialLocation="Greater London & UK Region"
      />
    </div>
  );
};
