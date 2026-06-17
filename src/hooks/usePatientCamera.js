import { useState, useEffect, useRef, useCallback } from 'react';

export function usePatientCamera({ enabled = true } = {}) {
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not supported in this browser.');
      return false;
    }

    setCameraError('');
    setPermissionDenied(false);

    try {
      stopCamera();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraOn(true);
      return true;
    } catch (err) {
      const denied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setPermissionDenied(denied);
      setCameraError(
        denied
          ? 'Camera access was denied. Allow camera permission to join the video call.'
          : 'Could not open camera. Please try again.'
      );
      setCameraOn(false);
      return false;
    }
  }, [enabled, stopCamera]);

  const toggleCamera = useCallback(async () => {
    if (cameraOn) {
      stopCamera();
      return false;
    }
    return startCamera();
  }, [cameraOn, startCamera, stopCamera]);

  useEffect(() => {
    if (!enabled) {
      stopCamera();
      return undefined;
    }

    let cancelled = false;

    (async () => {
      const ok = await startCamera();
      if (cancelled && ok) stopCamera();
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [enabled, startCamera, stopCamera]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) {
      video.play().catch(() => {});
    }
  }, [stream]);

  return {
    videoRef,
    cameraOn,
    cameraError,
    permissionDenied,
    startCamera,
    stopCamera,
    toggleCamera,
  };
}
