<script lang="ts">
    let offerCode = $state("");
    let answerCode = $state("");

    let localVideo: HTMLVideoElement;
    let remoteVideo: HTMLVideoElement;

    let pc: RTCPeerConnection;

    function createPeer() {
        pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pc.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0];
        };
    }

    async function setupVideoStreams() {
        let localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        localVideo.srcObject = localStream;

        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        });
    }

    async function createSession() {
        createPeer();
        await setupVideoStreams();

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // wait till all ice candidates is done
        // then set the offer
        await new Promise((resolve) => {
            if (pc.iceGatheringState === "complete") return resolve(null);
            pc.onicegatheringstatechange = () => {
                if (pc.iceGatheringState === "complete") resolve(null);
            };
        });

        offerCode = btoa(JSON.stringify(pc.localDescription));
    }

    async function joinSession() {
        createPeer();
        await setupVideoStreams();

        const decodedOffer = JSON.parse(atob(offerCode));
        await pc.setRemoteDescription(decodedOffer);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // wait till all ice candidates is done
        // then set the answer
        await new Promise((resolve) => {
            if (pc.iceGatheringState === "complete") return resolve(null);
            pc.onicegatheringstatechange = () => {
                if (pc.iceGatheringState === "complete") resolve(null);
            };
        });

        answerCode = btoa(JSON.stringify(pc.localDescription));
    }

    // for host to take answerCode from remote user and accept it
    async function acceptAnswer() {
        const decoded = JSON.parse(atob(answerCode));
        await pc.setRemoteDescription(decoded);
        console.log("ANSWER ACCEPTED");
    }
</script>

<div class="flex flex-col h-screen p-4 gap-4">
    <div class="flex flex-row gap-4 justify-center">
        <video
            bind:this={localVideo}
            autoplay
            playsinline
            muted
            class="w-1/2 bg-black rounded"
        ></video>

        <video
            bind:this={remoteVideo}
            autoplay
            playsinline
            class="w-1/2 bg-black rounded"
        ></video>
    </div>

    <button onclick={createSession}>Host</button>
    <textarea bind:value={offerCode} placeholder="Offer Code"></textarea>

    <button onclick={joinSession}>Join</button>
    <textarea bind:value={answerCode} placeholder="Answer Code"></textarea>

    <button onclick={acceptAnswer}>Accept Answer</button>
</div>
