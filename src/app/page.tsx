import { Header } from '@/widgets/header';
import { ChildInfoForm } from '@/features/child-info';

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

        <ChildInfoForm />
      </main>
    </div>
  );
}
