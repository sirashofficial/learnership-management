'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, Circle, AlertCircle, TrendingUp, Book, Award } from 'lucide-react';
import { formatGroupNameDisplay } from '@/lib/groupName';

interface UnitStandardData {
  code: string;
  title: string;
  credits: number;
  moduleNumber: number;
}

interface LearnerAssessmentData {
  formative1Completed: boolean;
  formative1Date?: string;
  formative2Completed: boolean;
  formative2Date?: string;
  formative3Completed: boolean;
  formative3Date?: string;
  summativeCompleted: boolean;
  summativeDate?: string;
  summativeResult?: 'PASS' | 'FAIL' | 'PENDING';
  summativeMarks?: number;
  workplaceActivityCompleted: boolean;
  workplaceActivityDate?: string;
  workplaceActivityPeriodStart?: string;
  workplaceActivityPeriodEnd?: string;
  workplaceAssessor?: string;
  workplaceResult?: 'COMPETENT' | 'NOT_YET_COMPETENT' | 'PENDING';
}

interface ModuleWorkplaceActivityData {
  activityPeriodStart?: string;
  activityPeriodEnd?: string;
  completed: boolean;
  assessmentDate?: string;
  result?: 'COMPETENT' | 'NOT_YET_COMPETENT' | 'PENDING';
  assessor?: string;
}

interface LearnerAssessmentTrackerProps {
  learnerName: string;
  learnerEmail?: string;
  groupName: string;
  startDate: string;
  modules: any[];
  assessmentData?: Record<string, LearnerAssessmentData>;
  workplaceActivityData?: Record<number, ModuleWorkplaceActivityData>;
  totalCredits?: number;
}

export default function LearnerAssessmentTracker({
  learnerName,
  learnerEmail,
  groupName,
  startDate,
  modules,
  assessmentData = {},
  workplaceActivityData = {},
  totalCredits = 140,
}: LearnerAssessmentTrackerProps) {
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [expandedUnitStandards, setExpandedUnitStandards] = useState<string[]>([]);

  // Calculate overall progress
  const progress = useMemo(() => {
    let completedCredits = 0;
    let totalModuleCredits = 0;

    modules.forEach((module) => {
      totalModuleCredits += module.credits;

      // Check if all activities in module are completed
      const moduleWorkplaceActivity = workplaceActivityData[module.moduleNumber];
      if (moduleWorkplaceActivity?.completed) {
        completedCredits += module.credits;
      }
    });

    return {
      creditsEarned: completedCredits,
      creditsTotal: totalModuleCredits || totalCredits,
      percentage: Math.round((completedCredits / (totalModuleCredits || totalCredits)) * 100),
    };
  }, [modules, workplaceActivityData, totalCredits]);

  // Get module status
  const getModuleStatus = (moduleNumber: number) => {
    const moduleWorkplaceActivity = workplaceActivityData[moduleNumber];
    
    if (!moduleWorkplaceActivity) {
      return { status: 'NOT_STARTED', label: 'Not Started', color: 'bg-slate-100 text-slate-700' };
    }
    
    if (moduleWorkplaceActivity.completed) {
      if (moduleWorkplaceActivity.result === 'COMPETENT') {
        return { status: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-700' };
      }
    }
    
    return { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-700' };
  };

  const toggleModule = (moduleNumber: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleNumber)
        ? prev.filter(m => m !== moduleNumber)
        : [...prev, moduleNumber]
    );
  };

  const toggleUnitStandard = (unitStandardCode: string) => {
    setExpandedUnitStandards(prev =>
      prev.includes(unitStandardCode)
        ? prev.filter(u => u !== unitStandardCode)
        : [...prev, unitStandardCode]
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{learnerName}</h1>
        {learnerEmail && (
          <p className="text-slate-600 dark:text-slate-400">{learnerEmail}</p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-600 dark:text-slate-400">Group</p>
            <p className="font-semibold text-slate-900 dark:text-white">{formatGroupNameDisplay(groupName)}</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400">Start Date</p>
            <p className="font-semibold text-slate-900 dark:text-white">{startDate}</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400">Overall Progress</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {progress.creditsEarned}/{progress.creditsTotal} credits
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Qualification Progress
          </h2>
          <span className="text-2xl font-bold text-indigo-600">{progress.percentage}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {progress.creditsEarned} of {progress.creditsTotal} credits completed
        </p>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Book className="w-6 h-6 text-indigo-600" />
          Modules ({modules.length} total)
        </h2>

        {modules.map((module) => {
          const isExpanded = expandedModules.includes(module.moduleNumber);
          const { status, label, color } = getModuleStatus(module.moduleNumber);
          const moduleWorkplaceActivity = workplaceActivityData[module.moduleNumber];

          return (
            <div key={module.moduleNumber} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.moduleNumber)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-600 dark:text-slate-400">
                      MODULE {module.moduleNumber}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {module.name}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${color}`}>
                    {label}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {module.credits} credits
                  </span>
                </div>
              </button>

              {/* Module Content */}
              {isExpanded && (
                <div className="p-6 bg-white dark:bg-slate-800 space-y-6">
                  {/* Unit Standards */}
                  {module.unitStandards && module.unitStandards.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Unit Standards ({module.unitStandards.length})
                      </h4>
                      {module.unitStandards.map((unitStandard: any) => {
                        const isUnitExpanded = expandedUnitStandards.includes(unitStandard.code);
                        const unitAssessmentData = assessmentData[unitStandard.code];

                        return (
                          <div key={unitStandard.code} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                            {/* Unit Standard Summary */}
                            <button
                              onClick={() => toggleUnitStandard(unitStandard.code)}
                              className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between text-left"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                  {unitStandard.code}
                                </span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  {unitStandard.title}
                                </span>
                              </div>
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                {unitStandard.credits} credits
                              </span>
                            </button>

                            {/* Unit Standard Details */}
                            {isUnitExpanded && (
                              <div className="p-4 bg-white dark:bg-slate-800 space-y-4 border-t border-slate-200 dark:border-slate-700">
                                {/* Formatives */}
                                <div className="space-y-2">
                                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                                    Formative Activities (Practice - Not Graded)
                                  </h5>
                                  <div className="space-y-1 text-sm">
                                    {['1', '2', '3'].map((formativeNum) => {
                                      const isCompleted = (assessmentData as any)?.[`formative${formativeNum}Completed`];
                                      const date = (assessmentData as any)?.[`formative${formativeNum}Date`];
                                      return (
                                        <label key={`formative-${formativeNum}`} className="flex items-center gap-2 cursor-pointer">
                                          {isCompleted ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <Circle className="w-4 h-4 text-slate-400" />
                                          )}
                                          <span className="text-slate-700 dark:text-slate-300">
                                            Formative Activity {formativeNum}
                                            {date && ` - Completed: ${date}`}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Summative */}
                                <div className="space-y-2">
                                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                                    Summative Assessment (In-Class - Graded)
                                  </h5>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      {assessmentData?.summativeCompleted ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                                      )}
                                      <span className="text-sm text-slate-700 dark:text-slate-300">
                                        Assessment Date: {unitAssessmentData?.summativeDate || 'TBD'}
                                      </span>
                                    </div>
                                    {unitAssessmentData?.summativeResult && (
                                      <div className="text-sm text-slate-700 dark:text-slate-300">
                                        Result: <span className="font-semibold">{unitAssessmentData.summativeResult}</span>
                                        {unitAssessmentData.summativeMarks && ` (${unitAssessmentData.summativeMarks}/100)`}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Module Workplace Activity */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
                      Module Workplace Activity
                    </h4>
                    {moduleWorkplaceActivity ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {moduleWorkplaceActivity.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          )}
                          <span className="text-slate-700 dark:text-slate-300">
                            Period: {moduleWorkplaceActivity.activityPeriodStart || 'TBD'} - {moduleWorkplaceActivity.activityPeriodEnd || 'TBD'}
                          </span>
                        </div>
                        {moduleWorkplaceActivity.result && (
                          <div className="text-slate-700 dark:text-slate-300">
                            Result: <span className="font-semibold">{moduleWorkplaceActivity.result}</span>
                            {moduleWorkplaceActivity.assessor && ` (Assessor: ${moduleWorkplaceActivity.assessor})`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                        No workplace activity data
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FISA Section */}
      {progress.percentage === 100 && (
        <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="text-lg font-bold text-green-900 dark:text-green-200 flex items-center gap-2">
            <Award className="w-6 h-6" />
            Ready for FISA (Final Summative Assessment)
          </h3>
          <p className="text-sm text-green-800 dark:text-green-300 mt-2">
            This learner has completed all required modules and is eligible for the Final Summative Assessment.
          </p>
        </div>
      )}
    </div>
  );
}
