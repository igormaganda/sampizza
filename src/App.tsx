/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AppProvider } from '@/context/AppContext';
import { FrontOffice } from '@/components/FrontOffice';
import { BackOffice } from '@/components/BackOffice';
import { OrderTracking } from '@/components/OrderTracking';
import { OrderSuccess } from '@/components/OrderSuccess';
import { OrderCancel } from '@/components/OrderCancel';

type ViewType = 'front' | 'back' | 'tracking' | 'success' | 'cancel';

export default function App() {
  const [view, setView] = useState<ViewType>('front');

  useEffect(() => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);

    // Check for success/cancel pages
    if (path === '/success' || path === '/success/') {
      setView('success');
    } else if (path === '/cancel' || path === '/cancel/') {
      setView('cancel');
    } else if (path === '/admin' || path === '/admin/') {
      setView('back');
    } else if (path === '/suivi' || path === '/suivi/') {
      setView('tracking');
    } else {
      setView('front');
    }
  }, []);

  return (
    <AppProvider>
      {view === 'front' && <FrontOffice />}
      {view === 'back' && <BackOffice />}
      {view === 'tracking' && <OrderTracking />}
      {view === 'success' && <OrderSuccess />}
      {view === 'cancel' && <OrderCancel />}
    </AppProvider>
  );
}
