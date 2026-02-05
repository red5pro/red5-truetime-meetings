import React from "react";
import { JoinFormProps } from "../types.ts";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid2";
import { Box } from "@mui/system";
import { ParticipantInfo } from "./ParticipantInfo.tsx";
import { Button, TextField } from "@mui/material";

export const JoinForm = React.memo<JoinFormProps>(({
    streamName,
    onStreamNameChange,
    streamNameFieldError,
    isAuthEnabled,
    isGuest,
    onSubmit,
    isJoining,
    roomInfo
}) => {
    const { t } = useTranslation()

    return (
        <Grid container justifyContent="center">
            <form onSubmit={onSubmit}>
                <Box style={{ margin: '21px' }}>
                    <ParticipantInfo
                        roomInfo={roomInfo}
                        currentUserName={streamName}
                    />
                </Box>

                <Grid container spacing={2} sx={{ mt: 1, mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 12 }}>
                        <TextField
                            autoFocus
                            required
                            fullWidth
                            color="primary"
                            value={streamName || ''}
                            variant="outlined"
                            onChange={onStreamNameChange}
                            placeholder={t('Your name')}
                            id="participant_name"
                            autoComplete="cc-exp-year"
                            disabled={isJoining}
                            error={streamNameFieldError}
                            helperText={streamNameFieldError ? 'Spaces are not allowed' : ''}
                        />
                    </Grid>
                    {/*
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth variant="outlined" disabled={isJoining}>
                            <InputLabel id="user-role-label">{t('Role')}</InputLabel>
                            <Select
                                labelId="user-role-label"
                                id="user-role-select"
                                value={selectedRole}
                                onChange={onRoleChange}
                                label={t('Role')}
                                color="primary"
                            >
                                {Object.values(USER_ROLES).map((role) => (
                                    <MenuItem key={role} value={role}>
                                        {getRoleDisplayName(role)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    */}
                </Grid>

                <Grid container justifyContent="center">
                    <Grid size={{ sm: 6, xs: 12 }}>
                        <Button
                            fullWidth
                            color="secondary"
                            variant="contained"
                            type="submit"
                            id="room_join_button"
                            disabled={isJoining || streamNameFieldError}
                            sx={{ borderRadius: 6 }}
                        >
                            {isJoining ? t('Joining...') : (isGuest ? t('Ask to Join') : (roomInfo["userCount"] > 0 ? t('Join') : t('Start Call')))}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Grid>
    )
})

JoinForm.displayName = 'JoinForm'
