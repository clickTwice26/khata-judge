import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Badge,
  Tooltip,
} from '@mui/material';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import HistoryIcon from '@mui/icons-material/History';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

interface MuiNavbarProps {
  historyCount: number;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

export const MuiNavbar: React.FC<MuiNavbarProps> = ({
  historyCount,
  onOpenHistory,
  onOpenSettings,
}) => {
  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar
        sx={{
          minHeight: { xs: 58, sm: 64 },
          px: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Left: Logo & Brand & Tagline */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
            }}
          >
            <FactCheckIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.0625rem' },
                lineHeight: 1.2,
                color: 'text.primary',
              }}
            >
              Khata Judge
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontSize: '0.75rem',
                lineHeight: 1.2,
              }}
            >
              Check your answer. Get the full-mark version.
            </Typography>
          </Box>
        </Box>

        {/* Right: "My past answers" and Settings icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={
              <Badge
                badgeContent={historyCount}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: 10,
                    height: 16,
                    minWidth: 16,
                    padding: '0 4px',
                  },
                }}
              >
                <HistoryIcon fontSize="small" />
              </Badge>
            }
            onClick={onOpenHistory}
            sx={{
              height: 36,
              px: 1.75,
              fontSize: '0.875rem',
            }}
          >
            My past answers
          </Button>

          <Tooltip title="Settings">
            <IconButton
              onClick={onOpenSettings}
              size="small"
              sx={{
                width: 36,
                height: 36,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
              aria-label="Settings"
            >
              <SettingsOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
