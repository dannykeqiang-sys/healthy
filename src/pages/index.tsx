import { Button } from '@/components/shadcn/button';

export default function IndexPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <header className="flex flex-col items-center">
        <h1 className="my-5 text-center text-4xl font-semibold">
          Hello ice.js 3
        </h1>
      </header>
      <main className="flex flex-col items-center my-5 gap-4">
        <p className="text-muted-foreground">
          基于 React 的渐进式应用框架
        </p>
        <div className="flex gap-3">
          <Button variant="default" asChild>
            <a
              href="https://reactjs.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn React
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://ice3.alibaba-inc.com/v3/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn ice.js
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}
