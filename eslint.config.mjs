export default [
  {
    files: ['**/*.{js,jsx}'],
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'coverage/**',
      '*.min.js',
      'public/**',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Console and global objects
        console: 'readonly',
        process: 'readonly',
        global: 'readonly',

        // DOM and Browser APIs
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',

        // Storage APIs
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        indexedDB: 'readonly',

        // Network APIs
        fetch: 'readonly',
        XMLHttpRequest: 'readonly',
        WebSocket: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',

        // File APIs
        File: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        FormData: 'readonly',

        // Crypto and encoding
        crypto: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',

        // Timers
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        queueMicrotask: 'readonly',

        // Notifications and media
        Notification: 'readonly',
        Audio: 'readonly',
        Video: 'readonly',

        // Modern Web APIs
        AbortController: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        PerformanceObserver: 'readonly',

        // Streams and workers
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        Worker: 'readonly',
        ServiceWorker: 'readonly',
        WorkerGlobalScope: 'readonly',

        // Request/Response
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',

        // Event APIs
        Event: 'readonly',
        CustomEvent: 'readonly',
        EventTarget: 'readonly',

        // Buffer (Node.js)
        Buffer: 'readonly',

        // Self reference
        self: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^[A-Z_]',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-undef': 'error',
    },
  },
];
