"use client";

import { createContext, useContext, ReactNode } from "react";
import useSWR, { mutate } from "swr";
import { fetcher as globalFetcher } from "@/lib/swr-config";
import { invalidateGroups } from "@/lib/cache-invalidation";
import { useAuth } from "@/contexts/AuthContext";

export interface Group {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  summativeDate?: string;
  assessingDate?: string;
  fisaDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PLANNING' | 'COMPLETED' | 'ON_HOLD';
  students?: Array<any>;
  location?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  email?: string;
  phone?: string;
  industry?: string;
  coordinator?: string;
  notes?: string;
  createdAt?: string;
  _count?: {
    students: number;
    sessions: number;
  };
  actualProgress?: {
    avgCreditsPerStudent: number;
    avgProgressPercent: number;
    totalCreditsEarned: number;
    totalUniqueUnitsPassed: number;
    totalCreditsRequired: number;
    currentAssessmentModule?: number;
    atRiskCount?: number;
  };
  unitStandardRollouts?: Array<any>;
  healthStatus?: string;
  attendanceRate?: number;
  totalRecorded?: number;
  facilitatorMetrics?: {
    totalUnits: number;
    facilitatedUnits: number;
    facilitatedPercent: number;
    currentModule: number;
  };
  totalCreditsRequired?: number;
  currentAssessmentModule?: number;
}

interface GroupsContextType {
  groups: Group[];
  isLoading: boolean;
  error: any;
  addGroup: (group: Omit<Group, "id" | "createdAt">) => Promise<Group>;
  updateGroup: (id: string, updates: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  
  // Only fetch groups if user is authenticated
  const shouldFetch = Boolean(user && !authLoading);
  
  // Fetch groups data from UNIFIED endpoint (single source of truth)
  const { data: unifiedResponse, error: groupsError, isLoading: groupsLoading } = useSWR(
    shouldFetch ? '/api/data/groups' : null,
    globalFetcher,
    {
      revalidateOnFocus: shouldFetch,
      revalidateIfStale: shouldFetch,
      refreshInterval: shouldFetch ? 30000 : 0,
      shouldRetryOnError: false, // Don't retry on auth errors
      dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
    }
  );

  // Extract and map groups from unified response
  const groups = (unifiedResponse?.data?.groups || []).map((unifiedGroup: any) => ({
    id: unifiedGroup.id,
    name: unifiedGroup.name,
    startDate: unifiedGroup.startDate || '',
    endDate: unifiedGroup.endDate,
    location: unifiedGroup.location,
    createdAt: unifiedGroup.createdAt,
    status: unifiedGroup.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    rolloutPlan: unifiedGroup.rolloutPlan || null,
    unitStandardRollouts: unifiedGroup.unitStandardRollouts || [],
    healthStatus: unifiedGroup.metrics?.healthStatus || 'NO_PLAN',
    attendanceRate: unifiedGroup.metrics?.attendanceRate || 0,
    totalRecorded: unifiedGroup.metrics?.totalRecorded || 0,
    totalCreditsRequired: unifiedGroup.totalCreditsRequired || 0,
    currentAssessmentModule: unifiedGroup.currentAssessmentModule || 0,
    facilitatorMetrics: unifiedGroup.facilitatorMetrics || {
      totalUnits: 0,
      facilitatedUnits: 0,
      facilitatedPercent: 0,
      currentModule: 0,
    },
    actualProgress: {
      avgCreditsPerStudent: unifiedGroup.metrics?.avgCreditsPerStudent ?? 0,
      avgProgressPercent: unifiedGroup.metrics?.avgProgressPercent ?? 0,
      totalCreditsEarned: unifiedGroup.metrics?.totalCreditsEarned ?? 0,
      totalUniqueUnitsPassed: unifiedGroup.metrics?.totalUniqueUnitsPassed ?? 0,
      totalCreditsRequired: unifiedGroup.totalCreditsRequired ?? 0,
      currentAssessmentModule: unifiedGroup.currentAssessmentModule ?? 0,
      atRiskCount: unifiedGroup.metrics?.atRiskCount ?? 0,
    },
    _count: {
      students: unifiedGroup.metrics?.studentCount ?? 0,
      sessions: 0,
    },
  }));
  
  const isLoading = groupsLoading;
  const error = groupsError;

  const addGroup = async (groupData: Omit<Group, "id" | "createdAt">) => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(groupData),
      });

      if (!response.ok) throw new Error('Failed to create group');

      const data = await response.json();
      await invalidateGroups(); // Invalidate all group-related caches
      return data.data || data;
    } catch (error) {
      console.error('Error adding group:', error);
      throw error;
    }
  };

  const updateGroup = async (id: string, updates: Partial<Group>) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update group');

      await invalidateGroups(); // Invalidate all group-related caches
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete group');
      }

      await invalidateGroups(); // Invalidate all group-related caches
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  };

  return (
    <GroupsContext.Provider
      value={{
        groups,
        isLoading,
        error,
        addGroup,
        updateGroup,
        deleteGroup,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const context = useContext(GroupsContext);
  if (context === undefined) {
    throw new Error("useGroups must be used within a GroupsProvider");
  }
  return context;
}