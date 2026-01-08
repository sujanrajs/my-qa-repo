import type { ReactNode } from 'react';
import { Footer } from '../Footer/Footer';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="layout">
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

