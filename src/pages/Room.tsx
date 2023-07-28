import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { BiShow, BiHide, BiMicrophoneOff, BiMicrophone, BiSolidPhone } from "react-icons/bi";
export default function Room() {
    const [stream, setStream] = useState<MediaStream>();
    const [muted, setMuted] = useState<boolean>(false);
    const [enabled, setEnabled] = useState<boolean>(false);
    const [userConnection, setUserConnection] = useState<boolean>(false);
    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection>();
    const socket = useRef<Socket>();
    const { id } = useParams();
    const navigate = useNavigate();

    const getMedia = async (deviceId: any = null) => {
        try {
            const initialConstrains = { audio: true, video: { facingMode: "user" } };
            const cameraConstrains = {
                audio: true,
                video: {
                    deviceId: { exact: deviceId },
                },
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(
                deviceId ? cameraConstrains : initialConstrains
            );
            setStream(mediaStream);
            if (myVideo.current) {
                myVideo.current.srcObject = mediaStream;
            }
            if (!(peerConnection.current && socket.current)) return;

            mediaStream?.getTracks().forEach((track) => {
                if (!peerConnection.current) return;
                peerConnection.current.addTrack(track, mediaStream);
            });

            peerConnection.current.onicecandidate = handleIce;
            peerConnection.current.ontrack = handleTrack;
            if (!deviceId) {
                await getCameras();
            }
            socket.current.emit("join_room", id);
        } catch (e) {
            console.log(e);
        }
    };

    function handleIce(e: RTCPeerConnectionIceEvent) {
        socket.current?.emit("iceCandidate", e.candidate, id);
    }

    function handleTrack(e: RTCTrackEvent) {
        if (!userVideo.current) return;
        userVideo.current.srcObject = e.streams[0];
        setUserConnection(true);
    }

    const getCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter((device) => device.kind === "videoinput");
            const currentCamera = stream?.getVideoTracks()[0];
            cameras.forEach((camera) => {
                const option = document.createElement("option");
                option.value = camera.deviceId;
                option.innerText = camera.label;
                if (currentCamera?.label === camera.label) {
                    option.selected = true;
                }
            });
        } catch (e) {
            console.log(e);
        }
    };

    useEffect(() => {
        socket.current = io("http://localhost:8080");
        peerConnection.current = new RTCPeerConnection();

        if (socket.current) {
            socket.current.emit("enter_room", id);
            socket.current.on("welcome", async () => {
                if (!(socket.current && peerConnection.current)) return;
                const offer = await peerConnection.current.createOffer();
                peerConnection.current?.setLocalDescription(offer);
                socket.current.emit("offer", offer, id);
            });
            socket.current.on("getOffer", async (offer: RTCSessionDescription) => {
                if (!(socket.current && peerConnection.current)) return;
                peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnection.current?.createAnswer();
                peerConnection.current.setLocalDescription(answer);
                socket.current.emit("answer", answer, id);
            });

            socket.current.on("getAnswer", (answer: RTCSessionDescription) => {
                if (!(socket.current && peerConnection.current)) return;
                peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            });
            socket.current.on("getIceCandidate", async (candidate: RTCIceCandidate) => {
                await peerConnection.current?.addIceCandidate(candidate);
            });
            socket.current.on("exit", () => {
                if (userVideo.current) userVideo.current.srcObject = null;
                setUserConnection(false);
            });
        }

        getMedia();

        return () => {
            exitVideo();
        };
    }, []);

    const exitVideo = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        if (socket.current) {
            socket.current.disconnect();
        }

        navigate("/");
    };

    const onToggleMute = () => {
        stream?.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
        setMuted((pre) => !pre);
    };
    const onToggleEnabled = () => {
        stream?.getVideoTracks().forEach((video) => (video.enabled = !video.enabled));
        setEnabled((pre) => !pre);
    };

    return (
        <main className="">
            <div className="w-screen h-screen relative ">
                <article
                    style={{
                        transform: `${
                            userConnection ? "scale(0.3) translate(90%, 90%)  " : "scale(1)"
                        }`,
                    }}
                    className={`w-screen h-screen absolute transition-all ease-linear duration-300 `}
                >
                    <video
                        className={`bg-black  min-h-[400px] w-full h-full `}
                        autoPlay
                        ref={myVideo}
                    />
                </article>
                <article className={`w-screen h-screen `}>
                    <video
                        className={`bg-black h-full w-full  ${userConnection ? "" : "hidden"}`}
                        autoPlay
                        ref={userVideo}
                    />
                </article>
            </div>
            <nav className="space-x-5 w-full fixed bottom-0 h-14">
                <div className="w-full h-14 fixed bg-slate-300 opacity-50"></div>
                <div className="space-x-5 w-full h-full relative flex justify-center items-center">
                    <button className="rounded-full h-10 w-10 p-2" onClick={onToggleMute}>
                        {muted ? (
                            <BiMicrophoneOff className="w-full h-full text-white" />
                        ) : (
                            <BiMicrophone className="w-full h-full text-white" />
                        )}
                    </button>
                    <button className="rounded-full h-10 w-10 p-2 bg-red-600" onClick={exitVideo}>
                        <BiSolidPhone className="w-full h-full text-white" />
                    </button>
                    <button className="rounded-full h-10 w-10 p-2 " onClick={onToggleEnabled}>
                        {enabled ? (
                            <BiHide className="w-full h-full text-white" />
                        ) : (
                            <BiShow className="w-full h-full text-white" />
                        )}
                    </button>
                </div>
            </nav>
        </main>
    );
}
