"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, Circle, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  description: string;
  completed: boolean;
}

interface UnitStandard {
  id: string;
  code: string;
  title: string;
  credits: number;
  completed: boolean;
  activities: Activity[];
}

interface Module {
  id: number;
  name: string;
  unitStandards: UnitStandard[];
}

interface ModuleProgressProps {
  studentId: string;
  studentName: string;
  modules: Module[];
  onToggleUnitStandard: (moduleId: number, unitStandardId: string) => void;
  onToggleActivity: (moduleId: number, unitStandardId: string, activityId: string) => void;
  onAddActivity: (moduleId: number, unitStandardId: string, description: string) => void;
  onClose: () => void;
}

export default function ModuleProgress({
  studentId,
  studentName,
  modules,
  onToggleUnitStandard,
  onToggleActivity,
  onAddActivity,
  onClose,
}: ModuleProgressProps) {
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [expandedUnits, setExpandedUnits] = useState<string[]>([]);
  const [addingActivity, setAddingActivity] = useState<{ moduleId: number; unitId: string } | null>(null);
  const [newActivityText, setNewActivityText] = useState("");

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => (prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]));
  };

  const totalCredits = modules.reduce(
    (sum, module) => sum + module.unitStandards.reduce((mSum, us) => mSum + us.credits, 0),
    0
  );
  const earnedCredits = modules.reduce(
    (sum, module) =>
      sum + module.unitStandards.filter((us) => us.completed).reduce((mSum, us) => mSum + us.credits, 0),
    0
  );
  const progressPercent = totalCredits > 0 ? Math.round((earnedCredits / totalCredits) * 100) : 0;

  const handleAddActivity = (moduleId: number, unitId: string) => {
    if (newActivityText.trim()) {
      onAddActivity(moduleId, unitId, newActivityText.trim());
      setNewActivityText("");
      setAddingActivity(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary to-secondary text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Module Progress</h2>
              <p className="text-white/90 mt-1">Student: {studentName}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Ring */}
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/20" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - progressPercent / 100)}`}
                  className="text-white transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{progressPercent}%</span>
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">
                {earnedCredits} / {totalCredits}
              </div>
              <div className="text-white/90 text-sm">Credits Earned</div>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {modules.map((module) => {
              const moduleCredits = module.unitStandards.reduce((sum, us) => sum + us.credits, 0);
              const moduleEarned = module.unitStandards
                .filter((us) => us.completed)
                .reduce((sum, us) => sum + us.credits, 0);
              const isExpanded = expandedModules.includes(module.id);

              return (
                <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
                      <span className="font-semibold text-gray-900">
                        Module {module.id}: {module.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {moduleEarned} / {moduleCredits} credits
                      </span>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                          style={{ width: `${moduleCredits > 0 ? (moduleEarned / moduleCredits) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Unit Standards */}
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {module.unitStandards.map((unit) => {
                        const isUnitExpanded = expandedUnits.includes(unit.id);
                        return (
                          <div key={unit.id} className="border border-gray-200 rounded-lg">
                            {/* Unit Standard Header */}
                            <div className="flex items-center gap-3 p-3 bg-white">
                              <button
                                onClick={() => onToggleUnitStandard(module.id, unit.id)}
                                className={cn(
                                  "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                  unit.completed
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-gray-300 hover:border-primary"
                                )}
                              >
                                {unit.completed && <CheckCircle className="w-4 h-4" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900">
                                  {unit.code}: {unit.title}
                                </div>
                                <div className="text-sm text-gray-600">{unit.credits} credits</div>
                              </div>
                              <button
                                onClick={() => toggleUnit(unit.id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                {isUnitExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </div>

                            {/* Activities */}
                            {isUnitExpanded && (
                              <div className="px-3 pb-3 bg-gray-50">
                                <div className="pt-3 space-y-2">
                                  {unit.activities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-2">
                                      <button
                                        onClick={() => onToggleActivity(module.id, unit.id, activity.id)}
                                        className={cn(
                                          "mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                                          activity.completed
                                            ? "bg-primary border-primary text-white"
                                            : "border-gray-300 hover:border-primary"
                                        )}
                                      >
                                        {activity.completed && <CheckCircle className="w-3 h-3" />}
                                      </button>
                                      <span
                                        className={cn(
                                          "text-sm flex-1",
                                          activity.completed ? "text-gray-500 line-through" : "text-gray-700"
                                        )}
                                      >
                                        {activity.description}
                                      </span>
                                    </div>
                                  ))}

                                  {/* Add Activity */}
                                  {addingActivity?.moduleId === module.id && addingActivity?.unitId === unit.id ? (
                                    <div className="flex gap-2 mt-2">
                                      <input
                                        type="text"
                                        value={newActivityText}
                                        onChange={(e) => setNewActivityText(e.target.value)}
                                        placeholder="Activity description..."
                                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        autoFocus
                                        onKeyPress={(e) => {
                                          if (e.key === "Enter") handleAddActivity(module.id, unit.id);
                                        }}
                                      />
                                      <button
                                        onClick={() => handleAddActivity(module.id, unit.id)}
                                        className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                                      >
                                        Add
                                      </button>
                                      <button
                                        onClick={() => {
                                          setAddingActivity(null);
                                          setNewActivityText("");
                                        }}
                                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setAddingActivity({ moduleId: module.id, unitId: unit.id })}
                                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium mt-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Activity
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
