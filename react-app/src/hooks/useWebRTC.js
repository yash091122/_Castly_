import { useState, useRef, useCallback, useEffect } from 'react';

export function useWebRTC() {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    const peerConnectionRef = useRef(null);

    const startLocalStream = useCallback(async () => {
        try {
            setIsConnecting(true);
            setError(null);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            setLocalStream(stream);
            setIsConnecting(false);
            return stream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            setError('Could not access camera/microphone. Please check permissions.');
            setIsConnecting(false);

            // Return a placeholder for demo purposes
            return null;
        }
    }, []);

    const stopLocalStream = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
    }, [localStream]);

    const toggleAudio = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        } else {
            setIsAudioEnabled(prev => !prev);
        }
    }, [localStream]);

    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        } else {
            setIsVideoEnabled(prev => !prev);
        }
    }, [localStream]);

    const startCall = useCallback(async () => {
        await startLocalStream();
    }, [startLocalStream]);

    const endCall = useCallback(() => {
        stopLocalStream();
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setRemoteStreams([]);
    }, [stopLocalStream]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [localStream]);

    return {
        localStream,
        remoteStreams,
        isAudioEnabled,
        isVideoEnabled,
        isConnecting,
        error,
        startCall,
        endCall,
        toggleAudio,
        toggleVideo,
        startLocalStream,
        stopLocalStream
    };
}

export default useWebRTC;
