import React, { useState, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Divider,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import { EvaluationResult } from '../types';

interface MuiHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  history: EvaluationResult[];
  onSelectResult: (res: EvaluationResult) => void;
  onDeleteItem: (id: string) => void;
  onToggleStar: (id: string) => void;
  onClearAll: () => void;
}

export const MuiHistoryDrawer: React.FC<MuiHistoryDrawerProps> = ({
  open,
  onClose,
  history,
  onSelectResult,
  onDeleteItem,
  onToggleStar,
  onClearAll,
}) => {
  const [search, setSearch] = useState('');
  const [filterStarred, setFilterStarred] = useState(false);

  const filtered = useMemo(() => {
    return history.filter((item) => {
      if (filterStarred && !item.starred) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.question?.toLowerCase().includes(q) ||
          item.studentAnswer?.toLowerCase().includes(q) ||
          item.verdictSummary?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [history, search, filterStarred]);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return { bg: '#dcfce7', text: '#15803d' };
    if (percentage >= 60) return { bg: '#dbeafe', text: '#1d4ed8' };
    return { bg: '#fef3c7', text: '#b45309' };
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 440 },
            p: 0,
            bgcolor: 'background.paper',
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <HistoryEduIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
            My past answers ({history.length})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {history.length > 0 && (
            <Button
              color="error"
              size="small"
              onClick={onClearAll}
              sx={{ fontSize: '0.75rem', fontWeight: 500 }}
            >
              Clear all
            </Button>
          )}
          <IconButton onClick={onClose} size="small" aria-label="close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Filter Toolbar */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'), display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by question, answer, or verdict..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
            htmlInput: {
              style: { fontSize: 14 },
            },
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            size="small"
            icon={<StarIcon sx={{ fontSize: '14px !important', color: filterStarred ? '#f59e0b !important' : 'inherit' }} />}
            label="Starred only"
            clickable
            variant={filterStarred ? 'filled' : 'outlined'}
            color={filterStarred ? 'warning' : 'default'}
            onClick={() => setFilterStarred(!filterStarred)}
            sx={{ height: 26, fontSize: '0.75rem', fontWeight: 600 }}
          />

          <Typography variant="caption" color="text.secondary">
            Showing {filtered.length} of {history.length}
          </Typography>
        </Box>
      </Box>

      {/* List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 3, color: 'text.secondary' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {history.length === 0 ? 'No answers saved yet' : 'No matching answers found'}
            </Typography>
            <Typography variant="caption">
              {history.length === 0
                ? 'Whenever you check an answer, it is automatically saved here on your device.'
                : 'Try searching with different keywords.'}
            </Typography>
          </Box>
        ) : (
          filtered.map((item) => {
            const gradeStyle = getGradeColor(item.percentage);
            return (
              <Paper
                key={item.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25,
                  transition: 'border-color 0.2s, background-color 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc'),
                  },
                }}
              >
                {/* Score and actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1 }}>
                      {item.totalAwarded} / {item.totalMarks}
                    </Typography>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: gradeStyle.bg,
                        color: gradeStyle.text,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {item.gradeBand || item.letterGrade}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => onToggleStar(item.id)} aria-label="star">
                      {item.starred ? (
                        <StarIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                      ) : (
                        <StarBorderIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      )}
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDeleteItem(item.id)} aria-label="delete">
                      <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Question */}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.question}
                </Typography>

                {/* Plain verdict */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.verdictSummary}
                </Typography>

                <Divider sx={{ my: 0.5 }} />

                {/* Card footer */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </Typography>

                  <Button
                    size="small"
                    variant="text"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    onClick={() => {
                      onSelectResult(item);
                      onClose();
                    }}
                    sx={{ p: 0, minWidth: 'auto', fontSize: '0.8125rem', fontWeight: 600 }}
                  >
                    View result
                  </Button>
                </Box>
              </Paper>
            );
          })
        )}
      </Box>
    </Drawer>
  );
};
