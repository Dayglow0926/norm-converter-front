'use client';

import { useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { normClient } from '@/shared/api/norm-client';
import { buildConversationDraftUpdate, type ConversationDraftResponse } from '../lib/structured-analysis-extract';
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
  const { conversation, setConversation, setConversationField } = useLanguageAnalysisStore();
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!conversation.sourceText.trim()) return;

    setIsExtracting(true);
    setExtractError(null);

    try {
      const response = await normClient.extractLanguageAnalysis<ConversationDraftResponse>({
        type: 'conversation',
        sourceText: conversation.sourceText,
      });

      setConversation(
        buildConversationDraftUpdate(
          conversation,
          response.draft.conversation,
          conversation.sourceText,
          response.warnings
        )
      );
    } catch (error) {
      setExtractError(
        error instanceof Error ? error.message : '대화분석 자동 채우기 중 오류가 발생했습니다.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="대화 기록 입력"
        subtitle="대화 기록 또는 관찰 메모를 붙여넣고 자동 채우기를 누르세요."
      />
      <Textarea
        placeholder="대화 기록 또는 관찰 메모를 입력하세요"
        value={conversation.sourceText}
        onChange={(e) => {
          setConversationField('sourceText', e.target.value);
          setConversationField('extractionWarnings', []);
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
          disabled={!conversation.sourceText.trim() || isExtracting}
        >
          {isExtracting ? '자동 채우는 중...' : '자동 채우기'}
        </Button>
      </div>
      {extractError && <p className="text-destructive mt-2 text-xs">{extractError}</p>}
      {conversation.extractionWarnings.length > 0 && (
        <div className="bg-muted/50 mt-2 rounded-md p-2">
          {conversation.extractionWarnings.map((warning) => (
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

function SituationalObservationsSection() {
  const { conversation, setConversationField } = useLanguageAnalysisStore();
  const { situationalObservations } = conversation;
  const [customSituation, setCustomSituation] = useState('');

  const updateObservation = (index: number, field: keyof SituationalObservation, value: string) => {
    const updated = situationalObservations.map((obs, i) =>
      i === index ? { ...obs, [field]: value } : obs
    );
    setConversationField('situationalObservations', updated);
  };

  const removeObservation = (index: number) => {
    setConversationField(
      'situationalObservations',
      situationalObservations.filter((_, i) => i !== index)
    );
  };

  const addCustomObservation = () => {
    const trimmed = customSituation.trim();
    if (!trimmed) return;
    setConversationField('situationalObservations', [
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

export function ConversationAnalysisForm() {
  const { conversation, setConversationField } = useLanguageAnalysisStore();

  return (
    <div className="space-y-6 py-2">
      <SourceTextSection />
      <hr />
      <ChecklistSection
        title="화용/담화"
        items={conversation.pragmatic}
        onUpdate={(items) => setConversationField('pragmatic', items)}
      />
      <hr />
      <ChecklistSection
        title="주제 관리"
        items={conversation.topicManagement}
        onUpdate={(items) => setConversationField('topicManagement', items)}
      />
      <hr />
      <div>
        <SectionHeader title="의사소통 기능" subtitle="콤마 또는 줄바꿈으로 구분해서 수정할 수 있습니다." />
        <Textarea
          placeholder="예) 의문사 질문, 의문사 대답"
          value={formatList(conversation.communicationIntents)}
          onChange={(e) => setConversationField('communicationIntents', parseList(e.target.value))}
          rows={3}
          className="text-sm"
        />
      </div>
      <hr />
      <SituationalObservationsSection />
      <hr />
      <div>
        <SectionHeader title="기타 메모" />
        <Textarea
          placeholder="자동 추출되지 않은 메모를 입력하세요"
          value={conversation.notes ?? ''}
          onChange={(e) => setConversationField('notes', e.target.value || null)}
          rows={3}
          className="text-sm"
        />
      </div>
    </div>
  );
}
