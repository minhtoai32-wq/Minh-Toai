import React, { useState, useEffect, useRef } from 'react';
import { 
  Type, 
  FileText, 
  UserCircle, 
  Search, 
  Copy, 
  Check, 
  Loader2, 
  Zap, 
  Image as ImageIcon, 
  Youtube,
  Settings,
  ChevronRight,
  FileText as FileIcon,
  CheckCircle2,
  Users,
  Image,
  Loader2 as LoaderIcon,
  Key,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiResponse, analyzeImage, generateImage, extractJSON, setUIKeys } from './lib/gemini';

// --- Types ---
type Tab = 'title' | 'script' | 'prompt-analysis' | 'char-thumb' | 'seo' | 'history';

interface HistoryItem {
  id: string;
  timestamp: string;
  type: 'title' | 'script' | 'prompt-analysis' | 'seo';
  input: string;
  result: any;
}

interface SEOData {
  description: string;
  keywords: string[];
}

interface VideoPrompt {
  segment: string;
  prompt: string;
}

// --- Components ---

const Header = ({ activeTab, setActiveTab, model, setModel }: { 
  activeTab: Tab, 
  setActiveTab: (tab: Tab) => void,
  model: string,
  setModel: (m: string) => void
}) => {
  const tabs: { id: Tab, label: string, icon: any }[] = [
    { id: 'title', label: 'Tiêu đề', icon: Type },
    { id: 'script', label: 'Kịch bản', icon: FileText },
    { id: 'prompt-analysis', label: 'Phân tích Prompt', icon: Zap },
    { id: 'char-thumb', label: 'Thumbnail', icon: UserCircle },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'history', label: 'Lịch sử', icon: CheckCircle2 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase">J-Processor <span className="text-indigo-500">AI</span></h1>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse">Chào mừng Sếp Huy Bơ trở lại!</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-950 shadow-lg' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-300 outline-none cursor-pointer"
            >
              <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};

const TitleProcessor = ({ model }: { model: string }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const saveToHistory = (type: HistoryItem['type'], input: string, result: any) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('vi-VN'),
      type,
      input,
      result
    };
    const history = JSON.parse(localStorage.getItem('j_processor_history') || '[]');
    localStorage.setItem('j_processor_history', JSON.stringify([newItem, ...history]));
  };

  const handleProcess = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const prompt = `MISSION: SINGLE BEST Vietnamese YouTube Title for: ${input}`;
      const system = "Chuyên gia viết tiêu đề YouTube. Chỉ trả về 1 TIÊU ĐỀ DUY NHẤT BẰNG TIẾNG VIỆT. Sử dụng các từ khóa thu hút và đặt trong dấu 【 】 nếu cần. Không giải thích thêm.";
      const res = await getGeminiResponse(prompt, system, model);
      const finalRes = res || '';
      setResult(finalRes);
      if (finalRes) saveToHistory('title', input, finalRes);
    } catch (error) {
      console.error(error);
      setResult('Dạ có chút lỗi nhỏ, sếp Huy Bơ đợi em kiểm tra lại ạ.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-8 flex flex-col gap-6">
        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Type className="w-5 h-5 text-indigo-500" />
          Tiêu đề gốc
        </h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Sếp dán tiêu đề vào đây ạ..."
          className="pro-input flex-grow min-h-[200px] resize-none text-lg font-medium"
        />
        <button 
          onClick={handleProcess}
          disabled={loading || !input.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          XỬ LÝ TIÊU ĐỀ CHO SẾP
        </button>
      </div>

      <div className="glass-card p-8 flex flex-col gap-6 relative overflow-hidden">
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ top: '-100%' }}
              animate={{ top: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10"
            />
          )}
        </AnimatePresence>
        
        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          Tiêu đề mới
        </h2>
        <div className="flex-grow flex items-center justify-center p-6 bg-slate-950/50 rounded-3xl border border-slate-800/50">
          {result ? (
            <p className="text-2xl md:text-3xl font-black text-center bg-gradient-to-br from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {result}
            </p>
          ) : (
            <p className="text-slate-600 font-bold uppercase tracking-widest">Đang chờ lệnh...</p>
          )}
        </div>
        <button 
          onClick={copyToClipboard}
          disabled={!result}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP TIÊU ĐỀ'}
        </button>
      </div>
    </div>
  );
};

const ScriptProcessor = ({ 
  model, 
  onScriptGenerated,
  input,
  setInput,
  result,
  setResult,
  loading,
  setLoading,
  progress,
  setProgress
}: { 
  model: string, 
  onScriptGenerated: (script: string) => void,
  input: string,
  setInput: (s: string) => void,
  result: string,
  setResult: (s: string) => void,
  loading: boolean,
  setLoading: (b: boolean) => void,
  progress: string,
  setProgress: (s: string) => void
}) => {
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const huyBoMessages = [
    "Khởi đầu hành trình kiến tạo kiệt tác cho sếp Huy Bơ...",
    "Từng con chữ đang nhảy múa để phục vụ sếp Huy Bơ đây ạ...",
    "Đoạn 3 đang được trau chuốt vô cùng tỉ mỉ, sếp Huy Bơ đợi em xíu nhé...",
    "Sự tinh tế đang được thổi hồn vào đoạn 4 cho sếp Huy Bơ...",
    "Đoạn 5 đang dần hiện rõ vẻ đẳng cấp, thưa sếp Huy Bơ...",
    "Em đang dồn hết tâm huyết vào đoạn 6 cho sếp Huy Bơ đây...",
    "Vẻ đẹp của ngôn từ đang tỏa sáng ở đoạn 7, sếp Huy Bơ thấy sao ạ?",
    "Đoạn 8 đang được mài giũa sắc bén như ý sếp Huy Bơ...",
    "Sếp Huy Bơ ơi, đoạn 9 sắp hoàn thành với phong cách cực đỉnh rồi...",
    "Cột mốc đoạn 10! Một nửa kiệt tác đã sẵn sàng phục vụ sếp Huy Bơ...",
    "Tiếp tục bùng nổ sáng tạo ở đoạn 11 cho sếp Huy Bơ...",
    "Đoạn 12 đang mang hơi thở thời đại, đúng gu sếp Huy Bơ luôn...",
    "Sự kịch tính đang dâng cao ở đoạn 13, sếp Huy Bơ chuẩn bị nhé...",
    "Đoạn 14 đang được em thêu dệt bằng những từ ngữ mỹ miều nhất...",
    "Sắp về đích rồi sếp Huy Bơ ơi, đoạn 15 đang lên sóng...",
    "Đoạn 16 mang đậm dấu ấn cá nhân của sếp Huy Bơ...",
    "Sự hoàn hảo đang được định nghĩa lại ở đoạn 17, thưa sếp...",
    "Đoạn 18 đang tỏa sáng rực rỡ cho sếp Huy Bơ...",
    "Chỉ còn chút xíu nữa thôi, đoạn 19 đang được hoàn thiện cuối cùng...",
    "Đoạn 20 - Mảnh ghép cuối cùng của siêu phẩm dành cho sếp Huy Bơ!"
  ];

  const handleProcess = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult('');
    setProgress('Dạ em đang nhập vai Biên tập viên quốc tế để phục vụ sếp Huy Bơ đây ạ!');
    
    try {
      const originalCharCount = input.length;
      // Split by paragraphs
      const paragraphs = input.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
      
      let finalScriptParts = new Array(paragraphs.length).fill('');
      let completedCount = 0;

      const systemInstruction = `Bạn là một biên tập viên bản tin thời sự quốc tế kỳ cựu, chuyên viết kịch bản voice-over cho video và phát thanh.

Mục tiêu của bạn KHÔNG phải là sáng tạo tự do. Nhiệm vụ là viết lại nội dung gốc thành một kịch bản mới nhưng vẫn giữ gần như nguyên vẹn: cấu trúc, thứ tự triển khai, nhịp độ, mức độ kịch tính, số lượng ý, mật độ thông tin, cảm xúc, độ dài.

====================
YÊU CẦU VĂN PHONG
====================
Kịch bản phải được viết theo phong cách bản tin thời sự quốc tế chuyên nghiệp, trang trọng, dồn dập và kịch tính.
Bắt buộc mở đầu toàn bộ kịch bản bằng đúng câu sau: "Kính chào quý vị đến với những tin tức thời sự vừa được cập nhật mới nhất của chúng tôi. Sau đây là phần tin chi tiết. Mời quý vị cùng theo dõi."

Sau phần mở đầu, mỗi sự kiện hoặc mỗi phần nội dung phải bắt đầu bằng một headline ngắn, mạnh, sắc bén, có tính cảnh báo hoặc gây chú ý nhưng vẫn khách quan.
Giọng văn phải: nghiêm túc, dồn dập, mang sắc thái địa chính trị, tạo cảm giác cấp bách.

Ưu tiên sử dụng các cụm từ: leo thang căng thẳng, đối đầu chiến lược, răn đe quân sự, xoay trục địa chính trị, hệ lụy nghiêm trọng, động thái chưa từng có, áp lực gia tăng, nguy cơ bùng phát, phản ứng cứng rắn, cục diện khu vực, kịch bản xấu nhất, làn ranh đỏ, khủng hoảng ngoại giao, sức ép quân sự, thế trận mới, cuộc chạy đua vũ trang, nguy cơ mất kiểm soát.

Khi nhắc đến nhân vật, luôn đặt chức danh trước tên riêng.
Khi nhắc đến sự kiện, bắt buộc ưu tiên đưa thêm: con số cụ thể, thời gian, địa danh, tên khí tài, vũ khí, chiến hạm, hệ thống phòng thủ, đơn vị quân đội, số thương vong, số lượng binh sĩ, khoảng cách, phạm vi tác chiến.

Chuyển ý giữa các đoạn bằng các cụm từ: Trong khi đó, Ở chiều ngược lại, Trong bối cảnh..., Tuy nhiên, Đáng chú ý, Cùng thời điểm, Theo các chuyên gia, Một diễn biến khác, Không chỉ dừng lại ở đó.

====================
QUY TẮC BẮT BUỘC VỀ NỘI DUNG
====================
1. Kịch bản mới phải bám sát tối đa nội dung kịch bản gốc. Không tự ý thêm chủ đề mới. Không bỏ luận điểm, chi tiết. Không viết tóm tắt. Không thay đổi thứ tự.
2. Mỗi đoạn trong kịch bản gốc phải tương ứng chính xác với một đoạn trong kịch bản mới (1:1).
3. Độ dài của từng đoạn chỉ được phép chênh lệch tối đa ±10% so với đoạn tương ứng trong bản gốc.`;

      const batchSize = 1; // Process one by one to make progress messages more visible
      for (let i = 0; i < paragraphs.length; i += batchSize) {
        const batch = paragraphs.slice(i, i + batchSize);
        const batchPromises = batch.map(async (para, index) => {
          const actualIndex = i + index;
          const paraCharCount = para.length;
          
          const prompt = `Viết lại đoạn văn sau theo phong cách thời sự quốc tế. 
          
          YÊU CẦU ĐỘ DÀI: Đoạn gốc có ${paraCharCount} ký tự. Đoạn mới phải có độ dài xấp xỉ ${paraCharCount} ký tự (sai số tối đa 10%).
          
          NỘI DUNG ĐOẠN GỐC:
          ${para}
          
          QUY TRÌNH THỰC HIỆN:
          1. Xác định ý chính, cảm xúc và vai trò của đoạn này.
          2. Viết lại đoạn văn giữ nguyên ý và cảm xúc nhưng dùng văn phong thời sự quốc tế.
          3. Nếu đây là đoạn đầu tiên của kịch bản, hãy bắt đầu bằng headline sắc bén sau câu chào mở đầu.
          4. Nếu không phải đoạn đầu, hãy sử dụng từ nối chuyển ý phù hợp.
          5. Tự kiểm tra độ dài để đảm bảo nằm trong khoảng ±10% của ${paraCharCount} ký tự.`;

          const res = await getGeminiResponse(prompt, systemInstruction, model);
          if (res) {
            finalScriptParts[actualIndex] = res.trim();
            completedCount++;
            const msg = huyBoMessages[completedCount - 1] || `Đã hoàn thành ${completedCount}/${paragraphs.length} đoạn cho sếp Huy Bơ...`;
            setProgress(msg);
            setResult(finalScriptParts.filter(p => p !== '').join('\n\n'));
          }
        });
        await Promise.all(batchPromises);
        if (i + batchSize < paragraphs.length) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      const intro = "Kính chào quý vị đến với những tin tức thời sự vừa được cập nhật mới nhất của chúng tôi. Sau đây là phần tin chi tiết. Mời quý vị cùng theo dõi.";
      const mainContent = finalScriptParts.join('\n\n');
      const finalFullScript = `${intro}\n\n${mainContent}`;
      
      const newCharCount = finalFullScript.length;
      const diffRatio = ((newCharCount - originalCharCount) / originalCharCount * 100).toFixed(2);
      const status = Math.abs(parseFloat(diffRatio)) <= 3 ? "PASS" : "CHECK REQUIRED (±3% limit)";

      const header = `Số ký tự kịch bản gốc: ${originalCharCount}\nSố ký tự kịch bản mới: ${newCharCount}\nTỷ lệ chênh lệch: ${diffRatio}%\nKết quả kiểm tra: ${status}\n\n====================\n\n`;
      
      const finalResult = header + finalFullScript;
      setResult(finalResult);
      onScriptGenerated(finalFullScript);
      
      // Save to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('vi-VN'),
        type: 'script',
        input,
        result: finalResult
      };
      const history = JSON.parse(localStorage.getItem('j_processor_history') || '[]');
      localStorage.setItem('j_processor_history', JSON.stringify([historyItem, ...history]));

      setProgress('');
    } catch (error) {
      console.error(error);
      setResult('Lỗi khi xử lý kịch bản theo thuật toán mới. Sếp Huy Bơ vui lòng thử lại ạ.');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file: File) => {
    if (file && (file.type === 'text/plain' || file.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setInput(ev.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      alert('Vui lòng chỉ kéo thả file .txt');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-8 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Mời sếp nhập kịch bản gốc
          </h2>
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{input.length} Ký tự</span>
        </div>
        <div 
          className={`relative flex-grow flex flex-col transition-all duration-300 ${isDragging ? 'scale-[1.01]' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Dán nội dung hoặc kéo thả file .txt vào đây..."
            className={`pro-input flex-grow min-h-[300px] resize-none text-sm leading-relaxed transition-all ${
              isDragging ? 'border-orange-500 bg-orange-500/5 ring-4 ring-orange-500/20' : ''
            }`}
          />
          <AnimatePresence>
            {isDragging && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-orange-600/10 backdrop-blur-[2px] rounded-3xl border-2 border-dashed border-orange-500 flex flex-col items-center justify-center pointer-events-none z-20"
              >
                <div className="bg-orange-600 p-4 rounded-full shadow-lg shadow-orange-600/20 mb-3">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-black text-orange-500 uppercase tracking-widest">Thả file kịch bản tại đây</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" /> NẠP FILE .TXT
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt" className="hidden" />
          <button 
            onClick={handleProcess}
            disabled={loading || !input.trim()}
            className="btn-primary flex-[2] bg-orange-600 hover:bg-orange-500 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            REWRITE DEEP SCRIPT
          </button>
        </div>
      </div>

      <div className="glass-card p-8 flex flex-col gap-6 relative overflow-hidden">
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ top: '-100%' }}
              animate={{ top: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_15px_rgba(249,115,22,0.5)] z-10"
            />
          )}
        </AnimatePresence>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Kịch bản mới
          </h2>
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{result.length} Ký tự</span>
        </div>
        
        <div className="flex-grow bg-slate-950/50 rounded-3xl border border-slate-800/50 p-6 overflow-y-auto relative">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest animate-pulse text-center px-4">{progress || 'Dạ em đang căng não e viết nha anh Huy Bơ'}</p>
            </div>
          ) : result ? (
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed">{result}</pre>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-slate-600 font-bold uppercase tracking-widest">Ready...</p>
            </div>
          )}
        </div>
        <button onClick={copyToClipboard} disabled={!result} className="btn-secondary w-full flex items-center justify-center gap-2">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? 'ĐÃ SAO CHÉP XONG' : 'SAO CHÉP KỊCH BẢN'}
        </button>
      </div>
    </div>
  );
};

const CharacterThumbnailProcessor = ({ 
  model, 
  initialScript,
  script,
  setScript,
  charList,
  setCharList,
  ytUrl,
  setYtUrl,
  imgPreview,
  setImgPreview,
  generatedImg,
  setGeneratedImg,
  ocrResult,
  setOcrResult,
  loadingChars,
  setLoadingChars,
  loadingGen,
  setLoadingGen,
  lastExtracted,
  setLastExtracted
}: { 
  model: string, 
  initialScript: string,
  script: string,
  setScript: (s: string) => void,
  charList: string,
  setCharList: (s: string) => void,
  ytUrl: string,
  setYtUrl: (s: string) => void,
  imgPreview: string | null,
  setImgPreview: (s: string | null) => void,
  generatedImg: string | null,
  setGeneratedImg: (s: string | null) => void,
  ocrResult: string,
  setOcrResult: (s: string) => void,
  loadingChars: boolean,
  setLoadingChars: (b: boolean) => void,
  loadingGen: boolean,
  setLoadingGen: (b: boolean) => void,
  lastExtracted: string,
  setLastExtracted: (s: string) => void
}) => {
  const [loadingOCR, setLoadingOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialScript && initialScript !== script && !script) {
      setScript(initialScript);
    }
  }, [initialScript]);

  useEffect(() => {
    if (script && script !== lastExtracted && !loadingChars) {
      handleExtractChars();
    }
  }, [script]);

  const handleExtractChars = async () => {
    if (!script.trim()) return;
    setLoadingChars(true);
    setLastExtracted(script);
    try {
      const prompt = `Xác định và liệt kê TẤT CẢ các tên nhân vật/vận động viên duy nhất được đề cập trong kịch bản này: ${script}`;
      const system = "Trích xuất tên nhân vật duy nhất từ kịch bản. Trả về danh sách phân cách bằng dấu phẩy. Chỉ sử dụng Tiếng Việt.";
      const res = await getGeminiResponse(prompt, system, model);
      setCharList(res || '');
    } catch (error) {
      console.error(error);
      setCharList('Lỗi khi trích xuất nhân vật.');
    } finally {
      setLoadingChars(false);
    }
  };

  const handleYoutubeUrl = (url: string) => {
    setYtUrl(url);
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[1].length === 11) ? match[1] : null;
    if (videoId) {
      const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      setImgPreview(thumbUrl);
      setGeneratedImg(null);
      setOcrResult('');
      
      // Trigger OCR for YouTube thumbnail
      fetch(thumbUrl)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string);
            processOCR(base64);
          };
          reader.readAsDataURL(blob);
        })
        .catch(err => console.error("OCR for YT thumb failed:", err));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        setImgPreview(base64);
        setGeneratedImg(null);
        processOCR(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processOCR = async (base64: string) => {
    setLoadingOCR(true);
    try {
      const [mime, data] = base64.split(';base64,');
      const mimeType = mime.split(':')[1];
      const res = await analyzeImage(data, mimeType, "Trích xuất toàn bộ văn bản từ hình ảnh này. Chỉ trả về văn bản, không giải thích.", model);
      setOcrResult(res || '');
    } catch (error) {
      console.error(error);
      setOcrResult('Lỗi khi nhận diện chữ.');
    } finally {
      setLoadingOCR(false);
    }
  };

  const handleRecreateThumbnail = async () => {
    if (!imgPreview) return;
    setLoadingGen(true);
    try {
      let base64ToAnalyze = '';
      let mimeType = 'image/jpeg';
      if (imgPreview.startsWith('data:')) {
        const [mime, data] = imgPreview.split(';base64,');
        base64ToAnalyze = data;
        mimeType = mime.split(':')[1];
      } else {
        const response = await fetch(imgPreview);
        const blob = await response.blob();
        base64ToAnalyze = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
      }
      const prompt = `Dựa trên ảnh bìa gốc này.
      
      NHIỆM VỤ:
      Tạo một prompt chi tiết bằng Tiếng Anh để AI tạo ảnh vẽ lại một ảnh bìa YouTube (Thumbnail) kịch tính hơn, đẹp hơn.
      
      YÊU CẦU CHO PROMPT ẢNH:
      - TUYỆT ĐỐI KHÔNG chèn bất kỳ chữ (text) nào vào ảnh. Chỉ tập trung vào hình ảnh.
      - Tập trung vào các nhân vật chính và bối cảnh xung quanh.
      - Phong cách: Cinematic, kịch tính, ánh sáng chuyên nghiệp (Moody lighting, Golden hour...), độ chi tiết cực cao (highly detailed, 8k).
      - Bố cục: Cân đối, thu hút ánh nhìn ngay lập tức.
      
      CHỈ TRẢ VỀ NỘI DUNG PROMPT TIẾNG ANH ĐỂ AI TẠO ẢNH HIỂU TỐT NHẤT.`;

      const genPrompt = await analyzeImage(base64ToAnalyze, mimeType, prompt, model);
      if (genPrompt) {
        const imgUrl = await generateImage(genPrompt);
        setGeneratedImg(imgUrl);
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Lỗi khi tạo lại ảnh bìa.');
    } finally {
      setLoadingGen(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-card p-8 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-500" /> Nhân vật
          </h2>
          <button onClick={handleExtractChars} disabled={loadingChars || !script.trim()} className="btn-primary py-2 px-4 text-[10px]">
            {loadingChars ? <Loader2 className="w-4 h-4 animate-spin" /> : 'TRÍCH XUẤT'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <textarea 
            value={script} 
            onChange={(e) => setScript(e.target.value)} 
            placeholder="Kịch bản sẽ tự động được lấy từ mục Kịch bản..." 
            className="pro-input h-32 resize-none text-xs" 
          />
          <div className="pro-input h-32 bg-slate-950/50 flex items-center justify-center overflow-y-auto">
            {loadingChars ? <Loader2 className="w-6 h-6 text-blue-500 animate-spin" /> : charList ? <p className="text-blue-300 font-bold text-sm text-center p-4">{charList}</p> : <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Danh sách nhân vật...</p>}
          </div>
        </div>
      </div>

      <div className="glass-card p-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-500" /> Thumbnail
          </h2>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Youtube className="w-4 h-4 text-red-500" />
            <input type="text" value={ytUrl} onChange={(e) => handleYoutubeUrl(e.target.value)} placeholder="Link YouTube của sếp..." className="pro-input py-1.5 text-[10px] w-full md:w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ảnh gốc / YouTube</span>
            <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-slate-950 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-500/50 transition-all overflow-hidden relative group">
              {imgPreview ? <img src={imgPreview} alt="Original Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <><ImageIcon className="w-10 h-10 text-slate-700 group-hover:text-indigo-500 transition-colors" /><p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Thả ảnh hoặc chọn file</p></>}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>
            {ocrResult && <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800"><span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-2">Văn bản trên ảnh</span><p className="text-xs text-slate-300 italic">"{ocrResult}"</p></div>}
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Ảnh bìa mới (AI Recreate)</span>
            <div className="aspect-video bg-slate-950 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center gap-4 overflow-hidden relative group">
              {loadingGen ? <div className="flex flex-col items-center gap-3"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /><p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest animate-pulse">Đang kiến tạo ảnh cho sếp Huy Bơ...</p></div> : generatedImg ? <img src={generatedImg} alt="Generated Thumbnail" className="w-full h-full object-cover" /> : <div className="text-center p-6"><Zap className="w-10 h-10 text-slate-800 mx-auto mb-3" /><p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Chưa có ảnh mới</p></div>}
            </div>
            <button onClick={handleRecreateThumbnail} disabled={loadingGen || !imgPreview} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loadingGen ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} KIẾN TẠO THUMBNAIL MỚI CHO SẾP
            </button>
            {generatedImg && <button onClick={() => { const link = document.createElement('a'); link.href = generatedImg; link.download = 'new-thumbnail.png'; link.click(); }} className="btn-secondary w-full py-2 text-[10px] uppercase tracking-widest">TẢI ĐÃ SAO CHÉP XONG</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

const SEOProcessor = ({ 
  model, 
  initialScript,
  script,
  setScript,
  result,
  setResult,
  loading,
  setLoading,
  lastProcessed,
  setLastProcessed
}: { 
  model: string, 
  initialScript: string,
  script: string,
  setScript: (s: string) => void,
  result: SEOData | null,
  setResult: (d: SEOData | null) => void,
  loading: boolean,
  setLoading: (b: boolean) => void,
  lastProcessed: string,
  setLastProcessed: (s: string) => void
}) => {
  const [copied, setCopied] = useState<'desc' | 'all' | null>(null);

  useEffect(() => {
    if (initialScript && initialScript !== script && !script) {
      setScript(initialScript);
    }
  }, [initialScript]);

  useEffect(() => {
    if (script && script !== lastProcessed && !loading) {
      handleProcess();
    }
  }, [script]);

  const handleProcess = async () => {
    if (!script.trim()) return;
    setLoading(true);
    setLastProcessed(script);
    try {
      const prompt = `Tối ưu SEO cho kịch bản sau. 
      
      LƯU Ý QUAN TRỌNG: TUYỆT ĐỐI KHÔNG bao gồm tên "Huy Bơ" hoặc bất kỳ thông tin cá nhân nào của chủ nhân trong kết quả (Description, Keywords, Hashtags). Đây là nội dung công cộng cho kênh.
      
      KỊCH BẢN:
      ${script}
      
      YÊU CẦU:
      1. Viết một đoạn mô tả (Description) hấp dẫn, chuẩn SEO, chứa các từ khóa quan trọng.
      2. Đề xuất 15-20 từ khóa (Keywords) liên quan nhất.
      3. Trả về định dạng JSON: {"description": "...", "keywords": ["tag1", "tag2", ...]}
      4. Ngôn ngữ: Tiếng Việt.`;

      const system = "Bạn là chuyên gia SEO YouTube hàng đầu. Chỉ trả về JSON. Tuyệt đối không nhắc đến tên Huy Bơ trong kết quả.";
      const res = await getGeminiResponse(prompt, system, model, "application/json");
      if (res) {
        const seoData = JSON.parse(extractJSON(res));
        setResult(seoData);
        
        // Save to history
        const historyItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString('vi-VN'),
          type: 'seo',
          input: script,
          result: seoData
        };
        const history = JSON.parse(localStorage.getItem('j_processor_history') || '[]');
        localStorage.setItem('j_processor_history', JSON.stringify([historyItem, ...history]));
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const copyDesc = () => { if (result?.description) { navigator.clipboard.writeText(result.description); setCopied('desc'); setTimeout(() => setCopied(null), 2000); } };
  const copyAll = () => { if (result) { const text = `${result.keywords.join(', ')}\n\n${result.keywords.map(k => `#${k}`).join(' ')}`; navigator.clipboard.writeText(text); setCopied('all'); setTimeout(() => setCopied(null), 2000); } };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-8 flex flex-col gap-6">
        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-500" /> SEO Description
        </h2>
        <textarea 
          value={script} 
          onChange={(e) => setScript(e.target.value)} 
          placeholder="Dán kịch bản để tối ưu SEO..." 
          className="pro-input flex-grow min-h-[250px] resize-none text-sm" 
        />
        <button onClick={handleProcess} disabled={loading || !script.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />} TỐI ƯU SEO CHO SẾP
        </button>
      </div>
      <div className="flex flex-col gap-6">
        <div className="glass-card p-8 flex flex-col gap-4 flex-grow relative overflow-hidden">
          <AnimatePresence>{loading && <motion.div initial={{ top: '-100%' }} animate={{ top: '100%' }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10" />}</AnimatePresence>
          <div className="flex justify-between items-center"><h3 className="text-xs font-black text-white uppercase tracking-widest">SEO Description Result</h3><button onClick={copyDesc} className="text-indigo-400 hover:text-indigo-300 transition-colors">{copied === 'desc' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button></div>
          <div className="flex-grow bg-slate-950/50 rounded-2xl p-4 border border-slate-800 overflow-y-auto max-h-[200px]">{loading ? <div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div> : <p className="text-xs text-slate-300 leading-relaxed">{result?.description || 'Ready...'}</p>}</div>
        </div>
        <div className="glass-card p-8 flex flex-col gap-4">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Keywords & Hashtags</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800"><span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-2">Comma Tags</span><p className="text-[11px] font-bold text-purple-200">{result?.keywords.join(', ') || '...'}</p></div>
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800"><span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2">Hashtags</span><p className="text-[11px] font-bold text-blue-200">{result?.keywords.map(k => `#${k}`).join(' ') || '...'}</p></div>
          </div>
          <button onClick={copyAll} disabled={!result} className="btn-secondary w-full flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest">{copied === 'all' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} COPY ALL SEO KEYWORDS</button>
        </div>
      </div>
    </div>
  );
};

const PromptAnalysisProcessor = ({ 
  model, 
  initialScript,
  script,
  setScript,
  results,
  setResults,
  loading,
  setLoading
}: { 
  model: string, 
  initialScript: string,
  script: string,
  setScript: (s: string) => void,
  results: VideoPrompt[],
  setResults: (r: VideoPrompt[]) => void,
  loading: boolean,
  setLoading: (b: boolean) => void
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  useEffect(() => { 
    if (initialScript && !script) setScript(initialScript); 
  }, [initialScript]);

  const handleProcess = async () => {
    if (!script.trim()) return;
    setLoading(true);
    try {
      // Split by period and add it back to each segment to respect "every sentence ending with a period is a scene"
      const segments = script.split('.')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => s + '.');

      if (segments.length === 0) {
        setLoading(false);
        return;
      }

      const prompt = `Sếp Huy Bơ yêu cầu phân tích kịch bản này thành ${segments.length} cảnh (mỗi câu kết thúc bằng dấu chấm là một cảnh).
      
      Nhiệm vụ của bạn: Tạo prompt video Veo3 cực kỳ chi tiết cho TỪNG cảnh sau đây.
      
      DANH SÁCH CÁC CẢNH CỦA SẾP:
      ${segments.map((s, i) => `${i + 1}. ${s}`).join('\n')}
      
      YÊU CẦU KỸ THUẬT:
      1. Trả về một mảng JSON chứa đúng ${segments.length} đối tượng.
      2. Mỗi đối tượng có cấu trúc: {"segment": "nội dung câu gốc", "prompt": "mô tả video Veo3 chi tiết"}.
      3. Prompt Veo3 phải bao gồm: Bối cảnh, nhân vật, hành động, góc máy (Cinematic, Wide shot, Close-up...), ánh sáng (Golden hour, Moody...), và chất lượng (8k, highly detailed).
      4. Toàn bộ ngôn ngữ sử dụng là Tiếng Việt.
      
      CHỈ TRẢ VỀ MẢNG JSON.`;

      const system = "Bạn là trợ lý đắc lực của sếp Huy Bơ, chuyên gia hàng đầu về Prompt Video AI cho Veo3. Bạn có khả năng biến những câu văn đơn giản thành những kịch bản hình ảnh đỉnh cao. Luôn tuân thủ định dạng JSON và số lượng cảnh yêu cầu.";
      
      const res = await getGeminiResponse(prompt, system, model, "application/json");
      if (res) {
        const promptData = JSON.parse(extractJSON(res));
        setResults(promptData);
        
        // Save to history
        const historyItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString('vi-VN'),
          type: 'prompt-analysis',
          input: script,
          result: promptData
        };
        const history = JSON.parse(localStorage.getItem('j_processor_history') || '[]');
        localStorage.setItem('j_processor_history', JSON.stringify([historyItem, ...history]));
      }
    } catch (error) { 
      console.error(error); 
      alert("Dạ sếp ơi, có chút lỗi khi phân tích cảnh, sếp thử lại giúp em nhé!");
    } finally { 
      setLoading(false); 
    }
  };

  const copyPrompt = (text: string, index: number) => { navigator.clipboard.writeText(text); setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-8 flex flex-col gap-6">
        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Kịch bản phân tích</h2>
        <textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder="Dán kịch bản vào đây để phân tích từng cảnh..." className="pro-input flex-grow min-h-[300px] resize-none text-sm leading-relaxed" />
        <button onClick={handleProcess} disabled={loading || !script.trim()} className="btn-primary w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />} PHÂN TÍCH PROMPT VEO3</button>
      </div>
      <div className="glass-card p-8 flex flex-col gap-6 relative overflow-hidden">
        <AnimatePresence>{loading && <motion.div initial={{ top: '-100%' }} animate={{ top: '100%' }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent shadow-[0_0_15px_rgba(234,179,8,0.5)] z-10" />}</AnimatePresence>
        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> Danh sách Prompt Cảnh</h2>
        <div className="flex-grow bg-slate-950/50 rounded-3xl border border-slate-800/50 p-4 overflow-y-auto space-y-4">
          {loading ? <div className="h-full flex flex-col items-center justify-center gap-4"><Loader2 className="w-10 h-10 text-yellow-500 animate-spin" /><p className="text-xs font-bold text-yellow-500 uppercase tracking-widest animate-pulse">Analyzing Scenes...</p></div> : results.length > 0 ? results.map((item, idx) => (
            <div key={idx} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3 group">
              <div className="flex justify-between items-start"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cảnh {idx + 1}</span><button onClick={() => copyPrompt(item.prompt, idx)} className="text-slate-500 hover:text-yellow-500 transition-colors">{copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}</button></div>
              <p className="text-[11px] text-slate-400 italic">"{item.segment}"</p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50"><p className="text-xs text-yellow-100/90 font-medium leading-relaxed">{item.prompt}</p></div>
            </div>
          )) : <div className="h-full flex items-center justify-center"><p className="text-slate-600 font-bold uppercase tracking-widest">Ready...</p></div>}
        </div>
      </div>
    </div>
  );
};

const HistoryProcessor = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('j_processor_history') || '[]');
    setHistory(savedHistory);
  }, []);

  const deleteItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('j_processor_history', JSON.stringify(updatedHistory));
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const clearHistory = () => {
    if (window.confirm('Sếp có chắc chắn muốn xóa toàn bộ lịch sử không ạ?')) {
      setHistory([]);
      localStorage.removeItem('j_processor_history');
      setSelectedItem(null);
    }
  };

  const downloadItem = (item: HistoryItem) => {
    let content = `LOẠI: ${item.type.toUpperCase()}\nTHỜI GIAN: ${item.timestamp}\n\nINPUT:\n${item.input}\n\nKẾT QUẢ:\n`;
    
    if (item.type === 'seo') {
      content += `Description: ${item.result.description}\nKeywords: ${item.result.keywords.join(', ')}`;
    } else if (item.type === 'prompt-analysis') {
      content += item.result.map((r: any, i: number) => `Cảnh ${i+1}:\nSegment: ${r.segment}\nPrompt: ${r.prompt}`).join('\n\n');
    } else {
      content += item.result;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `j-processor-${item.type}-${item.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      <div className="lg:col-span-1 glass-card p-6 flex flex-col gap-4 overflow-hidden">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> Lịch sử của sếp
          </h2>
          {history.length > 0 && (
            <button onClick={clearHistory} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest">Xóa hết</button>
          )}
        </div>
        
        <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {history.length > 0 ? history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedItem?.id === item.id 
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                  item.type === 'script' ? 'bg-orange-500/20 text-orange-400' :
                  item.type === 'title' ? 'bg-blue-500/20 text-blue-400' :
                  item.type === 'seo' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {item.type}
                </span>
                <span className="text-[9px] text-slate-500 font-medium">{item.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-2 font-medium">
                {item.input.substring(0, 100)}...
              </p>
            </div>
          )) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="bg-slate-900 p-4 rounded-full mb-4">
                <FileIcon className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Chưa có lịch sử xử lý</p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 glass-card p-8 flex flex-col gap-6 overflow-hidden">
        {selectedItem ? (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  Chi tiết kết quả
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  Loại: {selectedItem.type} | {selectedItem.timestamp}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => downloadItem(selectedItem)} className="btn-secondary py-2 px-4 text-[10px] flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5" /> TẢI VỀ
                </button>
                <button onClick={() => deleteItem(selectedItem.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-xl transition-colors">
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              <section>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Nội dung gốc</h4>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 leading-relaxed italic">"{selectedItem.input}"</p>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3">Kết quả xử lý</h4>
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                  {selectedItem.type === 'seo' ? (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-2">Description</span>
                        <p className="text-xs text-slate-300 leading-relaxed">{selectedItem.result.description}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2">Keywords</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.result.keywords.map((k: string, i: number) => (
                            <span key={i} className="bg-slate-900 px-2 py-1 rounded-lg text-[10px] text-slate-300 border border-slate-800">#{k}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : selectedItem.type === 'prompt-analysis' ? (
                    <div className="space-y-4">
                      {selectedItem.result.map((r: any, i: number) => (
                        <div key={i} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                          <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-2">Cảnh {i+1}</span>
                          <p className="text-[11px] text-slate-400 italic mb-2">"{r.segment}"</p>
                          <p className="text-xs text-white font-medium">{r.prompt}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">
                      {selectedItem.result}
                    </pre>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="bg-slate-900/50 p-8 rounded-full mb-6 border border-slate-800">
              <Zap className="w-12 h-12 text-slate-800" />
            </div>
            <h3 className="text-xl font-black text-slate-700 uppercase tracking-widest mb-2">Chưa chọn mục nào</h3>
            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Chọn một mục từ danh sách bên trái để xem chi tiết</p>
          </div>
        )}
      </div>
    </div>
  );
};

const KeyManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    const savedKeys = JSON.parse(localStorage.getItem('j_processor_user_keys') || '[]');
    setKeys(savedKeys);
    setUIKeys(savedKeys);
  }, []);

  const saveKeys = (updatedKeys: string[]) => {
    setKeys(updatedKeys);
    localStorage.setItem('j_processor_user_keys', JSON.stringify(updatedKeys));
    setUIKeys(updatedKeys);
  };

  const addKey = () => {
    if (newKey.trim() && !keys.includes(newKey.trim())) {
      const updated = [...keys, newKey.trim()];
      saveKeys(updated);
      setNewKey('');
    }
  };

  const removeKey = (index: number) => {
    const updated = keys.filter((_, i) => i !== index);
    saveKeys(updated);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-2xl hover:bg-slate-800 transition-all group"
      >
        <Key className={`w-5 h-5 ${isOpen ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 left-0 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Quản lý API Key</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Dán API Key mới..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-indigo-500 transition-all"
                />
                <button onClick={addKey} className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-xl transition-all">
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto flex flex-col gap-2 pr-1">
                {keys.length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-4 italic">Chưa có Key bổ sung. Hệ thống đang dùng Key mặc định.</p>
                ) : (
                  keys.map((k, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950/50 border border-slate-800/50 p-2 rounded-xl group">
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                        {k.substring(0, 8)}••••••••{k.substring(k.length - 4)}
                      </span>
                      <button onClick={() => removeKey(i)} className="text-slate-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-[9px] text-indigo-300 leading-relaxed">
                  <Zap className="w-3 h-3 inline mr-1 mb-0.5" />
                  Hệ thống sẽ tự động xoay vòng giữa các Key này khi một Key bị hết hạn ngạch.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('title');
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [generatedScript, setGeneratedScript] = useState('');
  
  // Script state lifted to App to prevent loss on tab switch
  const [scriptInput, setScriptInput] = useState('');
  const [scriptResult, setScriptResult] = useState('');
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptProgress, setScriptProgress] = useState('');

  // Prompt Analysis state lifted to App
  const [paInput, setPaInput] = useState('');
  const [paResults, setPaResults] = useState<VideoPrompt[]>([]);
  const [paLoading, setPaLoading] = useState(false);

  // SEO state lifted to App
  const [seoInput, setSeoInput] = useState('');
  const [seoResult, setSeoResult] = useState<SEOData | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoLastProcessed, setSeoLastProcessed] = useState('');

  // Thumbnail state lifted to App
  const [thumbScript, setThumbScript] = useState('');
  const [charList, setCharList] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState('');
  const [thumbLoadingChars, setThumbLoadingChars] = useState(false);
  const [thumbLoadingGen, setThumbLoadingGen] = useState(false);
  const [thumbLastExtracted, setThumbLastExtracted] = useState('');

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} model={model} setModel={setModel} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
            {activeTab === 'title' && <TitleProcessor model={model} />}
            {activeTab === 'script' && (
              <ScriptProcessor 
                model={model} 
                onScriptGenerated={(s) => setGeneratedScript(s)}
                input={scriptInput}
                setInput={setScriptInput}
                result={scriptResult}
                setResult={setScriptResult}
                loading={scriptLoading}
                setLoading={setScriptLoading}
                progress={scriptProgress}
                setProgress={setScriptProgress}
              />
            )}
            {activeTab === 'prompt-analysis' && (
              <PromptAnalysisProcessor 
                model={model} 
                initialScript={generatedScript}
                script={paInput}
                setScript={setPaInput}
                results={paResults}
                setResults={setPaResults}
                loading={paLoading}
                setLoading={setPaLoading}
              />
            )}
            {activeTab === 'char-thumb' && (
              <CharacterThumbnailProcessor 
                model={model} 
                initialScript={generatedScript}
                script={thumbScript}
                setScript={setThumbScript}
                charList={charList}
                setCharList={setCharList}
                ytUrl={ytUrl}
                setYtUrl={setYtUrl}
                imgPreview={imgPreview}
                setImgPreview={setImgPreview}
                generatedImg={generatedImg}
                setGeneratedImg={setGeneratedImg}
                ocrResult={ocrResult}
                setOcrResult={setOcrResult}
                loadingChars={thumbLoadingChars}
                setLoadingChars={setThumbLoadingChars}
                loadingGen={thumbLoadingGen}
                setLoadingGen={setThumbLoadingGen}
                lastExtracted={thumbLastExtracted}
                setLastExtracted={setThumbLastExtracted}
              />
            )}
            {activeTab === 'seo' && (
              <SEOProcessor 
                model={model} 
                initialScript={generatedScript}
                script={seoInput}
                setScript={setSeoInput}
                result={seoResult}
                setResult={setSeoResult}
                loading={seoLoading}
                setLoading={setSeoLoading}
                lastProcessed={seoLastProcessed}
                setLastProcessed={setSeoLastProcessed}
              />
            )}
            {activeTab === 'history' && <HistoryProcessor />}
          </motion.div>
        </AnimatePresence>
      </main>

      <KeyManager />

      <footer className="border-t border-slate-800 py-6 bg-slate-950/50">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">System Operational</span></div>
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">J-Processor Multi-AI V2.0 | Build 2026.04 | Powered by Gemini</p>
          <div className="flex items-center gap-4 text-slate-500"><ChevronRight className="w-4 h-4" /></div>
        </div>
      </footer>
    </div>
  );
}
