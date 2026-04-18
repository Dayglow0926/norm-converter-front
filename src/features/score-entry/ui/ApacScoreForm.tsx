'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  APAC_ADMINISTRATION_LABELS,
  APAC_ERROR_PATTERNS,
  APAC_ERROR_PATTERN_SECTIONS,
  APAC_INPUT_LABELS,
  APAC_NOTES,
  APAC_SCORE_RANGE,
  APAC_SCORE_VERSION_LABELS,
  type ApacErrorPatternExampleInput,
  type ApacAdministrationMode,
  type ApacScoreVersion,
} from '@/entities/assessment-tool';
import { useApacStore } from '../model/apacStore';

interface ApacScoreFormProps {
  ageMonths: number;
}

export function ApacScoreForm({ ageMonths }: ApacScoreFormProps) {
  void ageMonths;

  const emptyExampleInput: ApacErrorPatternExampleInput = {
    target: '',
    production: '',
  };

  const scoreVersion = useApacStore((state) => state.scoreVersion);
  const administrationMode = useApacStore((state) => state.administrationMode);
  const rawScore = useApacStore((state) => state.rawScore);
  const errorPatternKeys = useApacStore((state) => state.errorPatternKeys);
  const errorPatternExamples = useApacStore((state) => state.errorPatternExamples);
  const setScoreVersion = useApacStore((state) => state.setScoreVersion);
  const setAdministrationMode = useApacStore((state) => state.setAdministrationMode);
  const setRawScore = useApacStore((state) => state.setRawScore);
  const toggleErrorPattern = useApacStore((state) => state.toggleErrorPattern);
  const setErrorPatternExampleField = useApacStore((state) => state.setErrorPatternExampleField);

  const isUntestable = scoreVersion === 'untestable';
  const scoreInvalid =
    !isUntestable &&
    rawScore !== null &&
    (rawScore < APAC_SCORE_RANGE.min || rawScore > APAC_SCORE_RANGE.max);

  const btnBase =
    'flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none';
  const btnActive = 'bg-primary text-primary-foreground border-primary';
  const btnInactive = 'border-border hover:bg-muted';

  const handleVersionChange = (value: ApacScoreVersion) => {
    setScoreVersion(value);
  };

  const handleAdministrationChange = (value: ApacAdministrationMode) => {
    setAdministrationMode(value);
  };

  const handleScoreChange = (value: string) => {
    if (value === '') {
      setRawScore(null);
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num < APAC_SCORE_RANGE.min || num > APAC_SCORE_RANGE.max) {
      setRawScore(null);
      return;
    }

    setRawScore(num);
  };

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 pt-4">
        <div>
          <p className="mb-2 text-sm font-medium">{APAC_SCORE_VERSION_LABELS.title}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleVersionChange('standard')}
              className={`${btnBase} ${scoreVersion === 'standard' ? btnActive : btnInactive}`}
            >
              {APAC_SCORE_VERSION_LABELS.standard}
            </button>
            <button
              type="button"
              onClick={() => handleVersionChange('revised')}
              className={`${btnBase} ${scoreVersion === 'revised' ? btnActive : btnInactive}`}
            >
              {APAC_SCORE_VERSION_LABELS.revised}
            </button>
            <button
              type="button"
              onClick={() => handleVersionChange('untestable')}
              className={`${btnBase} ${scoreVersion === 'untestable' ? btnActive : btnInactive}`}
            >
              {APAC_SCORE_VERSION_LABELS.untestable}
            </button>
          </div>
        </div>

        {isUntestable ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {APAC_SCORE_VERSION_LABELS.untestableNotice}
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="mb-2 text-sm font-medium">{APAC_ADMINISTRATION_LABELS.title}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAdministrationChange('direct')}
                  className={`${btnBase} ${administrationMode === 'direct' ? btnActive : btnInactive}`}
                >
                  {APAC_ADMINISTRATION_LABELS.direct}
                  <span className="ml-1 text-xs font-normal opacity-70">
                    {APAC_ADMINISTRATION_LABELS.directHint}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAdministrationChange('partial_imitation')}
                  className={`${btnBase} ${administrationMode === 'partial_imitation' ? btnActive : btnInactive}`}
                >
                  {APAC_ADMINISTRATION_LABELS.partial}
                </button>
                <button
                  type="button"
                  onClick={() => handleAdministrationChange('total_imitation')}
                  className={`${btnBase} ${administrationMode === 'total_imitation' ? btnActive : btnInactive}`}
                >
                  {APAC_ADMINISTRATION_LABELS.total}
                </button>
              </div>
              {administrationMode === 'partial_imitation' && (
                <p className="text-muted-foreground mt-2 text-xs">
                  {APAC_ADMINISTRATION_LABELS.partialNotice}
                </p>
              )}
              {administrationMode === 'total_imitation' && (
                <p className="text-muted-foreground mt-2 text-xs">
                  {APAC_ADMINISTRATION_LABELS.totalNotice}
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">{APAC_INPUT_LABELS.scoreTitle}</p>
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={`${APAC_SCORE_RANGE.min}-${APAC_SCORE_RANGE.max}`}
                  className={`w-24 text-center ${scoreInvalid ? 'border-destructive' : ''}`}
                  value={rawScore ?? ''}
                  onChange={(e) => handleScoreChange(e.target.value)}
                  aria-invalid={scoreInvalid}
                />
                <span className="text-muted-foreground text-sm">{APAC_INPUT_LABELS.scoreSuffix}</span>
              </div>
              {scoreInvalid && (
                <p className="text-destructive mt-1 text-xs">
                  {APAC_SCORE_RANGE.min}-{APAC_SCORE_RANGE.max} 범위만 가능
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{APAC_INPUT_LABELS.errorPatternsTitle}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {APAC_INPUT_LABELS.errorPatternsHint}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {APAC_INPUT_LABELS.errorPatternExampleHint}
                </p>
              </div>

              {APAC_ERROR_PATTERN_SECTIONS.map((section) => {
                const options = APAC_ERROR_PATTERNS.filter((option) => option.section === section.id);

                return (
                  <div key={section.id} className="space-y-3 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-semibold">{section.title}</p>
                      <p className="text-muted-foreground text-xs">{section.description}</p>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {options.map((option) => {
                        const checked = errorPatternKeys.includes(option.key);
                        const exampleValue = errorPatternExamples[option.key] ?? emptyExampleInput;

                        return (
                          <div
                            key={option.key}
                            className={`rounded-md border px-3 py-2 transition-colors ${
                              checked
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            <label
                              htmlFor={`apac-error-pattern-${option.key}`}
                              className="flex cursor-pointer items-start gap-2 text-sm"
                            >
                              <input
                                id={`apac-error-pattern-${option.key}`}
                                type="checkbox"
                                className="mt-0.5 h-4 w-4"
                                checked={checked}
                                onChange={() => toggleErrorPattern(option.key)}
                              />
                              <span>{option.label}</span>
                            </label>

                            {checked && (
                              <div className="mt-2 pl-6">
                                <p className="text-muted-foreground mb-1 text-xs">
                                  {APAC_INPUT_LABELS.errorPatternExampleTitle}
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">
                                      {APAC_INPUT_LABELS.errorPatternExampleTargetLabel}
                                    </p>
                                    <Input
                                      type="text"
                                      value={exampleValue.target}
                                      placeholder={
                                        APAC_INPUT_LABELS.errorPatternExampleTargetPlaceholder
                                      }
                                      onChange={(e) =>
                                        setErrorPatternExampleField(
                                          option.key,
                                          'target',
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">
                                      {APAC_INPUT_LABELS.errorPatternExampleProductionLabel}
                                    </p>
                                    <Input
                                      type="text"
                                      value={exampleValue.production}
                                      placeholder={
                                        APAC_INPUT_LABELS.errorPatternExampleProductionPlaceholder
                                      }
                                      onChange={(e) =>
                                        setErrorPatternExampleField(
                                          option.key,
                                          'production',
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="space-y-1">
          {APAC_NOTES.map((note) => (
            <p key={note} className="text-muted-foreground text-xs">
              {note}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
