import { useEffect, useState, type RefObject } from "react";

export function useResizeObserver(ref: RefObject<HTMLElement>) {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(()=>{
        const element = ref.current;
        if(!element) return;

        const observer = new ResizeObserver((entries)=>{
            const entry = entries[0];
            if(entry){
                setSize({
                    width: Math.floor(entry.contentRect.width),
                    height: Math.floor(entry.contentRect.height),
                })
            }
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);

    return size;
    }