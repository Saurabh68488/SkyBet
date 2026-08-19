// ============================================
// Ludo Game Page — Static Export Wrapper
// ============================================

import LudoGameClient from './LudoGameClient';

export function generateStaticParams() {
  return [{ roomId: 'placeholder' }];
}

export default function LudoGamePage() {
  return <LudoGameClient />;
}
