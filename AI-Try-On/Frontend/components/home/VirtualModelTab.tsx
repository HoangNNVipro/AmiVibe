import React from 'react';
import { AppState, Gender, AgeGroup, AspectRatio } from '../../types';

interface VirtualModelTabProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  skinTones: string[];
  isRatioOpen: boolean;
  setIsRatioOpen: (open: boolean) => void;
  isOutputDropdownOpen: boolean;
  setIsOutputDropdownOpen: (open: boolean) => void;
  ratioDropdownRef: React.RefObject<HTMLDivElement>;
  dropdownRef: React.RefObject<HTMLDivElement>;
  handleGenerate: () => void;
}

export const VirtualModelTab: React.FC<VirtualModelTabProps> = ({
  state,
  setState,
  skinTones,
  isRatioOpen,
  setIsRatioOpen,
  isOutputDropdownOpen,
  setIsOutputDropdownOpen,
  ratioDropdownRef,
  dropdownRef,
  handleGenerate
}) => {
  return (
    <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto no-scrollbar space-y-8">
      {/* Gender Selection */}
      <div className="space-y-3">
        <label className="text-[13px] font-bold text-white/50 block">Gender:</label>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setState(s => ({...s, creatorSettings: {...s.creatorSettings, gender: Gender.MALE}}))}
            className={`h-12 rounded-xl flex items-center justify-center gap-3 border transition-all font-bold text-[14px] ${state.creatorSettings.gender === Gender.MALE ? 'bg-[#1a1a1a] border-white text-white' : 'bg-[#111] border-white/10 text-white/40 hover:text-white/60'}`}
          >
            <i className="fa-solid fa-mars text-blue-300"></i> Male
          </button>
          <button 
            onClick={() => setState(s => ({...s, creatorSettings: {...s.creatorSettings, gender: Gender.FEMALE}}))}
            className={`h-12 rounded-xl flex items-center justify-center gap-3 border transition-all font-bold text-[14px] ${state.creatorSettings.gender === Gender.FEMALE ? 'bg-[#1a1a1a] border-white text-white' : 'bg-[#111] border-white/10 text-white/40 hover:text-white/60'}`}
          >
            <i className="fa-solid fa-venus text-pink-300"></i> Female
          </button>
        </div>
      </div>

      {/* Age Selection */}
      <div className="space-y-3">
        <label className="text-[13px] font-bold text-white/50 block">Age:</label>
        <div className="grid grid-cols-3 gap-2">
          {[AgeGroup.CHILDREN, AgeGroup.YOUTH, AgeGroup.ELDERLY].map(age => (
            <button 
              key={age}
              onClick={() => setState(s => ({...s, creatorSettings: {...s.creatorSettings, age}}))}
              className={`h-11 rounded-xl flex items-center justify-center gap-2 border transition-all font-bold text-[13px] ${state.creatorSettings.age === age ? 'bg-[#1a1a1a] border-white text-white' : 'bg-[#111] border-white/10 text-white/40 hover:text-white/60'}`}
            >
              <i className={`fa-solid ${age === AgeGroup.CHILDREN ? 'fa-face-smile' : age === AgeGroup.YOUTH ? 'fa-user' : 'fa-user-tie'} text-sm`}></i>
              {age}
            </button>
          ))}
        </div>
      </div>

      {/* Skin Tone Selection */}
      <div className="space-y-3">
        <label className="text-[13px] font-bold text-white/50 block">Skin Tone:</label>
        <div className="grid grid-cols-4 gap-2">
          {skinTones.map(tone => (
            <button 
              key={tone}
              onClick={() => setState(s => ({...s, creatorSettings: {...s.creatorSettings, skinTone: tone}}))}
              className={`h-10 rounded-lg border flex items-center justify-center transition-all ${state.creatorSettings.skinTone === tone ? 'border-white' : 'border-white/10 opacity-70 hover:opacity-100'}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-5 rounded-[4px] border border-black/20 shadow-inner" style={{ backgroundColor: tone }}></div>
                {state.creatorSettings.skinTone === tone ? <i className="fa-solid fa-circle-check text-[12px]"></i> : <i className="fa-regular fa-circle text-[12px] opacity-40"></i>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Section */}
      <div className="space-y-3">
        <label className="text-[13px] font-bold text-white/50 block">Prompt <span className="font-normal opacity-50">(Optional)</span></label>
        <div className="relative">
          <textarea 
            value={state.creatorSettings.prompt}
            onChange={(e) => setState(s => ({...s, creatorSettings: {...s.creatorSettings, prompt: e.target.value}}))}
            placeholder="Please describe your creative ideas for the image."
            className="w-full h-40 bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 text-[13px] text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-white/30 transition-all no-scrollbar"
          />
        </div>
      </div>

      {/* Bottom Controls for Creator Tab */}
      <div className="pt-4 mt-auto space-y-4">
         <div className="flex gap-3">
            {/* Aspect Ratio Selector */}
            <div className="relative flex-1" ref={ratioDropdownRef}>
              <button 
                onClick={() => setIsRatioOpen(!isRatioOpen)}
                className="w-full h-11 flex items-center justify-between bg-[#111] border border-white/10 rounded-xl px-4 text-[14px] font-medium hover:bg-[#1a1a1a] transition-all"
              >
                <span className="opacity-80">{state.aspectRatio}</span>
                <i className={`fa-solid fa-chevron-${isRatioOpen ? 'up' : 'down'} text-[10px] opacity-40`}></i>
              </button>
              {isRatioOpen && (
                <div className="absolute bottom-full left-0 w-36 mb-2 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50 py-1">
                  {[AspectRatio.SQUARE, AspectRatio.PORTRAIT_3_4, AspectRatio.PORTRAIT_2_3, AspectRatio.STORY].map(ratio => (
                    <button 
                      key={ratio} 
                      onClick={() => { setState(p => ({ ...p, aspectRatio: ratio })); setIsRatioOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold text-left hover:bg-white/5 transition-colors ${state.aspectRatio === ratio ? 'text-[#4dff4d]' : 'text-white/50'}`}
                    >
                      <div className={`border-2 rounded-[2px] ${state.aspectRatio === ratio ? 'border-[#4dff4d]' : 'border-white/20'}`} style={{ width: ratio === '1:1' ? '12px' : '9px', height: '12px' }}></div>
                      {ratio}
                      {state.aspectRatio === ratio && <i className="fa-solid fa-check ml-auto text-[10px]"></i>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Output Count Selector */}
            <div className="relative flex-1" ref={dropdownRef}>
              <button 
                onClick={() => setIsOutputDropdownOpen(!isOutputDropdownOpen)} 
                className="w-full h-11 flex items-center justify-between bg-[#111] border border-white/10 rounded-xl px-4 text-[14px] font-medium hover:bg-[#1a1a1a] transition-all"
              >
                <span className="opacity-80">{state.outputCount} Outputs</span>
                <i className={`fa-solid fa-chevron-${isOutputDropdownOpen ? 'up' : 'down'} text-[10px] opacity-40`}></i>
              </button>
              {isOutputDropdownOpen && (
                <div className="absolute bottom-full left-0 w-40 mb-2 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50 py-1">
                  {[1, 2, 3, 4].map(num => (
                    <button key={num} onClick={() => { setState(p => ({ ...p, outputCount: num })); setIsOutputDropdownOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-bold text-left hover:bg-white/5 transition-colors ${state.outputCount === num ? 'text-[#4dff4d] bg-white/5' : 'text-white/50'}`}><span>{num} Output{num > 1 ? 's' : ''}</span>{state.outputCount === num && <i className="fa-solid fa-check text-[10px]"></i>}</button>
                  ))}
                </div>
              )}
            </div>
         </div>

         <button 
          onClick={handleGenerate} 
          className="w-full bg-[#4dff4d] hover:bg-[#3ce63c] text-black font-black h-12 rounded-xl flex items-center justify-center text-[15px] transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(77,255,77,0.3)] group"
         >
           <span className="font-black">Generate</span>
         </button>
      </div>
    </div>
  );
};
