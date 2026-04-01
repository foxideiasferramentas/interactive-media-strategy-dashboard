import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

type FunnelStep = "top" | "middle" | "bottom";

interface FunnelSidebarProps {
  active: FunnelStep;
  onChange: (step: FunnelStep) => void;
  filledSteps?: FunnelStep[];
}

const steps: {
  id: FunnelStep;
  number: string;
  label: string;
  subtitle: string;
  color: string;
  activeText: string;
  activeBg: string;
  activeBorder: string;
  dotColor: string;
}[] = [
  {
    id: "top",
    number: "01",
    label: "Topo de Funil",
    subtitle: "Conscientização",
    color: "text-blue-600",
    activeText: "text-blue-700",
    activeBg: "bg-blue-600",
    activeBorder: "border-blue-600",
    dotColor: "bg-blue-400",
  },
  {
    id: "middle",
    number: "02",
    label: "Meio de Funil",
    subtitle: "Consideração",
    color: "text-violet-600",
    activeText: "text-violet-700",
    activeBg: "bg-violet-600",
    activeBorder: "border-violet-600",
    dotColor: "bg-violet-400",
  },
  {
    id: "bottom",
    number: "03",
    label: "Fundo de Funil",
    subtitle: "Conversão",
    color: "text-emerald-600",
    activeText: "text-emerald-700",
    activeBg: "bg-emerald-600",
    activeBorder: "border-emerald-600",
    dotColor: "bg-emerald-400",
  },
];

export function FunnelSidebar({ active, onChange, filledSteps }: FunnelSidebarProps) {
  const visibleSteps = filledSteps ? steps.filter((s) => filledSteps.includes(s.id)) : steps;
  const activeIndex = visibleSteps.findIndex((s) => s.id === active);

  return (
    <div className="w-full md:w-52 flex-shrink-0">
      <div className="bg-white rounded-xl border border-gray-100 p-4 md:sticky md:top-8">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-4 px-1 font-medium">Etapas do Funil</p>

        <div className="relative">
          {/* Vertical line removed */}

          <div className="space-y-1 relative z-10">
            {visibleSteps.map((step, i) => {
              const isActive = step.id === active;
              const isPast = i < activeIndex;

              return (
                <div key={step.id}>
                  <button
                    onClick={() => onChange(step.id)}
                    className={`
                      w-full flex items-start gap-3 p-2.5 rounded-lg transition-all text-left
                      ${isActive ? "bg-gray-50 border border-gray-100" : "hover:bg-gray-50 border border-transparent"}
                    `}
                  >
                    {/* Step indicator */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`
                        w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300
                        ${isPast || isActive ? step.activeBg : "bg-gray-100 border-2 border-gray-200"}
                        ${isActive ? "shadow-md scale-105" : ""}
                      `}>
                        <CheckCircle2 className={`w-4 h-4 ${isPast || isActive ? "text-white" : "text-gray-300"}`} />
                      </div>
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p
                        className={`text-base leading-tight ${isActive ? step.activeText : isPast ? "text-gray-500" : "text-gray-400"}`}
                        style={{ fontWeight: isActive ? 600 : 400 }}
                      >
                        {step.label}
                      </p>
                      <p className={`text-sm mt-0.5 leading-tight ${isActive ? step.color : "text-gray-300"}`}>
                        {step.subtitle}
                      </p>
                    </div>
                  </button>

                  {/* Connector dots between steps */}
                  {i < visibleSteps.length - 1 && (
                    <div className="flex justify-start pl-[26px] py-1">
                      <div className="space-y-0.5">
                        {[0, 1, 2].map((dot) => (
                          <motion.div
                            key={dot}
                            animate={{ 
                              opacity: [0.3, 0.8, 0.3],
                              scale: [1, 1.2, 1]
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity, 
                              delay: dot * 0.3,
                              ease: "easeInOut"
                            }}
                            className={`w-1 h-1 rounded-full ${isPast || isActive ? step.dotColor : "bg-gray-200"}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Funnel shape visual */}
        <div className="mt-4 pt-4 border-t border-gray-50">
          <div className="flex flex-col items-center gap-1">
            {visibleSteps.map((step, i) => {
              const widths = ["100%", "75%", "50%"];
              const colors = ["bg-blue-500", "bg-violet-500", "bg-emerald-500"];
              const allIndex = steps.findIndex((s) => s.id === step.id);
              return (
                <div
                  key={step.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${step.id === active ? colors[allIndex] : "bg-gray-100"}`}
                  style={{ width: widths[i] ?? "50%" }}
                />
              );
            })}
          </div>
          <p className="text-xs text-gray-300 text-center mt-2 uppercase tracking-widest font-medium">
            {visibleSteps[activeIndex]?.subtitle ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
}
