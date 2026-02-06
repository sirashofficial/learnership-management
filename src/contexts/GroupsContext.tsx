"use client";

import { createContext, useContext, ReactNode } from "react";
import useSWR, { mutate } from "swr";

export interface Company {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  industry?: string;
}

export interface Group {
  id: string;
  name: string;
  company?: Company;
  companyId?: string | null;
  startDate: string;
  endDate: string;
  status: 'Planning' | 'Active' | 'Completed' | 'On Hold';
  location: string;
  coordinator: string;
  notes: string;
  createdAt?: string;
  _count?: {
    students: number;
    sessions: number;
  };
}

interface GroupsContextType {
  groups: Group[];
  companies: Company[];
  isLoading: boolean;
  error: any;
  addGroup: (group: Omit<Group, "id" | "createdAt">) => Promise<void>;
  updateGroup: (id: string, updates: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addCompany: (company: Omit<Company, "id">) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

const fetcher = (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  }).then((res) => res.json()).then((data) => data.data || data);
};

export function GroupsProvider({ children }: { children: ReactNode }) {
  const { data: groupsData, error: groupsError } = useSWR('/api/groups', fetcher);
  const { data: companiesData, error: companiesError } = useSWR('/api/companies', fetcher);

  const groups = groupsData || [];
  const companies = companiesData || [];
  const isLoading = !groupsData || !companiesData;
  const error = groupsError || companiesError;

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

      mutate('/api/groups');
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

  const addCompany = async (companyData: Omit<Company, "id">) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) throw new Error('Failed to create company');

      mutate('/api/companies');
    } catch (error) {
      console.error('Error adding company:', error);
      throw error;
    }
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/companies', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) throw new Error('Failed to update company');

      mutate('/api/companies');
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies?id=${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete company');
      }

      mutate('/api/companies');
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  };

  return (
    <GroupsContext.Provider
      value={{
        groups,
        companies,
        isLoading,
        error,
        addGroup,
        updateGroup,
        deleteGroup,
        addCompany,
        updateCompany,
        deleteCompany,
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