import React, { useState, useCallback, useMemo, useEffect } from "react";
import type { Experiment, CalculationBlock } from "./experiment.types";
import { 
  calculateAllValues, 
  calculateMarking,
  type InputValues,
  type CalculationResults 
} from "./CalculationEngine";
import { calculateExperiment11Feedback } from "./Experiment11Marking";
import WorksheetSection from "@/components/worksheets/WorksheetSection";
import { CheckCircle2, Hash, Lightbulb } from "lucide-react";




interface ExperimentRendererProps {
  experiment: Experiment;
}




export default function ExperimentRenderer({ experiment }: ExperimentRendererProps) {
  const [studentID, setStudentID] = useState("");
  const [inputValues, setInputValues] = useState<InputValues>({});
  const [submittedInputs, setSubmittedInputs] = useState<Record<string, boolean>>({});
  const [calcResults, setCalcResults] = useState<CalculationResults>({});
  const [userCalcValues, setUserCalcValues] = useState<Record<string, number>>({});
  const [submittedCalcValues, setSubmittedCalcValues] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, number>>({});




  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`experiment_${experiment.number}_data`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.studentID) setStudentID(parsed.studentID);
        if (parsed.inputValues) setInputValues(parsed.inputValues);
        if (parsed.submittedInputs) setSubmittedInputs(parsed.submittedInputs);
        if (parsed.userCalcValues) setUserCalcValues(parsed.userCalcValues);
        if (parsed.submittedCalcValues) setSubmittedCalcValues(parsed.submittedCalcValues);
        if (parsed.revealedHints) setRevealedHints(parsed.revealedHints);
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    }
  }, [experiment.number]);




  const handleInputChange = useCallback((inputId: string, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    setInputValues(prev => ({ ...prev, [inputId]: numValue }));
  }, []);




  const submitInput = useCallback((inputId: string) => {
    setSubmittedInputs(prev => ({
      ...prev,
      [inputId]: true
    }));
  }, []);




  const handleUserCalcChange = useCallback((inputId: string, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    setUserCalcValues(prev => ({
      ...prev,
      [inputId]: numValue !== undefined && !isNaN(numValue) ? numValue : 0
    }));
  }, []);




  const submitCalcValue = useCallback((inputId: string) => {
    setSubmittedCalcValues(prev => ({
      ...prev,
      [inputId]: true
    }));
  }, []);




  const revealHint = useCallback((calcLabel: string) => {
    setRevealedHints(prev => ({
      ...prev,
      [calcLabel]: (prev[calcLabel] || 0) + 1
    }));
  }, []);




  React.useEffect(() => {
    const results = calculateAllValues(experiment.sections, inputValues);
    setCalcResults(results);
  }, [inputValues, experiment.sections]);




  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    const dataToSave = {
      studentID,
      inputValues,
      submittedInputs,
      userCalcValues,
      submittedCalcValues,
      revealedHints,
      timestamp: Date.now()
    };
    
    localStorage.setItem(`experiment_${experiment.number}_data`, JSON.stringify(dataToSave));
    
    // Dispatch event to show saved indicator in WorksheetShell
    window.dispatchEvent(new CustomEvent(`experiment_${experiment.number}_saved`));
  }, [studentID, inputValues, submittedInputs, userCalcValues, submittedCalcValues, revealedHints, experiment.number]);




  const getCalcValue = useCallback((calc: CalculationBlock): number | null => {
    const key = calc.label
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "_");
    
    const value = calcResults[key];
    return value !== undefined && value !== null && !isNaN(value as number) ? value as number : null;
  }, [calcResults]);




  const getErrorStatus = (calc: CalculationBlock, value: number): "good" | "warning" | "error" => {
    if (calc.expectedValue === undefined) return "good";
    
    const tolerance = calc.tolerance ?? 0;
    const min = calc.expectedValue - tolerance;
    const max = calc.expectedValue + tolerance;
    
    if (value >= min && value <= max) return "good";
    
    const extendedMin = min - tolerance * 0.5;
    const extendedMax = max + tolerance * 0.5;
    
    if (value >= extendedMin && value <= extendedMax) return "warning";
    return "error";
  };




  const calculateHintDeduction = useCallback((calcLabel: string): number => {
    const hintsRevealed = revealedHints[calcLabel] || 0;
    return hintsRevealed * 0.25; // Deduct 0.25 marks per hint
  }, [revealedHints]);




  const genericMarking = useMemo(() => {
    const baseMarking = calculateMarking(inputValues, calcResults);
    
    // Calculate total hint deductions
    let totalDeduction = 0;
    Object.entries(revealedHints).forEach(([calcLabel, hintsCount]) => {
      totalDeduction += hintsCount * 0.25;
    });
    
    return {
      ...baseMarking,
      hintDeduction: totalDeduction,
      calculationMarks: Math.max(0, (baseMarking.calculationMarks ?? 0) - totalDeduction)
    };
  }, [inputValues, calcResults, revealedHints]);




  const experiment11Marking = useMemo(() => {
    if (experiment.number !== 11) {
      return { accuracyMarks: 0, dataQualityScore: 0, feedback: [] as string[] };
    }
    
    const filteredCalculations: Record<string, number> = {};
    for (const [key, value] of Object.entries(calcResults)) {
      if (value !== undefined && !isNaN(value)) {
        filteredCalculations[key] = value;
      }
    }
    
    return calculateExperiment11Feedback(filteredCalculations);
  }, [experiment.number, calcResults]);




  const totalAccuracyMarks = (genericMarking.accuracyMarks ?? 0) + (experiment11Marking.accuracyMarks ?? 0);
  const totalDataQualityScore = Math.min((genericMarking.dataQualityScore ?? 0) + (experiment11Marking.dataQualityScore ?? 0), 100);
  const totalMarks = Math.min((genericMarking.calculationMarks ?? 0) + totalAccuracyMarks, 5);
  const allFeedback = [...(genericMarking.feedback ?? []), ...(experiment11Marking.feedback ?? [])];




  const evaluateCondition = (condition: string, inputs: InputValues, calculations: CalculationResults): boolean => {
    try {
      const context: Record<string, number> = {};
      for (const [key, value] of Object.entries({ ...inputs, ...calculations })) {
        if (value !== undefined && !isNaN(value)) {
          context[key] = value;
        }
      }
      
      let expression = condition;
      const sortedKeys = Object.keys(context).sort((a, b) => b.length - a.length);
      
      for (const key of sortedKeys) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escapedKey}\\b`, "g");
        expression = expression.replace(regex, String(context[key]));
      }
      
      const result = Function(`"use strict"; return (${expression})`)();
      return typeof result === "boolean" ? result : false;
    } catch {
      return false;
    }
  };




  const isSectionCompleted = (section: Experiment["sections"][number]): boolean => {
    const inputs = section.inputs ?? [];
    const allInputsFilled = inputs.length === 0 || inputs.every(input => 
      submittedInputs[input.id] === true &&
      inputValues[input.id] !== undefined && 
      inputValues[input.id] !== null && 
      !isNaN(inputValues[input.id] as number)
    );
    
    const calculations = section.calculations ?? [];
    const userCalculations = calculations.filter(calc => calc.userEnters === true);
    const allCalcsFilled = userCalculations.length === 0 || userCalculations.every(calc => 
      calc.userInputId && 
      submittedCalcValues[calc.userInputId] === true &&
      userCalcValues[calc.userInputId] !== undefined && 
      userCalcValues[calc.userInputId] !== null
    );
    
    return allInputsFilled && allCalcsFilled;
  };



return (
  <div id="experiment-content" className="max-w-6xl mx-auto p-6">
      {/* Student ID Section */}
      <div className="mb-8 border-l-4 border-teal-700 p-5 bg-slate-50">
        <h2 className="text-base font-semibold text-slate-900 mb-3">
          Student ID
        </h2>
        <div>
          <input
            type="text"
            value={studentID}
            onChange={(e) => setStudentID(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-teal-700 focus:border-teal-700 text-sm"
            placeholder="Enter your student ID"
          />
          <p className="mt-2 text-xs text-slate-600">
            Your student ID will appear on the exported PDF
          </p>
        </div>
      </div>
      
      {experiment.sections.map((section) => (
        <WorksheetSection
            key={section.sectionNumber}
            sectionNumber={section.sectionNumber}
            title={section.title}
            description={section.description}
            completed={isSectionCompleted(section)}
            accentColor="cyan"
        >
          {section.inputs && section.inputs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-700 mb-4">Measurements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.inputs.map((input) => {
                  const isSubmitted = submittedInputs[input.id] === true;
                  
                  return (
                    <div key={input.id} className="bg-slate-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {input.label}
                        {isSubmitted && (
                          <CheckCircle2 className="ml-2 h-4 w-4 text-green-600 inline" />
                        )}
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="0.01"
                          value={inputValues[input.id] ?? ""}
                          onChange={(e) => handleInputChange(input.id, e.target.value)}
                          onBlur={() => submitInput(input.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            isSubmitted ? 'border-green-500 bg-green-50' : 'border-slate-300'
                          }`}
                          placeholder={`Enter ${input.label}`}
                        />
                        <span className="ml-2 text-sm text-slate-600 whitespace-nowrap">{input.unit}</span>
                      </div>
                      {input.hint && (
                        <p className="mt-2 text-xs text-slate-500">{input.hint}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}




          {section.calculations && section.calculations.length > 0 && (
<div className="mb-6">
  <h3 className="text-lg font-medium text-slate-700 mb-4">Calculations</h3>
  <div className="space-y-4">
    {section.calculations.map((calc, i) => {
      const expectedValue = getCalcValue(calc);
      const userValue = calc.userInputId ? userCalcValues[calc.userInputId] : null;
      const hasSubmitted = calc.userInputId ? submittedCalcValues[calc.userInputId] : false;
      const percentError = userValue !== null && userValue !== undefined && expectedValue !== null && expectedValue !== undefined 
        ? Math.abs((userValue - expectedValue) / expectedValue) * 100 
        : null;
      const errorStatus = userValue !== null && userValue !== undefined && expectedValue !== null && expectedValue !== undefined
        ? getErrorStatus(calc, userValue) 
        : "good";
      const isUserCalculation = calc.userEnters === true;
      const calcKey = calc.label;
      const hintsRevealed = revealedHints[calcKey] || 0;
      const hintDeduction = calculateHintDeduction(calcKey);


      return (
        <div key={i} className="bg-slate-50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-800 mb-2">{calc.label}</h4>
          
          {isUserCalculation ? (
            <>
              <div className="flex items-center mb-3">
                <input
                  type="number"
                  step="0.001"
                  value={userValue ?? ""}
                  onChange={(e) => handleUserCalcChange(calc.userInputId!, e.target.value)}
                  onBlur={() => submitCalcValue(calc.userInputId!)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    hasSubmitted ? 'border-green-500 bg-green-50' : 'border-slate-300'
                  }`}
                  placeholder="Enter your calculation"
                />
                <span className="ml-2 text-sm text-slate-600 whitespace-nowrap">{calc.outputUnit}</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">{calc.explanation}</p>
            </>
          ) : (
            <p className="text-sm text-slate-600 mb-3">{calc.explanation}</p>
          )}


          {hasSubmitted && userValue !== null && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-medium ${
                  errorStatus === "good" ? "text-green-700" : 
                  errorStatus === "warning" ? "text-amber-700" : "text-red-700"
                }`}>
                  {errorStatus === "good" ? "✓" : errorStatus === "warning" ? "⚠" : "✗"}{" "}
                  Your calculation checked
                </p>
                {hintsRevealed > 0 && (
                  <p className="text-xs text-orange-600 font-semibold">
                    -{hintDeduction.toFixed(2)} marks (hints)
                  </p>
                )}
              </div>
              
              <div className={`mt-2 text-sm space-y-1 p-3 rounded-lg ${
                errorStatus === "good" ? "bg-green-50 border border-green-200" : 
                errorStatus === "warning" ? "bg-amber-50 border border-amber-200" : 
                "bg-red-50 border border-red-200"
              }`}>
                {isUserCalculation && (
                  <p className="text-slate-700">
                    Your value: <span className="font-bold">{userValue.toFixed(3)}{calc.outputUnit}</span>
                  </p>
                )}
                {expectedValue !== null && (
                  <p className="text-slate-700">
                    Expected: <span className="font-bold">{expectedValue.toFixed(3)}{calc.outputUnit}</span>
                  </p>
                )}
                {percentError !== null && (
                  <p className={`font-medium ${
                    errorStatus === "good" ? "text-green-700" : 
                    errorStatus === "warning" ? "text-amber-700" : "text-red-700"
                  }`}>
                    {percentError.toFixed(1)}% difference
                  </p>
                )}
              </div>


              {/* Progressive Hints */}
              {errorStatus !== "good" && (
                <div className="mt-3">
                  <button
                    onClick={() => revealHint(calcKey)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    <Lightbulb className="h-3 w-3" />
                    Need a hint? {hintsRevealed > 0 ? `(Level ${hintsRevealed + 1})` : ''}
                  </button>
                  
                  {hintsRevealed >= 1 && (
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-blue-900 mb-1">Hint 1:</p>
                      <p className="text-blue-800">Check your units and make sure they match the expected output.</p>
                    </div>
                  )}
                  
                  {hintsRevealed >= 2 && (
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-blue-900 mb-1">Hint 2:</p>
                      <p className="text-blue-800">Did you convert all values to the correct units before calculating?</p>
                    </div>
                  )}
                  
                  {hintsRevealed >= 3 && (
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-blue-900 mb-1">Hint 3:</p>
                      <p className="text-blue-800">Double-check your formula: {calc.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      );
    })}
  </div>
</div>
)}


          {section.warnings && section.warnings.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-slate-700 mb-4">Warnings</h3>
              {section.warnings.map((warning, i) => {
                const conditionMet = evaluateCondition(warning.condition, inputValues, calcResults);
                
                return conditionMet ? (
                  <div
                    key={i}
                    className={`p-4 rounded-lg mb-2 ${
                      warning.severity === "error"
                        ? "bg-red-100 border border-red-400 text-red-700"
                        : "bg-amber-100 border border-amber-400 text-amber-700"
                    }`}
                  >
                    {warning.message}
                  </div>
                ) : null;
              })}
            </div>
          )}
        </WorksheetSection>
      ))}




      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-md p-6 border-2 border-blue-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Automatic Marking & Data Quality</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Total Marks</p>
            <p className="text-3xl font-bold text-blue-600">{totalMarks.toFixed(1)} / 5</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Calculation Marks</p>
            <p className="text-2xl font-semibold text-green-600">{(genericMarking.calculationMarks ?? 0).toFixed(1)} / 3</p>
            {genericMarking.hintDeduction && genericMarking.hintDeduction > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                (Hint deductions: -{genericMarking.hintDeduction.toFixed(2)})
              </p>
            )}
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Accuracy Marks</p>
            <p className="text-2xl font-semibold text-purple-600">{totalAccuracyMarks.toFixed(1)} / 2</p>
          </div>
        </div>




        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-700 font-medium">Data Quality Score</span>
            <span className="text-slate-700 font-semibold">{totalDataQualityScore.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${totalDataQualityScore}%` }}
            ></div>
          </div>
        </div>




        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-3">Feedback</h3>
          <div className="space-y-2">
            {allFeedback.length > 0 ? (
              allFeedback.map((item, i) => (
                <p key={i} className="text-sm text-slate-700 flex items-start">
                  <span className="mr-2">{item.charAt(0)}</span>
                  <span>{item.substring(1)}</span>
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">
                Your progress is automatically saved. Enter all measurements and press Enter to log each value.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}