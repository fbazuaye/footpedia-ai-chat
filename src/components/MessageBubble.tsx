import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, User, Bot } from "lucide-react";

interface Source {
  title: string;
  url?: string;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  sources?: Source[];
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500' : 'bg-primary'
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-primary-foreground" />
        )}
      </div>
      
      <Card className={`max-w-[80%] p-4 ${
        isUser 
          ? 'bg-blue-500 text-white border-blue-500' 
          : 'bg-card border-border'
      }`}>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/20">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Sources:</p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => source.url && window.open(source.url, '_blank')}
                >
                  {source.title}
                  {source.url && <ExternalLink className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-muted-foreground'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </Card>
    </div>
  );
}