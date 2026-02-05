# TrueTime Meetings by Red5

A real-time video conferencing application built with React and Red5 Pro, featuring multi-participant video calls, screen sharing, chat messaging, and various interactive features.

## Features

### Core Video Conferencing
- **Multi-participant video calls** with up to 30 participants by default
- **Real-time audio/video streaming** using Red5 Pro WebRTC technology
- **Screen sharing** with audio support
- **Play-only mode** for viewers without publishing capabilities
- **Automatic device switching** when devices become unavailable

### Interactive Features
- **Live chat messaging** with real-time delivery
- **Emoji reactions** with floating animations
- **Raise hand functionality** for meeting management
- **Participant list** with status indicators
- **Audio level detection** and visual talker indicators

### Media Controls
- **Camera on/off** with device selection
- **Microphone mute/unmute** with device selection
- **Speaker selection** for audio output
- **Video quality control** with configurable bitrate settings

### Layout Options
- **Auto layout** - Automatically adjusts based on participant count
- **Tiled layout** - Equal-sized video tiles for all participants
- **Sidebar layout** - Pinned main speaker with participant sidebar
- **Pin/unpin participants** for focused viewing

### User Experience
- **Lobby page** for pre-meeting setup and device testing
- **Permission handling** for camera and microphone access
- **Responsive design** with drawer-based UI components
- **Internationalization** support with react-i18next
- **Dark/light theme** support with Material-UI

## Tech Stack

- **Frontend**: React 18+ with Hooks
- **UI Library**: Material-UI (MUI)
- **WebRTC**: Red5 Pro Conference Client
- **State Management**: React useState/useRef
- **Routing**: React Router
- **Notifications**: Notistack
- **Styling**: Material-UI theming
- **Internationalization**: react-i18next

## Installation

```bash
# Clone the repository
git clone https://github.com/red5pro/red5-truetime-meetings
cd truetime-meetings

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npm start
```

## Configuration

### Runtime Configuration (Recommended)

The application supports **runtime configuration** via a JSON file, allowing you to modify settings **after the build** without rebuilding the application. This is the recommended approach for production deployments.

#### Setup

1. **Create `config.json` in the `public` folder** (or use the provided `config.json_prototype` as a template):

```json
{
  "VITE_TURN_SERVER_URL": "stun:stun2.l.google.com:19302",
  "VITE_TURN_SERVER_USERNAME": "",
  "VITE_TURN_SERVER_CREDENTIAL": "",
  "VITE_HOST": "xxx.red5pro.net",
  "VITE_NODE_GROUP": "default",
  "VITE_BACKEND_HOST": "",
  "VITE_ENABLE_CLOSED_CAPTION": "false",
  "VITE_ENABLE_RECORDING": "false",
  "VITE_DEFAULT_THEME": "black",
  "VITE_LOGO_URL": "/logo.svg"
}
```

2. **Update values** in `config.json` to match your Red5 Pro deployment

3. **Build and deploy** - The application will load configuration from `/config.json` at runtime

#### How It Works

- The application fetches `/config.json` on startup (see `src/main.tsx`)
- Configuration values are stored in the runtime config store (`src/utils/configStore.ts`)
- Runtime config values override build-time environment variables
- You can update `config.json` in your deployed application without rebuilding

#### Available Configuration Options

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `VITE_HOST` | string | Red5 Pro host URL | `"xxx.red5pro.net"` |
| `VITE_BACKEND_HOST` | string | Backend API URL | `"xxx.red5pro.net"` |
| `VITE_NODE_GROUP` | string | Red5 Pro node group | `"default"` |
| `VITE_TURN_SERVER_URL` | string | TURN/STUN server URL | `"stun:stun2.l.google.com:19302"` |
| `VITE_TURN_SERVER_USERNAME` | string | TURN server username | `""` |
| `VITE_TURN_SERVER_CREDENTIAL` | string | TURN server credential | `""` |
| `VITE_ENABLE_RECORDING` | string | Enable recording feature | `"true"` or `"false"` |
| `VITE_ENABLE_CLOSED_CAPTION` | string | Enable closed captions | `"true"` or `"false"` |
| `VITE_DEFAULT_THEME` | string | Default UI theme | `"black"` or `"blue"` |
| `VITE_LOGO_URL` | string | Custom logo URL | `"/path/to/logo.svg"` |

### Environment Variables (Development)

For **development purposes**, you can also use environment variables. Create an `.env` file in the root of your project:

```env
VITE_HOST="xxx-xxx-x-oci.red5pro.net"
VITE_BACKEND_HOST="xxx-xxx-x-oci.red5pro.net"
VITE_NODE_GROUP="xxxxxx"
VITE_TURN_SERVER_URL="stun:stun2.l.google.com:19302"
VITE_TURN_SERVER_USERNAME=""
VITE_TURN_SERVER_CREDENTIAL=""
VITE_PUBNUB_PUBLISH_KEY="pub-x-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx"
VITE_PUBNUB_SUBSCRIBE_KEY="sub-x-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx"
VITE_VIRTUAL_BACKGROUND_IMAGES="https://xxx,https://xxx,https://xxx"
VITE_DEFAULT_THEME='black'
VITE_LOGO_URL="https://xxx"
```

> **Note**: Runtime configuration from `config.json` takes precedence over build-time environment variables.

## Docker Deployment

### Docker Setup

The application includes Docker support for containerized deployment with runtime environment variable configuration.

#### Files Structure

- **`Dockerfile`** - Multi-stage build configuration for React app with nginx
- **`ci/docker_startup_script.sh`** - Runtime script for environment variable replacement
- **`env.docker`** - Template file with placeholder values for build-time configuration
- **`nginx.conf`** - Nginx configuration for serving the React app

#### Environment Variables

The Docker setup supports 4 configurable environment variables that are replaced at runtime:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_HOST` | Frontend host URL | `your-frontend-domain.com` |
| `VITE_BACKEND_HOST` | Backend API URL | `your-backend-api.com` |
| `VITE_ENABLE_RECORDING` | Enable recording feature | `true` or `false` |
| `VITE_ENABLE_CLOSED_CAPTION` | Enable closed captions | `true` or `false` |

#### Build Process

1. **Build Time**: The app is built with template variables from `env.docker`
2. **Runtime**: The startup script replaces template variables with actual environment values

#### Usage

**Build the Docker image:**
```bash
docker build -t truetime-meetings .
```

**Run with environment variables:**
```bash
docker run -p 3000:80 \
  -e VITE_HOST=https://your-frontend-domain.com \
  -e VITE_BACKEND_HOST=https://your-backend-api.com \
  -e VITE_ENABLE_RECORDING=true \
  -e VITE_ENABLE_CLOSED_CAPTION=true \
  truetime-meetings
```

**Using docker-compose:**
```yaml
version: '3.8'
services:
  truetime-meetings:
    build: .
    ports:
      - "3000:80"
    environment:
      - VITE_HOST=https://your-frontend-domain.com
      - VITE_BACKEND_HOST=https://your-backend-api.com
      - VITE_ENABLE_RECORDING=true
      - VITE_ENABLE_CLOSED_CAPTION=true
    restart: unless-stopped
```

#### How It Works

1. **Template Variables**: The app is built with `TEMPLATE_VITE_*` placeholders
2. **Runtime Replacement**: The startup script finds and replaces these placeholders with actual environment values
3. **Nginx Serving**: The app is served by nginx with optimized configuration (gzip, caching, security headers)

#### Customization

To add more environment variables:

1. Add the template variable to `env.docker`:
   ```env
   VITE_NEW_VARIABLE=TEMPLATE_VITE_NEW_VARIABLE
   ```

2. Update `ci/docker_startup_script.sh` to handle the new variable:
   ```bash
   # Add environment check
   if [ -z "$VITE_NEW_VARIABLE" ]; then
     echo "VITE_NEW_VARIABLE is not set"
     exit 1
   fi
   
   # Add replacement
   sed -i "s|TEMPLATE_VITE_NEW_VARIABLE|$VITE_NEW_VARIABLE|g" "$PATH_TO_FILE"
   ```

3. Rebuild and run with the new environment variable:
   ```bash
   docker run -p 3000:80 \
     -e VITE_NEW_VARIABLE=your-value \
     truetime-meetings
   ```
   
# Red5 Pro Conference SDK Documentation
Red5 Pro Conference SDK allows you to build advanced conference call applications with unlimited number of participants on top of your Red5 infrastructure(red5cloud-streammanager), supporting screen sharing, subscribe only participants, audio output/input device switching, publish quality changing and audio level monitoring. 



## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Basic Usage](#basic-usage)
  - [Joining a Room](#joining-a-room)
  - [Handling New Participants](#handling-new-participants)
  - [Handle Disconnected Participants](#handle-disconnected-participants)
  - [Leave a Room](#leave-a-room)
  - [Mute Video/Audio](#mute-videoaudio)
  - [Handle Participant Media Updates](#handle-participant-media-updates)
- [Advanced Usage](#advanced-usage)
  - [Screen Sharing](#screen-sharing)
  - [Audio Level Monitoring](#audio-level-monitoring)
  - [Sending/Receiving Chat Message](#sendingreceiving-chat-message)
  - [Change Video Publish Quality](#change-video-publish-quality)
  - [Switch Video/Audio Output Devices](#switch-videoaudio-output-devices)
- [Events](#events)
  - [Connection Events](#connection-events)
  - [Participant Events](#participant-events)
  - [Subscription Events](#subscription-events)
  - [Audio/Video Events](#audiovideo-events)
  - [Screen Share Events](#screen-share-events)
  - [Chat Events](#chat-events)
  - [Event Handler Examples](#event-handler-examples)
  - [Removing Event Listeners](#removing-event-listeners)
  - [Common Patterns](#common-patterns)

## Overview

The Red5 Pro Conference SDK provides a high-level API for building video conferencing applications. It abstracts the complexity of WebRTC management, media handling, and connection management while providing robust features for production use.

### Key Features

- **Real-time Video Conferencing**: Full-duplex audio/video communication
- **Screen Sharing**: Built-in screen capture and sharing capabilities
- **Audio Level Monitoring**: Real-time audio level detection for participants
- **Media Device Management**: Easy camera/microphone switching
- **Role-based Access**: Support for publisher and subscriber roles
- **Chat Messaging**: Built-in text chat functionality
- **Mute/Unmute Controls**: Audio and video muting capabilities
- **Cross-browser Support**: Works across modern browsers

## Installation

### Prerequisites

- Red5 Pro Javascript WebRTC SDK
- ConferenceClient.ts and MediaStreamManager.js
- Red5 Pro Stream Manager(Cloud) deployment

### NPM Installation

```bash
npm install red5pro-webrtc-sdk
```

### Include the SDK Files ConferenceClient.ts and MediaStreamManager.js in same directory

```javascript
import { ConferenceClient } from './ConferenceClient';
```

## Quick Start

Here's a minimal example to get you started:

```javascript
import { ConferenceClient } from './ConferenceClient';

// Initialize the client
client = new ConferenceClient({
        host: 'your-cloud-deployment-host.red5pro.net',
        nodeGroup: 'default',
        maxVideoBitrateKbps: 3000,
        iceServers: [{ urls: 'stun:stun2.l.google.com:19302' }]
        });

// Get user media
const mediaStream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});

// Join a room
await client.join('room-123', 'user-456', '', 'publisher', mediaStream, true, true);

// Listen for events
client.on('user-published', (data) => {
  console.log('Joined successfully:', data.participants);
});

client.on('new-participant', async (data) => {
    console.log('New participant:', data.participant);
    if (data.participant.role === 'publisher') {
    await client.subscribe(data.participant);
    }
});
```
## Basic Usage

### Joining a Room

Get user media stream through media stream manager. We will pass it to join()
```javascript
var video = true
var audio = true
var mediaStream = client.mediaStreamManager.getCurrentStream(video, audio)
```
##### `join(roomId, userId, token, role, mediaStream, videoEnabled, audioEnabled, metaData)`

Join a conference room. If succesfull conference sdk will emit `user-published` event with already existing participants in the room. You can join as publisher or subscriber. Publishers can publish and subscribe(play), meanwhile subscriber role can only subscribe streams.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `roomId` | string | - | Unique room identifier |
| `userId` | string | - | Unique user identifier (stream name) |
| `token` | string | '' | Authentication token |
| `role` | string | 'publisher' | User role ('publisher' or 'subscriber') |
| `mediaStream` | MediaStream | null | User's media stream |
| `videoEnabled` | boolean | true | Initial video state |
| `audioEnabled` | boolean | true | Initial audio state |
| `metaData` | string | null | Additional user metadata |

**Returns:** `Promise<boolean>`

**Example:**
```javascript
client.on('user-published', handleUserPublished);
client.on('subscribe-success', handleSubscribeSuccess);

await client.join(
  'conference-room-id',
  'user-id-123',
  'auth-token',
  'publisher',
  mediaStream,
  true,  // video enabled
  true,  // audio enabled
  { name: 'John Doe', avatar: 'https://...' }
);

const handleUserPublished = async (data) => {
    console.log('User published/joined room success', data);
    await subscribeToParticipants(data.participants);
};

const subscribeToParticipants = async (participantsObj) => {
    for (const [userId, participant] of Object.entries(participantsObj)) {
        if(participant.role === "publisher") {
            await subscribeToParticipant(participant);
        }
    }
};

const subscribeToParticipant = async (participant) => {
    try {
        console.log(`Subscribing to participant: ${participant.uid}`);
        await client.subscribe(participant);
    } catch (error) {
        console.error(`Failed to subscribe to ${participant.uid}:`, error);
    }
};

// Add user to a state for rendering their video on screen.
const handleSubscribeSuccess = (data) => {
    console.log('Subscribe success:', data.uid);
    setSubscribedParticipants(prev => ({
        ...prev,
        [data.uid]: {
            participant: data.participant,
            mediaStream: data.mediaStream
        }
    }));
};

return(
{/* Subscribed participants */}
{Object.keys(subscribedParticipants).length > 0 && (
    <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "15px",
        width: "100%"
    }}>
        <h3 style={{ margin: "0", color: "#333" }}>
            Subscribed Participants ({Object.keys(subscribedParticipants).length})
        </h3>
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "15px",
            width: "100%",
            maxWidth: "1200px"
        }}>
            {Object.entries(subscribedParticipants).map(([userId, subscribedData]) => (
                <div key={userId} style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "5px"
                }}>
                    <span style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#666"
                    }}>
                        User: {userId.substring(0, 8)}...
                    </span>
                    <video
                        id={`red5pro-subscriber-${userId}`}
                        autoPlay
                        playsInline
                        ref={(videoElement) => {
                            if (videoElement && subscribedData.mediaStream && !videoElement.srcObject) {
                                videoElement.srcObject = subscribedData.mediaStream;
                            }
                        }}
                        style={{
                            width: "300px",
                            height: "225px",
                            border: "2px solid #28a745",
                            borderRadius: "8px",
                            backgroundColor: "#000"
                        }}
                    />
                </div>
            ))}
        </div>
    </div>
)}
)

```
### Handling New Participants
When a new participant joins, conference sdk will emit a new event `new-participant`. Listen for this event and subscribe to new participant.

```javascript
client.on('new-participant', handleNewParticipant);

const handleNewParticipant = async (data) => {
    console.log('New participant:', data.participant);
    setParticipants(prev => ({
        ...prev,
        [data.participant.uid]: data.participant
    }));
    
    if(data.participant.role === "publisher") {
        setTimeout(async () => {
            await subscribeToParticipant(data.participant);
        }, 3000);
    }
};

```

### Handle Disconnected Participants
When someones leaves the room, conference client will emit `participant-disconnected` event. Listen for it and remove the user from your participant lists.
```javascript

client.on('participant-disconnected', handleParticipantDisconnected);

const handleParticipantDisconnected = (data) => {
    console.log('Participant disconnected:', data.participant);
    setParticipants(prev => {
        const newParticipants = { ...prev };
        delete newParticipants[data.participant.uid];
        return newParticipants;
    });
    setSubscribedParticipants(prev => {
        const newSubscribed = { ...prev };
        delete newSubscribed[data.participant.uid];
        return newSubscribed;
    });
    setAudioLevels(prev => { // if you handle audio levels, remove from that list also.
        const newLevels = { ...prev };
        delete newLevels[data.participant.uid];
        return newLevels;
    });
};
```

### Leave a Room
Leave a room by calling `leave()` method on conference client.
```javascript
client.leave()
```

### Mute Video/Audio
You can turn off/on camera or mute/unmute your microphone.
```javascript
const handleMuteAudio = () => {    
    if (isAudioMuted) {
        client.unmuteAudio();
    } else {
        client.muteAudio();
    }
};

const handleMuteVideo = () => {
    if (isVideoMuted) {
        client.unmuteVideo();
    } else {
        client.muteVideo();
    }
};
```
### Handle Participant Media Updates
When a participant in room turn on/turn off their camera or mute/unmute their microphone conference sdk will emit `participant-media-update` event. By listening to this event you can update ui accordingly like showing a mic muted icon on participant or puting an overlay to their video if they turned off their camera.

```javascript
client.on('participant-media-update', handleParticipantMediaUpdate);

const handleParticipantMediaUpdate = (data) => {
    console.log('Participant media update:', data);
    const { streamName, videoEnabled, audioEnabled } = data;
    setParticipantMuteStates(prev => ({
        ...prev,
        [streamName]: {
            videoMuted: !videoEnabled,
            audioMuted: !audioEnabled
        }
    }));
};

```

## Advanced Usage

### Screen Sharing
Call `startScreenShare()` method on conference client.
```javascript
 const handleStartScreenShare = async () => {   
    try {
        await client.startScreenShare({
            width: 1920,
            height: 1080,
            frameRate: 30,
            includeAudio: true
        });
    } catch (error) {
        console.error('Failed to start screen share:', error);
        setIsStartingScreenShare(false);
        alert('Failed to start screen share: ' + error.message);
    }
};
```

Sdk will emit events `screen-share-started`, `screen-share-stopped`
You may use such events like below

```javascript
client.on('screen-share-started', handleScreenShareStarted);
client.on('screen-share-stopped', handleScreenShareStopped);

const handleScreenShareStarted = (data) => {
    console.log('Screen share started:', data);
    setIsScreenSharing(true);
    setIsStartingScreenShare(false);
};

const handleScreenShareStopped = () => {
    console.log('Screen share stopped');
    setIsScreenSharing(false);
    setIsStartingScreenShare(false);
};

```
### Audio Level Monitoring
Conference client will emit audio level event for each subscribed participant periodically. You can use this event to display audio levels of participants on screen or as more real world example, you can use it to make a talking indicator.
```javascript
client.on('audio-level', handleAudioLevel);
const handleAudioLevel = (data) => {
    setAudioLevels(prev => ({
        ...prev,
        [data.userId]: data.level.normalized
    }));
};
```
Audio level data includes normalized, rms, dcb. You can use the one you want.

### Sending/Receiving Chat Message
You can send and receive chat message through red5 pro stream manager without relying any 3rd party messaging service. You can use this to exchange any message, build a emoji functionality or room chat box.

```javascript
client.sendChatMessage('Hello world!')
client.on('chat-message', handleChatMessage);
const handleChatMessage = (chatMessage) => {
    console.log("Received chat message", chatMessage);
};
```
### Change Video Publish Quality
You can set maximum video publish bitrate before joining a room or when you are in room and publishing.

While creating conference client, you can set maximum publish quality by passing maxVideoBitrateKbps.
```javascript
client = new ConferenceClient({
    host: 'your-cloud-deployment-host.red5pro.net',
    nodeGroup: 'default',
    maxVideoBitrateKbps: 3000,
    iceServers: [{ urls: 'stun:stun2.l.google.com:19302' }]
    });
```
If you have inited the sdk but not started to publish, you can still change it by reaching config object of conference client and set quality by
```javascript
client.config.maxVideoBitrateKbps = 1000
```

During publishing, you can change publish quality by calling 
```javascript
client.setMaxVideoPublishKbps(1500)
```

Remote participants should see quality increase/drop as soon as you call this.

### Switch Video/Audio Output Devices
Through conference client media stream manager, you can allow users to switch audio input/output and camera devices.

#### Switch Video Device
Use `switchVideoDevice()`, `refreshPublisherStream()`, `cleanupCurrentMediaStream()` and `setCurrentStream()` methods to achieve this on air or before publishing.

See this react example:

```javascript
const cameraSelected = React.useCallback((value) => {
    if (selectedCamera !== value) {
        setSelectedDevices({ videoDeviceId: value })
        try {
        conferenceClient.current.mediaStreamManager.switchVideoDevice(value).then(mediaStream => {
            const tempLocalVideo = document.getElementById('red5pro-publisher')
            tempLocalVideo.srcObject = mediaStream
            conferenceClient.current.refreshPublisherStream(mediaStream).then(r => {
            conferenceClient.current.mediaStreamManager.cleanupCurrentMediaStream()
            conferenceClient.current.mediaStreamManager.setCurrentStream(mediaStream)
            })
        })
        } catch (e) {
        log.log('Local stream is not ready yet.')
        }
    }
}, [selectedCamera, setSelectedDevices])
```
#### Switch Microphone Device
Call `switchAudioDevice()` and refresh users stream. 

React example:
```javascript
const microphoneSelected = React.useCallback((value) => {
    if (selectedMicrophone !== value) {
        setSelectedDevices({ audioDeviceId: value })

        conferenceClient.current.mediaStreamManager.switchAudioDevice(value).then(mediaStream => {
        const tempLocalVideo = document.getElementById('red5pro-publisher')
        tempLocalVideo.srcObject = mediaStream
        conferenceClient.current.refreshPublisherStream(mediaStream).then(r => {
            conferenceClient.current.mediaStreamManager.cleanupCurrentMediaStream()
            conferenceClient.current.mediaStreamManager.setCurrentStream(mediaStream)
        })
        })
    }
}, [selectedMicrophone, setSelectedDevices])
```

#### Switch Audio Output Device
You can even switch audio output device of conference while in a room.

React example:
```javascript
const speakerSelected = React.useCallback((value) => {
if (selectedSpeaker !== value) {
    setSelectedDevices({ speakerDeviceId: value })
    updateAudioOutput(value)
}
}, [selectedSpeaker, setSelectedDevices])

const updateAudioOutput = React.useCallback(async (selectedAudioOutput = selectedSpeaker) => {
console.log('updateAudioOutput', selectedAudioOutput)
if (!('setSinkId' in HTMLMediaElement.prototype) || isNull(selectedAudioOutput)) return

for (let key of Object.keys(participants)) {
    const videoElement = document.getElementById(`red5pro-subscriber-${key}`);
    if (!videoElement) {
    console.warn(`No video element found for participant ${key}`);
    subscribeToParticipants({ [key]: participants[key] })
    continue;
    }

    if (typeof videoElement.setSinkId !== 'function') {
    console.error('setSinkId is not supported in this browser.');
    continue;
    }

    try {
    await videoElement.setSinkId(selectedAudioOutput);
    console.log('Audio output set for', key, 'to', selectedAudioOutput);
    } catch (error) {
    console.error('Error setting audio output for', key, ':', error);
    }
}
}, [selectedSpeaker, participants])

```

## Events

```javascript
import ConferenceClient from './ConferenceClient';

const client = new ConferenceClient({
  host: 'your-host.com',
  nodeGroup: 'default',
  iceServers: [{ urls: 'stun:stun2.l.google.com:19302' }]
});

// Set up event listeners
client.on('join-failed', handleJoinFail);
client.on('user-published', handleUserPublished);
client.on('new-participant', handleNewParticipant);
client.on('participant-disconnected', handleParticipantDisconnected);
client.on('subscribe-success', handleSubscribeSuccess);
client.on('subscribe-failed', handleSubscribeFailed);
client.on('subscribe-stop', handleSubscribeStop);
client.on('audio-level', handleAudioLevel);
client.on('audio-muted', handleAudioMuted);
client.on('video-muted', handleVideoMuted);
client.on('participant-media-update', handleParticipantMediaUpdate);
client.on('connection-closed', handleConnectionClosed);
client.on('connect-fail', handleConnectFail);
client.on('chat-message', handleChatMessage);
client.on('screen-share-started', handleScreenShareStarted);
client.on('screen-share-stopped', handleScreenShareStopped);
```

## Connection Events

### `join-failed`
Emitted when joining a room fails.

**Data:**
- `error` - Error message
- `statusCode` - HTTP status code (401 for unauthorized)

```javascript
client.on('join-failed', (data) => {
  console.log('Join failed:', data.error);
  if (data.statusCode === 401) {
    // Handle unauthorized access
  }
});
```

### `user-published`
Emitted when the user successfully joins and publishes to the room.

**Data:**
- `participants` - Object containing other participants in the room
- `roomState` - Current room state information

```javascript
client.on('user-published', (data) => {
  setIsPublished(true);
  setParticipants(data.participants);
});
```

### `connection-closed`
Emitted when the publisher connection is closed.

```javascript
client.on('connection-closed', () => {
  // Handle connection loss
  handleLeaveFromRoom();
});
```

### `connect-fail`
Emitted when initial connection fails.

```javascript
client.on('connect-fail', () => {
  setIsJoining(false);
  // Show connection error
});
```

## Participant Events

### `new-participant`
Emitted when a new participant joins the room.

**Data:**
- `participant` - Participant information object
- `roomState` - Updated room state

```javascript
client.on('new-participant', (data) => {
  setParticipants(prev => ({
    ...prev,
    [data.participant.uid]: data.participant
  }));
});
```

### `participant-disconnected`
Emitted when a participant leaves the room.

**Data:**
- `participant` - Participant information object
- `roomState` - Updated room state

```javascript
client.on('participant-disconnected', (data) => {
  setParticipants(prev => {
    const newParticipants = { ...prev };
    delete newParticipants[data.participant.uid];
    return newParticipants;
  });
});
```

### `participant-media-update`
Emitted when a participant's media state changes (mute/unmute).

**Data:**
- `streamName` - Participant's stream name
- `videoEnabled` - Whether video is enabled
- `audioEnabled` - Whether audio is enabled
- `timestamp` - Update timestamp

```javascript
client.on('participant-media-update', (data) => {
  setParticipants(prev => ({
    ...prev,
    [data.streamName]: {
      ...prev[data.streamName],
      videoEnabled: data.videoEnabled,
      audioEnabled: data.audioEnabled
    }
  }));
});
```

## Subscription Events

### `subscribe-success`
Emitted when successfully subscribing to a participant's stream.

**Data:**
- `uid` - Participant's unique identifier
- `mediaStream` - MediaStream object
- `participant` - Participant information

```javascript
client.on('subscribe-success', (data) => {
  setSubscribedParticipants(prev => ({
    ...prev,
    [data.uid]: {
      participant: data.participant,
      mediaStream: data.mediaStream
    }
  }));
});
```

### `subscribe-failed`
Emitted when subscription to a participant fails.

**Data:**
- `user` - User object with `uid` property
- `error` - Error message

```javascript
client.on('subscribe-failed', (data) => {
  console.error('Subscribe failed for:', data.user.uid, data.error);
  // Handle retry logic or remove participant
});
```

### `subscribe-stop`
Emitted when a subscription stops.

**Data:**
- `uid` - Participant's unique identifier

```javascript
client.on('subscribe-stop', (data) => {
  setSubscribedParticipants(prev => {
    const newSubscribed = { ...prev };
    delete newSubscribed[data.uid];
    return newSubscribed;
  });
});
```

## Audio/Video Events

### `audio-level`
Emitted periodically with audio level data for participants.

**Data:**
- `userId` - Participant's user ID
- `level` - Audio level object containing:
  - `normalized` - Level from 0-100
  - `rms` - Root Mean Square value
  - `db` - Decibel level

```javascript
client.on('audio-level', (data) => {
  if (data.level.normalized > 75) {
    // Participant is talking
    setTalkers(prev => [...prev, data.userId]);
  }
});
```

### `audio-muted`
Emitted when local audio is muted/unmuted.

**Data:**
- `muted` - Boolean indicating mute state

```javascript
client.on('audio-muted', (data) => {
  setIsMyMicMuted(data.muted);
});
```

### `video-muted`
Emitted when local video is muted/unmuted.

**Data:**
- `muted` - Boolean indicating mute state

```javascript
client.on('video-muted', (data) => {
  setIsMyCamTurnedOff(data.muted);
});
```

## Screen Share Events

### `screen-share-started`
Emitted when screen sharing starts successfully.

**Data:**
- `streamName` - Screen share stream name (usually ends with '-screenshare')
- `stream` - MediaStream object (optional)

```javascript
client.on('screen-share-started', (data) => {
  setIsScreenShared(true);
  if (data.stream) {
    // Handle screen share stream
  }
});
```

### `screen-share-stopped`
Emitted when screen sharing stops.

```javascript
client.on('screen-share-stopped', () => {
  setIsScreenShared(false);
});
```

## Chat Events

### `chat-message`
Emitted when receiving a chat message from another participant.

**Data:**
- `senderStreamName` - Name of the message sender
- `chatMessageText` - JSON string containing message data

```javascript
client.on('chat-message', (chatMessage) => {
  const message = JSON.parse(chatMessage.chatMessageText);
  
  if (message.eventType === 'MESSAGE_RECEIVED') {
    setMessages(prev => [...prev, message]);
  } else if (message.eventType === 'REACTIONS') {
    showReactions(message.senderStreamId, message.reaction);
  } else if (message.eventType === 'RAISED_HAND') {
    handleRaisedHand(message);
  }
});
```

## Event Handler Examples

```javascript
function handleJoinFail(data) {
  setIsJoining(false);
  if (data.statusCode === 401) {
    setUnAuthorizedDialogOpen(true);
  }
}

function handleUserPublished(data) {
  setIsJoining(false);
  setIsPublished(true);
  setParticipants(data.participants);
  setlobbyOrMeetingPage('meeting');
}

function handleNewParticipant(data) {
  setParticipants(prev => ({
    ...prev,
    [data.participant.uid]: data.participant
  }));
}

function handleParticipantDisconnected(data) {
  // Clean up UI references
  clearRemoteSubscriber(data.participant.uid);
  
  // Remove from participants
  setParticipants(prev => {
    const newParticipants = { ...prev };
    delete newParticipants[data.participant.uid];
    return newParticipants;
  });
}

function handleAudioLevel(data) {
  // Update talking indicators
  if (data.level.normalized > 75) {
    setTalkers(prev => [...prev, data.userId]);
  }
}

function handleChatMessage(chatMessage) {
  const message = JSON.parse(chatMessage.chatMessageText);
  
  switch (message.eventType) {
    case 'MESSAGE_RECEIVED':
      if (!messageDrawerOpen) {
        setNumberOfUnReadMessages(prev => prev + 1);
        // Show notification
        enqueueSnackbar(message.message, { 
          sender: message.name,
          variant: 'message' 
        });
      }
      setMessages(prev => [...prev, message]);
      break;
      
    case 'REACTIONS':
      showReactions(message.senderStreamId, message.reaction);
      break;
      
    case 'RAISED_HAND':
      if (message.isRaisedHand) {
        setRaisedHands(prev => [...prev, message.senderStreamId]);
      } else {
        setRaisedHands(prev => 
          prev.filter(id => id !== message.senderStreamId)
        );
      }
      break;
  }
}
```

## Removing Event Listeners

```javascript
// Remove specific listener
client.off('join-failed', handleJoinFail);

// Clean up when component unmounts
useEffect(() => {
  return () => {
    // Remove all listeners by calling leave
    client.leave();
  };
}, []);
```

## Common Patterns

### Error Handling
```javascript
client.on('subscribe-failed', (data) => {
  console.error('Subscribe failed:', data.error);
  // Implement retry logic or remove participant from UI
});

client.on('connect-fail', () => {
  setIsJoining(false);
  displayMessage('Failed to connect to the server');
});
```

### State Management
```javascript
// Update participants when they join/leave
client.on('new-participant', handleNewParticipant);
client.on('participant-disconnected', handleParticipantDisconnected);

// Track media states
client.on('participant-media-update', handleParticipantMediaUpdate);
client.on('audio-muted', (data) => setIsMyMicMuted(data.muted));
client.on('video-muted', (data) => setIsMyCamTurnedOff(data.muted));
```

### UI Updates
```javascript
// Show loading states
client.on('user-published', () => {
  setIsJoining(false);
  setlobbyOrMeetingPage('meeting');
});

// Handle talking indicators
client.on('audio-level', (data) => {
  updateTalkerLevel(data.userId, data.level.normalized);
});
```
