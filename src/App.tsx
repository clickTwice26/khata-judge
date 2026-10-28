import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Alert,
  Typography,
} from '@mui/material';

import { getAppTheme } from './theme';
import {
  EvaluationParameter,
  EvaluationRequest,
  EvaluationResult,
  SampleQA,
  StrictnessLevel,
  AnswerImage,
} from './types';
import { EVALUATION_PRESETS, SAMPLE_QA_LIST } from './data/presets';
import { evaluateAnswerWithGemini, mapToFriendlyError, fetchAvailableGeminiModels, performOcrOnImages, GeminiModelInfo } from './services/geminiJudge';
import {
  getStoredApiKey,
  setStoredApiKey,
  getStoredModel,
  setStoredModel,
} from './utils/storage';
import { khataDB, StoredPreset, StoredEvaluation, DraftState } from './services/db';

import { MuiNavbar } from './components/MuiNavbar';
import { ApiKeySetupCard } from './components/ApiKeySetupCard';
import { SettingsDrawer } from './components/SettingsDrawer';
import { MuiHistoryDrawer } from './components/MuiHistoryDrawer';
import { MuiWorkbench } from './components/MuiWorkbench';
import { MuiScorecard } from './components/MuiScorecard';

export function App() {
  // Theme state
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('khata_theme_mode') as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  });

  const appTheme = useMemo(() => getAppTheme(themeMode), [themeMode]);

  const toggleThemeMode = () => {
    const nextMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
    try {
      localStorage.setItem('khata_theme_mode', nextMode);
    } catch {
      // ignore
    }
  };

  // App Settings State
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [availableModels, setAvailableModels] = useState<GeminiModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<StoredEvaluation[]>([]);
  const [customPresets, setCustomPresets] = useState<StoredPreset[]>([]);

  // Navigation Steps: 1 = Your question, 2 = Your answer, 3 = Your result
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Database Sync & Auto-Save State
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<any>(null);

  // Form State
  const defaultPreset = EVALUATION_PRESETS[0];
  const [question, setQuestion] = useState<string>('');
  const [totalMarks, setTotalMarks] = useState<number>(defaultPreset.defaultTotalMarks);
  const [modelAnswer, setModelAnswer] = useState<string>('');
  const [parameters, setParameters] = useState<EvaluationParameter[]>(defaultPreset.parameters);
  const [strictness, setStrictness] = useState<StrictnessLevel>('standard');
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [images, setImages] = useState<AnswerImage[]>([]);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeProgress, setTranscribeProgress] = useState<string>('');

  // Execution State
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<EvaluationResult | null>(null);

  // Refresh DB state from IndexedDB
  const refreshDatabaseState = useCallback(async () => {
    try {
      const [evals, presets] = await Promise.all([
        khataDB.getAllEvaluations(),
        khataDB.getCustomPresets(),
      ]);
      setHistory(evals);
      setCustomPresets(presets);
    } catch (e) {
      console.warn('Failed to load DB state:', e);
    }
  }, []);

  const loadModelsForApiKey = useCallback(async (keyToUse: string) => {
    if (!keyToUse || !keyToUse.trim()) {
      setAvailableModels([]);
      return;
    }
    setIsLoadingModels(true);
    try {
      const list = await fetchAvailableGeminiModels(keyToUse.trim());
      setAvailableModels(list);
    } catch (e) {
      console.warn('Could not fetch models dynamically:', e);
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  // Load initial settings, draft, and DB collections on startup
  useEffect(() => {
    const initApp = async () => {
      const savedKey = getStoredApiKey();
      setApiKey(savedKey);
      if (savedKey) {
        loadModelsForApiKey(savedKey);
      }
      const savedModel = getStoredModel();
      setSelectedModel(savedModel);

      // Load collections from IndexedDB
      await refreshDatabaseState();

      // Check if there is an active draft saved in IndexedDB
      try {
        const savedDraft = await khataDB.loadDraft();
        if (savedDraft && (savedDraft.question || savedDraft.studentAnswer)) {
          setQuestion(savedDraft.question || '');
          setTotalMarks(savedDraft.totalMarks || 20);
          setModelAnswer(savedDraft.modelAnswer || '');
          setStudentAnswer(savedDraft.studentAnswer || '');
          if (Array.isArray(savedDraft.parameters) && savedDraft.parameters.length > 0) {
            setParameters(savedDraft.parameters);
          }
          setStrictness(savedDraft.strictness || 'standard');
          setAdditionalInstructions(savedDraft.additionalInstructions || '');
          if (savedDraft.selectedModel) {
            setSelectedModel(savedDraft.selectedModel);
          }
          // If draft already has question and answer, go to step 2; else step 1
          if (savedDraft.studentAnswer && savedDraft.studentAnswer.trim()) {
            setCurrentStep(2);
          }
        } else {
          handleLoadSample(SAMPLE_QA_LIST[0]);
        }
      } catch (err) {
        console.warn('Failed to load draft from DB:', err);
        handleLoadSample(SAMPLE_QA_LIST[0]);
      }

      isInitialMount.current = false;
    };

    initApp();
  }, [refreshDatabaseState]);

  // Debounced Auto-Save to IndexedDB whenever draft fields change
  useEffect(() => {
    if (isInitialMount.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const draft: DraftState = {
        id: 'current_workbench_draft',
        updatedAt: Date.now(),
        question,
        totalMarks,
        modelAnswer,
        studentAnswer,
        parameters,
        strictness,
        additionalInstructions,
        selectedModel,
        activeResultId: activeResult?.id || null,
      };

      try {
        await khataDB.saveDraft(draft);
      } catch (e) {
        console.warn('Auto-save error:', e);
      }
    }, 400);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [
    question,
    totalMarks,
    modelAnswer,
    studentAnswer,
    parameters,
    strictness,
    additionalInstructions,
    selectedModel,
    activeResult,
  ]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    setStoredApiKey(key);
    setError(null);
    loadModelsForApiKey(key);
  };

  const handleSelectModel = (model: string) => {
    setSelectedModel(model);
    setStoredModel(model);
  };

  const handleLoadSample = (sample: SampleQA) => {
    setQuestion(sample.question);
    setModelAnswer(sample.modelAnswer || '');
    setStudentAnswer(sample.studentAnswer);
    setTotalMarks(sample.totalMarks);

    const matchingPreset =
      EVALUATION_PRESETS.find((p) => p.id === sample.presetId) || EVALUATION_PRESETS[0];
    const presetSum = matchingPreset.parameters.reduce((s, p) => s + p.weight, 0);
    const scaled = matchingPreset.parameters.map((p) => ({
      ...p,
      id: `param_${Math.random().toString(36).substring(2, 7)}`,
      weight: Number(((p.weight / presetSum) * sample.totalMarks).toFixed(1)),
    }));
    setParameters(scaled);
    setError(null);
    setCurrentStep(1);
  };

  // Custom Preset Management
  const handleSaveCustomPreset = async (name: string, description: string) => {
    const newPreset: StoredPreset = {
      id: `preset_${Date.now()}`,
      name,
      description: description || `${parameters.length} custom points`,
      defaultTotalMarks: totalMarks,
      parameters: [...parameters],
      isCustom: true,
      createdAt: Date.now(),
    };

    await khataDB.saveCustomPreset(newPreset);
    await refreshDatabaseState();
  };

  const handleDeleteCustomPreset = async (id: string) => {
    if (window.confirm('Delete this saved marking style?')) {
      await khataDB.deleteCustomPreset(id);
      await refreshDatabaseState();
    }
  };

  // OCR Transcription Handler for Answer Sheet Images
  const handleTranscribeImages = async () => {
    if (images.length === 0) return;
    if (!apiKey.trim()) {
      setError('Your Google AI key is not working. Please check it in Settings.');
      setIsSettingsOpen(true);
      return;
    }

    setIsTranscribing(true);
    setError(null);
    try {
      const text = await performOcrOnImages(
        images,
        apiKey,
        selectedModel,
        (current, total) => {
          setTranscribeProgress(`Reading handwriting from page ${current} of ${total}...`);
        }
      );
      setStudentAnswer((prev) => (prev.trim() ? `${prev}\n\n${text}` : text));
    } catch (err: unknown) {
      console.error('OCR transcription error:', err);
      const msg = err instanceof Error ? err.message : mapToFriendlyError(err);
      setError(msg);
    } finally {
      setIsTranscribing(false);
      setTranscribeProgress('');
    }
  };

  // Evaluation Handler
  const handleEvaluate = async () => {
    setError(null);

    if (!apiKey.trim()) {
      setError('Your Google AI key is not working. Please check it in Settings.');
      setIsSettingsOpen(true);
      return;
    }

    if (!question.trim()) {
      setError('Please enter a question before checking.');
      setCurrentStep(1);
      return;
    }

    const hasImages = images.length > 0;
    if (!studentAnswer.trim() && !hasImages) {
      setError('Please type your answer or upload answer photos before checking.');
      setCurrentStep(2);
      return;
    }

    if (parameters.length === 0) {
      setError('Please add at least one point in How marks are given.');
      setCurrentStep(1);
      return;
    }

    setIsEvaluating(true);
    try {
      const request: EvaluationRequest = {
        question: question.trim(),
        modelAnswer: modelAnswer.trim() || undefined,
        studentAnswer: studentAnswer.trim(),
        totalMarks,
        parameters,
        strictness,
        additionalInstructions: additionalInstructions.trim() || undefined,
        model: selectedModel,
        apiKey: apiKey.trim(),
        images: hasImages ? images : undefined,
      };

      const result = await evaluateAnswerWithGemini(request);
      setActiveResult(result);

      // Save to IndexedDB
      await khataDB.saveEvaluation(result);
      await refreshDatabaseState();

      setCurrentStep(3);
    } catch (err: unknown) {
      console.error('Answer check error:', err);
      const userMessage = err instanceof Error ? err.message : mapToFriendlyError(err);
      setError(userMessage);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleToggleStar = async (id: string) => {
    await khataDB.toggleStarEvaluation(id);
    await refreshDatabaseState();
    if (activeResult?.id === id) {
      setActiveResult((prev) => (prev ? { ...prev, starred: !prev.starred } : null));
    }
  };

  const handleDeleteEvaluation = async (id: string) => {
    await khataDB.deleteEvaluation(id);
    await refreshDatabaseState();
    if (activeResult?.id === id) {
      setActiveResult(null);
      setCurrentStep(1);
    }
  };

  const handleResetForm = async () => {
    if (window.confirm('Start over? This will clear your current question and answer.')) {
      setQuestion('');
      setModelAnswer('');
      setStudentAnswer('');
      setImages([]);
      setAdditionalInstructions('');
      setError(null);
      setActiveResult(null);
      setCurrentStep(1);
      await khataDB.clearDraft();
    }
  };

  const handleCheckNewQuestion = () => {
    setActiveResult(null);
    setQuestion('');
    setModelAnswer('');
    setStudentAnswer('');
    setImages([]);
    setCurrentStep(1);
    khataDB.clearDraft();
  };

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {/* Simple Header */}
        <MuiNavbar
          historyCount={history.length}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Main Content Area */}
        <Container maxWidth="lg" sx={{ py: { xs: 2.5, sm: 4 }, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* One-time Setup Card: Connect free Google AI key (only shown if key is missing) */}
          {!apiKey && (
            <ApiKeySetupCard
              onSaveKey={handleSaveApiKey}
              selectedModel={selectedModel}
            />
          )}

          {/* Guided Step Indicator */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 1, sm: 2 },
              pb: 1,
            }}
          >
            {[
              { step: 1 as const, label: '1. Your question' },
              { step: 2 as const, label: '2. Your answer' },
              { step: 3 as const, label: '3. Your result', disabled: !activeResult },
            ].map((item) => {
              const isActive = currentStep === item.step;
              const isPassed = currentStep > item.step;
              return (
                <Box
                  key={item.step}
                  onClick={() => {
                    if (!item.disabled) setCurrentStep(item.step);
                  }}
                  sx={{
                    px: { xs: 1.5, sm: 2.5 },
                    py: 1,
                    borderRadius: 2,
                    fontSize: { xs: '0.8125rem', sm: '0.9375rem' },
                    fontWeight: isActive ? 700 : 500,
                    color: isActive
                      ? 'primary.main'
                      : isPassed
                      ? 'text.primary'
                      : 'text.secondary',
                    bgcolor: isActive
                      ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.15)' : '#eff6ff')
                      : 'transparent',
                    border: '1.5px solid',
                    borderColor: isActive ? 'primary.main' : 'transparent',
                    cursor: item.disabled ? 'default' : 'pointer',
                    opacity: item.disabled ? 0.45 : 1,
                    transition: 'all 0.2s',
                    userSelect: 'none',
                    '&:hover': {
                      bgcolor: !item.disabled && !isActive ? 'action.hover' : undefined,
                    },
                  }}
                >
                  {item.label}
                </Box>
              );
            })}
          </Box>

          {/* Plain Friendly Error Banner */}
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ borderRadius: 2, fontSize: '0.9375rem' }}
            >
              {error}
            </Alert>
          )}

          {/* Guided Step Views */}
          {(currentStep === 1 || currentStep === 2) && (
            <MuiWorkbench
              currentStep={currentStep}
              onChangeStep={setCurrentStep}
              question={question}
              onChangeQuestion={setQuestion}
              totalMarks={totalMarks}
              onChangeTotalMarks={setTotalMarks}
              modelAnswer={modelAnswer}
              onChangeModelAnswer={setModelAnswer}
              parameters={parameters}
              onChangeParameters={setParameters}
              strictness={strictness}
              onChangeStrictness={setStrictness}
              additionalInstructions={additionalInstructions}
              onChangeAdditionalInstructions={setAdditionalInstructions}
              studentAnswer={studentAnswer}
              onChangeStudentAnswer={setStudentAnswer}
              customPresets={customPresets}
              onSaveCustomPreset={handleSaveCustomPreset}
              onDeleteCustomPreset={handleDeleteCustomPreset}
              onEvaluate={handleEvaluate}
              isEvaluating={isEvaluating}
              onReset={handleResetForm}
              onSelectSample={handleLoadSample}
              images={images}
              onChangeImages={setImages}
              onTranscribeImages={handleTranscribeImages}
              isTranscribing={isTranscribing}
              transcribeProgress={transcribeProgress}
            />
          )}

          {currentStep === 3 && activeResult && (
            <MuiScorecard
              result={activeResult}
              onEditAndCheckAgain={() => setCurrentStep(2)}
              onCheckNewQuestion={handleCheckNewQuestion}
              onToggleStar={handleToggleStar}
            />
          )}
        </Container>

        {/* Peaceful Footer */}
        <Box
          component="footer"
          sx={{
            py: 2.5,
            px: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>Khata Judge</strong> — Check your answer. Get the full-mark version.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Saved on this device
          </Typography>
        </Box>

        {/* Slide-out Settings Drawer */}
        <SettingsDrawer
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKey={apiKey}
          onSaveApiKey={handleSaveApiKey}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          themeMode={themeMode}
          onToggleThemeMode={toggleThemeMode}
          customPresets={customPresets}
          onDeleteCustomPreset={handleDeleteCustomPreset}
          onRefreshData={refreshDatabaseState}
          evaluationCount={history.length}
          availableModels={availableModels}
          isLoadingModels={isLoadingModels}
          onRefreshModels={() => loadModelsForApiKey(apiKey)}
        />

        {/* Slide-out "My Past Answers" Drawer */}
        <MuiHistoryDrawer
          open={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onSelectResult={(res) => {
            setActiveResult(res);
            setCurrentStep(3);
          }}
          onDeleteItem={handleDeleteEvaluation}
          onToggleStar={handleToggleStar}
          onClearAll={async () => {
            if (window.confirm('Clear all your past answers from this device?')) {
              await khataDB.clearAllEvaluations();
              await refreshDatabaseState();
              if (activeResult) {
                setActiveResult(null);
                setCurrentStep(1);
              }
            }
          }}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
