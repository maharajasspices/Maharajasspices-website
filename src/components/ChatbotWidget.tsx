import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import chatBotLogo from "@/assets/chat-bot-logo.webp";
import { useLocation, Link } from "react-router-dom";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Product {
  id: string;
  name: string;
}

const MAX_CHAT_CONTEXT_MESSAGES = 12;

// Site pages for hyperlink matching
const SITE_PAGES = [
  { path: '/shop', names: ['shop', 'products', 'browse products', 'our products', 'product page', 'shop page'] },
  { path: '/become-stockist', names: ['become a stockist', 'stockist', 'become stockist', 'stockist application', 'apply to be a stockist'] },
  { path: '/store-locator', names: ['store locator', 'find a store', 'stores', 'store locations', 'find stores', 'where to buy'] },
  { path: '/recipes', names: ['recipes', 'recipe page', 'cooking recipes', 'our recipes'] },
  { path: '/about', names: ['about us', 'about page', 'our story', 'who we are'] },
  { path: '/contact', names: ['contact us', 'contact page', 'get in touch', 'reach us'] },
  { path: '/track-order', names: ['track order', 'order tracking', 'track my order'] },
  { path: '/shipping-policy', names: ['shipping policy', 'delivery policy', 'shipping information'] },
  { path: '/refund-policy', names: ['refund policy', 'return policy', 'returns policy'] },
  { path: '/terms', names: ['terms of service', 'terms and conditions'] },
  { path: '/privacy-policy', names: ['privacy policy', 'data privacy'] },
  { path: '/careers', names: ['careers page', 'job opportunities', 'career opportunities', 'job openings'] },
  { path: '/liked-items', names: ['liked items', 'liked products', 'my likes', 'favorites', 'favourite products', 'wishlist'] },
  { path: '/auth', names: ['sign in', 'log in', 'login', 'create account', 'register', 'sign up'] },
  { path: '/cart', names: ['my cart', 'shopping cart', 'view cart', 'checkout cart'] },
  { path: '/recently-viewed', names: ['recently viewed', 'viewed products', 'browsing history', 'recently browsed'] },
];

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '👋 Hi! I\'m here to help you find the perfect spices and answer any questions about Maharaja\'s Spices products.\n\nI have real-time access to our inventory and can recommend products based on discounts and specials!\n\nIf you can\'t find what you\'re looking for, please call our hotline at 068 405 1374.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const hasAutoOpened = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch products for hyperlink matching
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name')
        .eq('in_stock', true);
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  // Initialize session and load chat history
  useEffect(() => {
    const initializeChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const storedSessionId = sessionStorage.getItem('chat_session_id');
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else {
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
        sessionStorage.setItem('chat_session_id', newSessionId);
      }

      if (user && storedSessionId) {
        const { data: chatHistory } = await supabase
          .from('chat_messages')
          .select('role, content')
          .eq('user_id', user.id)
          .eq('session_id', storedSessionId)
          .order('created_at', { ascending: true })
          .limit(20);

        if (chatHistory && chatHistory.length > 0) {
          setMessages([
            { role: 'assistant', content: '👋 Welcome back! How can I help you with Maharaja\'s Spices today?\n\nIf you need immediate assistance, call 068 405 1374.' },
            ...chatHistory.map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            }))
          ]);
        }
      }
    };

    initializeChat();
  }, []);

  // Auto-open chatbot ONLY ONCE per session on home page
  useEffect(() => {
    const isHomePage = location.pathname === '/';
    const alreadyOpened = sessionStorage.getItem('chatbotAutoOpened');
    
    if (isHomePage && !alreadyOpened && !hasAutoOpened.current) {
      hasAutoOpened.current = true;
      
      const openTimer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('chatbotAutoOpened', 'true');
        
        // Auto-close after 3 seconds if user hasn't interacted
        const closeTimer = setTimeout(() => {
          setIsOpen(false);
        }, 3000);
        
        return () => clearTimeout(closeTimer);
      }, 4000);

      return () => clearTimeout(openTimer);
    }
  }, [location.pathname]);

  // Clean and format content - strip all code/HTML patterns and format nicely
  const cleanContent = (content: string): string => {
    let cleaned = content;
    
    // Remove any HTML tags completely (in case AI returns HTML)
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/`[^`]*`/g, '');
    
    // Remove asterisks (markdown bold/italic)
    cleaned = cleaned.replace(/\*+/g, '');
    
    // Remove markdown headers
    cleaned = cleaned.replace(/^#{1,6}\s*/gm, '');
    
    // Remove markdown links but keep the text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // Remove any remaining markdown formatting
    cleaned = cleaned.replace(/__/g, '');
    cleaned = cleaned.replace(/~~/g, '');
    
    // Clean up excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();
    
    return cleaned;
  };

  // Parse content and add product + page hyperlinks
  const parseContentWithLinks = (content: string): React.ReactNode[] => {
    const cleanedContent = cleanContent(content);
    let currentContent = cleanedContent;
    
    // Collect all matches (products + pages)
    const matches: { start: number; end: number; path: string; text: string; type: 'product' | 'page' }[] = [];
    
    // Sort products by name length (longest first) to match longer names first
    const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
    
    // Match products
    sortedProducts.forEach(product => {
      const regex = new RegExp(`\\b${product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(currentContent)) !== null) {
        const overlaps = matches.some(m => 
          (match!.index >= m.start && match!.index < m.end) ||
          (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
        );
        
        if (!overlaps) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            path: `/product/${product.id}`,
            text: match[0],
            type: 'product'
          });
        }
      }
    });
    
    // Match site pages - sort by name length to match longest first
    const allPageNames = SITE_PAGES.flatMap(page => 
      page.names.map(name => ({ name, path: page.path }))
    ).sort((a, b) => b.name.length - a.name.length);
    
    allPageNames.forEach(({ name, path }) => {
      const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(currentContent)) !== null) {
        const overlaps = matches.some(m => 
          (match!.index >= m.start && match!.index < m.end) ||
          (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
        );
        
        if (!overlaps) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            path: path,
            text: match[0],
            type: 'page'
          });
        }
      }
    });
    
    // Also match path patterns like "/shop" or "/contact"
    SITE_PAGES.forEach(page => {
      const regex = new RegExp(`${page.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(currentContent)) !== null) {
        const overlaps = matches.some(m => 
          (match!.index >= m.start && match!.index < m.end) ||
          (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
        );
        
        if (!overlaps) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            path: page.path,
            text: match[0],
            type: 'page'
          });
        }
      }
    });
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // Build the result
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    matches.forEach((match, idx) => {
      // Add text before this match
      if (match.start > lastIndex) {
        parts.push(currentContent.substring(lastIndex, match.start));
      }
      
      // Add the link
      parts.push(
        <Link 
          key={`${match.path}-${idx}`}
          to={match.path}
          className="text-primary underline hover:opacity-80 font-medium"
        >
          {match.text}
        </Link>
      );
      
      lastIndex = match.end;
    });
    
    // Add remaining text
    if (lastIndex < currentContent.length) {
      parts.push(currentContent.substring(lastIndex));
    }
    
    if (parts.length === 0) {
      return [cleanedContent];
    }
    
    return parts;
  };

  // Make phone numbers clickable
  const formatWithPhoneLinks = (parts: React.ReactNode[]): React.ReactNode[] => {
    return parts.map((part, idx) => {
      if (typeof part !== 'string') return part;
      
      const phoneRegex = /(\d{3}\s?\d{3}\s?\d{4})/g;
      const segments: React.ReactNode[] = [];
      let lastIdx = 0;
      let match;
      
      while ((match = phoneRegex.exec(part)) !== null) {
        if (match.index > lastIdx) {
          segments.push(part.substring(lastIdx, match.index));
        }
        segments.push(
          <a 
            key={`phone-${idx}-${match.index}`}
            href={`tel:${match[1].replace(/\s/g, '')}`}
            className="underline hover:opacity-80 font-semibold"
          >
            {match[1]}
          </a>
        );
        lastIdx = match.index + match[0].length;
      }
      
      if (lastIdx < part.length) {
        segments.push(part.substring(lastIdx));
      }
      
      return segments.length > 0 ? segments : part;
    }).flat();
  };

  const handleSendMessage = async () => {
    if (message.trim() === "" || isLoading) return;

    const userMessage = message;
    setMessage("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      if (userId && sessionId) {
        await supabase.from('chat_messages').insert({
          user_id: userId,
          session_id: sessionId,
          role: 'user',
          content: userMessage
        });
      }

      // Send a bounded amount of chat history to avoid oversized prompts (which can cause model failures)
      const conversation: Message[] = [...messages, { role: 'user', content: userMessage }];
      const contextWindow = conversation.slice(-MAX_CHAT_CONTEXT_MESSAGES);

      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: {
          messages: contextWindow,
          userId: userId
        }
      });

      if (error) throw error;

      const assistantMessage = data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

      if (userId && sessionId) {
        await supabase.from('chat_messages').insert({
          user_id: userId,
          session_id: sessionId,
          role: 'assistant',
          content: assistantMessage
        });
      }
    } catch (error) {
      console.error('Error calling chatbot function:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "⚠️ We're currently experiencing high traffic. Please try again in a moment or contact us directly at 068 405 1374 for immediate assistance." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat button - positioned above mobile nav with extra buffer for WebView on mobile, bottom-4 on desktop */}
      <button
        aria-label="Open chat"
        className="fixed right-4 z-50 bg-primary hover:bg-primary/90 shadow-[var(--shadow-elegant)] hover:scale-110 transition-all duration-300 animate-fade-in p-3 rounded-2xl rounded-br-sm border-2 border-primary-foreground/20 md:bottom-4"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '72px', 
          height: '72px',
        }}
      >
        <img src={chatBotLogo} alt="Maharaja's Spices chat" className="h-full w-full object-contain" width="72" height="72" />
      </button>

      {/* Mobile and desktop positioning CSS */}
      <style>{`
        @media (max-width: 767px) {
          button[aria-label="Open chat"] {
            bottom: calc(5rem + env(safe-area-inset-bottom, 0px)) !important;
          }
          .chatbot-popup {
            top: 1rem !important;
            bottom: 1rem !important;
            height: auto !important;
          }
        }
        @media (min-width: 768px) {
          .chatbot-popup {
            top: 1rem !important;
            bottom: 1rem !important;
            height: auto !important;
          }
        }
      `}</style>

      {isOpen && (
        <Card 
          className="chatbot-popup fixed right-4 z-[60] shadow-[var(--shadow-strong)] animate-scale-in flex flex-col w-[calc(100vw-2rem)] max-w-[420px] md:w-[420px]" 
        >
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <img src={chatBotLogo} alt="Maharaja's Spices" className="h-6 w-6 object-contain" width="24" height="24" />
              </div>
              <div>
                <h3 className="font-semibold">Maharaja's Spices</h3>
                <p className="text-xs text-muted-foreground">Ask about our spices!</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`rounded-lg p-3 max-w-[85%] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {msg.role === 'user' 
                      ? msg.content 
                      : formatWithPhoneLinks(parseContentWithLinks(msg.content))}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 shadow-sm">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                size="icon" 
                onClick={handleSendMessage} 
                disabled={isLoading}
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default ChatbotWidget;
