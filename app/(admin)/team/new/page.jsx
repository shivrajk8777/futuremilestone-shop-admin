'use client';

import { useRouter } from 'next/navigation';
import TeamForm from '../TeamForm';

export default function NewTeamMemberPage() {
  const router = useRouter();
  
  return (
    <TeamForm
      onCancel={() => router.push('/team')}
      onSuccess={() => {
        router.push('/team');
        router.refresh();
      }}
    />
  );
}
