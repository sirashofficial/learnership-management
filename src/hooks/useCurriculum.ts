'use client';

import useSWR from 'swr';
import { swrConfig, fetcher } from '@/lib/swr-config';

export interface Module {
  id: string;
  code: string;
  name: string;
  description: string | null;
  credits: number;
  order: number;
  status: string;
  unitStandards: UnitStandard[];
  documents: CurriculumDocument[];
}

export interface UnitStandard {
  id: string;
  code: string;
  title: string;
  credits: number;
  level: number;
  content: string | null;
  moduleId: string;
  activities: Activity[];
}

export interface Activity {
  id: string;
  description: string;
  duration: number;
  resources: string | null;
  assessmentType: string | null;
}

export interface CurriculumDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  description: string | null;
  category: string;
  version: string;
  uploadedAt: string;
}

export function useCurriculum() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Module[] }>(
    '/api/curriculum',
    fetcher,
    swrConfig.curriculum
  );

  const modules = data?.data || [];
  const unitStandards = modules.flatMap(module => module.unitStandards || []);

  return {
    modules,
    unitStandards,
    isLoading,
    isError: error,
    mutate,
  };
}
