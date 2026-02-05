import Grid from '@mui/material/Grid2';
import MessageCard from './Cards/MessageCard';
import { JSX, useEffect, useRef } from "react";
import { FileType } from "red5pro-conference-sdk";

interface Message {
    date: string;
    name: string;
    message: string;
    eventType?: string;
    files?: FileType[];
}

interface MessagesTabProps {
    messages?: Message[];
}

function MessagesTab(props: MessagesTabProps): JSX.Element {
    const { messages = [] } = props;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <>
            <Grid
                container
                ref={scrollContainerRef}
                sx={{ mt: 1 }}
                id="paper-props"
                style={{ flexWrap: 'nowrap', flex: 'auto', overflowY: 'auto' }}
            >
                <Grid size={12}>
                    {messages.map((m, index) => (
                        <Grid key={index} size={12}>
                            <MessageCard
                                date={m.date}
                                isMe={!m?.eventType}
                                name={m.name}
                                message={m.message}
                                files={m.files}
                            />
                        </Grid>
                    ))}
                    <div ref={messagesEndRef} />
                </Grid>
            </Grid>
        </>
    );
}

export default MessagesTab;