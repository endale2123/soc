/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SOCProvider } from './context/SOCContext';
import { Shell } from './components/layout/Shell';

export default function App() {
  return (
    <SOCProvider>
      <Shell />
    </SOCProvider>
  );
}
