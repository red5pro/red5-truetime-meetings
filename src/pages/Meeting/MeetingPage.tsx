import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Container, Box, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactionBarSelector } from '@charkour/react-reactions'
import { Close } from '@mui/icons-material'
import cloneDeep from 'lodash/cloneDeep'

import Footer from '../../Components/Footer/Footer.tsx'
import VideoCard from '../../Components/Cards/VideoCard.tsx'
import LayoutPinned from '../Layout/PinnedLayout.tsx'
import LayoutTiled from '../Layout/TiledLayout.tsx'
import LayoutAuto from '../Layout/AutoLayout.tsx'
import { isNull } from '../../utils/utils.tsx'
import { LayoutOptions } from '../../utils/layoutOptions.ts'
import RecordingIndicator from '../../Components/RecordingIndicator.tsx'
import MuteParticipantDialog from "../../Components/MuteParticipantDialog.tsx"
import { usePictureInPicture } from '../../utils/PiPManager.tsx'
import ClosedCaptions from "../../Components/ClosedCaptions.tsx"
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.ts'
import { GallerySize, MeetingPageProps, Reaction, SubscribedParticipant } from "./types.ts";
import { debounce } from "lodash";
import { getRuntimeConfig } from '../../utils/configStore';

// Constants
const REACTION_LIST: Reaction[] = [
    { label: 'Love It', node: <div>💖</div>, key: 'sparkling_heart' },
    { label: 'Like', node: <div>👍🏼</div>, key: 'thumbs_up' },
    { label: 'Tada', node: <div>🎉</div>, key: 'party_popper' },
    { label: 'Applause', node: <div>👏🏼</div>, key: 'clapping_hands' },
    { label: 'Haha', node: <div>😂</div>, key: 'face_with_tears_of_joy' },
    { label: 'Surprised', node: <div>😮</div>, key: 'open_mouth' },
    { label: 'Sad', node: <div>😢</div>, key: 'sad_face' },
    { label: 'Thinking', node: <div>🤔</div>, key: 'thinking_face' },
    { label: 'Dislike', node: <div>👎🏼</div>, key: 'thumbs_down' }
]

const AUTO_LAYOUT_PARTICIPANT_LIMIT = 8

const MeetingPage = React.memo<MeetingPageProps>((props) => {
    const [pushToTalkEnabled, setPushToTalkEnabled] = useState<boolean>(
        localStorage.getItem('isPushToTalkEnabled') === 'true'
    )
    const [gallerySize, setGallerySize] = useState<GallerySize>({ w: 100, h: 100 })
    const theme = useTheme()

    // Create refs for props functions to prevent dependency issues
    const propsRef = useRef(props)

    // Keep ref up to date
    useEffect(() => {
        propsRef.current = props
    }, [props])

    // Enhanced PiP Integration for all participants
    const {
        isSupported: pipSupported,
        isOpen: pipIsOpen,
        openPiP,
        updatePiP,
        closePiP,
    } = usePictureInPicture()

    // Memoized participant list
    const allParticipants = useMemo(() => {
        const participants = cloneDeep(props.subscribedParticipants || {})

        // Add raised hand status to subscribed participants
        props.raisedHands?.forEach(id => {
            if (participants[id]) {
                participants[id].participant.isRaiseHand = true
            }
        })

        // Add not subscribed participants from props.participants
        Object.entries(props.participants || {}).forEach(([uid, participant]) => {
            if (!participants[uid]) {
                // This participant is not subscribed yet, add them
                participants[uid] = {
                    mediaStream: undefined,
                    participant: {
                        ...participant,
                        isPending: true,
                        audioEnabled: true,
                        videoEnabled: false,
                        isRaiseHand: props.raisedHands?.includes(uid) || false
                    }
                }
            }
        })

        const participantList = Object.values(participants)

        // Add current user to the list
        const mergedList: SubscribedParticipant[] = [
            {
                mediaStream: props.currentConferenceClient?.mediaStreamManager.getCurrentStream(),
                participant: {
                    uid: props.streamName,
                    name: props.streamName,
                    isPending: false,
                    audioEnabled: !props.isMyMicMuted,
                    videoEnabled: !props.isMyCamTurnedOff,
                    isRaiseHand: props.isRaiseHand
                }
            },
            ...participantList
        ]

        return mergedList
    }, [
        props.subscribedParticipants,
        props.participants,
        props.raisedHands,
        props.streamName,
        props.isMyMicMuted,
        props.isMyCamTurnedOff,
        props.isRaiseHand,
        props.currentConferenceClient
    ])

    const keyboardShortcuts = useKeyboardShortcuts({
        onToggleCaptions: props?.closedCaptions.handleToggleCaptions,
        onToggleMic: props.toggleMic,
        isCurrentlyMuted: props.isMyMicMuted,
        enableTapToTalk: pushToTalkEnabled,
        enableCaptionsToggle: (getRuntimeConfig().VITE_ENABLE_CLOSED_CAPTION === 'true')
    })

    useEffect(() => {
        localStorage.setItem('isPushToTalkEnabled', String(pushToTalkEnabled))
        keyboardShortcuts.setIsTapToTalkEnabled(pushToTalkEnabled)
    }, [pushToTalkEnabled, keyboardShortcuts])

    // Open all participants PiP
    const openAllParticipantsPiP = useCallback(() => {
        if (!pipSupported) {
            console.warn('Picture-in-Picture is not supported in this browser')
            return
        }

        const currentProps = propsRef.current

        openPiP({
            participants: allParticipants,
            onMuteToggle: (streamId: string) => {
                if (streamId === currentProps.streamName) {
                    currentProps.toggleMic?.()
                } else {
                    currentProps.setParticipantIdMuted?.(streamId)
                    currentProps.setMuteParticipantDialogOpen?.(true)
                }
            },
            onVideoToggle: (streamId: string) => {
                if (streamId === currentProps.streamName) {
                    if (currentProps.isMyCamTurnedOff) {
                        currentProps.checkAndTurnOnLocalCamera?.()
                    } else {
                        currentProps.checkAndTurnOffLocalCamera?.()
                    }
                }
            },
            onVolumeToggle: (streamId: string) => {
                console.log('Volume toggled for participant:', streamId)
            },
            // @ts-ignore
            talkers: currentProps.talkers || [],
            streamName: currentProps.streamName
        })
    }, [pipSupported, allParticipants, openPiP])

    // Update PiP when participants change
    useEffect(() => {
        if (pipIsOpen) {
            const currentProps = propsRef.current

            updatePiP({
                participants: allParticipants,
                onMuteToggle: (streamId: string) => {
                    if (streamId === currentProps.streamName) {
                        currentProps.toggleMic?.()
                    } else {
                        currentProps.setParticipantIdMuted?.(streamId)
                        currentProps.setMuteParticipantDialogOpen?.(true)
                    }
                },
                onVideoToggle: (streamId: string) => {
                    if (streamId === currentProps.streamName) {
                        if (currentProps.isMyCamTurnedOff) {
                            currentProps.checkAndTurnOnLocalCamera?.()
                        } else {
                            currentProps.checkAndTurnOffLocalCamera?.()
                        }
                    }
                },
                onVolumeToggle: (streamId: string) => {
                    console.log('Volume toggled for participant:', streamId)
                },
                // @ts-ignore
                talkers: currentProps.talkers || [],
                streamName: currentProps.streamName
            })
        }
    }, [pipIsOpen, allParticipants, updatePiP])

    // Gallery resize handler
    const handleGalleryResize = useCallback((calcDrawer = false) => {
        const gallery = document.getElementById('stream-gallery')

        if (!gallery) return

        if (calcDrawer) {
            const currentProps = propsRef.current
            const hasOpenDrawer = currentProps.messageDrawerOpen ||
                currentProps.participantListDrawerOpen ||
                currentProps.effectsDrawerOpen ||
                currentProps.infoDrawerOpen ||
                currentProps.localRecordingDrawerOpen ||
                currentProps.transcriptionDrawerOpen ||
                currentProps.externalStreamsDrawerOpen

            gallery.classList.toggle('drawer-open', hasOpenDrawer)
        }

        const { width: screenWidth, height: screenHeight } = gallery.getBoundingClientRect()
        setGallerySize({ w: screenWidth, h: screenHeight })
    }, [])

    // Emoji handler
    const handleEmojiSend = useCallback((emoji: string) => {
        const currentProps = propsRef.current
        currentProps.sendReactions?.(emoji)
        currentProps.setShowEmojis?.(!currentProps.showEmojis)
    }, [])

    // Layout renderer
    const renderLayout = useCallback(() => {
        const currentProps = propsRef.current
        const hasPin = !isNull(currentProps.pinnedParticipantId)
        const isAutoLayout = currentProps.layout === LayoutOptions.Auto &&
            allParticipants.length <= AUTO_LAYOUT_PARTICIPANT_LIMIT

        const commonProps = {
            allParticipants,
            width: gallerySize.w,
            height: gallerySize.h,
            globals: currentProps.globals,
            publishStreamId: currentProps.publishStreamId,
            talkers: currentProps.talkers,
            streamName: currentProps.streamName,
            isPublished: currentProps.isPublished,
            isPlayOnly: currentProps.isPlayOnly,
            isMyMicMuted: currentProps.isMyMicMuted,
            isMyCamTurnedOff: currentProps.isMyCamTurnedOff,
            pinVideo: currentProps.pinVideo,
            unpinVideo: currentProps.unpinVideo,
            currentConferenceClient: currentProps.currentConferenceClient,
            setParticipantIdMuted: currentProps?.setParticipantIdMuted,
            setMuteParticipantDialogOpen: currentProps?.setMuteParticipantDialogOpen,
            connectionStats: currentProps?.connectionStats,
            networkScore: currentProps?.networkScore,
            pipSupported: pipSupported
        }

        if (isAutoLayout && !currentProps?.closedCaptions.captionsVisible) {
            return (
                <LayoutAuto
                    {...commonProps}
                    pinLayout={hasPin}
                    // @ts-ignore
                    pinnedParticipantId={currentProps.pinnedParticipantId}
                    isScreenShared={currentProps.isScreenShared}
                    isStartingScreenShare={currentProps.isStartingScreenShare}
                    isMobile={currentProps.isMobile}
                />
            )
        }

        if (hasPin) {
            return (
                <LayoutPinned
                    {...commonProps}
                    // @ts-ignore
                    pinnedParticipantId={currentProps.pinnedParticipantId}
                    layout={currentProps.layout}
                />
            )
        }

        return (
            <LayoutTiled
                {...commonProps}
                // @ts-ignore
                isScreenShared={currentProps.isScreenShared}
                isStartingScreenShare={currentProps.isStartingScreenShare}
                layout={currentProps.layout}
            />
        )
    }, [allParticipants, gallerySize, pipSupported])

    // Effects
    useEffect(() => {
        props.updateAudioOutput?.()
        handleGalleryResize(false)
    }, [props.participants, props.subscribedParticipants, props.updateAudioOutput, handleGalleryResize])

    useEffect(() => {
        handleGalleryResize(true)
    }, [
        props.infoDrawerOpen,
        props.messageDrawerOpen,
        props.participantListDrawerOpen,
        props.effectsDrawerOpen,
        props.localRecordingDrawerOpen,
        props.transcriptionDrawerOpen,
        props.externalStreamsDrawerOpen,
        handleGalleryResize
    ])

    useEffect(() => {
        const debouncedResize = debounce(() => handleGalleryResize(false), 500)
        window.addEventListener('resize', debouncedResize)

        return () => window.removeEventListener('resize', debouncedResize)
    }, [handleGalleryResize])

    // Reaction bar styles
    const reactionBarStyle: React.CSSProperties = {
        position: 'fixed',
        bottom: 105,
        left: '50%',
        transform: 'translate(-50%, 50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 666,
        height: 46
    }

    const reactionSelectorStyle: React.CSSProperties = {
        backgroundColor: theme.palette.themeColor?.[60],
        paddingTop: '7px',
        paddingLeft: '7px',
        paddingRight: '7px'
    }

    const pipOverlay = () => {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    textAlign: 'center',
                    gap: 2
                }}
            >
                <h3>Your conference is in the picture-in-picture window</h3>
                <p>You can see all {allParticipants.length} participants in the floating window.</p>
                <IconButton
                    onClick={closePiP}
                    size="large"
                    color="primary"
                    sx={{
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                            backgroundColor: 'primary.dark'
                        },
                        padding: 2
                    }}
                >
                    <Close />
                </IconButton>
                <p>Click the button above to return to the main view</p>
            </Box>
        )
    }

    return (
        <Container id="meeting-page">
            <Box id="stream-gallery" sx={{
                height: props?.closedCaptions.captionsVisible ? 'calc(100vh - 320px) !important' : 'calc(100vh - 80px) !important'
            }}>
                {pipIsOpen ? pipOverlay() : renderLayout()}
            </Box>

            {/* Recording Indicator */}
            {props?.isRecordingActive && <RecordingIndicator />}

            {/* Mute Participant Dialog */}
            <MuteParticipantDialog
                // @ts-ignore
                isMuteParticipantDialogOpen={props?.isMuteParticipantDialogOpen}
                setMuteParticipantDialogOpen={(open) => props?.setMuteParticipantDialogOpen?.(open)}
                // @ts-ignore
                participantIdMuted={props?.participantIdMuted}
                // @ts-ignore
                setParticipantIdMuted={(participant) => props?.setParticipantIdMuted?.(participant)}
                turnOffYourMicNotification={(streamId) => props?.turnOffYourMicNotification?.(streamId)}
            />

            {/* Emoji Reactions */}
            {props.showEmojis && (
                <Box id="reactions-bar" style={reactionBarStyle}>
                    <ReactionBarSelector
                        reactions={REACTION_LIST}
                        iconSize={28}
                        style={reactionSelectorStyle}
                        onSelect={handleEmojiSend}
                    />
                </Box>
            )}

            {/* Screen Share Video Element */}
            <VideoCard
                id="red5pro-publisher-screenshare"
                key="red5pro-publisher-screenshare"
                autoPlay
                hidePin
                isMine
                // @ts-ignore
                streamName={props.streamName}
                isPublished
                isPlayOnly={false}
                isMicMuted={false}
                isCamTurnedOff={false}
                publishStreamId={props.publishStreamId}
                pinVideo={props.pinVideo}
                unpinVideo={props.unpinVideo}
                hidePlayer
                layout={props.layout}
                // @ts-ignore
                setParticipantIdMuted={(participantId) => props?.setParticipantIdMuted?.(participantId)}
                setMuteParticipantDialogOpen={(isOpen) => props?.setMuteParticipantDialogOpen?.(isOpen)}
            />

            {/* Closed Captions Component */}
            <ClosedCaptions
                isVisible={props?.closedCaptions.captionsVisible}
                captions={props?.closedCaptions.captions}
                onToggleVisibility={() => props?.closedCaptions.handleToggleCaptions()}
                onLanguageChange={(language) => props?.closedCaptions.handleCaptionsLanguageChange(language)}
                onCaptionTypeChange={(isLive) => props?.closedCaptions?.handleCaptionTypeChange(isLive)}
                selectedLanguage={props?.closedCaptions?.captionsLanguage}
                isLiveCaptions={props?.closedCaptions?.isLiveCaptions}
                // @ts-ignore
                subscribedParticipants={props?.subscribedParticipants}
            />

            {/* Footer */}
            <Footer
                glass={false}
                isPlayOnly={props.isPlayOnly}
                isMyCamTurnedOff={props.isMyCamTurnedOff}
                cameraButtonDisabled={props.cameraButtonDisabled}
                checkAndTurnOffLocalCamera={props.checkAndTurnOffLocalCamera}
                checkAndTurnOnLocalCamera={props.checkAndTurnOnLocalCamera}
                isMyMicMuted={props.isMyMicMuted}
                toggleMic={props.toggleMic}
                microphoneButtonDisabled={props.microphoneButtonDisabled}
                isScreenShared={props.isScreenShared}
                handleStartScreenShare={props.handleStartScreenShare}
                handleStopScreenShare={props.handleStopScreenShare}
                isRaiseHand={props.isRaiseHand}
                setIsRaiseHand={props.setIsRaiseHand}
                showEmojis={props.showEmojis}
                setShowEmojis={props.setShowEmojis}
                numberOfUnReadMessages={props.numberOfUnReadMessages}
                toggleSetNumberOfUnreadMessages={props.toggleSetNumberOfUnreadMessages}
                messageDrawerOpen={props.messageDrawerOpen}
                handleMessageDrawerOpen={props.handleMessageDrawerOpen}
                participantCount={props.participantCount}
                participantListDrawerOpen={props.participantListDrawerOpen}
                handleParticipantListOpen={props.handleParticipantListOpen}
                setLeftTheRoom={props.setLeftTheRoom}
                handleSetDesiredTileCount={props.handleSetDesiredTileCount}
                handleBackgroundReplacement={props.handleBackgroundReplacement}
                microphoneSelected={props.microphoneSelected}
                selectedSpeaker={props.selectedSpeaker}
                speakerSelected={props.speakerSelected}
                // @ts-ignore
                devices={props.devices}
                selectedCamera={props.selectedCamera}
                cameraSelected={props.cameraSelected}
                selectedMicrophone={props.selectedMicrophone}
                selectedBackgroundMode={props.selectedBackgroundMode}
                setSelectedBackgroundMode={props.setSelectedBackgroundMode}
                effectsDrawerOpen={props.effectsDrawerOpen}
                handleEffectsOpen={props.handleEffectsOpen}
                globals={props.globals}
                layout={props.layout}
                changeLayout={props.changeLayout}
                infoDrawerOpen={props.infoDrawerOpen}
                handleInfoDrawerOpen={props.handleInfoDrawerOpen}
                localRecordingDrawerOpen={props.localRecordingDrawerOpen}
                handleLocalRecordingDrawerOpen={props.handleLocalRecordingDrawerOpen}
                outgoingBitrate={props.outgoingBitrate}
                updateOutgoingBitrate={props.updateOutgoingBitrate}
                isRecordingActive={props?.isRecordingActive}
                startRecord={(recordSeparately, serverRecording, localRecording) => props?.startRecord?.(recordSeparately, serverRecording, localRecording)}
                stopRecord={(serverRecording, localRecording) => props?.stopRecord?.(serverRecording, localRecording)}
                networkScore={props?.networkScore}
                connectionStats={props?.connectionStats}
                currentIssues={props?.currentIssues}
                printStatLogs={props?.printStatLogs}
                setPrintStatLogs={(printStatLogs) => props?.setPrintStatLogs?.(printStatLogs)}
                pipSupported={pipSupported}
                pipIsOpen={pipIsOpen}
                openAllParticipantsPiP={openAllParticipantsPiP}
                closePiP={closePiP}
                allParticipants={allParticipants}
                // @ts-ignore
                talkers={props.talkers}
                streamName={props.streamName}
                captionsVisible={props?.closedCaptions.captionsVisible}
                onToggleCaptions={() => props?.closedCaptions.handleToggleCaptions()}
                captionsLanguage={props?.closedCaptions.captionsLanguage}
                onCaptionsLanguageChange={(language: any) => props?.closedCaptions.handleCaptionsLanguageChange(language)}
                isLiveCaptions={props?.closedCaptions.isLiveCaptions}
                onCaptionTypeChange={(isLive: any) => props?.closedCaptions.handleCaptionTypeChange(isLive)}
                pushToTalkEnabled={pushToTalkEnabled}
                onPushToTalkToggle={(value) => setPushToTalkEnabled(value)}
                updateDevicesList={() => props?.updateDevicesList?.()}
                isLocalRecordingActive={props?.isLocalRecordingActive}
                startLocalRecording={props?.startLocalRecording}
                stopLocalRecording={props?.stopLocalRecording}
                downloadLocalRecording={props?.downloadLocalRecording}
                localRecordingStatus={props?.localRecordingStatus}
                isLocalRecordingUploading={props?.isLocalRecordingUploading}
                transcriptionDrawerOpen={props?.transcriptionDrawerOpen}
                handleTranscriptionDrawerOpen={props?.handleTranscriptionDrawerOpen}
                externalStreamsDrawerOpen={props?.externalStreamsDrawerOpen}
                handleExternalStreamsDrawerOpen={props?.handleExternalStreamsDrawerOpen}
            />

        </Container>
    )
})

MeetingPage.displayName = 'MeetingPage'

export default MeetingPage