import { ArrowLeft, ArrowRight, CornerDownRight, Lightbulb, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ControllerGuide() {
  
  // Định nghĩa danh sách nút và chức năng
  const controls = [
    { 
      icon: <ArrowLeft className="w-4 h-4" />, 
      keyName: "Left", 
      desc: "Di chuyển Trái / Giảm",
      color: "text-sky-400"
    },
    { 
      icon: <ArrowRight className="w-4 h-4" />, 
      keyName: "Right", 
      desc: "Di chuyển Phải / Tăng",
      color: "text-sky-400"
    },
    { 
      icon: <CornerDownRight className="w-4 h-4" />, 
      keyName: "Enter", 
      desc: "Chọn / Đặt quân / Vẽ",
      color: "text-emerald-400"
    },
    { 
      icon: <Lightbulb className="w-4 h-4" />, 
      keyName: "H", 
      desc: "Gợi ý / Đổi màu",
      color: "text-yellow-400"
    },
    { 
      icon: <Undo2 className="w-4 h-4" />, 
      keyName: "Back", 
      desc: "Quay lại / Menu",
      color: "text-red-400"
    },
  ];

  return (
    <Card className="bg-slate-900 border-slate-800 p-5 shadow-lg">
      <div className="space-y-3">
        {controls.map((ctrl, index) => (
          <div key={index} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
               <div className={`
                 w-8 h-8 rounded-md bg-slate-800 border-b-2 border-slate-950 
                 flex items-center justify-center shadow-sm group-hover:translate-y-[1px] group-hover:border-b-0 transition-all
                 ${ctrl.color}
               `}>
                 {ctrl.icon}
               </div>
               <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                 [{ctrl.keyName}]
               </span>
            </div>
            <span className="text-xs text-slate-500 font-medium text-right">
              {ctrl.desc}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}