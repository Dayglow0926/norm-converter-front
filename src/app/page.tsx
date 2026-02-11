import { Header } from '@/widgets/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto flex flex-col items-center justify-center gap-8 px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">언어재활사 규준변환기</h1>
          <p className="mt-2 text-muted-foreground">
            SLP Norm Converter - 아동언어평가 규준 변환 도구
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>프로젝트 초기화 완료</CardTitle>
            <CardDescription>
              Next.js 16 + React 19 + FSD 아키텍처
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="test-input" className="text-sm font-medium">
                테스트 입력
              </label>
              <Input id="test-input" placeholder="shadcn/ui Input 테스트" />
            </div>
            <Button className="w-full">시작하기</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
