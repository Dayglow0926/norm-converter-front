import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 SPA 빌드 (Cloudflare Pages 배포용)
  output: 'export',
  
  // React Compiler 활성화
  reactCompiler: true,
  
  // 이미지 최적화 비활성화 (정적 빌드 시 필요)
  images: {
    unoptimized: true,
  },
  
  // 참고: 검색엔진 차단은 robots.txt + meta 태그로 처리
  // headers는 static export에서 지원되지 않음
};

export default nextConfig;
