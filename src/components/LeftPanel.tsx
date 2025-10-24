import { KabupatenCard } from "./KabupatesList";

export function LeftPanel() {
 
  
  return (
    <div className="w-[23%] h-screen  relative overflow-y-auto ">
        <div className="flex w-full items-center justify-center sticky top-0 bg-white">
          <img src="/logo/ltkl.png" alt="LTKL Platform" className="px-4 py-4" />
        </div>
        <KabupatenCard />
    </div>
  );
}

export default LeftPanel;
