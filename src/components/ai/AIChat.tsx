'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Minimize2, Maximize2, Loader2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
}

export function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! I am your Learnership Assistant. How can I help you with the curriculum (NVC Level 2) today?',
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content })),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.data.response,
                    sources: data.data.sources
                }]);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please check your connection and try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg p-0 bg-primary/90 hover:bg-primary"
                onClick={() => setIsOpen(true)}
            >
                <MessageCircle className="h-8 w-8 text-white" />
            </Button>
        );
    }

    const toggleMinimize = () => setIsMinimized(!isMinimized);

    return (
        <div className={cn(
            "fixed right-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl transition-all duration-300 ease-in-out z-50 overflow-hidden",
            isMinimized ? "bottom-6 h-14 w-72 rounded-t-lg" : "bottom-6 h-[600px] w-[400px] rounded-2xl"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 cursor-pointer"
                onClick={toggleMinimize}>
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-md">
                        <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">Learnership Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}>
                        {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
                <>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 h-[480px] space-y-4 bg-white dark:bg-zinc-900">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full mb-4",
                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-foreground rounded-tl-sm border border-zinc-200 dark:border-zinc-700"
                                )}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                                            <p className="text-xs font-semibold text-muted-foreground mb-1">Sources:</p>
                                            <div className="space-y-1">
                                                {msg.sources.slice(0, 2).map((source: any, idx: number) => (
                                                    <div key={idx} className="text-xs text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded border border-zinc-100 dark:border-zinc-800">
                                                        <span className="font-medium text-primary/80">{source.filename}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start w-full">
                                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-3 rounded-tl-sm border border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-background border-t border-zinc-200 dark:border-zinc-800">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask about NVC L2..."
                                className="flex-1 bg-zinc-50 dark:bg-zinc-900"
                                disabled={isLoading}
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
