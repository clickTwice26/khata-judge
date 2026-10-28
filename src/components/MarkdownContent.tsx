import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, SxProps, Theme } from '@mui/material';

interface MarkdownContentProps {
  content: string;
  sx?: SxProps<Theme>;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, sx }) => {
  if (!content) return null;

  return (
    <Box
      sx={{
        fontSize: '1rem',
        lineHeight: 1.72,
        color: 'text.primary',
        '& p': {
          mt: 0,
          mb: 1.5,
          '&:last-child': { mb: 0 },
        },
        '& ul, & ol': {
          mt: 0.5,
          mb: 1.5,
          pl: 3,
          '&:last-child': { mb: 0 },
        },
        '& li': {
          mb: 0.5,
          lineHeight: 1.7,
        },
        '& strong, & b': {
          fontWeight: 700,
          color: 'text.primary',
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          fontWeight: 700,
          mt: 2,
          mb: 1,
          color: 'text.primary',
          lineHeight: 1.3,
          '&:first-of-type': { mt: 0 },
        },
        '& h1': { fontSize: '1.4rem' },
        '& h2': { fontSize: '1.25rem' },
        '& h3': { fontSize: '1.125rem' },
        '& h4': { fontSize: '1rem' },
        '& blockquote': {
          m: 0,
          my: 1.5,
          pl: 2,
          borderLeft: '3px solid',
          borderColor: 'primary.main',
          color: 'text.secondary',
          fontStyle: 'italic',
        },
        '& code': {
          fontFamily: 'monospace',
          fontSize: '0.875em',
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
          px: 0.6,
          py: 0.2,
          borderRadius: 1,
        },
        '& pre': {
          m: 0,
          my: 1.5,
          p: 2,
          borderRadius: 2,
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#020617' : '#f8fafc'),
          border: '1px solid',
          borderColor: 'divider',
          overflowX: 'auto',
          '& code': {
            bgcolor: 'transparent',
            p: 0,
            borderRadius: 0,
          },
        },
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          my: 1.5,
          '& th, & td': {
            border: '1px solid',
            borderColor: 'divider',
            p: 1,
            textAlign: 'left',
          },
          '& th': {
            bgcolor: 'action.hover',
            fontWeight: 700,
          },
        },
        '& hr': {
          border: 'none',
          borderTop: '1px solid',
          borderColor: 'divider',
          my: 2,
        },
        ...sx,
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </Box>
  );
};
