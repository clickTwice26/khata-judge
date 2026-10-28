import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Collapse,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { testGeminiApiKey } from '../services/geminiJudge';

interface ApiKeySetupCardProps {
  onSaveKey: (key: string) => void;
  selectedModel: string;
}

export const ApiKeySetupCard: React.FC<ApiKeySetupCardProps> = ({ onSaveKey, selectedModel }) => {
  const [inputKey, setInputKey] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ isError: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setFeedback({ isError: true, text: 'Please enter your Google AI key to continue.' });
      return;
    }

    setIsVerifying(true);
    setFeedback(null);
    try {
      const res = await testGeminiApiKey(trimmed, selectedModel);
      if (res.success) {
        onSaveKey(trimmed);
      } else {
        setFeedback({ isError: true, text: res.message });
      }
    } catch {
      setFeedback({ isError: true, text: 'Your Google AI key is not working. Please check it in Settings.' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3.5 },
        borderRadius: 3,
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#131b2e' : '#f0fdf4'),
        border: '1.5px solid',
        borderColor: (theme) => (theme.palette.mode === 'dark' ? '#1e3a5f' : '#bbf7d0'),
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          <KeyIcon sx={{ fontSize: 24 }} />
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Connect your free Google AI key to start checking answers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your key stays safely in your own browser on this device. It is never sent to any server.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: 'center', maxWidth: 640 }}>
            <TextField
              fullWidth
              size="small"
              type="password"
              placeholder="Paste your key here (e.g. AIzaSy...)"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setFeedback(null);
              }}
              slotProps={{
                htmlInput: {
                  style: { fontFamily: 'monospace', fontSize: 14, padding: '10px 14px' },
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isVerifying || !inputKey.trim()}
              startIcon={isVerifying ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlinedIcon />}
              sx={{ minWidth: 140, height: 42, flexShrink: 0 }}
            >
              {isVerifying ? 'Connecting...' : 'Connect'}
            </Button>
          </Box>

          {feedback && (
            <Alert severity={feedback.isError ? 'error' : 'success'} sx={{ mt: 2, maxWidth: 640 }}>
              {feedback.text}
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <Button
              size="small"
              variant="text"
              startIcon={<HelpOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setShowHelp(!showHelp)}
              sx={{ color: 'text.secondary', fontWeight: 500, p: 0, '&:hover': { background: 'transparent' } }}
            >
              {showHelp ? 'Hide instructions' : 'How do I get one? (Free in 1 minute)'}
            </Button>
          </Box>

          <Collapse in={showHelp}>
            <Box
              sx={{
                mt: 1.5,
                p: 2,
                borderRadius: 2,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0b0f19' : '#ffffff'),
                border: '1px solid',
                borderColor: 'divider',
                maxWidth: 640,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Follow these 3 quick steps:
              </Typography>
              <ol style={{ paddingLeft: 20, margin: '0 0 12px 0' }}>
                <li style={{ marginBottom: 6 }}>
                  Open{' '}
                  <Link
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, fontWeight: 600 }}
                  >
                    Google AI Studio <OpenInNewIcon sx={{ fontSize: 13 }} />
                  </Link>{' '}
                  and sign in with your regular Google account.
                </li>
                <li style={{ marginBottom: 6 }}>
                  Click the blue <strong>"Create API key"</strong> button.
                </li>
                <li>
                  Copy the generated key, paste it into the box above, and click <strong>"Connect"</strong>.
                </li>
              </ol>
              <Typography variant="caption" color="text.secondary">
                Google provides this free of charge with daily credits for personal study.
              </Typography>
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Paper>
  );
};
