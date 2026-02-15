'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
// Removed Sidebar and Header imports
import { useGroups } from '@/contexts/GroupsContext';
import GroupModal from '@/components/GroupModal';
import GroupDrawer from '@/components/GroupDrawer';
import GroupUploadModal from '@/components/GroupUploadModal';
import AddStudentModal from '@/components/AddStudentModal';
import {
  Building2,
  Users,
  Search,
  Plus,
  Edit2,
  Archive,
  UserPlus,
  Grid3x3,
  List,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Download,
  Upload
} from 'lucide-react';
import { differenceInDays, format, isAfter, isBefore, startOfMonth } from 'date-fns';

type PlanStatus = 'NO_PLAN' | 'NOT_STARTED' | 'ON_TRACK' | 'BEHIND' | 'AT_RISK' | 'COMPLETE';

// Rollout Status Helper
const getRolloutStatus = (rolloutPlan: any) => {
  if (!rolloutPlan) return { status: 'NO_PLAN', color: 'slate', label: 'No Plan' };

  const today = new Date();

  // Check current module status (simplistic logic for now)
  // Ideally compare current module vs planned timeline
  // For demo: checking if we are past any end dates without completion would require progress data
  // Here we just check if we are within valid dates

  // Example logic:
  if (rolloutPlan.module1EndDate && isAfter(today, new Date(rolloutPlan.module1EndDate))) {
    // If today is after module 1 end date, check actual progress (not available in group obj yet, assuming group obj has progress)
    // For now, let's just show "On Track" generic or random for demo, OR better:
    // Just showing "Active" based on start/end dates
    return { status: 'ON_TRACK', color: 'emerald', label: 'On Track' };
  }

  return { status: 'ON_TRACK', color: 'emerald', label: 'On Track' };
};

const extractStoredPlan = (notes: string | null | undefined) => {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    return parsed?.rolloutPlan || null;
  } catch {
    return null;
  }
};

const parsePlanDate = (value: string) => {
  const [day, month, year] = value.split('/').map((part) => Number(part));
  return new Date(year, month - 1, day);
};

const normalizeDate = (date: Date) => {
  const result = new Date(date.getTime());
  result.setHours(0, 0, 0, 0);
  return result;
};

const getUnitStandards = (plan: any) => {
  if (!plan?.modules) return [];
  return plan.modules
    .flatMap((module: any) =>
      (module.unitStandards || []).map((unit: any) => ({
        moduleNumber: module.moduleNumber ?? module.moduleIndex,
        start: parsePlanDate(unit.startDate),
        end: parsePlanDate(unit.endDate),
        assessing: parsePlanDate(unit.assessingDate),
      }))
    )
    .sort((a: any, b: any) => a.start.getTime() - b.start.getTime());
};

const getPlanStatus = (plan: any): PlanStatus => {
  if (!plan) return 'NO_PLAN';
  const standards = getUnitStandards(plan);
  if (standards.length === 0) return 'NO_PLAN';

  const today = normalizeDate(new Date());
  const firstStart = normalizeDate(standards[0].start);
  const lastAssess = normalizeDate(standards[standards.length - 1].assessing);

  if (today < firstStart) return 'NOT_STARTED';
  if (today > lastAssess) return 'COMPLETE';

  const active = standards.find((unit: any) => {
    const start = normalizeDate(unit.start);
    const end = normalizeDate(unit.end);
    return start <= today && end >= today;
  });

  if (active) return 'ON_TRACK';

  for (let i = 0; i < standards.length - 1; i += 1) {
    const currentEnd = normalizeDate(standards[i].end);
    const nextStart = normalizeDate(standards[i + 1].start);
    if (today > currentEnd && today < nextStart) {
      return 'BEHIND';
    }
  }

  const lastEnd = normalizeDate(standards[standards.length - 1].end);
  if (today > lastEnd && today <= lastAssess) {
    return 'BEHIND';
  }

  return 'BEHIND';
};

const getCurrentModuleLabel = (plan: any) => {
  if (!plan) return 'No Plan';
  const standards = getUnitStandards(plan);
  if (standards.length === 0) return 'No Plan';

  const today = normalizeDate(new Date());
  const firstStart = normalizeDate(standards[0].start);
  const lastAssess = normalizeDate(standards[standards.length - 1].assessing);

  if (today < firstStart) return 'Not Started';
  if (today > lastAssess) return 'Complete';

  const active = standards.find((unit: any) => {
    const start = normalizeDate(unit.start);
    const end = normalizeDate(unit.end);
    return start <= today && end >= today;
  });

  if (active) return `Module ${active.moduleNumber}`;

  return 'Between Modules';
};

// Module names and credits for the NVC L2 qualification
const MODULE_INFO = [
  { number: 1, name: 'Numeracy', credits: 16 },
  { number: 2, name: 'HIV/AIDS & Communications', credits: 24 },
  { number: 3, name: 'Market Requirements', credits: 22 },
  { number: 4, name: 'Business Sector & Industry', credits: 26 },
  { number: 5, name: 'Financial Requirements', credits: 26 },
  { number: 6, name: 'Business Operations', credits: 26 },
];

const TOTAL_CREDITS = MODULE_INFO.reduce((total, module) => total + module.credits, 0);

const getCurrentModuleInfo = (plan: any) => {
  if (!plan?.modules || plan.modules.length === 0) {
    return { label: '', moduleNumber: null };
  }

  const today = normalizeDate(new Date());

  for (const module of plan.modules) {
    if (!Array.isArray(module.unitStandards) || module.unitStandards.length === 0) continue;

    for (const unit of module.unitStandards) {
      if (!unit?.startDate || !unit?.endDate) continue;
      const start = normalizeDate(parsePlanDate(unit.startDate));
      const end = normalizeDate(parsePlanDate(unit.endDate));

      if (today >= start && today <= end) {
        const moduleNumber = module.moduleNumber ?? module.moduleIndex;
        const moduleInfo = MODULE_INFO.find((info) => info.number === moduleNumber);
        return {
          label: moduleInfo ? `Module ${moduleInfo.number} - ${moduleInfo.name}` : `Module ${moduleNumber}`,
          moduleNumber: moduleNumber ?? null,
        };
      }
    }
  }

  const lastModule = plan.modules[plan.modules.length - 1];
  const workplaceEndValue = lastModule?.workplaceActivityEndDate || lastModule?.workplaceActivity?.endDate;
  if (workplaceEndValue) {
    const workplaceEnd = normalizeDate(parsePlanDate(workplaceEndValue));
    if (today > workplaceEnd) {
      return { label: 'Programme Complete', moduleNumber: null };
    }
  }

  const lastUnitModule = plan.modules[plan.modules.length - 1];
  if (lastUnitModule) {
    const lastModuleNumber = lastUnitModule.moduleNumber ?? lastUnitModule.moduleIndex;
    const moduleInfo = MODULE_INFO.find((info) => info.number === lastModuleNumber);
    return {
      label: moduleInfo ? `Module ${moduleInfo.number} - ${moduleInfo.name}` : `Module ${lastModuleNumber}`,
      moduleNumber: lastModuleNumber ?? null,
    };
  }

  return { label: '', moduleNumber: null };
};

// Calculate credit completion based on workplace activity end dates
const getCreditCompletion = (plan: any): { completed: number; percentage: number } => {
  if (!plan?.modules || plan.modules.length === 0) {
    return { completed: 0, percentage: 0 };
  }

  const today = normalizeDate(new Date());
  let completedCredits = 0;

  // A module is complete when its workplace activity end date has passed
  for (const module of plan.modules) {
    if (module.workplaceActivityEndDate || module.workplaceActivity?.endDate) {
      const endValue = module.workplaceActivityEndDate || module.workplaceActivity?.endDate;
      const workplaceEnd = normalizeDate(parsePlanDate(endValue));

      if (today > workplaceEnd) {
        // Find the module info to get its credit value
        const moduleNumber = module.moduleNumber ?? module.moduleIndex;
        const moduleInfo = MODULE_INFO.find(m => m.number === moduleNumber);
        if (moduleInfo) {
          completedCredits += moduleInfo.credits;
        }
      }
    }
  }

  const percentage = Math.round((completedCredits / TOTAL_CREDITS) * 100);
  return { completed: completedCredits, percentage };
};

const getPerformanceStatus = (projectedPercent: number, actualPercent: number, hasPlan: boolean): PlanStatus => {
  if (!hasPlan) return 'NO_PLAN';
  if (actualPercent >= projectedPercent) return 'ON_TRACK';
  if (projectedPercent - actualPercent <= 10) return 'BEHIND';
  return 'AT_RISK';
};

const renderStatusBadge = (status: PlanStatus) => {
  switch (status) {
    case 'ON_TRACK':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          On Track
        </span>
      );
    case 'BEHIND':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5" />
          Behind
        </span>
      );
    case 'AT_RISK':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700">
          <AlertTriangle className="w-3.5 h-3.5" />
          At Risk
        </span>
      );
    case 'NOT_STARTED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
          <Clock className="w-3.5 h-3.5" />
          Not Started
        </span>
      );
    case 'COMPLETE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-teal-50 text-teal-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Complete
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          No Plan
        </span>
      );
  }
};

export default function GroupsPage() {
  const router = useRouter();
  const { groups, isLoading, deleteGroup } = useGroups();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCompanies, setExpandedCompanies] = useState<string[]>([]);
  const [expandedCollections, setExpandedCollections] = useState<string[]>(['montazility']);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [attendanceByGroup, setAttendanceByGroup] = useState<Record<string, number>>({});
  const { data: actualProgressData } = useSWR(
    '/api/groups/progress',
    (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json()),
    { revalidateOnFocus: false }
  );
  const actualProgressByGroup = useMemo(() => {
    const payload = actualProgressData?.data || actualProgressData || [];
    const progressMap: Record<string, { avgCredits: number; avgPercent: number }> = {};
    for (const item of payload) {
      progressMap[item.groupId] = {
        avgCredits: item.avgCreditsPerStudent || 0,
        avgPercent: item.avgProgressPercent || 0,
      };
    }
    return progressMap;
  }, [actualProgressData]);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [drawerGroup, setDrawerGroup] = useState<any | null>(null);
  const [drawerMeta, setDrawerMeta] = useState<{
    statusLabel: string;
    currentModuleLabel: string;
    attendanceRate: number;
    actualProgress?: { avgCredits: number; avgPercent: number };
  } | null>(null);

  // Define Collections (Dynamic)
  const montazilityCollection = {
    name: "Montazility 2026",
    groups: (groups || []).filter((g: any) =>
      g.status !== 'ARCHIVED' &&
      (g.name.includes("26") || g.name.includes("2026") || g.name.includes("Montzelity") || g.name.includes("Montazility"))
    )
  };

  // All other groups displayed flat (no company grouping)
  const allOtherGroups = (groups || []).filter((g: any) =>
    g.status !== 'ARCHIVED' && !montazilityCollection.groups.some((mg: any) => mg.id === g.id)
  );

  // Filter groups by search
  const filteredCollection = {
    ...montazilityCollection,
    groups: montazilityCollection.groups.filter((g: any) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  };

  const filteredOtherGroups = allOtherGroups.filter((g: any) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const activeGroups = (groups || []).filter((g: any) => g.status !== 'ARCHIVED');
  const totalStudents = activeGroups.reduce((sum: number, g: any) => sum + (g._count?.students || 0), 0);
  const avgAttendance = activeGroups.length > 0
    ? activeGroups.reduce((sum: number, g: any) => sum + (attendanceByGroup[g.id] ?? 0), 0) / activeGroups.length
    : 0;
  const programmeRows = activeGroups.map((group: any) => {
    const storedPlan = extractStoredPlan(group.notes);
    const creditProgress = getCreditCompletion(storedPlan);
    const actualProgress = actualProgressByGroup[group.id] || group.actualProgress;
    const actualPercent = actualProgress?.avgPercent || actualProgress?.avgProgressPercent || 0;
    const status = getPerformanceStatus(creditProgress.percentage, actualPercent, Boolean(storedPlan));
    return {
      id: group.id,
      name: group.name,
      learners: group._count?.students || group.students?.length || 0,
      attendance: attendanceByGroup[group.id] ?? 0,
      currentModule: getCurrentModuleLabel(storedPlan),
      status,
    };
  });
  const onTrackCount = programmeRows.filter((row) => row.status === 'ON_TRACK').length;
  const behindCount = programmeRows.filter((row) => row.status === 'BEHIND').length;
  const atRiskCount = programmeRows.filter((row) => row.status === 'AT_RISK').length;
  const attendanceTone = avgAttendance >= 80 ? 'emerald' : avgAttendance >= 60 ? 'amber' : 'red';

  useEffect(() => {
    if (activeGroups.length === 0) {
      setAttendanceByGroup({});
      return;
    }

    const fetchAttendance = async () => {
      setIsAttendanceLoading(true);
      try {
        const startDate = startOfMonth(new Date()).toISOString();
        const endDate = new Date().toISOString();
        const responses = await Promise.all(
          activeGroups.map((group: any) =>
            fetch(`/api/attendance/stats?groupId=${group.id}&startDate=${startDate}&endDate=${endDate}`)
          )
        );

        const payloads = await Promise.all(
          responses.map(async (response) => (response.ok ? response.json() : null))
        );

        const nextMap: Record<string, number> = {};
        payloads.forEach((payload, index) => {
          const groupId = activeGroups[index]?.id;
          if (!groupId) return;
          const attendanceRate = payload?.data?.attendanceRate ?? payload?.attendanceRate ?? 0;
          nextMap[groupId] = Number.isFinite(attendanceRate) ? Number(attendanceRate) : 0;
        });

        setAttendanceByGroup(nextMap);
      } catch (error) {
        console.error('Failed to fetch attendance stats:', error);
      } finally {
        setIsAttendanceLoading(false);
      }
    };

    fetchAttendance();
  }, [activeGroups.map((group: any) => group.id).join(',')]);

  const toggleCompany = (companyName: string) => {
    setExpandedCompanies(prev =>
      prev.includes(companyName)
        ? prev.filter(c => c !== companyName)
        : [...prev, companyName]
    );
  };

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections(prev =>
      prev.includes(collectionId)
        ? prev.filter(c => c !== collectionId)
        : [...prev, collectionId]
    );
  };

  const toggleSelectForMerge = (groupId: string) => {
    setSelectedForMerge(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleEditGroup = (group: any) => {
    setSelectedGroup(group);
    setShowGroupModal(true);
  };

  const handleArchiveGroup = async (group: any) => {
    // Build confirmation message
    const studentCount = group._count?.students || 0;
    let confirmMessage = `Are you sure you want to delete "${group.name}"? This cannot be undone.`;

    if (studentCount > 0) {
      confirmMessage += `\n\nWarning: This group has ${studentCount} student${studentCount !== 1 ? 's' : ''}. Deleting it will unassign them from this group.`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteGroup(group.id);
      // The group will be automatically removed from the list via the context's mutate
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert('Failed to delete group. Please try again.');
    }
  };

  const handleAddStudentsToGroup = (group: any) => {
    setSelectedGroup(group);
    setShowAddStudentModal(true);
  };

  const handleViewGroup = (group: any) => {
    const storedPlan = extractStoredPlan(group.notes);
    const creditProgress = getCreditCompletion(storedPlan);
    const actualProgress = actualProgressByGroup[group.id] || group.actualProgress;
    const actualPercent = actualProgress?.avgPercent || actualProgress?.avgProgressPercent || 0;
    const status = getPerformanceStatus(creditProgress.percentage, actualPercent, Boolean(storedPlan));

    setDrawerMeta({
      statusLabel: status === 'AT_RISK' ? 'At Risk' : status === 'BEHIND' ? 'Behind' : status === 'ON_TRACK' ? 'On Track' : 'No Plan',
      currentModuleLabel: getCurrentModuleLabel(storedPlan),
      attendanceRate: attendanceByGroup[group.id] ?? 0,
      actualProgress: actualProgress ? {
        avgCredits: actualProgress.avgCredits || actualProgress.avgCreditsPerStudent || 0,
        avgPercent: actualPercent,
      } : undefined,
    });
    setDrawerGroup(group);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div />
          <div className="flex gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
            >
              <Upload className="w-5 h-5" />
              Upload Plan
            </button>
            <button
              onClick={() => {
                setSelectedGroup(null);
                setShowGroupModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Create Group
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-600 text-white rounded-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Groups</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeGroups.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 text-white rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Students</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-600 text-white rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Attendance</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{avgAttendance.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups or companies..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-300 dark:border-slate-600">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Groups by Company */}
      <div className="space-y-4">
        {/* Merge Button */}
        {selectedForMerge.length >= 2 && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 text-white rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {selectedForMerge.length} groups selected
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Click merge to combine these groups into one
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedForMerge([])}
                  className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Merge Groups
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Montazility Collection */}
        {(searchQuery === '' || filteredCollection.groups.length > 0) && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
            <div
              onClick={() => toggleCollection('montazility')}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 cursor-pointer hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-colors border-b-2 border-purple-200 dark:border-purple-700"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600 text-white rounded-lg">
                  <Grid3x3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {filteredCollection.name}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded-full">
                      Collection
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {filteredCollection.groups.length} group{filteredCollection.groups.length !== 1 ? 's' : ''} • {
                      filteredCollection.groups.reduce((sum: number, g: any) => sum + (g._count?.students || 0), 0)
                    } student{filteredCollection.groups.reduce((sum: number, g: any) => sum + (g._count?.students || 0), 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {expandedCollections.includes('montazility') ? (
                <ChevronUp className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              )}
            </div>

            {expandedCollections.includes('montazility') && (
              <div className={`p-4 bg-purple-50/30 dark:bg-purple-900/10 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}`}>
                {filteredCollection.groups.map((group: any) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    viewMode={viewMode}
                    onEdit={() => handleEditGroup(group)}
                    onArchive={() => handleArchiveGroup(group)}
                    onAddStudents={() => handleAddStudentsToGroup(group)}
                    onView={() => handleViewGroup(group)}
                    isSelected={selectedForMerge.includes(group.id)}
                    onSelect={() => toggleSelectForMerge(group.id)}
                    actualProgress={actualProgressByGroup[group.id]}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Other Groups (Not organized by company) */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}`}>
          {filteredOtherGroups.map((group: any) => (
            <GroupCard
              key={group.id}
              group={group}
              viewMode={viewMode}
              onEdit={() => handleEditGroup(group)}
              onArchive={() => handleArchiveGroup(group)}
              onAddStudents={() => handleAddStudentsToGroup(group)}
              onView={() => handleViewGroup(group)}
              isSelected={selectedForMerge.includes(group.id)}
              onSelect={() => toggleSelectForMerge(group.id)}
              actualProgress={actualProgressByGroup[group.id]}
            />
          ))}
        </div>

        {filteredOtherGroups.length === 0 && filteredCollection.groups.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No groups found</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {searchQuery ? 'Try a different search term' : 'Create your first group to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Programme Overview */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Programme Overview</h3>
          <p className="text-sm text-slate-500">Live programme health across all active groups.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-600 text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Learners</p>
                <p className="text-2xl font-semibold text-slate-900">{totalStudents}</p>
                <p className="text-xs text-slate-500">{activeGroups.length} active groups</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-lg text-white ${attendanceTone === 'emerald'
                  ? 'bg-emerald-600'
                  : attendanceTone === 'amber'
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                  }`}
              >
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Average Attendance</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {isAttendanceLoading ? '...' : `${avgAttendance.toFixed(0)}%`}
                </p>
                <p className="text-xs text-slate-500">This month</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-600 text-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-slate-600">On Track</p>
                <p className="text-2xl font-semibold text-slate-900">{onTrackCount}</p>
                <p className="text-xs text-slate-500">of {activeGroups.length} total groups</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-500 text-white">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Behind / At Risk</p>
                <p className="text-2xl font-semibold text-slate-900">{behindCount + atRiskCount}</p>
                <p className="text-xs text-slate-500">Need attention</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-slate-900">Group Performance</h4>
            <div className="relative group">
              <button className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 px-2.5 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50">
                Status guide
                <Info className="w-3.5 h-3.5" />
              </button>
              <div className="absolute right-0 top-9 w-72 rounded-lg bg-white border border-slate-200 shadow-lg p-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">On Track</span>
                    <span>Today falls within a scheduled unit standard.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5">Behind</span>
                    <span>Past a unit end date with the next not started.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2 py-0.5">At Risk</span>
                    <span>Actual progress lags projected by more than 10%.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">Not Started</span>
                    <span>Plan exists, first unit not started yet.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 text-teal-700 px-2 py-0.5">Complete</span>
                    <span>All units are past the assessing date.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">No Plan</span>
                    <span>No rollout plan saved.</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Between Modules means today sits between unit standard date ranges.</div>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Group Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Learners</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <div className="flex items-center gap-1">
                      Current Module
                      <span className="relative group">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        <span className="absolute z-10 left-1/2 -translate-x-1/2 top-6 w-56 rounded-md bg-slate-900 text-white text-xs px-2 py-1 opacity-0 pointer-events-none group-hover:opacity-100">
                          Between Modules means today sits between unit standard date ranges.
                        </span>
                      </span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {programmeRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.learners}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {isAttendanceLoading ? '—' : `${row.attendance.toFixed(0)}%`}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.currentModule}</td>
                    <td className="px-4 py-3 text-sm">{renderStatusBadge(row.status)}</td>
                  </tr>
                ))}
                {programmeRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      No groups available for performance reporting.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showGroupModal && (
        <GroupModal
          group={selectedGroup}
          onClose={() => {
            setShowGroupModal(false);
            setSelectedGroup(null);
          }}
          onSave={() => {
            setShowGroupModal(false);
            setSelectedGroup(null);
            router.refresh();
          }}
        />
      )}

      <GroupUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false);
          router.refresh();
        }}
      />

      {showAddStudentModal && selectedGroup && (
        <AddStudentModal
          isOpen={true}
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          onClose={() => {
            setShowAddStudentModal(false);
            setSelectedGroup(null);
          }}
          onAdd={async (student) => {
            try {
              console.log('📝 Groups page: Received student data:', student);

              const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentId: student.studentId,
                  firstName: student.firstName,
                  lastName: student.lastName,
                  email: student.email || undefined,
                  phone: student.phone || undefined,
                  groupId: student.groupId || student.group,
                  status: student.status || 'ACTIVE',
                  progress: student.progress || 0,
                }),
              });

              console.log('📡 Response status:', response.status);

              if (response.ok) {
                const result = await response.json();
                console.log('✅ Success:', result);
                alert('Student added successfully!');
                setShowAddStudentModal(false);
                setSelectedGroup(null);
                router.refresh();
              } else {
                const error = await response.json();
                console.error('❌ API Error:', error);
                alert(`Failed to add student: ${error.error || error.message || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('❌ Error adding student:', error);
              alert('Failed to add student. Please try again.');
            }
          }}
        />
      )}

      {showMergeModal && (
        <MergeGroupsModal
          selectedGroupIds={selectedForMerge}
          groups={groups || []}
          onClose={() => setShowMergeModal(false)}
          onMerge={() => {
            setShowMergeModal(false);
            setSelectedForMerge([]);
            router.refresh();
          }}
        />
      )}

      <GroupDrawer
        isOpen={Boolean(drawerGroup)}
        group={drawerGroup}
        onClose={() => setDrawerGroup(null)}
        attendanceRate={drawerMeta?.attendanceRate}
        actualProgress={drawerMeta?.actualProgress}
        statusLabel={drawerMeta?.statusLabel}
        currentModuleLabel={drawerMeta?.currentModuleLabel}
      />
    </div>
  );
}

interface GroupCardProps {
  group: any;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onArchive: () => void;
  onAddStudents: () => void;
  onView: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  actualProgress?: { avgCredits: number; avgPercent: number };
}

function GroupCard({ group, viewMode, onEdit, onArchive, onAddStudents, onView, isSelected, onSelect, actualProgress }: GroupCardProps) {
  const router = useRouter();
  const studentCount = group._count?.students || 0;
  const attendanceRate = group.attendanceRate || 0;

  // Extract rollout plan from notes
  const rolloutPlan = extractStoredPlan(group.notes);

  // Get current module info and credit completion
  const currentModule = getCurrentModuleInfo(rolloutPlan);
  const creditProgress = getCreditCompletion(rolloutPlan);
  const resolvedActualProgress = actualProgress || group.actualProgress;
  const actualPercent = resolvedActualProgress?.avgPercent || resolvedActualProgress?.avgProgressPercent || 0;
  const performanceStatus = getPerformanceStatus(creditProgress.percentage, actualPercent, Boolean(rolloutPlan));

  const handleExportReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/reports/group-progress?groupId=${group.id}&format=csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `group-${group.name.replace(/[^a-z0-9]/gi, '_')}-progress.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export report');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center justify-between p-4 bg-slate-50 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}
      >
        {onSelect && (
          <div className="flex items-center mr-3" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
            />
          </div>
        )}
        <div className="flex items-center gap-4 flex-1" onClick={onView}>
          <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{group.name}</h4>
            {group.facilitator && (
              <p className="text-sm text-slate-600">Facilitator: {group.facilitator.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{studentCount}</p>
            <p className="text-xs text-slate-600">Students</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{attendanceRate}%</p>
            <p className="text-xs text-slate-600">Attendance</p>
          </div>

          {/* Dual Progress Bars (Projected + Actual) */}
          <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
            {/* Current Module Label */}
            {rolloutPlan && currentModule.label && (
              <p className="text-xs font-medium text-slate-700">
                {currentModule.label}
              </p>
            )}

            {/* Projected */}
            {rolloutPlan && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 w-14 flex items-center gap-0.5"><Calendar className="w-3 h-3" /> Proj</span>
                <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all" style={{ width: `${creditProgress.percentage}%` }} />
                </div>
                <span className="text-[10px] font-semibold text-teal-700 whitespace-nowrap w-20 text-right">
                  {creditProgress.percentage}% ({creditProgress.completed}/{TOTAL_CREDITS})
                </span>
              </div>
            )}

            {/* Actual */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-14 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Real</span>
              <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all" style={{ width: `${actualProgress?.avgPercent || 0}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-blue-700 whitespace-nowrap w-20 text-right">
                {actualPercent}% ({resolvedActualProgress?.avgCredits || resolvedActualProgress?.avgCreditsPerStudent || 0}/{TOTAL_CREDITS})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onAddStudents}
              className="p-2 hover:bg-teal-100 text-teal-600 rounded-lg transition-colors"
              title="Add Students"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
              title="Edit Group"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={onArchive}
              className="p-2 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              title="Archive Group"
            >
              <Archive className="w-5 h-5" />
            </button>
            <button
              onClick={handleExportReport}
              className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
              title="Export Progress Report"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 hover:shadow-lg transition-all overflow-hidden relative ${isSelected ? 'border-purple-500 ring-2 ring-purple-500' : 'border-slate-200 dark:border-slate-700'
        }`}
    >
      {onSelect && (
        <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-6 h-6 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
          />
        </div>
      )}
      <div className="p-4 cursor-pointer" onClick={onView}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4
                className="font-semibold text-slate-900 dark:text-white hover:text-teal-600 cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/groups/${group.id}`);
                }}
              >
                {group.name}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Started {new Date(group.startDate).toLocaleDateString()}
              </p>
              {/* Rollout Status Badge */}
              {renderStatusBadge(performanceStatus)}
            </div>
          </div>
        </div>
      </div>

      {group.facilitator && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Facilitator: {group.facilitator.name}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{studentCount}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Students</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{attendanceRate}%</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Attendance</p>
        </div>
      </div>

      {/* Current Module & Progress Bars */}
      <div className="mb-4 space-y-3 px-4">
        {/* Current Module Label */}
        {rolloutPlan && currentModule.label && (
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {currentModule.label}
          </p>
        )}

        {/* Projected Progress Bar (from rollout plan dates) */}
        {rolloutPlan && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Projected
              </span>
              <span className="font-semibold text-teal-700 dark:text-teal-300">
                {creditProgress.percentage}% ({creditProgress.completed}/{TOTAL_CREDITS})
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-300"
                style={{ width: `${creditProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Actual Progress Bar (from real assessment data) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Actual
            </span>
            <span className="font-semibold text-blue-700 dark:text-blue-300">
              {actualPercent}% ({resolvedActualProgress?.avgCredits || resolvedActualProgress?.avgCreditsPerStudent || 0}/{TOTAL_CREDITS})
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
              style={{ width: `${actualPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onAddStudents}
          className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <UserPlus className="w-4 h-4" />
          Add
        </button>
        <button
          onClick={onEdit}
          className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onArchive}
          className="py-2 px-3 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
          title="Archive"
        >
          <Archive className="w-4 h-4" />
        </button>
        <button
          onClick={handleExportReport}
          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          title="Export Report"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>


      {/* Drawer handles student drill-down */}
    </div >
  );
}

interface MergeGroupsModalProps {
  selectedGroupIds: string[];
  groups: any[];
  onClose: () => void;
  onMerge: () => void;
}

function MergeGroupsModal({ selectedGroupIds, groups, onClose, onMerge }: MergeGroupsModalProps) {
  const [targetGroupName, setTargetGroupName] = useState('');
  const [merging, setMerging] = useState(false);

  const selectedGroups = groups.filter(g => selectedGroupIds.includes(g.id));
  const totalStudents = selectedGroups.reduce((sum, g) => sum + (g._count?.students || 0), 0);

  const handleMerge = async () => {
    if (!targetGroupName.trim()) {
      alert('Please enter a name for the merged group');
      return;
    }

    setMerging(true);
    try {
      const response = await fetch('/api/groups/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupIds: selectedGroupIds,
          targetGroupName: targetGroupName.trim(),
        }),
      });

      if (response.ok) {
        alert('Groups merged successfully!');
        onMerge();
      } else {
        const error = await response.json();
        alert(`Failed to merge groups: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error merging groups:', error);
      alert('Failed to merge groups');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-7 h-7 text-purple-600" />
              Merge Groups
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Groups to merge:</h3>
            <ul className="space-y-2">
              {selectedGroups.map(group => (
                <li key={group.id} className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300">• {group.name}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {group._count?.students || 0} student{(group._count?.students || 0) !== 1 ? 's' : ''}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                Total: {totalStudents} student{totalStudents !== 1 ? 's' : ''} from {selectedGroups.length} groups
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              New Group Name *
            </label>
            <input
              type="text"
              value={targetGroupName}
              onChange={(e) => setTargetGroupName(e.target.value)}
              placeholder="Enter name for merged group"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
            />
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              All students will be moved to this new group. The old groups will be archived.
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Warning:</strong> This action will:
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
              <li>Create a new group with all students from selected groups</li>
              <li>Archive the original groups (they won't be deleted)</li>
              <li>Preserve all student data and progress</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={merging}
            className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={merging || !targetGroupName.trim()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {merging ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Merging...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Merge Groups
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
