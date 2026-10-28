import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Alert,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { EvaluationResult } from '../types';
import { computeWordDiff } from '../utils/diff';
import { downloadAnswerText, printAnswerPdf } from '../utils/export';
import { MarkdownContent } from './MarkdownContent';

interface MuiScorecardProps {
  result: EvaluationResult;
  onEditAndCheckAgain: () => void;
  onCheckNewQuestion: () => void;
  onToggleStar?: (id: string) => void;
}

export const MuiScorecard: React.FC<MuiScorecardProps> = ({
  result,
  onEditAndCheckAgain,
  onCheckNewQuestion,
  onToggleStar,
}) => {
  const [activeTab, setActiveTab] = useState<'points' | 'fullmark' | 'changes' | 'tips'>('points');
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
  const [diffMode, setDiffMode] = useState<'inline' | 'split'>('inline');

  // Compute word-level diff
  const diffTokens = useMemo(() => {
    return computeWordDiff(result.studentAnswer, result.fullMarkAnswer || result.studentAnswer);
  }, [result.studentAnswer, result.fullMarkAnswer]);

  const handleCopyFullMarkAnswer = async () => {
    const textToCopy = result.fullMarkAnswer || result.studentAnswer;
    await navigator.clipboard.writeText(textToCopy);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const getGradeBandStyle = (band?: string) => {
    switch (band) {
      case 'Excellent':
        return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      case 'Good':
        return { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Needs work':
      default:
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    }
  };

  const bandStyle = getGradeBandStyle(result.gradeBand);

  return (
    <Box sx={{ maxWidth: 880, mx: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Score Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#131b2e' : '#ffffff'),
          border: '1.5px solid',
          borderColor: (theme) => (theme.palette.mode === 'dark' ? '#1e3a5f' : '#e2e8f0'),
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 3,
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                bgcolor: bandStyle.bg,
                color: bandStyle.text,
                border: `1px solid ${bandStyle.border}`,
                fontWeight: 700,
                fontSize: '0.8125rem',
                letterSpacing: 0.25,
              }}
            >
              {result.gradeBand || 'Good'}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Graded on {new Date(result.timestamp).toLocaleDateString()}
            </Typography>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
            {result.verdictSummary}
          </Typography>

          <MarkdownContent
            content={result.executiveCritique}
            sx={{ maxWidth: 650, fontSize: '0.875rem', color: 'text.secondary', '& p': { m: 0 } }}
          />
        </Box>

        {/* Big Score Display */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'flex-start', sm: 'flex-end' },
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'),
            p: 2.5,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            minWidth: 170,
          }}
        >
          <Typography
            variant="h3"
            component="div"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}
          >
            {result.totalAwarded}
            <Typography
              component="span"
              variant="h5"
              sx={{ fontWeight: 500, color: 'text.secondary', ml: 0.5 }}
            >
              / {result.totalMarks}
            </Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, fontWeight: 600 }}>
            {result.percentage}% marks awarded
          </Typography>
        </Box>
      </Paper>

      {/* Main Tabbed Analysis Paper */}
      <Paper elevation={0} sx={{ borderRadius: 3, bgcolor: 'background.paper', overflow: 'hidden' }}>
        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc') }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 48 }}
          >
            <Tab
              value="points"
              label="Marks by point"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem', minHeight: 48 }}
            />
            <Tab
              value="fullmark"
              label="Your full-mark answer"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem', minHeight: 48 }}
            />
            <Tab
              value="changes"
              label="What changed"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem', minHeight: 48 }}
            />
            <Tab
              value="tips"
              label="Tips for next time"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem', minHeight: 48 }}
            />
          </Tabs>
        </Box>

        {/* ================= TAB 1: MARKS BY POINT ================= */}
        {activeTab === 'points' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Breakdown of your marks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                See exactly what you did well and where you lost marks for each point.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {result.parameters.map((point, index) => {
                const isFullMarks = point.marksAwarded >= point.maxMarks;
                return (
                  <Paper
                    key={point.parameterId || index}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'),
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9'),
                            color: 'text.secondary',
                          }}
                        >
                          Point {index + 1}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                          {point.parameterName}
                        </Typography>
                      </Box>

                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isFullMarks ? 'success.main' : 'text.primary' }}>
                        {point.marksAwarded} / {point.maxMarks} marks
                      </Typography>
                    </Box>

                    {/* What you did well & What lost marks */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5, mt: 0.5 }}>
                      {/* What you did well */}
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(34,197,94,0.08)' : '#f0fdf4'),
                          border: '1px solid',
                          borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(34,197,94,0.2)' : '#dcfce7'),
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <CheckCircleOutlinedIcon sx={{ fontSize: 16 }} /> What you did well
                        </Typography>
                        <MarkdownContent
                          content={point.strengths.join(' ')}
                          sx={{
                            color: (theme) => (theme.palette.mode === 'dark' ? '#86efac' : '#166534'),
                            fontSize: '0.875rem',
                            lineHeight: 1.55,
                            '& p': { m: 0 },
                          }}
                        />
                      </Box>

                      {/* What lost marks */}
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(234,179,8,0.08)' : '#fffbeb'),
                          border: '1px solid',
                          borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(234,179,8,0.2)' : '#fef3c7'),
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <LightbulbOutlinedIcon sx={{ fontSize: 16 }} /> What lost you marks
                        </Typography>
                        <MarkdownContent
                          content={point.flaws.join(' ')}
                          sx={{
                            color: (theme) => (theme.palette.mode === 'dark' ? '#fde047' : '#92400e'),
                            fontSize: '0.875rem',
                            lineHeight: 1.55,
                            '& p': { m: 0 },
                          }}
                        />
                      </Box>
                    </Box>

                    {/* How to get full marks */}
                    {point.recommendation && (
                      <Box sx={{ mt: 0.5, display: 'flex', gap: 0.75, alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          How to get full marks:
                        </Typography>
                        <MarkdownContent
                          content={point.recommendation}
                          sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'inline', '& p': { m: 0, display: 'inline' } }}
                        />
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          </Box>
        )}

        {/* ================= TAB 2: YOUR FULL-MARK ANSWER ================= */}
        {activeTab === 'fullmark' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Your full-mark answer
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A perfected version of your own answer to study and memorize for the exam.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
                  onClick={handleCopyFullMarkAnswer}
                >
                  {copiedAnswer ? 'Copied!' : 'Copy'}
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<ArrowDropDownIcon />}
                  startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={(e) => setDownloadMenuAnchor(e.currentTarget)}
                >
                  Download
                </Button>
                <Menu
                  anchorEl={downloadMenuAnchor}
                  open={Boolean(downloadMenuAnchor)}
                  onClose={() => setDownloadMenuAnchor(null)}
                >
                  <MenuItem
                    onClick={() => {
                      printAnswerPdf(result);
                      setDownloadMenuAnchor(null);
                    }}
                  >
                    Download as PDF (Print)
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      downloadAnswerText(result);
                      setDownloadMenuAnchor(null);
                    }}
                  >
                    Download as text file (.txt)
                  </MenuItem>
                </Menu>
              </Box>
            </Box>

            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: 2,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'),
                border: '1.5px solid',
                borderColor: 'primary.light',
              }}
            >
              <MarkdownContent content={result.fullMarkAnswer || result.studentAnswer} />
            </Paper>
          </Box>
        )}

        {/* ================= TAB 3: WHAT CHANGED ================= */}
        {activeTab === 'changes' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  What changed
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compare your original answer with the full-mark version to see exactly what was improved.
                </Typography>
              </Box>

              {/* View toggle */}
              <Box sx={{ display: 'flex', gap: 0.5, bgcolor: 'action.hover', p: 0.5, borderRadius: 1.5 }}>
                <Button
                  size="small"
                  variant={diffMode === 'inline' ? 'contained' : 'text'}
                  onClick={() => setDiffMode('inline')}
                  sx={{ height: 28, fontSize: '0.75rem', px: 1.5 }}
                >
                  Highlighted
                </Button>
                <Button
                  size="small"
                  variant={diffMode === 'split' ? 'contained' : 'text'}
                  onClick={() => setDiffMode('split')}
                  sx={{ height: 28, fontSize: '0.75rem', px: 1.5 }}
                >
                  Side-by-side
                </Button>
              </Box>
            </Box>

            {diffMode === 'inline' ? (
              <Box>
                {/* Legend */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, fontSize: 13 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 14, height: 14, bgcolor: '#bbf7d0', borderRadius: 0.5 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Added or improved content
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 14, height: 14, bgcolor: '#fecaca', borderRadius: 0.5 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Removed or replaced content
                    </Typography>
                  </Box>
                </Box>

                <Paper
                  variant="outlined"
                  sx={{
                    p: { xs: 2.5, sm: 3 },
                    borderRadius: 2,
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'),
                    fontSize: 16,
                    lineHeight: 1.75,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {diffTokens.map((token, idx) => {
                    if (token.type === 'added') {
                      return (
                        <Box
                          component="span"
                          key={idx}
                          sx={{
                            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(34,197,94,0.25)' : '#dcfce7'),
                            color: (theme) => (theme.palette.mode === 'dark' ? '#86efac' : '#14532d'),
                            px: 0.5,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontWeight: 500,
                          }}
                        >
                          {token.value}
                        </Box>
                      );
                    }
                    if (token.type === 'removed') {
                      return (
                        <Box
                          component="span"
                          key={idx}
                          sx={{
                            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.25)' : '#fee2e2'),
                            color: (theme) => (theme.palette.mode === 'dark' ? '#fca5a5' : '#7f1d1d'),
                            textDecoration: 'line-through',
                            px: 0.5,
                            py: 0.25,
                            borderRadius: 0.5,
                            opacity: 0.85,
                          }}
                        >
                          {token.value}
                        </Box>
                      );
                    }
                    return <span key={idx}>{token.value}</span>;
                  })}
                </Paper>
              </Box>
            ) : (
              /* Side-by-side mode */
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>
                    Your original answer
                  </Typography>
                  <MarkdownContent
                    content={result.studentAnswer}
                    sx={{ fontSize: '0.9375rem', lineHeight: 1.68 }}
                  />
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f0fdf4'),
                    borderColor: 'primary.light',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
                    Full-mark improved version
                  </Typography>
                  <MarkdownContent
                    content={result.fullMarkAnswer || result.studentAnswer}
                    sx={{ fontSize: '0.9375rem', lineHeight: 1.68 }}
                  />
                </Paper>
              </Box>
            )}
          </Box>
        )}

        {/* ================= TAB 4: TIPS FOR NEXT TIME ================= */}
        {activeTab === 'tips' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Tips for next time
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Actionable exam strategies to boost your score on similar questions.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {(result.tips || []).map((tip, idx) => (
                <Paper
                  key={idx}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'),
                  }}
                >
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: 1.5,
                      bgcolor: 'primary.main',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </Box>
                  <MarkdownContent
                    content={tip}
                    sx={{ fontSize: '0.9375rem', lineHeight: 1.6, '& p': { m: 0 } }}
                  />
                </Paper>
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Bottom Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<EditNoteIcon />}
            onClick={onEditAndCheckAgain}
          >
            Edit my answer and check again
          </Button>

          {onToggleStar && (
            <Tooltip title={result.starred ? 'Starred in your past answers' : 'Star this answer'}>
              <Button
                variant="outlined"
                startIcon={result.starred ? <BookmarkAddedIcon color="warning" /> : <BookmarkBorderIcon />}
                onClick={() => onToggleStar(result.id)}
              >
                {result.starred ? 'Saved & Starred' : 'Save to my past answers'}
              </Button>
            </Tooltip>
          )}
        </Box>

        <Button
          variant="contained"
          startIcon={<AddCircleOutlinedIcon />}
          onClick={onCheckNewQuestion}
        >
          Check a new question
        </Button>
      </Box>
    </Box>
  );
};
