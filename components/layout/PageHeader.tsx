'use client';

import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  accentColor?: string;
}

export function PageHeader({
  title,
  showBack = false,
  rightElement,
  accentColor,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3"
      style={accentColor ? { borderBottomColor: accentColor } : undefined}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <h1
            className="text-lg font-semibold"
            style={accentColor ? { color: accentColor } : undefined}
          >
            {title}
          </h1>
        </div>
        {rightElement && <div>{rightElement}</div>}
      </div>
    </header>
  );
}
