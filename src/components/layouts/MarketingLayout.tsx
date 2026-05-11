import { ReactNode } from 'react';
import Header from '../shared/Header';
import Footer from '../shared/Footer';

interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="print:hidden">
        <Header />
      </div>
      <main className="flex-grow">
        {children}
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
