import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  ShieldAlert,
  Users,
  GraduationCap,
  Activity,
  Radio,
  Send,
} from 'lucide-react';

interface PendingExpert {
  id: string;
  name: string;
  specialty: string;
  institution: string;
  experience: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export const AdminDashboardPage: React.FC = () => {
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastDistrict, setBroadcastDistrict] = useState('All Districts');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const [experts, setExperts] = useState<PendingExpert[]>([
    {
      id: 'e1',
      name: 'Dr. Rajesh Patil',
      specialty: 'Soil Science & Nutrient Management',
      institution: 'PDKV Akola Agriculture University',
      experience: '12 years',
      status: 'Pending',
    },
    {
      id: 'e2',
      name: 'Er. Sneha Kulkarni',
      specialty: 'Micro-Irrigation & Automation',
      institution: 'College of Agriculture, Pune',
      experience: '8 years',
      status: 'Pending',
    },
    {
      id: 'e3',
      name: 'Dr. Anita Deshmukh',
      specialty: 'Crop Pathology & Fungal Diseases',
      institution: 'ICAR National Research Centre',
      experience: '15 years',
      status: 'Approved',
    },
  ]);

  const handleApprove = (id: string) => {
    setExperts((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'Approved' } : e))
    );
  };

  const handleReject = (id: string) => {
    setExperts((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'Rejected' } : e))
    );
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastModalOpen(false);
      setBroadcastMessage('');
      alert(`Emergency alert broadcasted via SMS and App Notification to 1,240 farmers in ${broadcastDistrict}!`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Admin Management Console
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              District Agricultural System Oversight & Expert Verification
            </p>
          </div>

          <Button
            onClick={() => setBroadcastModalOpen(true)}
            variant="danger"
            size="sm"
            icon={<Radio className="w-4 h-4 animate-pulse" />}
          >
            Emergency Weather Broadcast
          </Button>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top 4 System Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <Users className="w-4 h-4 text-krishi-700" />
                <span>Onboarded Farmers</span>
              </div>
              <div className="text-3xl font-black text-gray-900 mt-2">1,240</div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">+142 this week</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <GraduationCap className="w-4 h-4 text-krishi-700" />
                <span>Verified Agronomists</span>
              </div>
              <div className="text-3xl font-black text-gray-900 mt-2">48</div>
              <p className="text-[11px] text-gray-500 mt-1">2 applications pending</p>
            </Card>

            <Card className="p-5 border-amber-200 bg-amber-50/20">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase">
                <Activity className="w-4 h-4 text-amber-600" />
                <span>Active Triage Cases</span>
              </div>
              <div className="text-3xl font-black text-amber-900 mt-2">24</div>
              <p className="text-[11px] text-amber-700 font-semibold mt-1">3 flagged high severity</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <Radio className="w-4 h-4 text-krishi-700" />
                <span>Data Ingestion</span>
              </div>
              <div className="text-3xl font-black text-emerald-700 mt-2">99.8%</div>
              <p className="text-[11px] text-gray-500 mt-1">Sentinel-2 & IMD Radars online</p>
            </Card>
          </div>

          {/* District Crop Distress Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">District Crop Health Heatmap</h3>
                <p className="text-xs text-gray-500">Live monitoring of regional agro-climatic clusters</p>
              </div>
              <span className="text-xs font-bold text-gray-500 bg-earth-100 px-3 py-1 rounded-full">
                Vidarbha Zone
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-emerald-900">Nagpur (Saoner)</span>
                  <span className="text-emerald-700 bg-white px-2 py-0.5 rounded shadow-2xs">84 / 100</span>
                </div>
                <div className="text-xs text-gray-600 mt-2">Crop: Soybean Flowering</div>
                <span className="inline-block mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Status: Optimal
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-amber-900">Wardha</span>
                  <span className="text-amber-800 bg-white px-2 py-0.5 rounded shadow-2xs">71 / 100</span>
                </div>
                <div className="text-xs text-gray-600 mt-2">Crop: Cotton Vegetative</div>
                <span className="inline-block mt-2 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Moisture Stress (32%)
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-red-200 bg-red-50/40">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-red-900">Amravati</span>
                  <span className="text-red-700 bg-white px-2 py-0.5 rounded shadow-2xs">68 / 100</span>
                </div>
                <div className="text-xs text-gray-600 mt-2">Crop: Soybean / Tur</div>
                <span className="inline-block mt-2 text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                  Anthracnose Outbreak
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-emerald-900">Yavatmal</span>
                  <span className="text-emerald-700 bg-white px-2 py-0.5 rounded shadow-2xs">79 / 100</span>
                </div>
                <div className="text-xs text-gray-600 mt-2">Crop: Cotton & Soybean</div>
                <span className="inline-block mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Status: Good
                </span>
              </div>
            </div>
          </Card>

          {/* Pending Agronomist Verifications */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Agronomist Credential Verification</h3>
                <p className="text-xs text-gray-500">Authenticate ICAR / State Agriculture University scientist applicants</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-earth-200 text-xs font-bold text-gray-400 uppercase">
                    <th className="py-3 px-4">Expert Name</th>
                    <th className="py-3 px-4">Specialization</th>
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">Experience</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-earth-100">
                  {experts.map((exp) => (
                    <tr key={exp.id} className="hover:bg-earth-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{exp.name}</td>
                      <td className="py-3.5 px-4 text-gray-700">{exp.specialty}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">{exp.institution}</td>
                      <td className="py-3.5 px-4 text-gray-700">{exp.experience}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            exp.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-800'
                              : exp.status === 'Rejected'
                              ? 'bg-red-50 text-red-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {exp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {exp.status === 'Pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApprove(exp.id)}
                              className="text-xs px-2.5 py-1"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(exp.id)}
                              className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      <MobileBottomNav />

      {/* Emergency Broadcast Modal */}
      <Modal
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        title="Broadcast Emergency Agro-Weather Alert"
      >
        <form onSubmit={handleSendBroadcast} className="space-y-4 text-sm text-gray-700">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Select Target District
            </label>
            <select
              value={broadcastDistrict}
              onChange={(e) => setBroadcastDistrict(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="All Districts">All Districts (1,240 farmers)</option>
              <option value="Nagpur">Nagpur District</option>
              <option value="Wardha">Wardha District</option>
              <option value="Amravati">Amravati District</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Emergency Message (Dispatched via SMS & Voice Call)
            </label>
            <textarea
              rows={3}
              required
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="e.g. Warning: Heavy hail storm predicted between 2 PM - 5 PM today. Halt harvesting and cover vulnerable open grain bags..."
              className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-earth-100">
            <Button
              variant="ghost"
              size="md"
              type="button"
              onClick={() => setBroadcastModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              type="submit"
              disabled={broadcastSent || !broadcastMessage.trim()}
              icon={<Send className="w-4 h-4" />}
            >
              {broadcastSent ? 'Transmitting to Cell Towers...' : 'Dispatch Broadcast'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
