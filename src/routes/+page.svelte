<script lang="ts">
    import {
        createAnswer,
        createCandidates,
        createRoom,
        deleteCandidates,
        getCandidates,
        getRoom,
    } from "./call.remote";

    let code = $state("");

    let localVideo: HTMLVideoElement;
    let remoteVideo: HTMLVideoElement;

    let pc: RTCPeerConnection;
    let localStream: MediaStream;
    let remoteStream: MediaStream;
    let polling: NodeJS.Timeout | null = null;

    const config = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    function initPeerConnection(role: "offer" | "answer") {
        pc = new RTCPeerConnection(config);

        pc.onicecandidate = ({ candidate }) => {
            if (!candidate) return;

            createCandidates({
                roomID: code,
                role,
                candidate: JSON.stringify(candidate),
            });
        };

        pc.onconnectionstatechange = () => {
            console.log(pc.connectionState);
            if (pc.connectionState === "connected") stopPolling();
        };
    }

    async function setupStreams() {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        localStream
            .getTracks()
            .forEach((track) => pc.addTrack(track, localStream));

        localVideo.srcObject = localStream;

        remoteStream = new MediaStream();
        pc.ontrack = ({ streams }) => {
            streams[0]
                .getTracks()
                .forEach((track) => remoteStream.addTrack(track));
        };
        remoteVideo.srcObject = remoteStream;
    }

    function stopPolling() {
        if (polling) {
            clearInterval(polling);
            polling = null;
            console.log("Signaling finished, polling stopped");
            deleteCandidates(code);
            console.log("Cleaning up ICE candidates");
        }
    }

    function startPolling(
        onRemoteDescription: (room: any) => Promise<void>,
        candidateRole: "offer" | "answer",
    ) {
        polling = setInterval(async () => {
            const room = await getRoom(code);
            await onRemoteDescription(room);

            const candidates = await getCandidates(code);
            for (const can of candidates) {
                if (can.role === candidateRole && can.candidate) {
                    await pc.addIceCandidate(JSON.parse(can.candidate));
                }
            }
        }, 500);
    }

    async function startCall() {
        initPeerConnection("offer");
        await setupStreams();

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await createRoom({
            roomID: code,
            offer: JSON.stringify(offer),
        });

        let answerSet = false;

        startPolling(async (room) => {
            if (!answerSet && room?.answer) {
                await pc.setRemoteDescription(JSON.parse(room.answer));
                answerSet = true;
            }
        }, "answer");
    }

    async function joinCall() {
        initPeerConnection("answer");
        await setupStreams();

        let offerSet = false;

        startPolling(async (room) => {
            if (!offerSet && room?.offer) {
                await pc.setRemoteDescription(JSON.parse(room.offer));
                offerSet = true;

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                await createAnswer({
                    roomID: code,
                    answer: JSON.stringify(answer),
                });
            }
        }, "offer");
    }
</script>

<div class="flex flex-col items-center gap-2 h-fit">
    <input type="text" placeholder="code" bind:value={code} />

    <button onclick={startCall}>START CALL</button>
    <button onclick={joinCall}>JOIN CALL</button>

    <video
        bind:this={localVideo}
        autoplay
        muted
        playsinline
        class="rounded bg-black"
    ></video>

    <video
        bind:this={remoteVideo}
        autoplay
        playsinline
        class="rounded bg-black"
    >
    </video>
</div>
