// Tiles moving across the table: a lifted copy flies from where a tile was to where it lands,
// and a short synthesised click marks the landing when sound is on.

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

let audio: AudioContext | null = null;
let soundOn = false;

export function setSound(on: boolean) {
  soundOn = on;
  if (!on) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') audio.resume();
  } catch {
    soundOn = false;
  }
}

/** A tile set down on a hard table: a bright tick of filtered noise over a short low knock. */
export function clack(strength = 1) {
  if (!soundOn || !audio) return;
  try {
    const t = audio.currentTime;
    const length = Math.floor(audio.sampleRate * 0.05);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 5;
    const noise = audio.createBufferSource();
    noise.buffer = buffer;
    const band = audio.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 2000 + Math.random() * 900;
    band.Q.value = 2.5;
    const tick = audio.createGain();
    tick.gain.value = 0.55 * strength;
    noise.connect(band).connect(tick).connect(audio.destination);
    noise.start(t);

    const knock = audio.createOscillator();
    knock.frequency.setValueAtTime(190, t);
    knock.frequency.exponentialRampToValueAtTime(70, t + 0.07);
    const body = audio.createGain();
    body.gain.setValueAtTime(0.22 * strength, t);
    body.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    knock.connect(body).connect(audio.destination);
    knock.start(t);
    knock.stop(t + 0.1);
  } catch {
    // Audio is a nicety; the game never depends on it.
  }
}

type Flight = {
  from: DOMRect;
  /** The element the tile lands as. It stays hidden until the flying copy arrives. */
  to: Element;
  /** Starts face down and turns over on the way (a computer's tile, or one from the boneyard). */
  flip?: boolean;
  /** Only the back travels, and nothing is revealed (a computer drawing a tile). */
  backOnly?: Element;
  duration?: number;
  delay?: number;
  strength?: number;
};

const back = (upright: boolean) =>
  upright
    ? '<svg class="domino domino-back" viewBox="0 0 50 100"><rect x="1" y="1" width="48" height="98" rx="5" class="domino-back-face"/><circle cx="25" cy="50" r="3.2" class="domino-back-pin"/></svg>'
    : '<svg class="domino domino-back" viewBox="0 0 100 50"><rect x="1" y="1" width="98" height="48" rx="5" class="domino-back-face"/><circle cx="50" cy="25" r="3.2" class="domino-back-pin"/></svg>';

/** Flies a copy of a tile from one place to another along a short arc, lifted at the top of it. */
export function fly({ from, to, flip = false, backOnly, duration = 520, delay = 0, strength = 1 }: Flight) {
  const target = (backOnly ?? to) as HTMLElement | SVGElement;
  const end = target.getBoundingClientRect();
  if (!end.width || !from.width) return;

  const landing = to as HTMLElement;
  if (!backOnly) landing.style.visibility = 'hidden';

  const ghost = document.createElement('div');
  ghost.className = 'tile-ghost';
  // A tile that ends upright (a double) or is drawn on its side keeps the shape of where it lands.
  const upright = end.height > end.width;
  Object.assign(ghost.style, { left: `${end.left}px`, top: `${end.top}px`, width: `${end.width}px`, height: `${end.height}px` });

  const card = document.createElement('div');
  card.className = 'tile-ghost-card';
  if (backOnly) {
    card.innerHTML = back(upright);
  } else {
    const face = to.cloneNode(true) as HTMLElement;
    face.removeAttribute('style');
    face.classList.add('tile-ghost-face');
    if (flip) {
      face.classList.add('is-turned');
      const turned = document.createElement('div');
      turned.className = 'tile-ghost-back';
      turned.innerHTML = back(upright);
      card.append(turned);
    }
    card.append(face);
  }
  ghost.append(card);
  document.body.append(ghost);

  const startTurn = upright && from.width > from.height ? -90 : 0;
  const scale = (startTurn ? from.width / end.height : from.width / end.width) || 1;
  const dx = from.left + from.width / 2 - (end.left + end.width / 2);
  const dy = from.top + from.height / 2 - (end.top + end.height / 2);
  const lift = Math.min(48, 16 + Math.hypot(dx, dy) * 0.08);

  const path = ghost.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) rotate(${startTurn}deg) scale(${scale})` },
      { offset: 0.55, transform: `translate(${dx * 0.35}px, ${dy * 0.35 - lift}px) rotate(${startTurn * 0.3 - 4}deg) scale(1.1)` },
      { offset: 0.86, transform: 'translate(0, 0) rotate(0deg) scale(0.96)' },
      { transform: 'none' },
    ],
    { duration, delay, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'backwards' },
  );
  ghost.animate(
    [
      { boxShadow: '0 0 0 0 rgb(15 74 53 / 0)' },
      { offset: 0.55, boxShadow: '0 12px 32px -8px rgb(15 74 53 / 0.28)' },
      { offset: 0.86, boxShadow: '0 0 0 0 rgb(15 74 53 / 0)' },
      { boxShadow: '0 0 0 0 rgb(15 74 53 / 0)' },
    ],
    { duration, delay, fill: 'backwards' },
  );
  if (flip && !backOnly) {
    card.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }], {
      duration: duration * 0.5,
      delay: delay + duration * 0.2,
      easing: 'cubic-bezier(0.45, 0, 0.2, 1)',
      fill: 'both',
    });
  }

  const land = window.setTimeout(() => clack(strength), delay + duration * 0.86);
  const done = () => {
    window.clearTimeout(land);
    landing.style.visibility = '';
    ghost.remove();
  };
  path.onfinish = done;
  path.oncancel = done;
}

/** A marker token dropped onto a train. */
export function dropMarker(el: Element) {
  clack(0.5);
  el.animate(
    [
      { transform: 'translateY(-20px) scale(1.5)', opacity: 0 },
      { offset: 0.7, transform: 'translateY(0) scale(0.9)', opacity: 1 },
      { transform: 'none', opacity: 1 },
    ],
    { duration: 380, easing: 'cubic-bezier(0.3, 0, 0.2, 1)' },
  );
}
