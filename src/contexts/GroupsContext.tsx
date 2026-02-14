"use client";

import { createContext, useContext, ReactNode } from "react";
import useSWR, { mutate } from "swr";

export interface Group {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  summativeDate?: string;
  assessingDate?: string;
  fisaDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PLANNING' | 'COMPLETED' | 'ON_HOLD';
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

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || 'An error occurred while fetching data');
  }

  return data.data || data;
};

export function GroupsProvider({ children }: { children: ReactNode }) {
  // Fetch groups data
  const { data: groupsData, error: groupsError, isLoading: groupsLoading } = useSWR('/api/groups', fetcher, {
    revalidateOnFocus: true,
    revalidateIfStale: true,
    refreshInterval: 30000,
    shouldRetryOnError: true,
  });

  // Ensure groups is always an array
  const groups = Array.isArray(groupsData) ? groupsData : [];
  const isLoading = groupsLoading;
  const error = groupsError;

  const addGroup = async (groupData: Omit<Group, "id" | "createdAt">) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) throw new Error('Failed to create group');

      const data = await response.json();
      mutate('/api/groups');
      return data.data || data;
    } catch (error) {
      console.error('Error adding group:', error);
      throw error;
    }
  };

  const updateGroup = async (id: string, updates: Partial<Group>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update group');

      mutate('/api/groups');
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete group');
      }

      mutate('/api/groups');
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