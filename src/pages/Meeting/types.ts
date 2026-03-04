import React from "react";

export interface Participant {
    uid: string
    name: string
    isPending: boolean
    audioEnabled: boolean
    videoEnabled: boolean
    isRaiseHand: boolean
    metaData?: string
}

export interface SubscribedParticipant {
    mediaStream?: MediaStream
    participant: Participant
}

export interface ClosedCaptionsProps {
    captionsVisible: boolean
    captions: any[]
    captionsLanguage: string
    isLiveCaptions: boolean
    handleToggleCaptions: () => void
    handleCaptionsLanguageChange: (language: string) => void
    handleCaptionTypeChange: (isLive: boolean) => void
}

export interface ConnectionStats {
    [key: string]: any
}

export interface MeetingPageProps {
    subscribedParticipants?: Record<string, SubscribedParticipant>
    participants?: Record<string, Participant>
    raisedHands?: string[]
    currentConferenceClient?: any
    streamName: string
    isMyMicMuted: boolean
    isMyCamTurnedOff: boolean
    isRaiseHand: boolean
    talkers?: string[]
    toggleMic?: () => void
    setParticipantIdMuted?: (id: string) => void
    setMuteParticipantDialogOpen?: (open: boolean) => void
    checkAndTurnOnLocalCamera?: () => void
    checkAndTurnOffLocalCamera?: () => void
    messageDrawerOpen: boolean
    participantListDrawerOpen: boolean
    effectsDrawerOpen: boolean
    infoDrawerOpen: boolean
    localRecordingDrawerOpen: boolean
    transcriptionDrawerOpen: boolean
    externalStreamsDrawerOpen: boolean
    sendReactions?: (emoji: string) => void
    setShowEmojis?: (show: boolean) => void
    showEmojis: boolean
    pinnedParticipantId?: string | null
    layout: string
    globals: any
    publishStreamId: string
    isPublished: boolean
    isPlayOnly: boolean
    pinVideo: (id: string) => void
    unpinVideo: () => void
    connectionStats?: ConnectionStats
    networkScore?: number
    closedCaptions: ClosedCaptionsProps
    isScreenShared: boolean
    isStartingScreenShare: boolean
    isMobile: boolean
    updateAudioOutput?: () => void
    isRecordingActive?: boolean
    isMuteParticipantDialogOpen?: boolean
    participantIdMuted?: string
    turnOffYourMicNotification?: (streamId: string) => void
    cameraButtonDisabled: boolean
    microphoneButtonDisabled: boolean
    handleStartScreenShare: () => void
    handleStopScreenShare: () => void
    setIsRaiseHand: (raised: boolean) => void
    numberOfUnReadMessages: number
    toggleSetNumberOfUnreadMessages: () => void
    handleMessageDrawerOpen: () => void
    participantCount: number
    handleParticipantListOpen: () => void
    setLeftTheRoom: (left: boolean) => void
    handleSetDesiredTileCount: (count: number) => void
    handleBackgroundReplacement: (mode: string) => void
    microphoneSelected: (deviceId: string) => void
    selectedSpeaker: string
    speakerSelected: (deviceId: string) => void
    devices: MediaDeviceInfo[]
    selectedCamera: string
    cameraSelected: (deviceId: string) => void
    selectedMicrophone: string
    selectedBackgroundMode: string
    setSelectedBackgroundMode: (mode: string) => void
    handleEffectsOpen: () => void
    changeLayout: (layout: string) => void
    handleInfoDrawerOpen: () => void
    handleLocalRecordingDrawerOpen: (open: boolean) => void
    handleTranscriptionDrawerOpen: (open: boolean) => void
    handleExternalStreamsDrawerOpen: (open: boolean) => void
    outgoingBitrate: number
    updateOutgoingBitrate: (bitrate: number) => void
    startRecord?: (recordSeparately?: boolean, serverRecording?: boolean, localRecording?: boolean) => void
    stopRecord?: (serverRecording?: boolean, localRecording?: boolean) => void
    isLocalRecordingActive?: boolean
    startLocalRecording?: () => void
    stopLocalRecording?: () => void
    downloadLocalRecording?: (filename?: string) => Promise<boolean>
    localRecordingStatus?: string
    isLocalRecordingUploading?: boolean
    currentIssues?: string[]
    printStatLogs?: boolean
    setPrintStatLogs?: (print: boolean) => void
    updateDevicesList?: () => void
    transcription: any
}

export interface GallerySize {
    w: number
    h: number
}

export interface Reaction {
    label: string
    node: React.ReactNode
    key: string
}