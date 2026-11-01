import { useEffect, useState } from 'react';
import ScoreSheet from './ScoreSheet';
import { GENERIC_DEFAULTS, GENERIC_EVENT, genericGame, loadSettings, type GenericSettings } from '../lib/generic';

/** The live blank sheet on the stage; rebuilds whenever the settings panel publishes new settings. */
export default function GenericStage() {
  const [settings, setSettings] = useState<GenericSettings>(GENERIC_DEFAULTS);

  useEffect(() => {
    setSettings(loadSettings());
    const onChange = (e: Event) => setSettings((e as CustomEvent<GenericSettings>).detail);
    window.addEventListener(GENERIC_EVENT, onChange);
    return () => window.removeEventListener(GENERIC_EVENT, onChange);
  }, []);

  const game = genericGame(settings);
  return <ScoreSheet key={`${game.slug}-${settings.players}`} mode="live" game={game} />;
}
