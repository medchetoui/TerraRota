// Enregistrement du navigateur (webm/ogg) → WAV PCM 16 bits mono 16000 Hz, silences du début et de la fin retirés.

const FREQUENCE = 16000;
const SEUIL = 0.02;
const MARGE_S = 0.15;

function rogner(data: Float32Array, frequence: number): Float32Array {
  let debut = 0;
  let fin = data.length - 1;
  while (debut < data.length && Math.abs(data[debut]) < SEUIL) debut++;
  while (fin > debut && Math.abs(data[fin]) < SEUIL) fin--;
  if (debut >= fin) return data;
  const marge = Math.round(MARGE_S * frequence);
  return data.subarray(Math.max(0, debut - marge), Math.min(data.length, fin + marge));
}

export function encoderWav(data: Float32Array, frequence = FREQUENCE): Blob {
  const tampon = new ArrayBuffer(44 + data.length * 2);
  const v = new DataView(tampon);
  const ecrire = (pos: number, texte: string) => { for (let i = 0; i < texte.length; i++) v.setUint8(pos + i, texte.charCodeAt(i)); };
  ecrire(0, 'RIFF');
  v.setUint32(4, 36 + data.length * 2, true);
  ecrire(8, 'WAVE');
  ecrire(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, frequence, true);
  v.setUint32(28, frequence * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ecrire(36, 'data');
  v.setUint32(40, data.length * 2, true);
  for (let i = 0; i < data.length; i++) {
    const x = Math.max(-1, Math.min(1, data[i]));
    v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  return new Blob([tampon], { type: 'audio/wav' });
}

export async function versWavMono16k(enregistrement: Blob): Promise<{ wav: Blob; secondes: number }> {
  const ctx = new AudioContext();
  const audio = await ctx.decodeAudioData(await enregistrement.arrayBuffer());
  await ctx.close();
  const hors = new OfflineAudioContext(1, Math.max(1, Math.ceil(audio.duration * FREQUENCE)), FREQUENCE);
  const source = hors.createBufferSource();
  source.buffer = audio;
  source.connect(hors.destination);
  source.start();
  const rendu = await hors.startRendering();
  const data = rogner(rendu.getChannelData(0), FREQUENCE);
  return { wav: encoderWav(data), secondes: data.length / FREQUENCE };
}
