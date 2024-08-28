'use client'

import { Box, Stack, TextField, Button, Paper, Typography } from "@mui/material";
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
  bgcolor="##004d40"
>
  <Paper
    elevation={3}
    sx={{
      width: "500px",
      maxHeight: "200vh",
      display: "flex",
      flexDirection: "column",
      borderRadius: 2,
      bgcolor: "#ffffff",
      overflow: "hidden",
      boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
    }}
  >
    <Box
      p={3}
      sx={{
        textAlign: "center",
        borderBottom: "1px solid #e0e0e0",
        bgcolor: "#eeeeee",
      }}
    >
      <Typography variant="h4" sx={{ color: '#0c005a', fontWeight: 'bold' }}>
        Your Rate My Professor AI
      </Typography>
      <Typography variant="subtitle1" sx={{ color: '#004d40' }}>
        Find your future professor
      </Typography>
    </Box>

    <Box
      display="flex"
      flexDirection="column"
      flexGrow={1}
      overflow="auto"
      sx={{
        p: 2,
        bgcolor: "#fafafa",
        borderTop: "1px solid #e0e0e0",
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      <Stack spacing={2}>
        {messages.map((message, index) => (
          <Box
            key={index}
            display="flex"
            justifyContent={message.role === "model" ? "flex-start" : "flex-end"}
          >
            <Box
              sx={{
                bgcolor: message.role === "model" ? "#004d40" : "#002d40",
                color: "white",
                borderRadius: 2,
                p: 2,
                maxWidth: "75%",
                wordBreak: "break-word",
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
        p: 2,
        borderTop: "1px solid #e0e0e0",
        bgcolor: "#eeeeee",
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
          input: { color: 'black' },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#ccc',
            },
            '&:hover fieldset': {
              borderColor: '#0c005a',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0c005a',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#999',
          },
        }}
      />
      <Button 
        variant="contained" 
        sx={{ 
          bgcolor: '#bc2525', 
          height: '56px',
          '&:hover': {
            bgcolor: '#ff0000',
          } 
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