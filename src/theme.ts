import { createTheme, Theme } from '@mui/material/styles';

export function getAppTheme(mode: 'light' | 'dark' = 'light'): Theme {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#3b82f6' : '#2563eb',
        dark: isDark ? '#2563eb' : '#1d4ed8',
        light: isDark ? '#60a5fa' : '#3b82f6',
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#94a3b8' : '#475569',
      },
      background: {
        default: isDark ? '#0b0f19' : '#f8fafc',
        paper: isDark ? '#111827' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#475569',
      },
      divider: isDark ? '#1e293b' : '#e2e8f0',
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 15,
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.015em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      subtitle1: {
        fontWeight: 600,
        fontSize: '1rem',
      },
      subtitle2: {
        fontWeight: 600,
        fontSize: '0.9375rem',
      },
      body1: {
        fontSize: '1rem', // 16px minimum for comfortable reading
        lineHeight: 1.68,
      },
      body2: {
        fontSize: '0.9375rem', // 15px
        lineHeight: 1.62,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.9375rem',
      },
      caption: {
        fontSize: '0.8125rem',
        lineHeight: 1.45,
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            boxShadow: 'none',
            padding: '8px 18px',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            backgroundColor: isDark ? '#3b82f6' : '#2563eb',
            '&:hover': {
              backgroundColor: isDark ? '#2563eb' : '#1d4ed8',
            },
          },
          outlined: {
            borderColor: isDark ? '#334155' : '#cbd5e1',
            color: isDark ? '#e2e8f0' : '#334155',
            '&:hover': {
              borderColor: isDark ? '#64748b' : '#94a3b8',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontSize: '1rem',
            lineHeight: 1.65,
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            '& fieldset': {
              borderColor: isDark ? '#334155' : '#cbd5e1',
            },
            '&:hover fieldset': {
              borderColor: isDark ? '#64748b' : '#94a3b8',
            },
            '&.Mui-focused fieldset': {
              borderColor: isDark ? '#3b82f6' : '#2563eb',
              borderWidth: '1.5px',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
            backgroundColor: isDark ? '#0b0f19' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderRadius: 10,
            border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
            '&:before': {
              display: 'none',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });
}

export const muiTheme = getAppTheme('light');
