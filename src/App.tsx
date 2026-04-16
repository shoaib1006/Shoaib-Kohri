/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Badge } from './components/ui/badge';
import BookingSystem from './components/BookingSystem';
import Dashboard from './components/Dashboard';
import LoyaltyProfile from './components/LoyaltyProfile';
import { Button } from './components/ui/button';
import { LayoutDashboard, Calendar, Trophy, MessageSquare, Award, Settings, Menu, X } from 'lucide-react';
import { seedData } from './lib/seed';

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [view, setView] = useState<'booking' | 'admin' | 'loyalty'>('booking');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    seedData();
  }, []);

  const NavItems = () => (
    <>
      <button 
        onClick={() => { setView('booking'); setIsMobileMenuOpen(false); }}
        className={`w-full px-6 py-4 lg:py-3 text-sm font-bold flex items-center gap-3 transition-all min-h-[44px] ${view === 'booking' ? 'text-blue-900 bg-yellow-400 border-l-4 border-white shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'}`}
      >
        <Calendar className={`w-4 h-4 ${view === 'booking' ? 'text-blue-900' : ''}`} />
        Live Bookings
      </button>
      <button 
        onClick={() => { setView('loyalty'); setIsMobileMenuOpen(false); }}
        className={`w-full px-6 py-4 lg:py-3 text-sm font-bold flex items-center gap-3 transition-all min-h-[44px] ${view === 'loyalty' ? 'text-blue-900 bg-yellow-400 border-l-4 border-white shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'}`}
      >
        <Award className={`w-4 h-4 ${view === 'loyalty' ? 'text-blue-900' : ''}`} />
        Loyalty Rewards
      </button>
      <button 
        onClick={() => { setView('admin'); setIsMobileMenuOpen(false); }}
        className={`w-full px-6 py-4 lg:py-3 text-sm font-bold flex items-center gap-3 transition-all min-h-[44px] ${view === 'admin' ? 'text-blue-900 bg-yellow-400 border-l-4 border-white shadow-lg' : 'text-white/90 hover:text-white hover:bg-white/10'}`}
      >
        <LayoutDashboard className={`w-4 h-4 ${view === 'admin' ? 'text-blue-900' : ''}`} />
        Admin Dashboard
      </button>
      <div className="px-6 py-4 lg:py-3 text-sm font-bold flex items-center gap-3 text-white/30 cursor-not-allowed min-h-[44px]">
        <MessageSquare className="w-4 h-4" />
        Omni-Channel Feed
      </div>
    </>
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col lg:flex-row min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-gradient-to-r from-sidebar to-[#1e40af] text-sidebar-foreground flex items-center justify-between px-6 shrink-0 z-50 sticky top-0 shadow-md">
          <div className="flex items-center gap-2.5 font-extrabold text-sm tracking-tight">
            <div className="w-7 h-7 bg-yellow-400 rounded flex items-center justify-center shadow-md">
              <Trophy className="w-4 h-4 text-blue-900" />
            </div>
            ROYAL TURF & ACADEMY
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-sidebar z-40 pt-20 flex flex-col animate-in fade-in slide-in-from-top-4 duration-300">
            <nav className="flex-1">
              <NavItems />
            </nav>
            <div className="p-6 border-t border-white/10">
              <div className="flex items-center gap-3 opacity-70 text-sm min-h-[44px]">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-[240px] bg-gradient-to-b from-sidebar to-[#1e40af] text-sidebar-foreground flex-col py-6 shrink-0 sticky top-0 h-screen shadow-2xl">
          <div className="px-6 mb-8 flex items-center gap-2.5 font-extrabold text-lg tracking-tight">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
              <Trophy className="w-5 h-5 text-blue-900" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">THE ROYAL TURF & ACADEMY</span>
          </div>
          
          <nav className="flex-1">
            <NavItems />
          </nav>

          <div className="px-6 py-3 text-sm flex items-center gap-3 opacity-70 mt-auto cursor-not-allowed min-h-[44px]">
            <Settings className="w-4 h-4" />
            Settings
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <header className="hidden lg:flex h-16 bg-white border-b items-center justify-between px-8 shrink-0">
            <h2 className="text-xl font-bold text-foreground">
              {view === 'booking' ? 'Booking Intelligence' : view === 'admin' ? 'Admin Dashboard' : 'Loyalty Program'}
            </h2>
            <div className="flex items-center gap-4">
              <Badge className="bg-red-100 text-red-600 border-none font-bold text-[10px] px-2 py-0.5">
                ● 4 LIVE SESSIONS
              </Badge>
              <div className="w-8 h-8 rounded-full bg-slate-300" />
            </div>
          </header>

          {/* Mobile View Title (shown only on mobile) */}
          <div className="lg:hidden px-6 pt-6 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-foreground">
              {view === 'booking' ? 'Booking Intelligence' : view === 'admin' ? 'Admin Dashboard' : 'Loyalty Program'}
            </h2>
            <Badge className="bg-red-100 text-red-600 border-none font-bold text-[9px] px-2 py-0.5">
              ● 4 LIVE
            </Badge>
          </div>

          <main className="flex-1 overflow-x-hidden p-4 lg:p-8">
            <div className="max-w-[1200px] mx-auto w-full">
              {view === 'booking' ? <BookingSystem /> : view === 'admin' ? <Dashboard /> : <LoyaltyProfile />}
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

