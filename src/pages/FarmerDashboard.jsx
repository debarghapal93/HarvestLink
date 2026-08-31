import { useState } from 'react';
import DashboardShell from '../components/DashboardShell';
import FarmerPane from '../components/FarmerPane';

export default function FarmerDashboard() {
  const [voiceCrop, setVoiceCrop] = useState(null);
  const [voiceQty,  setVoiceQty]  = useState(null);

  return (
    <DashboardShell>
      <FarmerPane
        voiceCrop={voiceCrop}
        voiceQty={voiceQty}
        clearVoice={() => { setVoiceCrop(null); setVoiceQty(null); }}
        onVoice={() => {}}
        onEdit={() => {}}
      />
    </DashboardShell>
  );
}
