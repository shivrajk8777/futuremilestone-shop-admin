'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TeamForm from '../../TeamForm';

export default function EditTeamMemberPage() {
  const { id } = useParams();
  const router = useRouter();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/team/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setMember(data.member);
        } else {
          setError('Team member not found');
        }
      })
      .catch(() => setError('Failed to load team data'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-6 w-6 text-fjord-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-500 font-semibold">{error || 'Team member not found'}</p>
      </div>
    );
  }

  return (
    <TeamForm
      member={member}
      onCancel={() => router.push('/team')}
      onSuccess={() => {
        router.push('/team');
        router.refresh();
      }}
    />
  );
}
