import React, { useState, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  CircularProgress,
  Link,
  List,
  ListItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyIcon from '@mui/icons-material/Key';
import SpeedIcon from '@mui/icons-material/Speed';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import StorageIcon from '@mui/icons-material/Storage';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { StoredPreset, khataDB } from '../services/db';
import { testGeminiApiKey, GeminiModelInfo } from '../services/geminiJudge';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  themeMode: 'light' | 'dark';
  onToggleThemeMode: () => void;
  customPresets: StoredPreset[];
  onDeleteCustomPreset: (id: string) => void;
  onRefreshData: () => void;
  evaluationCount: number;
  availableModels: GeminiModelInfo[];
  isLoadingModels: boolean;
  onRefreshModels: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  open,
  onClose,
  apiKey,
  onSaveApiKey,
  selectedModel,
  onSelectModel,
  themeMode,
  onToggleThemeMode,
  customPresets,
  onDeleteCustomPreset,
  onRefreshData,
  evaluationCount,
  availableModels,
  isLoadingModels,
  onRefreshModels,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Key editing state
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [newKey, setNewKey] = useState(apiKey);
  const [testingKey, setTestingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<{ isError: boolean; text: string } | null>(null);

  // Preset rename state
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetNewName, setPresetNewName] = useState('');

  // General feedback
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const isConnected = Boolean(apiKey && apiKey.trim().length > 0);

  const handleTestAndSaveKey = async () => {
    const trimmed = newKey.trim();
    if (!trimmed) {
      setKeyFeedback({ isError: true, text: 'Please enter a key.' });
      return;
    }

    setTestingKey(true);
    setKeyFeedback(null);
    try {
      const res = await testGeminiApiKey(trimmed, selectedModel);
      if (res.success) {
        onSaveApiKey(trimmed);
        setIsEditingKey(false);
        setKeyFeedback({ isError: false, text: 'Connected successfully.' });
      } else {
        setKeyFeedback({ isError: true, text: res.message });
      }
    } catch {
      setKeyFeedback({ isError: true, text: 'Your Google AI key is not working. Please check it.' });
    } finally {
      setTestingKey(false);
    }
  };

  const handleRemoveKey = () => {
    if (window.confirm('Disconnect your Google AI key?')) {
      onSaveApiKey('');
      setNewKey('');
      setIsEditingKey(false);
      setKeyFeedback(null);
    }
  };

  const handleStartRenamePreset = (p: StoredPreset) => {
    setEditingPresetId(p.id);
    setPresetNewName(p.name);
  };

  const handleSaveRenamePreset = async (id: string) => {
    if (!presetNewName.trim()) return;
    const target = customPresets.find((p) => p.id === id);
    if (target) {
      await khataDB.saveCustomPreset({
        ...target,
        name: presetNewName.trim(),
      });
      onRefreshData();
    }
    setEditingPresetId(null);
    setPresetNewName('');
  };

  const handleDownloadBackup = async () => {
    try {
      const data = await khataDB.exportFullDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `khata-judge-my-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setActionNotice('Backup downloaded successfully.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch {
      setActionNotice('Failed to download data backup.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const { importedEvals, importedPresets } = await khataDB.importFullDatabase(json);
        onRefreshData();
        setActionNotice(`Imported ${importedEvals} answers and ${importedPresets} marking styles.`);
        setTimeout(() => setActionNotice(null), 3500);
      } catch {
        setActionNotice('Failed to import: file is not a valid backup.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to delete all saved answers and custom marking styles from this device? This cannot be undone.')) {
      await khataDB.clearAllEvaluations();
      await khataDB.clearDraft();
      onRefreshData();
      setActionNotice('All data has been cleared from this device.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 460 },
            p: 0,
            bgcolor: 'background.paper',
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
            Settings
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {actionNotice && (
        <Alert severity="info" sx={{ m: 2, mb: 0, fontSize: 13 }} onClose={() => setActionNotice(null)}>
          {actionNotice}
        </Alert>
      )}

      {/* Content */}
      <Box sx={{ p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
        {/* Section 1: Google AI Key */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <KeyIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Google AI Key
              </Typography>
            </Box>
            <Chip
              label={isConnected ? 'Connected' : 'Not connected'}
              color={isConnected ? 'success' : 'default'}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>

          {!isEditingKey ? (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'), border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {isConnected
                  ? 'Your key is active and ready to check answers.'
                  : 'Add your free key to start checking your answers.'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={() => { setIsEditingKey(true); setNewKey(apiKey); }}>
                  {isConnected ? 'Change key' : 'Connect key'}
                </Button>
                {isConnected && (
                  <Button size="small" color="error" onClick={handleRemoveKey}>
                    Disconnect
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'), border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                type="password"
                placeholder="Paste key here (AIzaSy...)"
                value={newKey}
                onChange={(e) => {
                  setNewKey(e.target.value);
                  setKeyFeedback(null);
                }}
                slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: 13 } } }}
              />

              {keyFeedback && (
                <Alert severity={keyFeedback.isError ? 'error' : 'success'} sx={{ fontSize: 12 }}>
                  {keyFeedback.text}
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  variant="caption"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}
                >
                  Get free key <OpenInNewIcon sx={{ fontSize: 12 }} />
                </Link>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={() => setIsEditingKey(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleTestAndSaveKey}
                    disabled={testingKey || !newKey.trim()}
                    startIcon={testingKey ? <CircularProgress size={14} color="inherit" /> : undefined}
                  >
                    {testingKey ? 'Checking...' : 'Save'}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Section 2: Checking Quality & Available Models */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SpeedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Checking quality
              </Typography>
            </Box>
            <Chip
              label={selectedModel}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontFamily: 'monospace', fontSize: '0.75rem', height: 22 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Choose how answers are examined.
          </Typography>

          <RadioGroup
            value={selectedModel.includes('pro') ? 'best' : 'fast'}
            onChange={(e) => onSelectModel(e.target.value === 'best' ? 'gemini-2.5-pro' : 'gemini-2.5-flash')}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: !selectedModel.includes('pro') ? 'primary.main' : 'divider',
                bgcolor: !selectedModel.includes('pro') ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.1)' : '#eff6ff') : 'transparent',
                mb: 1,
              }}
            >
              <FormControlLabel
                value="fast"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Fast (Recommended)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Fastest checking, excellent accuracy for all academic subjects.
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: selectedModel.includes('pro') ? 'primary.main' : 'divider',
                bgcolor: selectedModel.includes('pro') ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.1)' : '#eff6ff') : 'transparent',
              }}
            >
              <FormControlLabel
                value="best"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Best
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Thorough, deep analysis for very long essays or competitive exams.
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </RadioGroup>

          {/* Dynamic Models Accordion */}
          <Accordion
            variant="outlined"
            disableGutters
            sx={{
              mt: 1.5,
              borderRadius: 2,
              '&:before': { display: 'none' },
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'),
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ minHeight: 42, px: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  All models on your API key {availableModels.length > 0 ? `(${availableModels.length})` : ''}
                </Typography>
                {isLoadingModels && <CircularProgress size={14} sx={{ mr: 1 }} />}
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 2, pt: 1, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Live models retrieved directly from Google's API:
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
                  onClick={onRefreshModels}
                  disabled={isLoadingModels || !apiKey.trim()}
                  sx={{ p: 0, minWidth: 'auto', fontSize: '0.75rem' }}
                >
                  Refresh
                </Button>
              </Box>

              {availableModels.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', py: 1 }}>
                  {apiKey.trim()
                    ? 'Click Refresh to load available models from your API key.'
                    : 'Connect your Google AI key above to see all models available on your account.'}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 260, overflowY: 'auto' }}>
                  {availableModels.map((m) => {
                    const isCurrent = selectedModel === m.id;
                    return (
                      <Paper
                        key={m.id}
                        variant="outlined"
                        onClick={() => onSelectModel(m.id)}
                        sx={{
                          p: 1.25,
                          borderRadius: 1.5,
                          cursor: 'pointer',
                          borderColor: isCurrent ? 'primary.main' : 'divider',
                          bgcolor: isCurrent
                            ? (theme: Theme) => (theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.15)' : '#eff6ff')
                            : 'transparent',
                          transition: 'all 0.15s',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: (theme: Theme) => (theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc'),
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: isCurrent ? 700 : 600, fontSize: '0.875rem' }}>
                            {m.displayName}
                          </Typography>
                          {isCurrent && (
                            <Chip label="Selected" size="small" color="primary" sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600 }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', display: 'block' }}>
                          {m.id} {m.inputTokenLimit ? `• ${Number(m.inputTokenLimit).toLocaleString()} context tokens` : ''}
                        </Typography>
                        {m.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              fontSize: '0.75rem',
                              mt: 0.25,
                            }}
                          >
                            {m.description}
                          </Typography>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>

        <Divider />

        {/* Section 3: Appearance */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.25 }}>
              Appearance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Switch between light and dark mode
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={onToggleThemeMode}
            startIcon={themeMode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
          >
            {themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
        </Box>

        <Divider />

        {/* Section 4: Saved Marking Styles */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <BookmarkBorderIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Saved marking styles
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Custom styles you have saved for different exam types.
          </Typography>

          {customPresets.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block' }}>
              No custom marking styles saved yet. You can save one while editing points in Step 1.
            </Typography>
          ) : (
            <List dense disablePadding sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              {customPresets.map((preset) => (
                <ListItem
                  key={preset.id}
                  divider
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {editingPresetId === preset.id ? (
                        <IconButton size="small" color="primary" onClick={() => handleSaveRenamePreset(preset.id)}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton size="small" onClick={() => handleStartRenamePreset(preset)}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                      <IconButton size="small" color="error" onClick={() => onDeleteCustomPreset(preset.id)}>
                        <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  }
                >
                  {editingPresetId === preset.id ? (
                    <TextField
                      size="small"
                      value={presetNewName}
                      onChange={(e) => setPresetNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRenamePreset(preset.id);
                        if (e.key === 'Escape') setEditingPresetId(null);
                      }}
                      sx={{ mr: 6 }}
                    />
                  ) : (
                    <Box sx={{ pr: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {preset.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {preset.parameters.length} points • {preset.defaultTotalMarks} marks
                      </Typography>
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider />

        {/* Section 5: Data & Privacy */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <StorageIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Your data
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your answers are saved only on this device. You currently have <strong>{evaluationCount}</strong> saved answer{evaluationCount === 1 ? '' : 's'}.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={handleDownloadBackup}
              sx={{ justifyContent: 'flex-start' }}
            >
              Download all my data (backup file)
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadOutlinedIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ justifyContent: 'flex-start' }}
            >
              Restore my data from backup
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />

            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteOutlinedIcon />}
              onClick={handleClearAllData}
              sx={{ justifyContent: 'flex-start', mt: 1 }}
            >
              Clear all my data
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};
