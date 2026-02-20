import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/system";
import { Avatar, Typography } from "@mui/material";
import { getFirstLetter } from "../../../utils/utils.tsx";
import { ParticipantInfoProps, User } from "../types.ts";

export const ParticipantInfo = React.memo<ParticipantInfoProps>(({ roomInfo, currentUserName }) => {
    const { t } = useTranslation()
    const theme = useTheme()

    const { userCount, users } = roomInfo

    // Helper function to parse user metadata and get the name
    const getUserName = (user: User): string => {
        try {
            const metadata = JSON.parse(user.metaData || '{}')
            return metadata.name || 'Unknown'
        } catch (error) {
            console.warn('Failed to parse user metadata:', error)
            return 'Unknown'
        }
    }

    // Helper function to render avatars
    const renderAvatars = () => {
        if (userCount === 0 || !users) return null

        const maxAvatars = 3
        const displayUsers = users?.slice(0, maxAvatars)
        const hasMore = userCount > maxAvatars

        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                flexWrap: 'wrap'
            }}>
                {displayUsers.map((user, index) => {
                    const userName = getUserName(user)
                    return (
                        <Avatar
                            key={user.uid || index}
                            sx={{
                                width: Math.min(48, window.innerWidth * 0.08), // Responsive size
                                height: Math.min(48, window.innerWidth * 0.08),
                                aspectRatio: "1 / 1",
                                backgroundColor: theme?.palette?.themeColor?.[20] || '#393737',
                                color: "#fff",
                                fontSize: Math.min(20, window.innerWidth * 0.03),
                                fontWeight: 600,
                            }}
                        >
                            {getFirstLetter(userName) || "U"}
                        </Avatar>
                    )
                })}
                {hasMore && (
                    <Avatar
                        sx={{
                            width: Math.min(48, window.innerWidth * 0.08),
                            height: Math.min(48, window.innerWidth * 0.08),
                            aspectRatio: "1 / 1",
                            backgroundColor: theme?.palette?.grey?.[500] || '#757575',
                            color: "#fff",
                            fontSize: Math.min(16, window.innerWidth * 0.025),
                            fontWeight: 600,
                        }}
                    >
                        +{userCount - maxAvatars}
                    </Avatar>
                )}
            </Box>
        )
    }

    // Helper function to format participant display
    const formatParticipantText = (): string => {
        if (userCount === 0 || !users) {
            return t('No one is in this call yet')
        }

        if (userCount === 1) {
            const userName = getUserName(users[0])
            // If someone else is in the call
            return `${userName} ${t('is in this call')}`
        }

        // Multiple participants - get parsed user names
        const userNames = users.map(user => getUserName(user))
        const otherUsers = users.filter(user => getUserName(user) !== currentUserName)
        const includesCurrentUser = userNames.includes(currentUserName)

        if (userCount === 2) {
            if (includesCurrentUser) {
                const otherUserName = getUserName(otherUsers[0]) || 'someone else'
                return `${t('You and')} ${otherUserName} ${t('are in this call')}`
            } else {
                const user1Name = getUserName(users[0]) || 'Someone'
                const user2Name = getUserName(users[1]) || 'someone else'
                return `${user1Name} ${t('and')} ${user2Name} ${t('are in this call')}`
            }
        }

        // More than 2 participants
        if (includesCurrentUser) {
            const othersCount = userCount - 1
            return `${t('You and')} ${othersCount} ${othersCount === 1 ? t('other participant') : t('other participants')} ${t('are in this call')}`
        } else {
            const firstUserName = getUserName(users[0]) || 'Someone'
            const othersCount = userCount - 1
            return `${firstUserName} ${t('and')} ${othersCount} ${othersCount === 1 ? t('other participant') : t('other participants')} ${t('are in this call')}`
        }
    }

    return (
        <Box sx={{ mb: 2, textAlign: 'center' }}>
            {renderAvatars()}
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {formatParticipantText()}
            </Typography>
        </Box>
    )
})

ParticipantInfo.displayName = 'ParticipantInfo'