import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DocumentScannerOutlinedIcon from '@mui/icons-material/DocumentScannerOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

import { EvaluationParameter, StrictnessLevel, SampleQA, AnswerImage } from '../types';
import { EVALUATION_PRESETS, SAMPLE_QA_LIST } from '../data/presets';
import { StoredPreset } from '../services/db';
import { processAnswerImageFile } from '../utils/image';

interface MuiWorkbenchProps {
  currentStep: 1 | 2;
  onChangeStep: (step: 1 | 2) => void;
  question: string;
  onChangeQuestion: (q: string) => void;
  totalMarks: number;
  onChangeTotalMarks: (m: number) => void;
  modelAnswer: string;
  onChangeModelAnswer: (ma: string) => void;
  parameters: EvaluationParameter[];
  onChangeParameters: (p: EvaluationParameter[]) => void;
  strictness: StrictnessLevel;
  onChangeStrictness: (s: StrictnessLevel) => void;
  additionalInstructions: string;
  onChangeAdditionalInstructions: (ins: string) => void;
  studentAnswer: string;
  onChangeStudentAnswer: (ans: string) => void;
  customPresets: StoredPreset[];
  onSaveCustomPreset: (name: string, desc: string) => void;
  onDeleteCustomPreset: (id: string) => void;
  onEvaluate: () => void;
  isEvaluating: boolean;
  onReset: () => void;
  onSelectSample: (sample: SampleQA) => void;
  images: AnswerImage[];
  onChangeImages: (imgs: AnswerImage[]) => void;
  onTranscribeImages: () => void;
  isTranscribing: boolean;
  transcribeProgress: string;
}

export const MuiWorkbench: React.FC<MuiWorkbenchProps> = ({
  currentStep,
  onChangeStep,
  question,
  onChangeQuestion,
  totalMarks,
  onChangeTotalMarks,
  modelAnswer,
  onChangeModelAnswer,
  parameters,
  onChangeParameters,
  studentAnswer,
  onChangeStudentAnswer,
  customPresets,
  onSaveCustomPreset,
  onEvaluate,
  isEvaluating,
  onReset,
  onSelectSample,
  images,
  onChangeImages,
  onTranscribeImages,
  isTranscribing,
  transcribeProgress,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Sample menu anchor
  const [sampleMenuAnchor, setSampleMenuAnchor] = useState<null | HTMLElement>(null);

  // Rubric save state
  const [showSaveStyle, setShowSaveStyle] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');

  // Loading step message cycling
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = [
    'Reading your answer...',
    'Giving marks...',
    'Writing your full-mark version...',
  ];

  useEffect(() => {
    if (!isEvaluating) {
      setLoadingMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isEvaluating]);

  // Marks math
  const totalAllocated = parameters.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
  const roundedAllocated = Number(totalAllocated.toFixed(1));
  const isBalanced = Math.abs(roundedAllocated - totalMarks) < 0.1;

  // Word count & suggested length
  const wordCount = studentAnswer.trim() ? studentAnswer.trim().split(/\s+/).length : 0;
  const suggestedMinWords = Math.max(80, Math.round(totalMarks * 35));
  const suggestedMaxWords = Math.max(120, Math.round(totalMarks * 55));

  const handleApplyExamType = (preset: { parameters: EvaluationParameter[]; defaultTotalMarks?: number }) => {
    const presetSum = preset.parameters.reduce((s, p) => s + p.weight, 0);
    const scaled = preset.parameters.map((p) => ({
      ...p,
      id: `p_${Math.random().toString(36).substring(2, 7)}`,
      weight: Number(((p.weight / (presetSum || 1)) * totalMarks).toFixed(1)),
    }));
    onChangeParameters(scaled);
  };

  const handleAutoBalance = () => {
    if (parameters.length === 0 || totalAllocated === 0) return;
    const ratio = totalMarks / totalAllocated;
    const normalized = parameters.map((p) => ({
      ...p,
      weight: Number((p.weight * ratio).toFixed(1)),
    }));
    onChangeParameters(normalized);
  };

  const handleAddParameter = () => {
    const newParam: EvaluationParameter = {
      id: `param_${Date.now()}`,
      name: `Point ${parameters.length + 1}`,
      weight: Math.max(1, Math.round(totalMarks / (parameters.length + 1))),
      description: 'Clear explanation and accurate details.',
    };
    onChangeParameters([...parameters, newParam]);
  };

  const handleUpdateParameter = (id: string, field: keyof EvaluationParameter, val: any) => {
    onChangeParameters(
      parameters.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleDeleteParameter = (id: string) => {
    if (parameters.length <= 1) return;
    onChangeParameters(parameters.filter((p) => p.id !== id));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChangeStudentAnswer(studentAnswer ? `${studentAnswer}\n\n${text}` : text);
      }
    } catch {
      // browser permission blocked
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) onChangeStudentAnswer(content);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    try {
      const processed = await Promise.all(
        fileList.map((file) => processAnswerImageFile(file))
      );
      onChangeImages([...images, ...processed]);
    } catch (err) {
      console.error('Failed to process image files:', err);
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    onChangeImages(images.filter((img) => img.id !== id));
  };

  const handleSaveStyleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStyleName.trim()) return;
    onSaveCustomPreset(newStyleName.trim(), `${parameters.length} marking points`);
    setNewStyleName('');
    setShowSaveStyle(false);
  };

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ================= STEP 1: YOUR QUESTION ================= */}
      {currentStep === 1 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {/* Section Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Your question
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type or paste your exam question, set the marks, and choose the exam type.
              </Typography>
            </Box>

            {/* Try an example Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<LightbulbOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={(e) => setSampleMenuAnchor(e.currentTarget)}
              sx={{ height: 36, fontSize: '0.875rem' }}
            >
              Try an example
            </Button>
            <Menu
              anchorEl={sampleMenuAnchor}
              open={Boolean(sampleMenuAnchor)}
              onClose={() => setSampleMenuAnchor(null)}
              slotProps={{ paper: { sx: { minWidth: 260 } } }}
            >
              {SAMPLE_QA_LIST.map((sample) => (
                <MenuItem
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample);
                    setSampleMenuAnchor(null);
                  }}
                  sx={{ py: 1 }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {sample.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sample.category} • {sample.totalMarks} marks
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Question Text Area */}
          <TextField
            fullWidth
            multiline
            rows={5}
            placeholder="Type or paste the exam question here..."
            value={question}
            onChange={(e) => onChangeQuestion(e.target.value)}
            slotProps={{
              htmlInput: {
                style: {
                  fontSize: 16,
                  lineHeight: 1.65,
                },
              },
            }}
          />

          {/* Marks and Exam Type */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: 2.5, alignItems: 'start' }}>
            {/* Total Marks */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Total marks
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  type="number"
                  size="small"
                  value={totalMarks}
                  onChange={(e) => onChangeTotalMarks(Math.max(1, Number(e.target.value) || 1))}
                  slotProps={{
                    htmlInput: {
                      min: 1,
                      max: 200,
                      style: { fontSize: 16, fontWeight: 700, textAlign: 'center', padding: '8px' },
                    },
                  }}
                  sx={{ width: 80 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  marks
                </Typography>
              </Box>
            </Box>

            {/* Exam Type Selector */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Choose exam type
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {EVALUATION_PRESETS.map((preset) => (
                  <Chip
                    key={preset.id}
                    label={preset.name}
                    clickable
                    onClick={() => handleApplyExamType(preset)}
                    variant="outlined"
                    sx={{
                      height: 32,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  />
                ))}
                {customPresets.map((preset) => (
                  <Chip
                    key={preset.id}
                    label={preset.name}
                    clickable
                    color="primary"
                    variant="outlined"
                    onClick={() => handleApplyExamType(preset)}
                    sx={{
                      height: 32,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* Collapsible: How marks are given */}
          <Accordion
            variant="outlined"
            disableGutters
            sx={{
              borderRadius: 2,
              '&:before': { display: 'none' },
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'),
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />} sx={{ px: 2.5, minHeight: 48 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    How marks are given
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Your answer is checked on each of these points
                  </Typography>
                </Box>

                <Chip
                  icon={isBalanced ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <WarningAmberIcon sx={{ fontSize: 14 }} />}
                  label={
                    isBalanced
                      ? `Marks add up to ${roundedAllocated} of ${totalMarks}`
                      : `Marks add up to ${roundedAllocated}. They must add up to ${totalMarks}`
                  }
                  size="small"
                  color={isBalanced ? 'success' : 'warning'}
                  variant="outlined"
                  sx={{ height: 26, fontSize: '0.75rem', fontWeight: 600 }}
                />
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 2.5, pt: 1, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Adjust points or click Balance to divide marks evenly.
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!isBalanced && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AutoFixHighIcon sx={{ fontSize: 14 }} />}
                      onClick={handleAutoBalance}
                      sx={{ height: 28, fontSize: '0.75rem' }}
                    >
                      Balance marks
                    </Button>
                  )}

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<BookmarkAddOutlinedIcon sx={{ fontSize: 14 }} />}
                    onClick={() => setShowSaveStyle(!showSaveStyle)}
                    sx={{ height: 28, fontSize: '0.75rem' }}
                  >
                    Save this marking style
                  </Button>
                </Box>
              </Box>

              {/* Inline Save Style Form */}
              {showSaveStyle && (
                <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'), display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Style name (e.g. Midterm History Marking)"
                    value={newStyleName}
                    onChange={(e) => setNewStyleName(e.target.value)}
                    sx={{ flexGrow: 1 }}
                    slotProps={{ htmlInput: { style: { fontSize: 13, padding: '6px 10px' } } }}
                  />
                  <Button size="small" variant="contained" onClick={handleSaveStyleSubmit}>
                    Save
                  </Button>
                  <Button size="small" onClick={() => setShowSaveStyle(false)}>
                    Cancel
                  </Button>
                </Paper>
              )}

              {/* Points Table */}
              <TableContainer component={Box} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 1.5 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc') }}>
                    <TableRow>
                      <TableCell sx={{ width: 35, py: 1, fontWeight: 700, fontSize: '0.75rem' }}>#</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 700, fontSize: '0.75rem' }}>What is checked</TableCell>
                      <TableCell sx={{ width: 90, py: 1, fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>Marks</TableCell>
                      <TableCell sx={{ width: 40, py: 1 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parameters.map((param, index) => (
                      <TableRow
                        key={param.id}
                        sx={{
                          '& .delete-btn': { opacity: { xs: 1, sm: 0 }, transition: 'opacity 0.2s' },
                          '&:hover .delete-btn': { opacity: 1 },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.8125rem', color: 'text.secondary', verticalAlign: 'top', pt: 1.5 }}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={param.name}
                            onChange={(e) => handleUpdateParameter(param.id, 'name', e.target.value)}
                            placeholder="What is checked..."
                            slotProps={{ htmlInput: { style: { fontSize: 14, fontWeight: 600, padding: '4px 8px' } } }}
                            sx={{ mb: 0.5 }}
                          />
                          <TextField
                            fullWidth
                            size="small"
                            value={param.description}
                            onChange={(e) => handleUpdateParameter(param.id, 'description', e.target.value)}
                            placeholder="Description..."
                            slotProps={{ htmlInput: { style: { fontSize: 12, padding: '4px 8px' } } }}
                          />
                        </TableCell>
                        <TableCell sx={{ verticalAlign: 'top', pt: 1.25, textAlign: 'center' }}>
                          <TextField
                            type="number"
                            size="small"
                            value={param.weight}
                            onChange={(e) => handleUpdateParameter(param.id, 'weight', Math.max(0.5, Number(e.target.value) || 0.5))}
                            slotProps={{
                              htmlInput: {
                                step: 0.5,
                                min: 0.5,
                                max: totalMarks,
                                style: { fontSize: 13, padding: '4px 6px', textAlign: 'center', fontWeight: 700, width: 45 },
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ verticalAlign: 'top', pt: 1, textAlign: 'center' }}>
                          {parameters.length > 1 && (
                            <IconButton
                              className="delete-btn"
                              size="small"
                              color="error"
                              onClick={() => handleDeleteParameter(param.id)}
                              aria-label="delete point"
                            >
                              <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddParameter}
                sx={{ height: 32, fontSize: '0.8125rem' }}
              >
                Add another point
              </Button>
            </AccordionDetails>
          </Accordion>

          {/* Collapsible: Teacher's Answer */}
          <Accordion
            variant="outlined"
            disableGutters
            sx={{
              borderRadius: 2,
              '&:before': { display: 'none' },
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'),
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />} sx={{ px: 2.5, minHeight: 48 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Add your teacher's answer or key points (optional)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2.5, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Paste the teacher's model answer or key points to benchmark against..."
                value={modelAnswer}
                onChange={(e) => onChangeModelAnswer(e.target.value)}
                slotProps={{ htmlInput: { style: { fontSize: 14, lineHeight: 1.6 } } }}
              />
            </AccordionDetails>
          </Accordion>

          {/* Primary Action Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => onChangeStep(2)}
              disabled={!question.trim()}
              sx={{ height: 46, px: 4, fontSize: '1rem', fontWeight: 600 }}
            >
              Continue to your answer
            </Button>
          </Box>
        </Paper>
      )}

      {/* ================= STEP 2: YOUR ANSWER ================= */}
      {currentStep === 2 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          {/* Question Review Preview */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'),
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Question ({totalMarks} marks)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25, whiteSpace: 'pre-wrap' }}>
                {question || 'No question prompt entered.'}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="text"
              startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
              onClick={() => onChangeStep(1)}
              sx={{ flexShrink: 0, fontSize: '0.8125rem' }}
            >
              Edit question
            </Button>
          </Box>

          {/* Answer Area Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>
                Your answer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type, paste or upload the answer you wrote.
              </Typography>
            </Box>

            {/* Word Count and Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentPasteIcon sx={{ fontSize: 15 }} />}
                onClick={handlePaste}
                sx={{ height: 32, fontSize: '0.8125rem' }}
              >
                Paste
              </Button>

              <Button
                size="small"
                variant="outlined"
                startIcon={<UploadFileIcon sx={{ fontSize: 15 }} />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ height: 32, fontSize: '0.8125rem' }}
              >
                Upload text
              </Button>
              <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleFileUpload} style={{ display: 'none' }} />

              <Button
                size="small"
                variant={images.length > 0 ? 'contained' : 'outlined'}
                color={images.length > 0 ? 'primary' : 'inherit'}
                startIcon={<AddPhotoAlternateOutlinedIcon sx={{ fontSize: 16 }} />}
                onClick={() => imageInputRef.current?.click()}
                sx={{ height: 32, fontSize: '0.8125rem' }}
              >
                {images.length > 0 ? `Add photos (${images.length})` : 'Upload answer photos'}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFilesSelect}
                style={{ display: 'none' }}
              />
            </Box>
          </Box>

          {/* Multiple Answer Sheet Images Tray */}
          {images.length > 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'),
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageOutlinedIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Answer sheet pages ({images.length} {images.length === 1 ? 'page' : 'pages'})
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    startIcon={isTranscribing ? <CircularProgress size={14} color="inherit" /> : <DocumentScannerOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={onTranscribeImages}
                    disabled={isTranscribing}
                    sx={{ height: 32, fontSize: '0.8125rem', fontWeight: 600 }}
                  >
                    {isTranscribing ? (transcribeProgress || 'Transcribing handwriting...') : 'Transcribe handwriting to text'}
                  </Button>

                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => onChangeImages([])}
                    disabled={isTranscribing}
                    sx={{ height: 32, fontSize: '0.8125rem' }}
                  >
                    Clear all
                  </Button>
                </Box>
              </Box>

              {/* Thumbnails Gallery */}
              <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', py: 0.5 }}>
                {images.map((img, idx) => (
                  <Paper
                    key={img.id}
                    variant="outlined"
                    sx={{
                      position: 'relative',
                      width: 120,
                      flexShrink: 0,
                      borderRadius: 2,
                      overflow: 'hidden',
                      p: 0.75,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Box
                      component="img"
                      src={img.dataUrl}
                      alt={`Page ${idx + 1}`}
                      sx={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 1.5,
                        display: 'block',
                      }}
                    />
                    <Chip
                      label={`Page ${idx + 1}`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        height: 20,
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                        color: '#ffffff',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(img.id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        color: 'error.main',
                        p: 0.35,
                        '&:hover': { bgcolor: '#ffffff' },
                      }}
                      aria-label="remove page"
                    >
                      <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: 11,
                        display: 'block',
                        textAlign: 'center',
                        mt: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'text.secondary',
                      }}
                    >
                      {img.name} ({img.sizeKb} KB)
                    </Typography>
                  </Paper>
                ))}

                <Button
                  variant="outlined"
                  onClick={() => imageInputRef.current?.click()}
                  sx={{
                    width: 120,
                    height: 148,
                    flexShrink: 0,
                    borderRadius: 2,
                    borderStyle: 'dashed',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                    fontSize: '0.75rem',
                  }}
                >
                  <AddIcon fontSize="small" />
                  Add page
                </Button>
              </Box>
            </Paper>
          )}

          {/* Suggested Length Helper */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, px: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {wordCount} words {images.length > 0 ? `• ${images.length} photo${images.length === 1 ? '' : 's'} attached` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              About {suggestedMinWords} to {suggestedMaxWords} words is ideal for {totalMarks} marks
            </Typography>
          </Box>

          {/* Student Answer Text Area */}
          <TextField
            fullWidth
            multiline
            rows={images.length > 0 ? 10 : 14}
            placeholder={
              images.length > 0
                ? "Your handwritten answer pages are attached above. You can click 'Transcribe handwriting to text' or check your answer directly..."
                : "Write or paste your answer here, or click 'Upload answer photos' to attach photos of your written answer sheet..."
            }
            value={studentAnswer}
            onChange={(e) => onChangeStudentAnswer(e.target.value)}
            slotProps={{
              htmlInput: {
                style: {
                  fontSize: 16,
                  lineHeight: 1.68,
                },
              },
            }}
          />

          <Divider sx={{ my: 1 }} />

          {/* Action Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<RestartAltIcon />}
              onClick={onReset}
              disabled={isEvaluating}
            >
              Start over
            </Button>

            {/* Exactly ONE main action button */}
            <Button
              variant="contained"
              size="large"
              disabled={isEvaluating || (!studentAnswer.trim() && images.length === 0)}
              startIcon={isEvaluating ? <CircularProgress size={18} color="inherit" /> : undefined}
              onClick={onEvaluate}
              sx={{ height: 48, px: 4, fontSize: '1rem', fontWeight: 700 }}
            >
              {isEvaluating ? loadingMessages[loadingMessageIndex] : 'Check my answer'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};
