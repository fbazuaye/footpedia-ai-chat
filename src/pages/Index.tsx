import { useState, useRef, useEffect } from "react";
import { SearchInput } from "@/components/SearchInput";
import { MessageBubble } from "@/components/MessageBubble";
import { ConversationPanel } from "@/components/ConversationPanel";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  sources?: Array<{ title: string; url?: string }>;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
  messages: Message[];
}

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const callFlowiseAPI = async (question: string) => {
    try {
      console.log('🌐 Calling Flowise via Supabase Edge Function');
      console.log('🌐 Question:', question);
      
      const requestBody = { question };
      console.log('🌐 Request body:', requestBody);
      
      // Call via Supabase Edge Function to bypass CORS
      const response = await fetch('https://ehfhstaqadbfrhfuxius.supabase.co/functions/v1/flowise-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoZmhzdGFxYWRiZnJoZnV4aXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNzk2MTEsImV4cCI6MjA2MzY1NTYxMX0.XBQJyqNuJQrESovR0qqGwAD5u6N1QDJYvhX-qt4k3lo'}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🌐 Edge Function response received');
      console.log('🌐 Response status:', response.status);
      console.log('🌐 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Edge Function error:', errorData);
        throw new Error(`Edge Function error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ Edge Function response data:', data);
      return data;
    } catch (error) {
      console.error('❌ Edge Function call error:', error);
      throw error;
    }
  };

  const handleSearch = async (query: string) => {
    console.log('🔍 handleSearch called with query:', query);
    console.log('🔍 Query length:', query.length);
    console.log('🔍 Query trimmed:', query.trim());
    
    if (!query.trim()) {
      console.error('❌ Empty query provided');
      toast({
        title: "Search Error",
        description: "Please enter a question to search.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    console.log('🔍 Loading state set to true');

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    };

    console.log('🔍 User message created:', userMessage);
    setCurrentMessages(prev => {
      console.log('🔍 Adding user message to current messages');
      return [...prev, userMessage];
    });

    try {
      console.log('🚀 About to call Flowise RAG API...');
      console.log('🚀 API call starting with query:', query);
      
      const response = await callFlowiseAPI(query);
      console.log('✅ Received response from Flowise RAG:', response);
      console.log('✅ Response type:', typeof response);
      console.log('✅ Response keys:', Object.keys(response || {}));
      
      // Extract response content and sources from RAG endpoint
      const aiContent = response.text || response.answer || response.result || "I couldn't find relevant information in the documents to answer your question.";
      
      // Handle different source document formats from Flowise RAG
      const sources = response.sourceDocuments?.map((doc: any, index: number) => ({
        title: doc.metadata?.source || doc.metadata?.title || doc.metadata?.filename || `Document ${index + 1}`,
        url: doc.metadata?.url || doc.metadata?.source
      })).filter(source => source.title && source.title !== `Document ${sources?.indexOf(source) + 1}`) || [];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiContent,
        sources: sources.length > 0 ? sources : undefined,
        timestamp: new Date(),
      };

      setCurrentMessages(prev => [...prev, aiMessage]);

      // Update or create conversation
      if (activeConversation) {
        setConversations(prev => prev.map(conv => 
          conv.id === activeConversation 
            ? { ...conv, messages: [...conv.messages, userMessage, aiMessage], messageCount: conv.messageCount + 2 }
            : conv
        ));
      } else {
        // Create new conversation
        const newConversation: Conversation = {
          id: Date.now().toString(),
          title: query.length > 50 ? query.substring(0, 50) + "..." : query,
          timestamp: new Date(),
          messageCount: 2,
          messages: [userMessage, aiMessage],
        };
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversation(newConversation.id);
      }

    } catch (error) {
      console.error('❌ Search error occurred:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorDescription = error instanceof Error ? error.message : "Failed to get response. Please try again.";
      
      toast({
        title: "Search Error",
        description: errorDescription,
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `Sorry, I encountered an error: ${errorDescription}. Please try your question again.`,
        timestamp: new Date(),
      };

      setCurrentMessages(prev => [...prev, errorMessage]);
    } finally {
      console.log('🔍 Setting loading to false');
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      setActiveConversation(id);
      setCurrentMessages(conversation.messages);
      setHasSearched(true);
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (activeConversation === id) {
      setActiveConversation(null);
      setCurrentMessages([]);
      setHasSearched(false);
    }
  };

  const handleNewConversation = () => {
    setActiveConversation(null);
    setCurrentMessages([]);
    setHasSearched(false);
  };

  const showHomepage = !hasSearched && currentMessages.length === 0;

  return (
    <div className="min-h-screen flex w-full bg-background">
      <ConversationPanel
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleNewConversation}
      />

      <div className="flex-1 flex flex-col">
        {showHomepage ? (
          // Homepage View
          <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6">
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground">
                Football<span className="text-primary">Pedia</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
                Your AI-powered football knowledge companion. Ask anything about players, teams, matches, statistics, and football history.
              </p>
            </div>

            <div className="w-full max-w-2xl px-4">
              <SearchInput onSearch={handleSearch} isLoading={isLoading} />
            </div>

            <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-2 md:gap-3 px-4">
              {[
                "Who won the 2022 World Cup?",
                "Tell me about Lionel Messi's career",
                "What are the rules of offside?",
                "Top goalscorers in Premier League history"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSearch(suggestion)}
                  className="px-3 md:px-4 py-2 text-xs md:text-sm bg-accent hover:bg-accent/80 text-accent-foreground rounded-full transition-colors border border-border"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Chat View
          <div className="flex-1 flex flex-col">
            <div className="border-b border-border bg-card/50 p-4 pl-16 md:pl-4">
              <h2 className="text-lg font-semibold text-foreground">
                Football<span className="text-primary">Pedia</span>
              </h2>
            </div>

            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="max-w-4xl mx-auto">
                {currentMessages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {isLoading && <LoadingSpinner />}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-border bg-card/50 p-4">
              <div className="max-w-4xl mx-auto">
                <SearchInput 
                  onSearch={handleSearch} 
                  isLoading={isLoading} 
                  placeholder="Ask a follow-up question..."
                  showButton={!isMobile}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-border bg-card/30 p-4 text-center text-xs md:text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row md:justify-center md:space-x-2">
            <span>Designed By Frank Bazuaye</span>
            <span className="hidden md:inline">•</span>
            <span>Powered By LiveGig Ltd.</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
