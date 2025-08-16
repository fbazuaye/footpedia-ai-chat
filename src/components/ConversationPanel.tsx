import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, MessageSquare, Trash2, X, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}

interface ConversationPanelProps {
  conversations: Conversation[];
  activeConversation?: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationPanel({
  conversations,
  activeConversation,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation
}: ConversationPanelProps) {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);
      setIsMobileOpen(false);
    }
  }, [isMobile]);

  // Close mobile panel when selecting conversation
  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobile}
          className="fixed top-4 left-4 z-50 h-10 w-10 rounded-full border border-border bg-background shadow-lg hover:bg-accent md:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Mobile Overlay */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setIsMobileOpen(false)} 
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`fixed left-0 top-0 h-full w-80 bg-card border-r border-border z-50 transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Button 
                onClick={onNewConversation}
                className="flex-1 mr-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                New Chat
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileOpen(false)}
                className="h-9 w-9 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-2">
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <Card 
                    key={conversation.id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-accent group ${
                      activeConversation === conversation.id ? 'bg-accent border-primary/20' : ''
                    }`}
                    onClick={() => handleSelectConversation(conversation.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{conversation.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {conversation.messageCount} messages • {conversation.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-2 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
                
                {conversations.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No conversations yet.
                    <br />
                    Start by asking a question!
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={`relative border-r border-border bg-card transition-all duration-300 hidden md:block ${
      isCollapsed ? 'w-12 lg:w-16' : 'w-64 lg:w-80'
    }`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleCollapse}
        className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-accent"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {!isCollapsed && (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <Button 
              onClick={onNewConversation}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>

          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <Card 
                  key={conversation.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-accent group ${
                    activeConversation === conversation.id ? 'bg-accent border-primary/20' : ''
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{conversation.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conversation.messageCount} messages • {conversation.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-2 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
              
              {conversations.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No conversations yet.
                  <br />
                  Start by asking a question!
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {isCollapsed && (
        <div className="flex flex-col items-center py-4 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewConversation}
            className="h-8 w-8 p-0"
            title="New Chat"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}