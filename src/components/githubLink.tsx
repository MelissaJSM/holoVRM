import { buildUrl } from "@/utils/buildUrl";

export const GitHubLink = () => {
    return (
        <div className="absolute right-0 z-10 m-24">
            <a
                draggable={false}
                href="https://github.com/MelissaJSM/holoVRM.git"
                rel="noopener noreferrer"
                target="_blank"
                className="block"
            >
                <div
                    className="p-4 lg:p-6 rounded-full bg-[#1F2328] hover:bg-[#33383E] active:bg-[#565A60] flex items-center transition-all duration-300 ease-in-out"
                    style={{
                        borderRadius: '10px', // 추가적인 round 효과
                    }}
                >
                    <img
                        alt="GitHub"
                        height={42}
                        width={42}
                        src={buildUrl("/github-mark-white.svg")}
                        className="mr-4"
                    />
                    <div className="text-white font-M_PLUS_2 font-bold text-xl">깃허브 방문</div>
                </div>
            </a>
        </div>
    );
};
