'use client';

/**
 * Animation System Usage Examples
 *
 * This file demonstrates all available animations and how to use them.
 * Copy these examples to implement physics-based animations in your components.
 */

import React from 'react';
import { Box, Card, CardContent, Typography, IconButton, Fab, ListItem } from '@mui/material';
import { animated } from '@react-spring/web';
import { Add as AddIcon, Refresh as RefreshIcon, Check as CheckIcon } from '@mui/icons-material';
import AnimatedButton, { AnimatedIconButton, AnimatedFab } from './AnimatedButton';
import AnimatedCard, { AnimatedListItem } from './AnimatedCard';
import {
  useButtonHover,
  useButtonPress,
  useInteractiveButton,
  useCardHover,
  useIconRotate,
  useIconBounce,
  useStaggeredAppear,
  useShakeError,
  useSuccessAnimation,
  useModalAnimation,
  useSlideIn,
  usePulse,
} from '@/app/hooks/useSpringAnimation';

export default function AnimationExamples() {
  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h3" gutterBottom>
        מערכת אנימציות (Animation System)
      </Typography>
      <Typography variant="body1" paragraph>
        דוגמאות לכל האנימציות הזמינות במערכת. העתק את הקוד לשימוש ברכיבים שלך.
      </Typography>

      {/* Button Animations */}
      <SectionTitle>1. אנימציות כפתורים (Button Animations)</SectionTitle>

      <ExampleSection title="כפתור אנימציה בסיסית (Basic Animated Button)">
        <AnimatedButton variant="contained" color="primary">
          לחץ כאן
        </AnimatedButton>
        <CodeBlock>{`import AnimatedButton from '@/app/components/ui/AnimatedButton';

<AnimatedButton variant="contained" color="primary">
  לחץ כאן
</AnimatedButton>`}</CodeBlock>
      </ExampleSection>

      <ExampleSection title="כפתור עם אינטנסיביות גבוהה (Strong Intensity)">
        <AnimatedButton variant="contained" color="secondary" intensity="strong">
          אנימציה חזקה
        </AnimatedButton>
        <CodeBlock>{`<AnimatedButton variant="contained" intensity="strong">
  אנימציה חזקה
</AnimatedButton>`}</CodeBlock>
      </ExampleSection>

      <ExampleSection title="כפתור אייקון מונפש (Animated Icon Button)">
        <AnimatedIconButton color="primary">
          <CheckIcon />
        </AnimatedIconButton>
        <CodeBlock>{`import { AnimatedIconButton } from '@/app/components/ui/AnimatedButton';

<AnimatedIconButton color="primary">
  <CheckIcon />
</AnimatedIconButton>`}</CodeBlock>
      </ExampleSection>

      <ExampleSection title="FAB מונפש (Animated FAB)">
        <AnimatedFab color="primary">
          <AddIcon />
        </AnimatedFab>
        <CodeBlock>{`import { AnimatedFab } from '@/app/components/ui/AnimatedButton';

<AnimatedFab color="primary">
  <AddIcon />
</AnimatedFab>`}</CodeBlock>
      </ExampleSection>

      {/* Card Animations */}
      <SectionTitle>2. אנימציות כרטיסים (Card Animations)</SectionTitle>

      <ExampleSection title="כרטיס מונפש (Animated Card)">
        <AnimatedCard sx={{ maxWidth: 345 }}>
          <CardContent>
            <Typography variant="h6">כרטיס עם אנימציית הרמה</Typography>
            <Typography variant="body2">העבר עכבר כדי לראות את האפקט</Typography>
          </CardContent>
        </AnimatedCard>
        <CodeBlock>{`import AnimatedCard from '@/app/components/ui/AnimatedCard';

<AnimatedCard sx={{ maxWidth: 345 }}>
  <CardContent>
    <Typography variant="h6">כרטיס עם אנימציית הרמה</Typography>
  </CardContent>
</AnimatedCard>`}</CodeBlock>
      </ExampleSection>

      <ExampleSection title="כרטיס לחיץ (Clickable Card)">
        <AnimatedCard
          sx={{ maxWidth: 345 }}
          onClick={() => alert('Clicked!')}
          clickable
        >
          <CardContent>
            <Typography variant="h6">לחץ עלי</Typography>
            <Typography variant="body2">סמן עכבר משתנה באופן אוטומטי</Typography>
          </CardContent>
        </AnimatedCard>
        <CodeBlock>{`<AnimatedCard
  onClick={() => handleClick()}
  clickable
>
  <CardContent>...</CardContent>
</AnimatedCard>`}</CodeBlock>
      </ExampleSection>

      {/* List Animations */}
      <SectionTitle>3. אנימציות רשימות (List Animations)</SectionTitle>

      <ExampleSection title="פריטי רשימה מדורגים (Staggered List Items)">
        <Box>
          {[0, 1, 2, 3].map((index) => (
            <AnimatedListItem key={index} index={index}>
              <Typography>פריט {index + 1} - מופיע בעיכוב</Typography>
            </AnimatedListItem>
          ))}
        </Box>
        <CodeBlock>{`import { AnimatedListItem } from '@/app/components/ui/AnimatedCard';

{items.map((item, index) => (
  <AnimatedListItem key={item.id} index={index}>
    <Typography>{item.name}</Typography>
  </AnimatedListItem>
))}`}</CodeBlock>
      </ExampleSection>

      {/* Custom Hook Examples */}
      <SectionTitle>4. הוקים מותאמים (Custom Animation Hooks)</SectionTitle>

      <ExampleSection title="שגיאת רעידה (Shake Error)">
        <ShakeErrorDemo />
        <CodeBlock>{`import { useShakeError } from '@/app/hooks/useSpringAnimation';
import { animated } from '@react-spring/web';

function Component() {
  const { x, trigger } = useShakeError();

  return (
    <animated.div style={{ x }}>
      <TextField error={hasError} />
      {hasError && trigger()}
    </animated.div>
  );
}`}</CodeBlock>
      </ExampleSection>

      <ExampleSection title="אייקון מסתובב (Rotating Icon)">
        <RotatingIconDemo />
        <CodeBlock>{`import { useIconRotate } from '@/app/hooks/useSpringAnimation';
import { animated } from '@react-spring/web';

function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const { rotate } = useIconRotate(loading);

  return (
    <IconButton onClick={() => setLoading(!loading)}>
      <animated.div style={{ rotate }}>
        <RefreshIcon />
      </animated.div>
    </IconButton>
  );
}`}</CodeBlock>
      </ExampleSection>

      <ExampleSection title="אנימציית הצלחה (Success Animation)">
        <SuccessAnimationDemo />
        <CodeBlock>{`import { useSuccessAnimation } from '@/app/hooks/useSpringAnimation';
import { animated } from '@react-spring/web';

function SuccessMessage({ show }: { show: boolean }) {
  const { scale, opacity } = useSuccessAnimation(show);

  return (
    <animated.div style={{ scale, opacity }}>
      <Typography>✅ הפעולה הצליחה!</Typography>
    </animated.div>
  );
}`}</CodeBlock>
      </ExampleSection>
    </Box>
  );
}

// Helper Components for Examples
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 'bold' }}>
      {children}
    </Typography>
  );
}

function ExampleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</Box>
    </Box>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <Box
      component="pre"
      sx={{
        p: 2,
        bgcolor: 'grey.100',
        borderRadius: 2,
        overflow: 'auto',
        fontSize: '0.875rem',
        fontFamily: 'monospace',
      }}
    >
      {children}
    </Box>
  );
}

// Interactive Demos
function ShakeErrorDemo() {
  const { x, trigger } = useShakeError();
  return (
    <Box>
      <animated.div style={{ x }}>
        <Card sx={{ p: 2, bgcolor: 'error.light', display: 'inline-block' }}>
          <Typography color="error.dark">❌ שגיאה בטופס</Typography>
        </Card>
      </animated.div>
      <AnimatedButton onClick={trigger} sx={{ mt: 1 }}>
        הפעל רעידה
      </AnimatedButton>
    </Box>
  );
}

function RotatingIconDemo() {
  const [loading, setLoading] = React.useState(false);
  const { rotate } = useIconRotate(loading);

  return (
    <Box>
      <AnimatedIconButton onClick={() => setLoading(!loading)}>
        <animated.div style={{ rotate }}>
          <RefreshIcon />
        </animated.div>
      </AnimatedIconButton>
      <Typography variant="caption" sx={{ ml: 2 }}>
        {loading ? 'מסתובב...' : 'לחץ להפעלה'}
      </Typography>
    </Box>
  );
}

function SuccessAnimationDemo() {
  const [show, setShow] = React.useState(false);
  const { scale, opacity } = useSuccessAnimation(show);

  return (
    <Box>
      <AnimatedButton onClick={() => setShow(!show)}>
        {show ? 'הסתר' : 'הצג'} הצלחה
      </AnimatedButton>
      <animated.div style={{ scale, opacity, marginTop: 16 }}>
        <Card sx={{ p: 2, bgcolor: 'success.light', display: 'inline-block' }}>
          <Typography color="success.dark">✅ הפעולה הצליחה!</Typography>
        </Card>
      </animated.div>
    </Box>
  );
}
