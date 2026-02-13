import { Header } from '@/widgets/header';
import { ChildInfoForm } from '@/features/child-info';

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto flex flex-col items-center justify-center gap-8 px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">언어재활사 규준변환기</h1>
          <p className="text-muted-foreground mt-2">
            SLP Norm Converter - 아동언어평가 규준 변환 도구
          </p>
        </div>

        <ChildInfoForm />
      </main>
    </div>
  );
}
