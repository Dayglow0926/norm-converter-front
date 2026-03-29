'use client';

import { useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { normClient } from '@/shared/api/norm-client';
import { buildBehavioralDraftUpdate, type BehavioralDraftResponse } from '../lib/structured-analysis-extract';
import {
  useLanguageAnalysisStore,
  type ChecklistItem,
  type SituationalObservation,
} from '../model/languageAnalysisStore';
import { ChecklistRow, SectionHeader } from './LanguageAnalysisCommon';

function parseList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatList(values: string[]): string {
  return values.join(', ');
}

function SourceTextSection() {
  const { behavioral, setBehavioral, setBehavioralField } = useLanguageAnalysisStore();
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!behavioral.sourceText.trim()) return;

    setIsExtracting(true);
    setExtractError(null);

    try {
      const response = await normClient.extractLanguageAnalysis<BehavioralDraftResponse>({
        type: 'behavioral_observation',
        sourceText: behavioral.sourceText,
      });

      setBehavioral(
        buildBehavioralDraftUpdate(
          behavioral,
          response.draft.behavioral,
          behavioral.sourceText,
          response.warnings
        )
      );
    } catch (error) {
      setExtractError(
        error instanceof Error ? error.message : '행동관찰 자동 채우기 중 오류가 발생했습니다.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="행동관찰 기록 입력"
        subtitle="행동관찰 기록 또는 메모를 붙여넣고 자동 채우기를 누르세요."
      />
      <Textarea
        placeholder="행동관찰 기록 또는 메모를 입력하세요"
        value={behavioral.sourceText}
        onChange={(e) => {
          setBehavioralField('sourceText', e.target.value);
          setBehavioralField('extractionWarnings', []);
          setExtractError(null);
        }}
        rows={6}
        className="text-sm"
      />
      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExtract}
          disabled={!behavioral.sourceText.trim() || isExtracting}
        >
          {isExtracting ? '자동 채우는 중...' : '자동 채우기'}
        </Button>
      </div>
      {extractError && <p className="text-destructive mt-2 text-xs">{extractError}</p>}
      {behavioral.extractionWarnings.length > 0 && (
        <div className="bg-muted/50 mt-2 rounded-md p-2">
          {behavioral.extractionWarnings.map((warning) => (
            <p key={warning} className="text-muted-foreground text-xs">
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistSection({
  title,
  items,
  onUpdate,
}: {
  title: string;
  items: ChecklistItem[];
  onUpdate: (items: ChecklistItem[]) => void;
}) {
  const updateItem = (index: number, value: 'positive' | 'negative' | null) => {
    onUpdate(items.map((item, i) => (i === index ? { ...item, value } : item)));
  };

  return (
    <div>
      <SectionHeader title={title} />
      <div className="rounded-md border px-3">
        {items.map((item, index) => (
          <ChecklistRow
            key={item.label}
            item={item}
            onChange={(value) => updateItem(index, value)}
          />
        ))}
      </div>
    </div>
  );
}

function NamingResponseSection() {
  const { behavioral, setBehavioralField } = useLanguageAnalysisStore();

  const options: Array<{ value: 'consistent' | 'inconsistent' | 'none'; label: string }> = [
    { value: 'consistent', label: '일관적' },
    { value: 'inconsistent', label: '비일관적' },
    { value: 'none', label: '무반응' },
  ];

  return (
    <div>
      <SectionHeader title="호명 반응" />
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              setBehavioralField(
                'namingResponse',
                behavioral.namingResponse === option.value ? null : option.value
              )
            }
            className={[
              'rounded-md border px-3 py-2 text-sm transition-colors',
              behavioral.namingResponse === option.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent hover:text-accent-foreground',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SituationalObservationsSection() {
  const { behavioral, setBehavioralField } = useLanguageAnalysisStore();
  const { situationalObservations } = behavioral;
  const [customSituation, setCustomSituation] = useState('');

  const updateObservation = (index: number, field: keyof SituationalObservation, value: string) => {
    const updated = situationalObservations.map((obs, i) =>
      i === index ? { ...obs, [field]: value } : obs
    );
    setBehavioralField('situationalObservations', updated);
  };

  const removeObservation = (index: number) => {
    setBehavioralField(
      'situationalObservations',
      situationalObservations.filter((_, i) => i !== index)
    );
  };

  const addCustomObservation = () => {
    const trimmed = customSituation.trim();
    if (!trimmed) return;
    setBehavioralField('situationalObservations', [
      ...situationalObservations,
      { situation: trimmed, observation: '', example: '', isCustom: true },
    ]);
    setCustomSituation('');
  };

  return (
    <div>
      <SectionHeader title="상황별 관찰" />
      <div className="space-y-3">
        {situationalObservations.map((obs, index) => (
          <div key={`${obs.situation}-${index}`} className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{obs.situation}</span>
              {obs.isCustom && (
                <button
                  type="button"
                  onClick={() => removeObservation(index)}
                  className="text-muted-foreground hover:text-destructive text-xs"
                >
                  삭제
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Textarea
                placeholder="관찰 내용"
                value={obs.observation}
                onChange={(e) => updateObservation(index, 'observation', e.target.value)}
                rows={2}
                className="text-sm"
              />
              <Textarea
                placeholder="예시"
                value={obs.example}
                onChange={(e) => updateObservation(index, 'example', e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        <Input
          placeholder="상황 직접 입력"
          value={customSituation}
          onChange={(e) => setCustomSituation(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustomObservation();
            }
          }}
          className="h-8 flex-1 text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={addCustomObservation} className="h-8 text-xs">
          + 상황 추가
        </Button>
      </div>
    </div>
  );
}

export function BehavioralObservationForm() {
  const { behavioral, setBehavioralField } = useLanguageAnalysisStore();

  return (
    <div className="space-y-6 py-2">
      <SourceTextSection />
      <hr />
      <div>
        <SectionHeader title="의사소통 기능" subtitle="콤마 또는 줄바꿈으로 구분해서 수정할 수 있습니다." />
        <Textarea
          placeholder="예) 행위 요구, 사물 요구"
          value={formatList(behavioral.communicationIntents)}
          onChange={(e) => setBehavioralField('communicationIntents', parseList(e.target.value))}
          rows={3}
          className="text-sm"
        />
      </div>
      <hr />
      <ChecklistSection
        title="공동주의/활동/호명"
        items={behavioral.jointAttention}
        onUpdate={(items) => setBehavioralField('jointAttention', items)}
      />
      <hr />
      <div>
        <SectionHeader title="몸짓" subtitle="콤마 또는 줄바꿈으로 구분해서 수정할 수 있습니다." />
        <Textarea
          placeholder="예) 손가락 가리키기, 손 흔들기"
          value={formatList(behavioral.gestures)}
          onChange={(e) => setBehavioralField('gestures', parseList(e.target.value))}
          rows={3}
          className="text-sm"
        />
      </div>
      <hr />
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <SectionHeader title="구어 산출(자발)" />
          <Textarea
            placeholder="자발 구어 산출 메모"
            value={behavioral.vocalSpontaneous ?? ''}
            onChange={(e) => setBehavioralField('vocalSpontaneous', e.target.value || null)}
            rows={3}
            className="text-sm"
          />
        </div>
        <div>
          <SectionHeader title="구어 산출(모방)" />
          <Textarea
            placeholder="모방 구어 산출 메모"
            value={behavioral.vocalImitation ?? ''}
            onChange={(e) => setBehavioralField('vocalImitation', e.target.value || null)}
            rows={3}
            className="text-sm"
          />
        </div>
      </div>
      <hr />
      <ChecklistSection
        title="화용/담화"
        items={behavioral.pragmatic}
        onUpdate={(items) => setBehavioralField('pragmatic', items)}
      />
      <hr />
      <NamingResponseSection />
      <hr />
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <SectionHeader title="지시따르기" />
          <Textarea
            placeholder="지시따르기 메모"
            value={behavioral.followingInstructions ?? ''}
            onChange={(e) => setBehavioralField('followingInstructions', e.target.value || null)}
            rows={3}
            className="text-sm"
          />
        </div>
        <div>
          <SectionHeader title="상징행동/놀이" />
          <Textarea
            placeholder="상징행동 또는 놀이 수준 메모"
            value={behavioral.symbolicBehavior ?? ''}
            onChange={(e) => setBehavioralField('symbolicBehavior', e.target.value || null)}
            rows={3}
            className="text-sm"
          />
        </div>
      </div>
      <hr />
      <SituationalObservationsSection />
      <hr />
      <div>
        <SectionHeader title="기타 메모" />
        <Textarea
          placeholder="자동 추출되지 않은 메모를 입력하세요"
          value={behavioral.notes ?? ''}
          onChange={(e) => setBehavioralField('notes', e.target.value || null)}
          rows={3}
          className="text-sm"
        />
      </div>
    </div>
  );
}
