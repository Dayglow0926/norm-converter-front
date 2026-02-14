import { ALL_TOOL_IDS } from '@/entities/assessment-tool';
import { ScoreEntryContent } from './ScoreEntryContent';

interface PageProps {
  params: Promise<{ tool: string }>;
}

// 정적 빌드를 위한 경로 생성 (output: 'export' 필요)
export function generateStaticParams() {
  return ALL_TOOL_IDS.map((tool) => ({ tool }));
}

export default async function ScoreEntryPage({ params }: PageProps) {
  const { tool } = await params;
  return <ScoreEntryContent tool={tool} />;
}
