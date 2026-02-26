'use client';

/**
 * 언어분석 유형 선택 + 입력 폼 라우터
 * - 유형 선택: 자발화 / 대화분석 / 행동관찰
 * - 자발화 선택 시: SpontaneousSpeechForm (SCRUM-112)
 * - 대화분석/행동관찰: 유형 선택만 지원 (입력 폼은 SCRUM-113/114에서 구현)
 */

import {
  useLanguageAnalysisStore,
  LANGUAGE_ANALYSIS_TYPE_LABELS,
  type LanguageAnalysisType,
} from '../model/languageAnalysisStore';
import { SpontaneousSpeechForm } from './SpontaneousSpeechForm';

const TYPE_ORDER: LanguageAnalysisType[] = [
  'spontaneous_speech',
  'conversation',
  'behavioral_observation',
];

export function LanguageAnalysisForm() {
  const { selectedType, setSelectedType } = useLanguageAnalysisStore();

  const handleTypeSelect = (type: LanguageAnalysisType) => {
    setSelectedType(selectedType === type ? null : type);
  };

  return (
    <div className="space-y-4 py-2">
      {/* 유형 선택 */}
      <div>
        <p className="text-muted-foreground mb-2 text-sm">분석 유형을 선택하세요</p>
        <div className="flex gap-2">
          {TYPE_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeSelect(type)}
              className={[
                'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
                selectedType === type
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent hover:text-accent-foreground',
              ].join(' ')}
            >
              {LANGUAGE_ANALYSIS_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* 자발화: SpontaneousSpeechForm */}
      {selectedType === 'spontaneous_speech' && <SpontaneousSpeechForm />}

      {/* 대화분석/행동관찰: 플레이스홀더 */}
      {(selectedType === 'conversation' || selectedType === 'behavioral_observation') && (
        <div className="bg-muted/50 rounded-md p-4 text-center">
          <p className="text-muted-foreground text-sm">
            {LANGUAGE_ANALYSIS_TYPE_LABELS[selectedType]} 입력 폼은 준비 중입니다.
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            유형 선택 후 결과 확인을 눌러 진행할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
