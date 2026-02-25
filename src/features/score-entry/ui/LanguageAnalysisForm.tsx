'use client';

/**
 * 언어분석 유형 선택 + 자발화 입력 폼
 * - 유형 선택: 자발화 / 대화분석 / 행동관찰
 * - 자발화 선택 시: MLU-w, MLU-max 입력 필드
 * - 대화분석/행동관찰: 유형 선택만 지원 (입력 폼은 SCRUM-112/113/114에서 구현)
 */

import { Input } from '@/components/ui/input';
import {
  useLanguageAnalysisStore,
  LANGUAGE_ANALYSIS_TYPE_LABELS,
  type LanguageAnalysisType,
} from '../model/languageAnalysisStore';

const TYPE_ORDER: LanguageAnalysisType[] = [
  'spontaneous_speech',
  'conversation',
  'behavioral_observation',
];

export function LanguageAnalysisForm() {
  const { selectedType, spontaneous, setSelectedType, setSpontaneous } =
    useLanguageAnalysisStore();

  const handleTypeSelect = (type: LanguageAnalysisType) => {
    setSelectedType(selectedType === type ? null : type);
  };

  const handleMluInput = (field: 'mluW' | 'mluMax', value: string) => {
    if (value === '') {
      setSpontaneous({ [field]: null });
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setSpontaneous({ [field]: num });
    }
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

      {/* 자발화: MLU 입력 */}
      {selectedType === 'spontaneous_speech' && (
        <div className="space-y-3">
          <p className="text-sm font-medium">평균발화길이(MLU)</p>
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
                  <span>MLU-w</span>
                  <span className="text-muted-foreground ml-1 text-xs">(평균어절길이)</span>
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
              <tr>
                <td className="py-2">
                  <span>MLU-max</span>
                  <span className="text-muted-foreground ml-1 text-xs">(최장발화길이)</span>
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
          {spontaneous.mluW === null && spontaneous.mluMax === null && (
            <p className="text-muted-foreground text-xs">MLU-w 또는 MLU-max 중 하나 이상 입력해주세요</p>
          )}
        </div>
      )}

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
