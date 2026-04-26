
import React, { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { getERPInsights } from '../services/geminiService';

interface AIAssistantProps {
  erpData: any;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ erpData }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: "Hello! I'm your ForgeERP Intelligence agent. Ask me about stock levels, production feasibility, or financial summaries." }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg = query;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setIsLoading(true);

    const botResponse = await getERPInsights(erpData, userMsg);
    setMessages(prev => [...prev, { role: 'bot', text: botResponse || 'I am sorry, I am unable to process that.' }]);
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col bg-white rounded-2xl tally-shadow overflow-hidden border border-slate-100">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Bot className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">AI Plant Consultant</h3>
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Powered by Gemini
            </p>
          </div>
        </div>
        <div className="hidden sm:flex gap-2">
           <button onClick={() => setQuery("Give me a stock summary")} className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-all">Stock Summary</button>
           <button onClick={() => setQuery("Check production bottleneck")} className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-all">Bottlenecks</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-slate-600" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                <Bot size={16} className="text-slate-600" />
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-50/50 border-t border-slate-100">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ask anything about your manufacturing data..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-6 pr-14 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !query.trim()}
            className="absolute right-3 top-2.5 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
