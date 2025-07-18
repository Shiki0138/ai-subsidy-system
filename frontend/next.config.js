/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14 App Router設定
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // PDF関連ライブラリのSSR問題を解決
  webpack: (config, { isServer }) => {
    // PDF関連ライブラリをクライアントサイドのみに制限
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }

    // PDF関連ライブラリをexternalに設定（サーバーサイドで実行しない）
    if (isServer) {
      config.externals = [...(config.externals || []), 
        'pdf-lib',
        '@react-pdf/renderer',
        'fontkit',
        'pdfjs-dist',
        'canvas',
        // その他の問題を起こす可能性のあるライブラリ
        'jsdom',
        'sharp',
        '@swc/helpers'
      ];
    }

    // Vercel環境でのビルド最適化
    if (process.env.VERCEL) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            pdf: {
              test: /[\\/]node_modules[\\/](pdf-lib|@react-pdf|pdfjs-dist|fontkit)[\\/]/,
              name: 'pdf-libs',
              priority: 10,
            },
          },
        },
      };
    }

    // Bundle分析 (開発時のみ)
    if (process.env.ANALYZE === 'true' && !process.env.VERCEL) {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      );
    }

    return config;
  },

  // TypeScript設定
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint設定
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 画像最適化
  images: {
    domains: ['localhost', 's3.amazonaws.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // セキュリティヘッダー（開発環境対応）
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: isDev 
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' http://localhost:3001 ws://localhost:3000 https://generativelanguage.googleapis.com https://*.googleapis.com;"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com https://*.googleapis.com;"
          },
        ],
      },
    ];
  },

  // 環境変数
  env: {
    APP_NAME: process.env.APP_NAME,
    APP_VERSION: process.env.APP_VERSION,
  },

  // 本番環境最適化
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

};

module.exports = nextConfig;
