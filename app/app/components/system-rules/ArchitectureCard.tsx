'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublicIcon from '@mui/icons-material/Public';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import ReactMarkdown from 'react-markdown';
import * as MuiIcons from '@mui/icons-material';

export interface ArchitectureConcept {
  id: string;
  order: number;
  title: string;
  icon: string; // MUI icon name
  customIconUrl?: string; // Optional custom icon URL
  color: string;
  realWorldExample: string; // Markdown format
  whySuperAdminCares: string[]; // Array of bullet points
  technicalTranslation: string; // Markdown format
  keywords: string[]; // For search
}

interface ArchitectureCardProps {
  concept: ArchitectureConcept;
  isRTL: boolean;
  searchTerm?: string;
}

// Dynamic Icon Component
function DynamicIcon({ name, sx }: { name: string; sx?: any }) {
  const IconComponent = (MuiIcons as any)[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found, using default HelpOutline`);
    return <MuiIcons.HelpOutline sx={sx} />;
  }

  return <IconComponent sx={sx} />;
}

// Highlight matching search terms
function highlightText(text: string, searchTerm?: string): React.ReactNode {
  if (!searchTerm || searchTerm.trim() === '') {
    return text;
  }

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '0 2px' }}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function ArchitectureCard({
  concept,
  isRTL,
  searchTerm,
}: ArchitectureCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Card
      sx={{
        borderRadius: borderRadius.xl,
        boxShadow: shadows.medium,
        border: `2px solid ${concept.color}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: shadows.large,
          transform: 'translateY(-2px)',
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Gradient Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${concept.color} 0%, ${concept.color}CC 100%)`,
          p: 3,
          color: colors.neutral[0],
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Icon Circle */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: colors.neutral[0],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: concept.color,
            flexShrink: 0,
          }}
        >
          {concept.customIconUrl ? (
            <img
              src={concept.customIconUrl}
              alt={concept.title}
              style={{ width: 40, height: 40 }}
            />
          ) : (
            <DynamicIcon name={concept.icon} sx={{ fontSize: 32 }} />
          )}
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            flex: 1,
            fontSize: { xs: '18px', md: '20px' },
          }}
        >
          {highlightText(concept.title, searchTerm)}
        </Typography>
      </Box>

      {/* Content */}
      <CardContent
        sx={{
          p: 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Real-World Example */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: colors.neutral[900],
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: { xs: '16px', md: '18px' },
            }}
          >
            <PublicIcon sx={{ color: concept.color, fontSize: 24 }} />
            דוגמה מהעולם האמיתי:
          </Typography>
          <Box
            sx={{
              fontSize: '14px',
              color: colors.neutral[700],
              lineHeight: 1.7,
              '& p': { mb: 1 },
              '& p:last-child': { mb: 0 },
              '& strong': {
                fontWeight: 700,
                color: colors.neutral[900],
              },
            }}
          >
            <ReactMarkdown>
              {searchTerm
                ? concept.realWorldExample
                : concept.realWorldExample}
            </ReactMarkdown>
          </Box>
        </Box>

        {/* Why SuperAdmin Cares */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: colors.neutral[900],
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: { xs: '16px', md: '18px' },
            }}
          >
            <LightbulbIcon sx={{ color: colors.status.orange, fontSize: 24 }} />
            למה זה חשוב ל-SuperAdmin?
          </Typography>
          <List dense sx={{ p: 0 }}>
            {concept.whySuperAdminCares.map((reason, index) => (
              <ListItem key={index} sx={{ px: 0, py: 0.5, alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                  <CheckCircleIcon
                    sx={{ fontSize: 20, color: colors.status.green }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={highlightText(reason, searchTerm)}
                  primaryTypographyProps={{
                    fontSize: '14px',
                    color: colors.neutral[700],
                    lineHeight: 1.6,
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Collapsible Technical Translation */}
        <Box sx={{ mt: 'auto' }}>
          <Accordion
            expanded={expanded}
            onChange={handleToggle}
            sx={{
              border: `1px solid ${colors.neutral[200]}`,
              borderRadius: borderRadius.md,
              boxShadow: 'none',
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                margin: 0,
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                minHeight: 48,
                '&.Mui-expanded': {
                  minHeight: 48,
                },
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0',
                  '&.Mui-expanded': {
                    margin: '12px 0',
                  },
                },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  color: colors.neutral[700],
                  fontSize: '14px',
                }}
              >
                ⚙️ תרגום טכני (לחץ להרחבה)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  p: 2,
                  background: colors.neutral[50],
                  borderRadius: borderRadius.md,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: colors.neutral[800],
                  lineHeight: 1.8,
                  overflowX: 'auto',
                  '& p': { mb: 1 },
                  '& p:last-child': { mb: 0 },
                  '& ul': {
                    paddingInlineStart: '20px',
                    margin: '8px 0',
                  },
                  '& li': {
                    marginBottom: '4px',
                  },
                  '& code': {
                    background: colors.neutral[100],
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '12px',
                  },
                }}
              >
                <ReactMarkdown>{concept.technicalTranslation}</ReactMarkdown>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </CardContent>
    </Card>
  );
}
