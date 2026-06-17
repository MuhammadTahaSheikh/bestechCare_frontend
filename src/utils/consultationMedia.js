/** Request the widest practical webcam view (head + shoulders, not tight face crop). */
async function applyWidestZoom(videoTrack) {
  const capabilities = videoTrack.getCapabilities?.();
  if (!capabilities?.zoom) return;

  const minZoom = typeof capabilities.zoom.min === 'number' ? capabilities.zoom.min : 1;

  try {
    await videoTrack.applyConstraints({ advanced: [{ zoom: minZoom }] });
  } catch {
    try {
      await videoTrack.applyConstraints({ zoom: minZoom });
    } catch {
      // Zoom constraint not supported on this device/browser.
    }
  }
}

export async function getConsultationMediaStream() {
  const wideConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
    video: {
      facingMode: 'user',
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      aspectRatio: { ideal: 16 / 9 },
      resizeMode: 'none',
    },
  };

  let stream;

  try {
    stream = await navigator.mediaDevices.getUserMedia(wideConstraints);
  } catch {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    });
  }

  const videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) {
    await applyWidestZoom(videoTrack);
  }

  return stream;
}
