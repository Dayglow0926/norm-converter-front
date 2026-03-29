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
import { ConversationAnalysisForm } from './ConversationAnalysisForm';
import { BehavioralObservationForm } from './BehavioralObservationForm';

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

      {selectedType === 'conversation' && <ConversationAnalysisForm />}
      {selectedType === 'behavioral_observation' && <BehavioralObservationForm />}
    </div>
  );
}
