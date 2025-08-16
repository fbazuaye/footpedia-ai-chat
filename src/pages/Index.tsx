import { useState, useRef, useEffect } from "react";
import { SearchInput } from "@/components/SearchInput";
import { MessageBubble } from "@/components/MessageBubble";
import { ConversationPanel } from "@/components/ConversationPanel";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const callFlowiseAPI = async (question: string) => {
    try {
      console.log('Sending request to Flowise:', { question });
      
      const response = await fetch('https://srv938896.hstgr.cloud/api/v1/prediction/d800a991-bf6d-4c73-aa66-b71413aff520', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      console.log('Flowise response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Flowise API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Flowise API response:', data);
      return data;
    } catch (error) {
      console.error('Flowise API error:', error);
      throw error;
    }
  };

  const handleSearch = async (query: string) => {
    console.log('handleSearch called with query:', query);
    setIsLoading(true);
    setHasSearched(true);

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    };

    setCurrentMessages(prev => [...prev, userMessage]);

    try {
      console.log('About to call Flowise API...');
      const response = await callFlowiseAPI(query);
      console.log('Received response from Flowise:', response);
      
      // Extract response content and sources
      const aiContent = response.text || response.answer || "I couldn't find a relevant answer to your question.";
      const sources = response.sourceDocuments?.map((doc: any, index: number) => ({
        title: doc.metadata?.title || `Source ${index + 1}`,
        url: doc.metadata?.url
      })) || [];

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
      toast({
        title: "Search Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "Sorry, I'm having trouble connecting right now. Please try your question again.",
        timestamp: new Date(),
      };

      setCurrentMessages(prev => [...prev, errorMessage]);
    } finally {
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
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold mb-4 text-foreground">
                Football<span className="text-primary">Pedia</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Your AI-powered football knowledge companion. Ask anything about players, teams, matches, statistics, and football history.
              </p>
            </div>

            <div className="w-full max-w-2xl">
              <SearchInput onSearch={handleSearch} isLoading={isLoading} />
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                "Who won the 2022 World Cup?",
                "Tell me about Lionel Messi's career",
                "What are the rules of offside?",
                "Top goalscorers in Premier League history"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSearch(suggestion)}
                  className="px-4 py-2 text-sm bg-accent hover:bg-accent/80 text-accent-foreground rounded-full transition-colors border border-border"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Chat View
          <div className="flex-1 flex flex-col">
            <div className="border-b border-border bg-card/50 p-4">
              <h2 className="text-lg font-semibold text-foreground">
                Football<span className="text-primary">Pedia</span>
              </h2>
            </div>

            <ScrollArea className="flex-1 p-6">
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
                  showButton={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-border bg-card/30 p-4 text-center text-sm text-muted-foreground">
          Designed By Frank Bazuaye • Powered By LiveGig Ltd.
        </footer>
      </div>
    </div>
  );
};

export default Index;
