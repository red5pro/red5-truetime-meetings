// Types
import { SelectChangeEvent } from "@mui/material/Select";
import { ChangeEvent, FormEvent } from "react";
import { UserRole } from "../../constants/userRoles";

export interface User {
    uid: string
    metaData?: string
}

export interface RoomInfo {
    userCount: number
    users?: User[]
}

export interface VideoPreviewProps {
    publishStreamId?: string
    talkers: any[]
    streamName: string
    isPublished: boolean
    isPlayOnly: boolean
    isMyMicMuted: boolean
    isMyCamTurnedOff: boolean
    pinVideo: (id: string) => void
    unpinVideo: () => void
    layout: string
}

export interface ControlButtonsProps {
    glass: boolean
    isMyCamTurnedOff: boolean
    cameraButtonDisabled: boolean
    handleMuteVideoLobby: () => void
    isMyMicMuted: boolean
    toggleMic: (muted?: boolean) => void
    microphoneButtonDisabled: boolean
    onSettingsClick: () => void
    onVirtualEffectsClick: () => void
}

export interface ParticipantInfoProps {
    roomInfo: RoomInfo
    currentUserName: string
}

export interface JoinFormProps {
    streamName: string
    onStreamNameChange: (e: ChangeEvent<HTMLInputElement>) => void
    streamNameFieldError: boolean
    isAuthEnabled: boolean
    isGuest: boolean
    selectedRole: UserRole
    onRoleChange: (e: SelectChangeEvent<UserRole>) => void
    onSubmit: (e: FormEvent<HTMLFormElement>) => void
    isJoining: boolean
    roomInfo: RoomInfo
}

export interface PlayOnlyVideoCardProps {
    streamName: string
    isPublished: boolean
    isPlayOnly: boolean
    isMyMicMuted: boolean
    isMyCamTurnedOff: boolean
    publishStreamId?: string
    pinVideo: (id: string) => void
    unpinVideo: () => void
    layout: string
}

export interface LobbyPageProps {
    outgoingBitrate: number
    updateOutgoingBitrate: (bitrate: number) => void
    streamName: string
    setStreamName: (name: string) => void
    isPlayOnly: boolean
    cameraPermissionState: string
    microphonePermissionState: string
    setIsJoining: (joining: boolean) => void
    setIsWaitingApproval: (waitingApproval: boolean) => void
    joinRoom: (roomName: string, streamId: string) => void
    devices: any[]
    glass: boolean
    isMyCamTurnedOff: boolean
    cameraButtonDisabled: boolean
    handleMuteVideoLobby: () => void
    isMyMicMuted: boolean
    toggleMic: (muted?: boolean) => void
    microphoneButtonDisabled: boolean
    handleBackgroundReplacement: (mode: string) => void
    microphoneSelected: (deviceId: string) => void
    selectedSpeaker: string
    speakerSelected: (deviceId: string) => void
    selectedCamera: string
    cameraSelected: (deviceId: string) => void
    selectedMicrophone: string
    selectedBackgroundMode: string
    setSelectedBackgroundMode: (mode: string) => void
    publishStreamId?: string
    talkers: any[]
    isPublished: boolean
    pinVideo: (id: string) => void
    unpinVideo: () => void
    layout: string
    isJoining?: boolean
    role: UserRole
    setRole: (role: UserRole) => void
    handleEffectsOpen: (open: boolean) => void
    effectsDrawerOpen: boolean
    setVirtualBackgroundImage: (image: any) => void
    handleInfoDrawerOpen: (open: boolean) => void
    handleMessageDrawerOpen: (open: boolean) => void
    handleParticipantListOpen: (open: boolean) => void
}
