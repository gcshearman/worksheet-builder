import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, FlaskConical, CheckCircle2, Trash2, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";


interface WorksheetShellProps {
  title: string;
  practicalType: string;
  experimentNumber: number;
  completionPercentage: number;
  completedSections: number;
  totalSections: number;
  onExportPDF?: () => void;
  children: ReactNode;
}


export default function WorksheetShell({
  title,
  practicalType,
  experimentNumber,
  completionPercentage,
  completedSections,
  totalSections,
  onExportPDF,
  children,
}: WorksheetShellProps) {
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [darkMode, setDarkMode] = useState(false);


  // Load dark mode preference from localStorage on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);


  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("darkMode", "true");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("darkMode", "false");
      }
      return newMode;
    });
  }, []);


  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`experiment_${experimentNumber}_data`);
    if (savedData) {
      try {
        JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse saved data:', e);
      }
    }
  }, [experimentNumber]);


  // Show saved indicator when changes are detected (via custom event)
  useEffect(() => {
    const handleSaveEvent = () => {
      setShowSavedIndicator(true);
      const timer = setTimeout(() => setShowSavedIndicator(false), 2000);
      return () => clearTimeout(timer);
    };
    
    window.addEventListener(`experiment_${experimentNumber}_saved`, handleSaveEvent);
    return () => window.removeEventListener(`experiment_${experimentNumber}_saved`, handleSaveEvent);
  }, [experimentNumber]);


  // Clear all data function
  const clearAllData = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all your progress? This cannot be undone.')) {
      localStorage.removeItem(`experiment_${experimentNumber}_data`);
      window.dispatchEvent(new Event('storage'));
      alert('Progress cleared. Please refresh the page to see the changes.');
    }
  }, [experimentNumber]);


  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b ${darkMode ? 'border-slate-700 bg-slate-900/90' : 'border-cyan-900/30 bg-slate-900/85'} backdrop-blur-md text-white shadow-sm`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-cyan-500/20 p-3">
              <FlaskConical className="h-8 w-8 text-cyan-300" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                {practicalType}
              </p>
              <h1 className="text-2xl font-bold md:text-3xl tracking-tight">
              Experiment {experimentNumber}
              </h1>
            </div>
          </div>


          <div className="flex flex-col gap-3 md:min-w-[320px]">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Worksheet Completion</span>
              <span>
                {completedSections}/{totalSections} sections
              </span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </div>


          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="rounded-2xl bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 hover:bg-cyan-400 transition"
            >
              <Download className="mr-2 inline h-5 w-5" />
              Export PDF
              </button>
          )}
        </div>
      </header>


      {/* Main Layout */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-semibold transition shadow-md ${
              darkMode 
                ? 'bg-yellow-500 text-slate-900 hover:bg-yellow-400' 
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <>
                <Sun className="h-4 w-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
          
          {/* Auto-save indicator */}
          {showSavedIndicator && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-purple-500 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-lg"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Saved</span>
            </motion.div>
          )}
          
          {/* Clear progress button */}
          <button
            onClick={clearAllData}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-orange-400 transition shadow-md"
            title="Clear all progress"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear Progress</span>
          </button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className={`rounded-3xl border-none shadow-md ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}`}>
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Progress Overview
                </h2>


                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-green-50 p-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-slate-600">Current Progress</p>
                    <p className="text-xl font-bold text-slate-900">
                      {completionPercentage}%
                    </p>
                  </div>
                </div>


                <ul className="space-y-3 text-sm text-slate-700">
                  <li>• Enter experimental data accurately</li>
                  <li>• Complete calculations stepwise</li>
                  <li>• Review graph outputs</li>
                  <li>• Export completed worksheet</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>


          <Card className={`rounded-3xl border-none shadow-md ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}`}>
            <CardContent className="p-6">
              <h2 className="mb-3 text-lg font-semibold">Practical Guidance</h2>
              <p className="text-sm leading-relaxed">
                Ensure all measurements are recorded to appropriate precision,
                concordant values are identified correctly, and calculations are
                clearly evidenced for full marks.
              </p>
            </CardContent>
          </Card>
        </aside>


        {/* Worksheet Content */}
        <main>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className={`mb-8 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} pb-6`}>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            {practicalType}
            </p>


            <h1 className="mt-2 text-3xl font-bold">
            {title}
          </h1>
          </div>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}