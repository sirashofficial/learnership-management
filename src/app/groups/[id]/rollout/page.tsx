'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RolloutPlanTable from '@/components/RolloutPlanTable';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function GroupRolloutPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params?.id as string;

  const [group, setGroup] = useState<{ id: string; name: string; startDate: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    fetch(`/api/groups/${groupId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const g = data?.data ?? data;
        setGroup({ id: g.id, name: g.name, startDate: g.startDate });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Group not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <RolloutPlanTable
          groupId={group.id}
          groupName={group.name}
          groupStartDate={group.startDate}
        />
      </div>
    </div>
  );
}
