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
      console.log('🌐 Sending request directly to Flowise RAG API');
      console.log('🌐 Question:', question);
      
      const requestBody = { 
        question,
        temperature: 0.1,
        topK: 3
      };
      console.log('🌐 Request body:', requestBody);
      
      // Call Flowise endpoint directly (bypassing proxy)
      const response = await fetch('https://srv938896.hstgr.cloud/api/v1/prediction/d800a991-bf6d-4c73-aa66-b71413aff520', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🌐 Flowise RAG response received');
      console.log('🌐 Response status:', response.status);
      console.log('🌐 Response ok:', response.ok);
      console.log('🌐 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        console.error('❌ Response not ok. Content-Type:', contentType);
        
        let errorText = 'Unknown error';
        if (contentType?.includes('text/html')) {
          errorText = `Server returned HTML (likely 404). Check if endpoint URL is correct.`;
          console.error('❌ Server returned HTML instead of JSON - endpoint may be incorrect');
        } else {
          errorText = await response.text();
        }
        
        console.error('❌ Flowise RAG API error response:', errorText);
        throw new Error(`Flowise API error: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.error('❌ Response is not JSON. Content-Type:', contentType);
        const responseText = await response.text();
        console.error('❌ Response body:', responseText.substring(0, 200) + '...');
        throw new Error('Server returned non-JSON response. Check endpoint configuration.');
      }

      const data = await response.json();
      console.log('✅ Flowise RAG API response data:', data);
      console.log('✅ Response data type:', typeof data);
      console.log('✅ Response data keys:', Object.keys(data || {}));
      return data;
    } catch (error) {
      console.error('❌ Flowise RAG API error:', error);
      console.error('❌ Error occurred in callFlowiseAPI function');
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
