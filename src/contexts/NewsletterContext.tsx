import { createContext, useContext, useState, ReactNode } from 'react';

interface NewsletterContextType {
  isOpen: boolean;
  openNewsletter: () => void;
  closeNewsletter: () => void;
}

const NewsletterContext = createContext<NewsletterContextType | undefined>(undefined);

export const NewsletterProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openNewsletter = () => setIsOpen(true);
  const closeNewsletter = () => setIsOpen(false);

  return (
    <NewsletterContext.Provider value={{ isOpen, openNewsletter, closeNewsletter }}>
      {children}
    </NewsletterContext.Provider>
  );
};

export const useNewsletter = () => {
  const context = useContext(NewsletterContext);
  if (context === undefined) {
    throw new Error('useNewsletter must be used within a NewsletterProvider');
  }
  return context;
};
