import React from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  icon: string;
  phase?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  subtitle,
  icon,
  phase = 'Phase 2',
}) => {
  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-1.5 rounded-xl text-gray-600 hover:bg-earth-100 flex items-center gap-1 text-sm font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider bg-earth-100 text-earth-800 px-3 py-1 rounded-full">
            {phase} Roadmap
          </span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full flex-1 flex items-center justify-center">
          <Card className="text-center p-8 sm:p-12 w-full max-w-lg shadow-soft-lg space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-krishi-50 text-krishi-700 flex items-center justify-center mx-auto text-4xl shadow-inner">
              {icon}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              <span>Coming in the next phase</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {title}
            </h2>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md mx-auto">
              {subtitle}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/dashboard">
                <Button variant="primary" size="md">
                  Go to Farmer Dashboard
                </Button>
              </Link>
              <Link to="/problem">
                <Button variant="outline" size="md">
                  Report a Field Problem
                </Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
