'use client';
import { Suspense } from 'react';
import TeamJoinForm from './TeamJoinForm';

export default function TeamJoinPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamJoinForm />
    </Suspense>
  );
}
