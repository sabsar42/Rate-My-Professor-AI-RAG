'use client'

import { Box, Paper, Typography, TextField, Button, Stack } from '@mui/material';
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "model",
      parts: [{ text: "Hi, I'm the Rate My Professor Support assistant. How can I help you today?" }]
    }
  ]);
  
  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    const updatedMessages = [
      ...messages,
      { role: "user", parts: [{ text: message }] },
      { role: "model", parts: [{ text: '' }] }
    ];

    setMessages(updatedMessages);
    setMessage('');

    const response = fetch('api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedMessages)
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }

        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);

          return [
            ...otherMessages,
            { ...lastMessage, parts: [{ text: lastMessage.parts[0].text + text }] },
          ];
        });

        return reader.read().then(processText);
      });
    });
  }
  
  return (
    <Box
    width="100vw"
    height="100vh"
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    bgcolor="#4a0e2e" // Deep indigo background
    sx={{
      background: 'linear-gradient(45deg, #1a237e 30%, #3949ab 90%)',
    }}
  >
    <Paper
      elevation={24}
      sx={{
        width: "80%", // Increased width
        height: "90vh", // Increased height
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        bgcolor: "rgba(255, 255, 255, 0.9)", // Slightly transparent white
        overflow: "hidden",
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
      }}
    >
      <Box
        p={4}
        sx={{
          textAlign: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
          bgcolor: "rgba(238, 238, 238, 0.7)",
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="h3" sx={{ color: '#1a237e', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
          Your Rate My Professor AI
        </Typography>
        <Typography variant="h5" sx={{ color: '#3f51b5', mt: 1 }}>
          Find your future professor
        </Typography>
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        flexGrow={1}
        overflow="auto"
        sx={{
          p: 3,
          bgcolor: "rgba(250, 250, 250, 0.7)",
          borderTop: "1px solid rgba(224, 224, 224, 0.5)",
          borderBottom: "1px solid rgba(224, 224, 224, 0.5)",
        }}
      >
        <Stack spacing={3}>
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={message.role === "model" ? "flex-start" : "flex-end"}
            >
              <Box
                sx={{
                  bgcolor: message.role === "model" ? "rgba(25, 118, 210, 0.8)" : "rgba(0, 150, 136, 0.8)",
                  color: "white",
                  borderRadius: 3,
                  p: 2,
                  maxWidth: "75%",
                  wordBreak: "break-word",
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(5px)',
                }}
              >
                <Typography variant="body1">
                  {message.parts[0].text}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box
        sx={{
          display: "flex",
          p: 3,
          borderTop: "1px solid rgba(224, 224, 224, 0.5)",
          bgcolor: "rgba(238, 238, 238, 0.7)",
          backdropFilter: 'blur(10px)',
        }}
      >
        <TextField
          label="Type a message"
          fullWidth
          variant="outlined"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{
            mr: 2,
            input: { color: '#1a237e' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(63, 81, 181, 0.5)',
              },
              '&:hover fieldset': {
                borderColor: '#3f51b5',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1a237e',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#3f51b5',
            },
          }}
        />
        <Button 
          variant="contained" 
          sx={{ 
            bgcolor: '#c62828', 
            height: '56px',
            minWidth: '120px',
            '&:hover': {
              bgcolor: '#d32f2f',
            },
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          }} 
          disabled={message.trim() === ''} 
          onClick={sendMessage}
        >
          Send
        </Button>
      </Box>
    </Paper>
  </Box>
);
  
}