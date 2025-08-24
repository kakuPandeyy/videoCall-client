
import React, { useRef, useState, useEffect, useCallback, use } from 'react';
import { Video, VideoOff, Phone, PhoneOff, Mic, MicOff,Monitor, MonitorOff,Fullscreen ,Minimize  } from 'lucide-react';
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import "../../App.css"
import { useNavigate } from "react-router-dom";



 
export default function Room() {
  const { roomId,username } = useParams();
  const navigate = useNavigate()
  const mySocketRef = useRef()
  const partnerSocketId = useRef()
  const peerRef = useRef()
  const localStreamRef = useRef()
  const remoteVideoRef = useRef()


  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream,setScreenStream]= useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isFullScreen,setIsFullScreen]=  useState(false)



  const iceServers = {
    iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                // Add more STUN servers for better connectivity
                { urls: 'stun:stun.services.mozilla.com' },
                { urls: 'stun:stun.stunprotocol.org:3478' } ,
      {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-password'
    }
    ]
  };




  // Initialize local video stream
  const initializeLocalStream = useCallback(async () => {
    try {
      console.log('Requesting user media...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('Got local stream:', stream);
      setLocalStream(stream);

      // Set the video source AFTER we have the ref
      if (localStreamRef.current) {
        localStreamRef.current.srcObject = stream;
        console.log('Local video ref assigned');
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access camera/microphone. Please check permissions.');
      return null;
    }
  }, []);


  useEffect(()=>{
    if (localStreamRef.current&&localStream) {
      localStream.current = localStream
    }
   

  },[localStream])


   useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);


   useEffect(() => {
    if (screenStream && localStreamRef.current && isScreenSharing) {
      localStreamRef.current.srcObject = screenStream;
    }
  }, [screenStream, isScreenSharing]);




   const createPeer = useCallback(() => {
    try {
      

      const peer = new RTCPeerConnection(iceServers);



  
      // peer.onnegotiationneeded =  handleNegotiation
    
      

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('New ICE candidate:', event.candidate);
            if (event.candidate) {
               mySocketRef.current.emit("ice-candidate",{target:partnerSocketId.current,candidate:event.candidate})
             }
        }
      };

      // Handle remote stream
      peer.ontrack = (event) => {
        console.log('Received remote track:', event);
        const [stream] = event.streams;
        setRemoteStream(stream);
      };

      // Connection state monitoring
      peer.onconnectionstatechange = () => {
        setConnectionStatus(peer.connectionState);
        console.log('Connection state:', peer.connectionState);
        
      };
      peer.onnegotiationneeded = handleNegotiation

      peerRef.current = peer

      return peer;

    } catch (error) {
      console.error('Error creating peer connection:', error);
      return null;
    }
  }, []);



  useEffect(()=>{
    if (connectionStatus==="connected") {
      setIsCallActive(true)
    }
   
    if (connectionStatus ==="disconnected"&& isCallActive ) {
      endCall()
      setIsCallActive(false)
    }
  },[connectionStatus])

 







// function handleTrack(remoteTracks){

//    console.log("Remote streams:", remoteTracks.streams);
// console.log("Tracks:", remoteTracks.track);
        
//         if (remoteVideoRef.current) {
//           remoteVideoRef.current.srcObject = remoteTracks.streams[0];
//         }


// }

async function handleNegotiation() {
  try{
    
    
      const offer = await peerRef.current.createOffer()
     await peerRef.current.setLocalDescription(offer)
  const payload = {
    target:partnerSocketId.current,
    caller:mySocketRef.current.id,
    sdp: peerRef.current.localDescription
  }
  
  console.log("offer",payload)
  mySocketRef.current.emit("offer",payload)
  

  }catch(e){
    console.log("error negotiation",e)
  }
}

  const startScreenShare = async () => {
    try {
      console.log('Starting screen share...');
      const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true // Include system audio if available
      });

      console.log('Got screen share stream:', screenShareStream);
      setScreenStream(screenShareStream);
      setIsScreenSharing(true);

      // Handle when user stops screen share via browser UI
      screenShareStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Screen share ended by user');
        stopScreenShare();
      });

      // If we have an active peer connection, replace the video track
      if (peerRef.current) {
        const videoSender = peerRef.current.getSenders().find(
          sender => sender.track && sender.track.kind === 'video'
        );
        
        if (videoSender) {
          await videoSender.replaceTrack(screenShareStream.getVideoTracks()[0]);
          console.log('Replaced video track with screen share');
        }
      }

    } catch (error) {
      console.error('Error starting screen share:', error);
      alert('Could not start screen share. Please check permissions.');
    }
  };

  // Stop screen sharing
  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        track.stop();
      });
      setScreenStream(null);
    }
    
    setIsScreenSharing(false);

    // Switch back to camera if we have local stream and active connection
    if (localStream & peerRef.current) {
      const videoSender = peerRef.current.getSenders().find(
        sender => sender.track && sender.track.kind === 'video'
      );
      
      if (videoSender && localStream.getVideoTracks()[0]) {
        videoSender.replaceTrack(localStream.getVideoTracks()[0]);
        console.log('Switched back to camera');
      }
    }
  };


  const startCall = async () => {
    try {
      // Get local stream first
      const stream = await initializeLocalStream();
      if (!stream) return;

      // Create peer connection
      peerRef.current = createPeer();
      if (!peerRef.current) return;

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track);
        peerRef.current.addTrack(track, stream);
      });

      
      console.log('Call started successfully');

    } catch (error) {
      console.error('Error starting call:', error);
    }
  };



   const endCall = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      setLocalStream(null);
    }

    // Close peer connection
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    // Clear video elements
    if (localStreamRef.current) {
      localStreamRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setRemoteStream(null);
    setIsCallActive(false);
    setConnectionStatus('disconnected');
  };


  const toggleRemoteFullscreen = async () => {
    if (!remoteVideoRef.current) return;

    try {
      if (!isFullScreen) {
        // Enter fullscreen
        if (remoteVideoRef.current.requestFullscreen) {
          await remoteVideoRef.current.requestFullscreen();
        } else if (remoteVideoRef.current.webkitRequestFullscreen) {
          // Safari support
          await remoteVideoRef.current.webkitRequestFullscreen();
        } else if (remoteVideoRef.current.mozRequestFullScreen) {
          // Firefox support
          await remoteVideoRef.current.mozRequestFullScreen();
        } else if (remoteVideoRef.current.msRequestFullscreen) {
          // IE/Edge support
          await remoteVideoRef.current.msRequestFullscreen();
        }
      } 
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };






// async function answer(offer) {

 
//    peerRef.current = createPeer(false)
//     await  peerRef.current.setRemoteDescription(offer)
    
//     console.log(localStreamRef.current.srcObject)
//    await localStreamRef.current.srcObject.getTracks().forEach(element => {
//    peerRef.current.addTrack(element,localStreamRef.current.srcObject)
//  });
  

//   const answer = await peerRef.current.createAnswer()
//    await peerRef.current.setLocalDescription(answer)

  
  
 
// }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };


 const createAnswer = async (offer) => {
    if (!peerRef.current) return;

    try {
       await peerRef.current.setRemoteDescription(offer)
      
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      
      // In a real app, send this offer to the remote peer


        const payload = {
           target:partnerSocketId.current,
           caller:mySocketRef.current.id,
           sdp: peerRef.current.localDescription
         }
  
      mySocketRef.current.emit("answer",payload)
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Create answer (for callee)
  const answerCall = async (offer) => {
    try{

       const stream = await initializeLocalStream();
      if (!stream) return;

      // Create peer connection
       peerRef.current = createPeer();
      if (!peerRef.current) return;

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track);
        peerRef.current.addTrack(track, stream);
      });

      createAnswer(offer)

    }catch(e){
      console.log(e)
    }

  };






  

  useEffect(() => {

  


  mySocketRef.current = io("http://localhost:8000");
  


    mySocketRef.current.emit("join-room", { roomId,username });
    
    mySocketRef.current.on("ice-candidate",async (candidate)=>{
       try {
        if (peerRef.current&& peerRef.current.remoteDescription) {
          peerRef.current.addIceCandidate(candidate);
        }
       
     } catch (e) {
    console.error("Error adding ice candidate", e);
     }
      })
  
    mySocketRef.current.on("joined-user",async (id) => {

      partnerSocketId.current = id

      startCall()


      console.log("User joined:", id);

      

      console.log("caller")

      // mySocketRef.current.on("offer",payload=>{

      //   console.log("offer com in fornt")
      //    console.log("offer coming",payload.sdp)
      //    answerCall(payload.sdp)
      // }
      
      // )

           mySocketRef.current.on("answer",payload=>{
      
        peerRef.current.setRemoteDescription(payload.sdp)
        
       })

    });


    mySocketRef.current.on("host-user", (id) => {


       partnerSocketId.current = id
      
      //  
       
      console.log("host joined:", id);

       mySocketRef.current.on("offer",payload=>{

        console.log("offer com in fornt")
         console.log("offer coming",payload.sdp)
         answerCall(payload.sdp)
      }
      
      )
    
       
  
    });

    mySocketRef.current.on("user-already",()=>{
      alert("user already exist")
    })

     mySocketRef.current.on("room-full",()=>{
      alert(" room is full or same name user already there try another")
    })
    
    


     return () => {
      
    mySocketRef.current.disconnect();
  };



   
  }, [ ]);


  // function handleHangUp() {
  



  //   if (peerRef.current) {
  //   peerRef.current.close();
  // }
  //  navigate("/")

  // }

  return (
    <>
       <div className="min-h-screen  p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          WebRTC Video Call App
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Local Video */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-700">
              <h2 className="text-white font-semibold flex items-center gap-2">
                Local Video (You)
                {isScreenSharing && (
                  <span className="text-blue-400 text-sm flex items-center gap-1">
                    <Monitor size={16} />
                    Screen Sharing
                  </span>
                )}
              </h2>
            </div>
            <div className="aspect-video bg-black relative">
              <video
                ref={localStreamRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && !isScreenSharing && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <VideoOff className="text-gray-400" size={48} />
                </div>
              )}
              {isScreenSharing && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                  Sharing Screen
                </div>
              )}
            </div>
          </div>

          {/* Remote Video */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-700">
              <h2 className="text-white font-semibold">Remote Video</h2>
            </div>
            <div className="aspect-video bg-black relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <div className="text-center text-gray-400">
                    <Video size={48} className="mx-auto mb-2" />
                    <p>Waiting for remote video...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-center items-center gap-4 mb-4">
            {connectionStatus==="connected"&& (
              <div className="flex gap-4">
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-lg transition-colors ${
                    isVideoEnabled 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
                
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-lg transition-colors ${
                    isAudioEnabled 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                <button
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  className={`p-3 rounded-lg transition-colors ${
                    isScreenSharing 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                </button>
              
                <button
                onClick={toggleRemoteFullscreen}

                >
                <Fullscreen size={20}/>
                </button>
                
                
                <button
                  onClick={endCall}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <PhoneOff size={20} />
                  End Call
                </button>
              </div>
            ) }
          </div>

          {/* Status */}
          <div className="text-center">
            <p className="text-gray-400">
              Connection Status: 
              <span className={`ml-2 font-semibold ${
                connectionStatus === 'connected' ? 'text-green-400' :
                connectionStatus === 'connecting' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {connectionStatus}
              </span>
            </p>
          </div>
        </div>

        {/* Debug Info */}
        {/* <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">Debug Info:</h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p>Local Stream: {localStream ? '✓ Active' : '✗ Not active'}</p>
            <p>Screen Stream: {screenStream ? '✓ Active' : '✗ Not active'}</p>
            <p>Remote Stream: {remoteStream ? '✓ Active' : '✗ Not active'}</p>
            <p>Peer Connection: {peerRef.current ? '✓ Created' : '✗ Not created'}</p>
            <p>Video Enabled: {isVideoEnabled ? '✓' : '✗'}</p>
            <p>Audio Enabled: {isAudioEnabled ? '✓' : '✗'}</p>
            <p>Screen Sharing: {isScreenSharing ? '✓ Active' : '✗ Inactive'}</p>
             <p>isCallActive: {isCallActive ? '✓ Active' : '✗ Inactive'}</p>
          </div>
        </div> */}
      </div>
    </div>
  

      </>
  );
}
