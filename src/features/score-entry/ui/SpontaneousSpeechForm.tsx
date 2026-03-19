'use client';

/**
 * SCRUM-112: 자발화 입력 폼 (8개 섹션)
 * 섹션 1: 구문 측정치 (MLU-w, MLU-max, 가장 긴 발화, 발화 상황)
 * 섹션 2: 의사소통 기능 카테고리별 체크리스트
 * 섹션 3: 문법형태소 태그 입력 (조사/연결어미/종결어미)
 * 섹션 4: 의미/문법 오류 토글 + 예시 입력
 * 섹션 5: 화용/담화 체크리스트 + 발화 예시
 * 섹션 6: 주제 관리 체크리스트
 * 섹션 7: 상황별 관찰 동적 추가/삭제
 * 섹션 8: 공동활동/호명 체크리스트
 */

import { useState, useRef, type KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  useLanguageAnalysisStore,
  useLanguageAnalysisCustomItemsStore,
  COMMUNICATION_FUNCTION_CATEGORIES,
  type ChecklistItem,
  type SituationalObservation,
} from '../model/languageAnalysisStore';

// =========================================
// 섹션 공통 헤더 컴포넌트
// =========================================

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {subtitle && <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>}
    </div>
  );
}

// =========================================
// 전사 데이터 파싱 로직
// =========================================

interface ParsedTranscript {
  mluW: number;
  mluMax: number;
  longestUtterance: string;
  formattedTranscript: string; // C:/S: 형식
}

function parseTranscript(raw: string): ParsedTranscript | null {
  const lines = raw.split('\n');

  const childUtterances: { wordCount: number; text: string }[] = [];
  const formattedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 숫자로 시작하는 줄 = 아동 발화 (숫자 = 어절 수)
    const childMatch = trimmed.match(/^(\d+)\s+(.+)$/);
    if (childMatch) {
      const wordCount = parseInt(childMatch[1], 10);
      const text = childMatch[2].trim();
      childUtterances.push({ wordCount, text });
      formattedLines.push(`S: ${text}`);
    } else {
      // 치료사 발화
      formattedLines.push(`C: ${trimmed}`);
    }
  }

  if (childUtterances.length === 0) return null;

  const totalWords = childUtterances.reduce((sum, u) => sum + u.wordCount, 0);
  const mluW = Math.round((totalWords / childUtterances.length) * 100) / 100;
  const mluMax = Math.max(...childUtterances.map((u) => u.wordCount));
  const longest = childUtterances.reduce((max, u) => (u.wordCount > max.wordCount ? u : max));

  return {
    mluW,
    mluMax,
    longestUtterance: longest.text,
    formattedTranscript: formattedLines.join('\n'),
  };
}

// =========================================
// 전사 데이터 입력 섹션
// =========================================

function TranscriptInputSection() {
  const { setSpontaneousField } = useLanguageAnalysisStore();
  const [transcriptText, setTranscriptText] = useState('');
  const [parseResult, setParseResult] = useState<ParsedTranscript | null>(null);
  const [parseError, setParseError] = useState(false);

  const handleAnalyze = () => {
    const result = parseTranscript(transcriptText);
    if (!result) {
      setParseError(true);
      setParseResult(null);
      return;
    }

    setParseError(false);
    setParseResult(result);

    // 섹션 1 필드 자동 채우기
    setSpontaneousField('mluW', result.mluW);
    setSpontaneousField('mluMax', result.mluMax);
    setSpontaneousField('longestUtterance', result.longestUtterance);

    // 섹션 7 상황별 관찰 첫 번째 항목에 전사 데이터 채우기
    setSpontaneousField('situationalObservations', [
      {
        situation: '전사 데이터',
        observation: '',
        example: result.formattedTranscript,
      },
    ]);
  };

  return (
    <div>
      <SectionHeader
        title="전사 데이터 입력"
        subtitle="전사 데이터를 붙여넣고 자동 분석 버튼을 누르세요 (숫자 = 아동 발화 어절 수)"
      />
      <Textarea
        placeholder={`예시:\n    방학 동안 뭐 했어?\n2    식당 갔어.\n    어떤 식당?\n6    방학 지낸 이야기에 밥을 먹었어. 여름방학에.`}
        value={transcriptText}
        onChange={(e) => {
          setTranscriptText(e.target.value);
          setParseError(false);
          setParseResult(null);
        }}
        rows={6}
        className="text-sm"
      />
      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAnalyze}
          disabled={!transcriptText.trim()}
        >
          자동 분석
        </Button>
        {parseResult && (
          <span className="text-xs text-green-600 dark:text-green-400">
            MLU-w {parseResult.mluW} · MLU-max {parseResult.mluMax}
          </span>
        )}
        {parseError && (
          <span className="text-destructive text-xs">
            아동 발화를 찾을 수 없습니다. 숫자로 시작하는 줄이 있는지 확인하세요.
          </span>
        )}
      </div>
    </div>
  );
}

// =========================================
// 섹션 1: 구문 측정치
// =========================================

function SyntaxMeasuresSection() {
  const { spontaneous, setSpontaneousField } = useLanguageAnalysisStore();

  const handleMluInput = (field: 'mluW' | 'mluMax', value: string) => {
    if (value === '') {
      setSpontaneousField(field, null);
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setSpontaneousField(field, num);
    }
  };

  return (
    <div>
      <SectionHeader title="섹션 1: 구문 측정치" />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-1 text-left font-medium">지표</th>
            <th className="w-36 py-1 text-center font-medium">값</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2">
              <span>평균어절길이</span>
            </td>
            <td className="py-2 text-center">
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="예: 2.50"
                value={spontaneous.mluW ?? ''}
                onChange={(e) => handleMluInput('mluW', e.target.value)}
                className="h-8 w-28 text-center"
              />
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2">
              <span>최장어절길이</span>
            </td>
            <td className="py-2 text-center">
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="예: 7.00"
                value={spontaneous.mluMax ?? ''}
                onChange={(e) => handleMluInput('mluMax', e.target.value)}
                className="h-8 w-28 text-center"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-3 space-y-2">
        <div>
          <label className="text-xs font-medium">가장 긴 발화</label>
          <Input
            placeholder="가장 긴 발화 텍스트를 입력하세요"
            value={spontaneous.longestUtterance ?? ''}
            onChange={(e) => setSpontaneousField('longestUtterance', e.target.value || null)}
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium">문법 구조</label>
          <Input
            placeholder="예: 대등접속 복문, 내포절 복문"
            value={spontaneous.longestUtteranceStructure ?? ''}
            onChange={(e) =>
              setSpontaneousField('longestUtteranceStructure', e.target.value || null)
            }
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium">발화 상황</label>
          <Input
            placeholder="예: 놀이 상황, 그림책 보기"
            value={spontaneous.speakingSituation ?? ''}
            onChange={(e) => setSpontaneousField('speakingSituation', e.target.value || null)}
            className="mt-1 h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// =========================================
// 섹션 2: 의사소통 기능
// =========================================

function CommunicationFunctionsSection() {
  const { spontaneous, setSpontaneousField } = useLanguageAnalysisStore();
  const { customItems, setCustomItems } = useLanguageAnalysisCustomItemsStore();
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});

  const toggleItem = (category: string, item: string) => {
    const current = spontaneous.communicationFunctions[category] ?? [];
    const updated = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
    setSpontaneousField('communicationFunctions', {
      ...spontaneous.communicationFunctions,
      [category]: updated,
    });
  };

  const addCustomItem = (category: string) => {
    const newItem = (newItemInputs[category] ?? '').trim();
    if (!newItem) return;
    const existing = customItems[category] ?? [];
    if (!existing.includes(newItem)) {
      setCustomItems(category, [...existing, newItem]);
    }
    // 추가한 항목 자동 체크
    toggleItem(category, newItem);
    setNewItemInputs((prev) => ({ ...prev, [category]: '' }));
  };

  const removeCustomItem = (category: string, item: string) => {
    const updated = (customItems[category] ?? []).filter((i) => i !== item);
    setCustomItems(category, updated);
    // 선택 해제
    const current = spontaneous.communicationFunctions[category] ?? [];
    if (current.includes(item)) {
      setSpontaneousField('communicationFunctions', {
        ...spontaneous.communicationFunctions,
        [category]: current.filter((i) => i !== item),
      });
    }
  };

  return (
    <div>
      <SectionHeader
        title="섹션 2: 의사소통 기능"
        subtitle="관찰된 의사소통 기능을 카테고리별로 선택하세요"
      />
      <div className="space-y-3">
        {COMMUNICATION_FUNCTION_CATEGORIES.map(({ category, items }) => {
          const selected = spontaneous.communicationFunctions[category] ?? [];
          const customs = customItems[category] ?? [];
          const allItems = [...items, ...customs];
          return (
            <div key={category} className="rounded-md border p-3">
              <p className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                {category}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allItems.map((item) => {
                  const isCustom = customs.includes(item);
                  const isSelected = selected.includes(item);
                  return (
                    <div key={item} className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => toggleItem(category, item)}
                        className={[
                          'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-accent',
                        ].join(' ')}
                      >
                        {item}
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => removeCustomItem(category, item)}
                          className="text-muted-foreground hover:text-destructive text-xs leading-none"
                          aria-label={`${item} 삭제`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-1">
                <Input
                  placeholder="항목 직접 추가"
                  value={newItemInputs[category] ?? ''}
                  onChange={(e) =>
                    setNewItemInputs((prev) => ({ ...prev, [category]: e.target.value }))
                  }
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomItem(category);
                    }
                  }}
                  className="h-7 flex-1 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCustomItem(category)}
                  className="h-7 text-xs"
                >
                  추가
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================
// 태그 입력 컴포넌트 (섹션 3)
// =========================================

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div
      className="border-input flex min-h-[36px] flex-wrap gap-1 rounded-md border px-2 py-1 text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="bg-secondary text-secondary-foreground flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="hover:text-destructive ml-0.5 leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.nativeEvent.isComposing) return; // IME 조합 중 무시
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
          } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
            onChange(tags.slice(0, -1));
          }
        }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-[80px] flex-1 bg-transparent outline-none placeholder:text-xs"
      />
    </div>
  );
}

// =========================================
// 섹션 3: 문법형태소 태그 입력
// =========================================

function MorphemeTagsSection() {
  const { spontaneous, setSpontaneousField } = useLanguageAnalysisStore();
  const { morphemes } = spontaneous;

  const updateMorphemes = (field: keyof typeof morphemes, tags: string[]) => {
    setSpontaneousField('morphemes', { ...morphemes, [field]: tags });
  };

  return (
    <div>
      <SectionHeader title="섹션 3: 문법형태소" subtitle="Enter로 태그 추가, ×로 삭제" />
      <div className="space-y-2">
        <div>
          <label className="text-xs font-medium">조사</label>
          <div className="mt-1">
            <TagInput
              tags={morphemes.particles}
              onChange={(tags) => updateMorphemes('particles', tags)}
              placeholder="예: 이/가, 을/를, 에서"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium">연결어미</label>
          <div className="mt-1">
            <TagInput
              tags={morphemes.conjunctions}
              onChange={(tags) => updateMorphemes('conjunctions', tags)}
              placeholder="예: -고, -아서, -지만"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium">종결어미</label>
          <div className="mt-1">
            <TagInput
              tags={morphemes.endings}
              onChange={(tags) => updateMorphemes('endings', tags)}
              placeholder="예: -어, -다, -요"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================
// 섹션 4: 의미/문법 오류
// =========================================

function SemanticErrorsSection() {
  const { spontaneous, setSpontaneousField } = useLanguageAnalysisStore();
  const { semanticErrors } = spontaneous;

  return (
    <div>
      <SectionHeader title="섹션 4: 의미/문법 오류" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            setSpontaneousField('semanticErrors', {
              ...semanticErrors,
              enabled: !semanticErrors.enabled,
            })
          }
          className={[
            'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
            semanticErrors.enabled
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-accent',
          ].join(' ')}
        >
          {semanticErrors.enabled ? 'ON' : 'OFF'}
        </button>
        <span className="text-muted-foreground text-xs">
          {semanticErrors.enabled ? '오류 예시를 입력하세요' : '해당 없으면 OFF 유지'}
        </span>
      </div>
      {semanticErrors.enabled && (
        <Textarea
          placeholder="오류 예시를 입력하세요 (예: '강아지 먹다' → '강아지가 먹다'로 수정 필요)"
          value={semanticErrors.examples ?? ''}
          onChange={(e) =>
            setSpontaneousField('semanticErrors', {
              ...semanticErrors,
              examples: e.target.value || null,
            })
          }
          rows={3}
          className="mt-2 text-sm"
        />
      )}
    </div>
  );
}

// =========================================
// 체크리스트 컴포넌트 (섹션 5, 6, 8)
// =========================================

function ChecklistRow({
  item,
  onChange,
  showNegative = true,
}: {
  item: ChecklistItem;
  onChange: (value: 'positive' | 'negative' | null) => void;
  showNegative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b py-1.5 last:border-0">
      <span className="text-sm">{item.label}</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onChange(item.value === 'positive' ? null : 'positive')}
          className={[
            'rounded px-2 py-0.5 text-xs font-medium transition-colors',
            item.value === 'positive'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-muted hover:bg-muted/80',
          ].join(' ')}
        >
          예
        </button>
        {showNegative && (
          <button
            type="button"
            onClick={() => onChange(item.value === 'negative' ? null : 'negative')}
            className={[
              'rounded px-2 py-0.5 text-xs font-medium transition-colors',
              item.value === 'negative'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-muted hover:bg-muted/80',
            ].join(' ')}
          >
            아니오
          </button>
        )}
      </div>
    </div>
  );
}

// =========================================
// 섹션 5: 화용/담화
// =========================================

function PragmaticSection() {
  const { spontaneous, setSpontaneousField } = useLanguageAnalysisStore();
  const { pragmatic } = spontaneous;

  const updateItem = (index: number, value: 'positive' | 'negative' | null) => {
    const updated = pragmatic.items.map((item, i) => (i === index ? { ...item, value } : item));
    setSpontaneousField('pragmatic', { ...pragmatic, items: updated });
  };

  return (
    <div>
      <SectionHeader title="섹션 5: 화용/담화" />
      <div className="rounded-md border px-3">
        {pragmatic.items.map((item, index) => (
          <ChecklistRow
            key={item.label}
            item={item}
            onChange={(value) => updateItem(index, value)}
          />
        ))}
      </div>
      <div className="mt-2">
        <label className="text-xs font-medium">발화 예시</label>
        <Textarea
          placeholder="관련 발화 예시를 입력하세요"
          value={pragmatic.examples ?? ''}
          onChange={(e) =>
            setSpontaneousField('pragmatic', { ...pragmatic, examples: e.target.value || null })
          }
          rows={2}
          className="mt-1 text-sm"
        />
      </div>
    </div>
  );
}

// =========================================
// 섹션 6: 주제 관리
// =========================================

function TopicManagementSection() {
  const { spontaneous, setSpontaneousField } = useLanguageAnalysisStore();
  const { topicManagement } = spontaneous;

  const updateItem = (index: number, value: 'positive' | 'negative' | null) => {
    const updated = topicManagement.map((item, i) => (i === index ? { ...item, value } : item));
    setSpontaneousField('topicManagement', updated);
  };

  return (
    <div>
      <SectionHeader title="섹션 6: 주제 관리" />
      <div className="rounded-md border px-3">
        {topicManagement.map((item, index) => (
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

// =========================================
// 섹션 7: 상황별 관찰
// =========================================

function SituationalObservationsSection() {
  const { spontaneous, setSpontaneousField } = useLanguageAnalysisStore();
  const { situationalObservations } = spontaneous;
  const [customSituation, setCustomSituation] = useState('');

  const updateObservation = (index: number, field: keyof SituationalObservation, value: string) => {
    const updated = situationalObservations.map((obs, i) =>
      i === index ? { ...obs, [field]: value } : obs
    );
    setSpontaneousField('situationalObservations', updated);
  };

  const removeObservation = (index: number) => {
    setSpontaneousField(
      'situationalObservations',
      situationalObservations.filter((_, i) => i !== index)
    );
  };

  const addCustomObservation = () => {
    const trimmed = customSituation.trim();
    if (!trimmed) return;
    setSpontaneousField('situationalObservations', [
      ...situationalObservations,
      { situation: trimmed, observation: '', example: '', isCustom: true },
    ]);
    setCustomSituation('');
  };

  return (
    <div>
      <SectionHeader
        title="섹션 7: 상황별 관찰"
        subtitle="각 상황의 관찰 내용과 발화 예시를 입력하세요"
      />
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
                placeholder={`발화 예시 (S:/C: 형식 가능)\n예) C: 이거 뭐야?\nS: 강아지야.`}
                value={obs.example}
                onChange={(e) => updateObservation(index, 'example', e.target.value)}
                rows={3}
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustomObservation}
          className="h-8 text-xs"
        >
          + 상황 추가
        </Button>
      </div>
    </div>
  );
}

// =========================================
// 섹션 8: 공동활동/호명
// =========================================

function JointAttentionSection() {
  const { spontaneous, setSpontaneousField } = useLanguageAnalysisStore();
  const { jointAttention } = spontaneous;

  const updateItem = (index: number, value: 'positive' | 'negative' | null) => {
    const updated = jointAttention.map((item, i) => (i === index ? { ...item, value } : item));
    setSpontaneousField('jointAttention', updated);
  };

  return (
    <div>
      <SectionHeader title="섹션 8: 공동활동/호명" subtitle="선택 사항" />
      <div className="rounded-md border px-3">
        {jointAttention.map((item, index) => (
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

// =========================================
// 메인 컴포넌트
// =========================================

export function SpontaneousSpeechForm() {
  return (
    <div className="space-y-6 py-2">
      <TranscriptInputSection />
      <hr />
      <SyntaxMeasuresSection />
      <hr />
      <CommunicationFunctionsSection />
      <hr />
      <MorphemeTagsSection />
      <hr />
      <SemanticErrorsSection />
      <hr />
      <PragmaticSection />
      <hr />
      <TopicManagementSection />
      <hr />
      <SituationalObservationsSection />
      <hr />
      <JointAttentionSection />
    </div>
  );
}
