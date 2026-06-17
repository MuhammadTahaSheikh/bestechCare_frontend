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
      autoGainControl: true,
    },
    video: {
      facingMode: 'user',
      width: { ideal: 1280, max: 1280 },
      height: { ideal: 720, max: 720 },
      aspectRatio: { ideal: 16 / 9 },
      frameRate: { ideal: 24, max: 30 },
    },
  };

  let stream;

  try {
    stream = await navigator.mediaDevices.getUserMedia(wideConstraints);
  } catch {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280, max: 1280 },
        height: { ideal: 720, max: 720 },
        frameRate: { ideal: 24, max: 30 },
      },
      audio: true,
    });
  }

  const videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) {
    await applyWidestZoom(videoTrack);
  }

  return stream;
}

/** Cap outgoing bitrate/resolution so the remote side does not stutter on slower uploads. */
export async function optimizeOutgoingVideo(peerConnection) {
  const senders = peerConnection.getSenders().filter((sender) => sender.track?.kind === 'video');

  await Promise.all(
    senders.map(async (sender) => {
      try {
        const params = sender.getParameters();
        if (!params.encodings?.length) {
          params.encodings = [{}];
        }

        params.encodings[0].maxBitrate = 600_000;
        params.encodings[0].maxFramerate = 24;
        params.encodings[0].scaleResolutionDownBy = 1.5;

        await sender.setParameters(params);
      } catch {
        // Some browsers reject encoding tweaks until the connection is stable.
      }
    })
  );
}

export function attachRemoteStream(videoEl, stream) {
  if (!videoEl || !stream) return;

  videoEl.srcObject = stream;
  videoEl.setAttribute('playsinline', 'true');
  videoEl.setAttribute('webkit-playsinline', 'true');

  const play = () => videoEl.play().catch(() => {});
  if (videoEl.readyState >= 2) {
    play();
  } else {
    videoEl.onloadedmetadata = play;
  }
}
