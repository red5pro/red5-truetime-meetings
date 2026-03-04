export interface Participant {
    uid: string
    name: string
    audioEnabled: boolean
    videoEnabled: boolean
    isRaiseHand?: boolean
    isScreenSharing?: boolean
    ownerStreamId?: string
    isPending?: boolean
    metaData?: string
}

export interface ParticipantObject {
    participant: Participant
    mediaStream: MediaStream | null
}

export interface Globals {
    desiredTileCount?: number
}

export interface NetworkScore {
    outbound?: number
}

export interface ConnectionStats {
    [key: string]: any
}

export interface LayoutTiledProps {
    allParticipants?: ParticipantObject[]
    width?: number
    height?: number
    streamName: string
    publishStreamId?: string
    currentConferenceClient?: any
    talkers?: string[]
    isPlayOnly: boolean
    pinVideo: (participantId: string) => void
    unpinVideo: () => void
    layout: string
    globals?: Globals
    networkScore?: NetworkScore
    connectionStats?: ConnectionStats
    setParticipantIdMuted?: (participantId: string) => void
    setMuteParticipantDialogOpen?: (isOpen: boolean) => void
}

export interface LayoutAutoProps {
    pinLayout: boolean
    allParticipants?: ParticipantObject[]
    pinnedParticipantId?: string
    globals?: Globals
    talkers?: string[]
    streamName: string
    publishStreamId?: string
    isPlayOnly: boolean
    pinVideo: (participantId: string) => void
    unpinVideo: () => void
    layout: string
    currentConferenceClient?: any
    networkScore?: NetworkScore
    connectionStats?: ConnectionStats
    setParticipantIdMuted?: (participantId: string) => void
    setMuteParticipantDialogOpen?: (isOpen: boolean) => void
}

export interface LayoutPinnedProps {
    allParticipants?: ParticipantObject[]
    pinnedParticipantId?: string
    publishStreamId?: string
    streamName: string
    talkers?: string[]
    isPlayOnly: boolean
    pinVideo: (participantId: string) => void
    unpinVideo: () => void
    layout: string
    currentConferenceClient?: any
    isMobile?: boolean
    networkScore?: NetworkScore
    connectionStats?: ConnectionStats
    setParticipantIdMuted?: (participantId: string) => void
    setMuteParticipantDialogOpen?: (isOpen: boolean) => void
}

export interface PinnedParticipantData {
    participant: Participant
    mediaStream: MediaStream | null
    isMine: boolean
}

export interface ParticipantCounts {
    maxPlayingParticipants: number
    othersCount: number
    showOthers: boolean
}

export interface ParticipantGroups {
    visibleUnpinned: ParticipantObject[]
    audioOnlyParticipants: ParticipantObject[]
}

export interface LayoutDimensions {
    area: number
    cols: number
    rows: number
    width: number
    height: number
}

export interface CardDimensions {
    width: number
    height: number
}

export interface LayoutConfig {
    videoCount: number
    showOthers: boolean
    aspectRatio: number
}
