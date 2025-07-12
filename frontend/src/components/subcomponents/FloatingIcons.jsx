import { SiValorant, SiCounterstrike, SiPokemon, SiRockstargames, SiNintendo3Ds } from "react-icons/si";
import { BsNintendoSwitch } from "react-icons/bs";
import { TbBrandFortnite } from "react-icons/tb";

// eslint-disable-next-line no-unused-vars
const FloatingIcon = ({ IconComponent, className, size, position, animationClass }) => {
    return (
        <div 
            className={`absolute ${size} ${className} ${animationClass}`} 
            style={{ 
                ...position, 
                zIndex: 1
            }}
        >
            <IconComponent className="w-full h-full" />
        </div>
    );
};

const FloatingIcons = () => {
    const icons = [
        { Icon: SiPokemon, size: 'w-16 h-16', position: { top: '10%', left: '10%' }, animation: 'animate-float-slow animate-spin-slow' },
        { Icon: SiValorant, size: 'w-20 h-20', position: { top: '20%', right: '15%' }, animation: 'animate-float-medium animate-spin-medium' },
        { Icon: TbBrandFortnite, size: 'w-14 h-14', position: { bottom: '15%', left: '20%' }, animation: 'animate-float-fast animate-spin-fast' },
        { Icon: SiCounterstrike, size: 'w-18 h-18', position: { top: '50%', left: '5%' }, animation: 'animate-float-slow animate-spin-medium' },
        { Icon: SiNintendo3Ds, size: 'w-16 h-16', position: { bottom: '10%', right: '10%' }, animation: 'animate-float-medium animate-spin-slow' },
        { Icon: BsNintendoSwitch, size: 'w-14 h-14', position: { top: '30%', left: '40%' }, animation: 'animate-float-fast animate-spin-fast' },
        { Icon: SiRockstargames, size: 'w-18 h-18', position: { bottom: '20%', right: '40%' }, animation: 'animate-float-slow animate-spin-medium' },
        { Icon: SiPokemon, size: 'w-16 h-16', position: { top: '5%', right: '30%' }, animation: 'animate-float-medium animate-spin-slow' }
    ];

    return (
        <>
            {icons.map((icon, index) => (
                <FloatingIcon
                    key={index}
                    IconComponent={icon.Icon}
                    className={`text-blue-600 opacity-30`}
                    size={icon.size}
                    position={icon.position}
                    animationClass={icon.animation}
                />
            ))}
        </>
    );
};

export default FloatingIcons;