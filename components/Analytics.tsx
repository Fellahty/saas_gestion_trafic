'use client';

import { useEffect } from 'react';
import { getAnalyticsInstance } from '@/firebase.config';

export default function Analytics() {
  useEffect(() => {
    // Initialiser Analytics côté client uniquement
    getAnalyticsInstance().catch((error) => {
      console.error('Failed to initialize Analytics:', error);
    });
  }, []);

  return null;
}
