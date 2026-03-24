
/**
 * DrawingCanvas v4 — robust Konva-based canvas
 *
 * Fixes in this version:
 *  ① sessionStorage persistence per questionId — re-opening the modal restores all elements
 *  ② Shapes use fill='rgba(0,0,0,0.001)' so the whole interior is clickable, not just the border
 *  ③ Lines/arrows have hitStrokeWidth={12} — much easier to click thin lines
 *  ④ Rotation stored in element state → rotated objects remain clickable forever
 *  ⑤ Hints bar — collapsible quick-reference for all tools
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Ellipse, Arrow, Text, Transformer, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import {
    Undo2, Redo2, Trash2, Pen, PenLine, Highlighter, Minus,
    Square, Circle, ArrowRight, Type, MousePointer, Eye, EyeOff,
    ChevronUp, ChevronDown, Layers, HelpCircle, X
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ActiveTool =
    | 'select' | 'pen' | 'marker' | 'pencil' | 'highlighter' | 'eraser'
    | 'rect' | 'ellipse' | 'line' | 'arrow' | 'text';

interface BaseEl { id:string; x:number; y:number; rotation:number; opacity:number; hidden:boolean; label:string; }
interface FreeEl  extends BaseEl { kind:'free';  points:number[]; stroke:string; strokeWidth:number; lineCap:'round'|'square'|'butt'; tension:number; }
interface RectEl  extends BaseEl { kind:'rect';  width:number; height:number; stroke:string; strokeWidth:number; }
interface EllEl   extends BaseEl { kind:'ell';   rx:number; ry:number; stroke:string; strokeWidth:number; }
interface LineEl  extends BaseEl { kind:'line';  points:number[]; stroke:string; strokeWidth:number; }
interface ArrEl   extends BaseEl { kind:'arr';   points:number[]; stroke:string; strokeWidth:number; }
interface TextEl  extends BaseEl { kind:'text';  text:string; fontSize:number; fill:string; width:number; fontFamily:string; }

type CanvasEl = FreeEl | RectEl | EllEl | LineEl | ArrEl | TextEl;

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = [
    '#000000','#1e293b','#374151','#64748b','#94a3b8','#ffffff',
    '#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6',
    '#8b5cf6','#ec4899','#0d9488','#84cc16','#f59e0b','#6366f1',
];
const SIZES = [{label:'Fine',v:1},{label:'Med',v:2},{label:'Thick',v:5},{label:'Bold',v:10}];
const uid = () => Math.random().toString(36).slice(2,10);

const makeBase = (overrides: Partial<BaseEl> = {}): BaseEl => ({
    id:uid(), x:0, y:0, rotation:0, opacity:1, hidden:false, label:'Element', ...overrides,
});

const TOOL_DEFS: {id:ActiveTool; label:string; icon:React.ReactNode; group:string; hint:string}[] = [
    {id:'select',      label:'Select',  icon:<MousePointer size={13}/>, group:'Select', hint:'Click to select • Drag to move • Handles to resize/rotate'},
    {id:'pen',         label:'Pen',     icon:<Pen size={13}/>,          group:'Pen',    hint:'Smooth freehand drawing'},
    {id:'marker',      label:'Marker',  icon:<PenLine size={13}/>,      group:'Pen',    hint:'Bold thick strokes'},
    {id:'pencil',      label:'Pencil',  icon:<Minus size={13}/>,        group:'Pen',    hint:'Textured sketchy lines'},
    {id:'highlighter', label:'Hi-lite', icon:<Highlighter size={13}/>,  group:'Pen',    hint:'Semi-transparent highlighting'},
    {id:'eraser',      label:'Eraser',  icon:<Trash2 size={11}/>,       group:'Pen',    hint:'Erase drawn strokes'},
    {id:'line',        label:'Line',    icon:<svg width="13" height="13" viewBox="0 0 13 13"><line x1="1" y1="12" x2="12" y2="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>, group:'Shape', hint:'Drag to draw a straight line'},
    {id:'arrow',       label:'Arrow',   icon:<ArrowRight size={13}/>,   group:'Shape', hint:'Drag to draw an arrow'},
    {id:'rect',        label:'Rect',    icon:<Square size={13}/>,       group:'Shape', hint:'Drag to draw a rectangle'},
    {id:'ellipse',     label:'Ellipse', icon:<Circle size={13}/>,       group:'Shape', hint:'Drag to draw a circle/ellipse'},
    {id:'text',        label:'Text',    icon:<Type size={13}/>,         group:'Shape', hint:'Click canvas to place a text box • Double-click to edit'},
];

// ─── Session storage helpers ───────────────────────────────────────────────────
const ssKey = (qId:string) => `canvas_els_${qId}`;
const loadEls = (qId:string|null): CanvasEl[] => {
    if(!qId) return [];
    try { const s=sessionStorage.getItem(ssKey(qId)); return s?JSON.parse(s):[];}
    catch { return []; }
};
const saveEls = (qId:string|null, els:CanvasEl[]) => {
    if(!qId) return;
    try { sessionStorage.setItem(ssKey(qId), JSON.stringify(els)); } catch {}
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface DrawingCanvasProps {
    onDrawEnd?: (blob:Blob) => void;
    onClear?: () => void;
    className?: string;
    style?: React.CSSProperties;
    initialData?: string;   // URL of previous raster drawing
    questionId?: string;    // used as sessionStorage key
}

// ─── Component ───────────────────────────────────────────────────────────────
export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    onDrawEnd, onClear, className='', style, initialData, questionId
}) => {
    const stageRef     = useRef<Konva.Stage>(null);
    const trRef        = useRef<Konva.Transformer>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({w:800, h:600});
    const [bgImage, setBgImage] = useState<HTMLImageElement|null>(null);

    // Elements — initialised from sessionStorage so re-entry works
    const [elements, setElements] = useState<CanvasEl[]>(() => loadEls(questionId??null));
    const [past,   setPast]   = useState<CanvasEl[][]>([loadEls(questionId??null)]);
    const [future, setFuture] = useState<CanvasEl[][]>([]);

    const [selectedId, setSelectedId] = useState<string|null>(null);
    const [activeTool, setActiveTool] = useState<ActiveTool>('pen');
    const [color,      setColor]      = useState('#000000');
    const [sizeIdx,    setSizeIdx]    = useState(1);
    const [showLayers, setShowLayers] = useState(false);
    const [showHints,  setShowHints]  = useState(false);

    const drawing  = useRef(false);
    const startPos = useRef({x:0, y:0});
    const dragId   = useRef<string|null>(null);

    const [textInput, setTextInput] = useState<{x:number;y:number;stX:number;stY:number;editId?:string}|null>(null);
    const [textVal,   setTextVal]   = useState('');
    const taRef = useRef<HTMLTextAreaElement>(null);

    // Container resize
    useEffect(()=>{
        const el=containerRef.current; if(!el) return;
        const ro=new ResizeObserver(entries=>{
            const {width,height}=entries[0].contentRect;
            if(width>0&&height>0) setSize({w:width,h:height});
        });
        ro.observe(el); return()=>ro.disconnect();
    },[]);

    // Load background image from URL
    useEffect(()=>{
        if(!initialData){ setBgImage(null); return; }
        // Skip if we already have local elements (session was restored)
        const img=new window.Image();
        img.crossOrigin='anonymous';
        img.onload=()=>setBgImage(img);
        img.onerror=()=>setBgImage(null);
        img.src=initialData;
    },[initialData]);

    // Sync transformer
    useEffect(()=>{
        if(!trRef.current||!stageRef.current) return;
        if(selectedId){
            const node=stageRef.current.findOne(`#${selectedId}`);
            if(node){ trRef.current.nodes([node]); trRef.current.getLayer()?.batchDraw(); return; }
        }
        trRef.current.nodes([]); trRef.current.getLayer()?.batchDraw();
    },[selectedId, elements]);

    // Persist elements to sessionStorage on every change
    useEffect(()=>{ saveEls(questionId??null, elements); },[elements, questionId]);

    // ── History ──
    const commit = useCallback((next:CanvasEl[])=>{
        setPast(p=>[...p,[...next]]); setFuture([]); setElements(next);
    },[]);

    const handleUndo=()=>{
        setPast(p=>{
            if(p.length<=1) return p;
            const prev=p[p.length-2];
            setFuture(f=>[elements,...f]); setElements([...prev]); setSelectedId(null);
            return p.slice(0,-1);
        });
    };
    const handleRedo=()=>{
        setFuture(f=>{
            if(!f.length) return f;
            const next=f[0];
            setPast(p=>[...p,[...elements]]); setElements([...next]); setSelectedId(null);
            return f.slice(1);
        });
    };

    // Notify export — synchronous atob conversion so blob is ALWAYS ready
    // before the modal can close (no async gap = no race-condition loss on quick exit)
    const notify=useCallback(()=>{
        const stage=stageRef.current;
        if(!stage||!onDrawEnd) return;
        const dataUrl=stage.toDataURL({pixelRatio:2});
        // Convert data URL → Blob synchronously (no async fetch gap)
        const [header, b64]=dataUrl.split(',');
        const mime=header.match(/:(.*?);/)![1];
        const binary=atob(b64);
        const len=binary.length;
        const u8=new Uint8Array(len);
        for(let i=0;i<len;i++) u8[i]=binary.charCodeAt(i);
        onDrawEnd(new Blob([u8],{type:mime}));
    },[onDrawEnd]);

    useEffect(()=>{ notify(); },[elements]);

    const ptr=useCallback(()=>{
        const s=stageRef.current; if(!s) return{x:0,y:0};
        const p=s.getPointerPosition(); return{x:p?.x??0,y:p?.y??0};
    },[]);

    const sw=SIZES[sizeIdx].v;

    // ── Mouse down ──
    const onMDown=useCallback((e:Konva.KonvaEventObject<MouseEvent>)=>{
        if(activeTool==='select'||activeTool==='text') return;
        const pos=ptr();
        drawing.current=true; startPos.current=pos;

        const id=uid(); dragId.current=id;
        const isPen=['pen','marker','pencil','highlighter','eraser'].includes(activeTool);

        if(isPen){
            const el:FreeEl={
                ...makeBase({id,label:`${activeTool} stroke`}),
                kind:'free', points:[pos.x,pos.y],
                stroke:   activeTool==='eraser'?'#ffffff':color,
                strokeWidth: activeTool==='eraser'?30: activeTool==='highlighter'?sw*8: activeTool==='marker'?sw*3:sw,
                opacity:  activeTool==='highlighter'?0.4:1,
                lineCap:  activeTool==='highlighter'?'square':'round',
                tension:  activeTool==='pencil'?0.5:0,
            };
            setElements(prev=>[...prev,el]);
        } else {
            if(activeTool==='rect'){
                const el:RectEl={...makeBase({id,label:'Rectangle'}), kind:'rect', width:1, height:1, stroke:color, strokeWidth:sw};
                setElements(prev=>[...prev,el]);
            } else if(activeTool==='ellipse'){
                const el:EllEl={...makeBase({id,label:'Ellipse'}), kind:'ell', rx:1, ry:1, stroke:color, strokeWidth:sw};
                setElements(prev=>[...prev,el]);
            } else if(activeTool==='line'){
                const el:LineEl={...makeBase({id,label:'Line'}), kind:'line', points:[pos.x,pos.y,pos.x,pos.y], stroke:color, strokeWidth:sw};
                setElements(prev=>[...prev,el]);
            } else if(activeTool==='arrow'){
                const el:ArrEl={...makeBase({id,label:'Arrow'}), kind:'arr', points:[pos.x,pos.y,pos.x,pos.y], stroke:color, strokeWidth:sw};
                setElements(prev=>[...prev,el]);
            }
        }
    },[activeTool,color,sw,ptr]);

    // ── Mouse move ──
    const onMMove=useCallback(()=>{
        if(!drawing.current||!dragId.current) return;
        const pos=ptr(); const sx=startPos.current.x, sy=startPos.current.y;
        setElements(prev=>prev.map(el=>{
            if(el.id!==dragId.current) return el;
            if(el.kind==='free') return{...el,points:[...(el as FreeEl).points,pos.x,pos.y]};
            if(el.kind==='rect') return{...el,x:Math.min(sx,pos.x),y:Math.min(sy,pos.y),width:Math.abs(pos.x-sx),height:Math.abs(pos.y-sy)};
            if(el.kind==='ell')  return{...el,x:(sx+pos.x)/2,y:(sy+pos.y)/2,rx:Math.abs(pos.x-sx)/2,ry:Math.abs(pos.y-sy)/2};
            if(el.kind==='line'||el.kind==='arr') return{...el,points:[sx,sy,pos.x,pos.y]};
            return el;
        }));
    },[ptr]);

    // ── Mouse up ──
    const onMUp=useCallback(()=>{
        if(!drawing.current) return;
        drawing.current=false; dragId.current=null;
        setElements(prev=>{ commit([...prev]); return prev; });
    },[commit]);

    // ── Stage click ──
    const onStageClick=useCallback((e:Konva.KonvaEventObject<MouseEvent>)=>{
        const target=e.target;
        const isBg=target===stageRef.current||target.name()==='bg';
        if(activeTool==='select'){
            if(isBg) setSelectedId(null); return;
        }
        if(activeTool==='text'&&isBg){
            const pos=ptr();
            const box=stageRef.current!.container().getBoundingClientRect();
            setTextInput({x:box.left+pos.x,y:box.top+pos.y,stX:pos.x,stY:pos.y});
            setTextVal(''); setTimeout(()=>taRef.current?.focus(),30);
        }
    },[activeTool,ptr]);

    // ── Text commit ──
    const commitText=(editId?:string)=>{
        if(!textVal.trim()||!textInput){setTextInput(null);return;}
        if(editId){
            setElements(prev=>{ const next=prev.map(el=>el.id===editId?{...el,text:textVal}:el); commit(next); return next; });
        } else {
            const el:TextEl={
                ...makeBase({label:'Text',x:textInput.stX,y:textInput.stY}),
                kind:'text',text:textVal,fontSize:14+sw*1.5,fill:color,width:220,fontFamily:'Inter,sans-serif',
            };
            setElements(prev=>{const next=[...prev,el]; commit(next); return next;});
        }
        setTextInput(null); setTextVal('');
    };

    // ── Drag / transform end ──
    const onEDragEnd=(id:string,e:Konva.KonvaEventObject<DragEvent>)=>{
        setElements(prev=>{
            const next=prev.map(el=>el.id===id?{...el,x:e.target.x(),y:e.target.y()}:el);
            commit(next); return next;
        });
    };
    const onTransformEnd=(id:string,e:Konva.KonvaEventObject<Event>)=>{
        const node=e.target;
        const sx=node.scaleX(), sy=node.scaleY(), rot=node.rotation();
        node.scaleX(1); node.scaleY(1);
        setElements(prev=>{
            const next=prev.map(el=>{
                if(el.id!==id) return el;
                const upd={...el,x:node.x(),y:node.y(),rotation:rot};
                if(el.kind==='rect') return{...upd,width:Math.max(4,el.width*sx),height:Math.max(4,el.height*sy)};
                if(el.kind==='ell')  return{...upd,rx:Math.max(4,el.rx*sx),ry:Math.max(4,el.ry*sy)};
                if(el.kind==='text') return{...upd,width:Math.max(20,el.width*sx),fontSize:Math.max(8,el.fontSize*sy)};
                return upd;
            });
            commit(next); return next;
        });
    };

    // ── Delete / clear / layer ops ──
    const deleteSelected=()=>{ if(!selectedId) return; const next=elements.filter(e=>e.id!==selectedId); commit(next); setSelectedId(null); };
    const clearAll=()=>{
        commit([]);
        setSelectedId(null);
        setBgImage(null); // also clear background so the canvas is truly empty
        if(questionId) { try { sessionStorage.removeItem(ssKey(questionId)); } catch {} }
        if(onClear) onClear();
    };
    const moveLayer=(id:string,dir:-1|1)=>{
        setElements(prev=>{
            const idx=prev.findIndex(e=>e.id===id); if(idx<0) return prev;
            const next=[...prev]; const t=idx+dir;
            if(t<0||t>=next.length) return prev;
            [next[idx],next[t]]=[next[t],next[idx]]; commit(next); return next;
        });
    };
    const toggleHide=(id:string)=>setElements(prev=>prev.map(el=>el.id===id?{...el,hidden:!el.hidden}:el));

    // ── Render element ──
    // Key fix: shapes use fill='rgba(0,0,0,0.001)' so entire interior is hit-testable.
    // Lines use hitStrokeWidth for easier clicking.
    const renderEl=(el:CanvasEl)=>{
        if(el.hidden) return null;
        const draggable=activeTool==='select';
        const common={
            id:el.id, key:el.id,
            x:el.x, y:el.y,
            rotation:el.rotation,   // always applied from state → survives re-entry
            opacity:el.opacity,
            draggable,
            onClick:(ev:any)=>{ ev.cancelBubble=true; if(activeTool==='select') setSelectedId(el.id); },
            onTap:(ev:any)=>{ ev.cancelBubble=true; if(activeTool==='select') setSelectedId(el.id); },
            onDragEnd:(ev:any)=>onEDragEnd(el.id,ev),
            onTransformEnd:(ev:any)=>onTransformEnd(el.id,ev),
        };

        switch(el.kind){
            case 'free':
                return <Line {...common} x={0} y={0} points={el.points} stroke={el.stroke}
                    strokeWidth={el.strokeWidth} lineCap={el.lineCap} lineJoin="round"
                    tension={el.tension} hitStrokeWidth={Math.max(12, el.strokeWidth+6)}/>;
            case 'rect':
                return <Rect {...common} width={el.width} height={el.height}
                    stroke={el.stroke} strokeWidth={el.strokeWidth}
                    fill="rgba(0,0,0,0.001)"/>;   // ← invisible fill = whole interior clickable
            case 'ell':
                return <Ellipse {...common} radiusX={el.rx} radiusY={el.ry}
                    stroke={el.stroke} strokeWidth={el.strokeWidth}
                    fill="rgba(0,0,0,0.001)"/>;
            case 'line':
                return <Line {...common} x={0} y={0} points={el.points}
                    stroke={el.stroke} strokeWidth={el.strokeWidth}
                    lineCap="round" hitStrokeWidth={12}/>;
            case 'arr':
                return <Arrow {...common} x={0} y={0} points={el.points}
                    stroke={el.stroke} strokeWidth={el.strokeWidth}
                    fill={el.stroke} hitStrokeWidth={12}/>;
            case 'text':
                return <Text {...common} text={el.text} fontSize={el.fontSize}
                    fill={el.fill} width={el.width} fontFamily={el.fontFamily} wrap="word"
                    onDblClick={()=>{
                        const box=stageRef.current!.container().getBoundingClientRect();
                        setTextInput({x:box.left+el.x,y:box.top+el.y,stX:el.x,stY:el.y,editId:el.id});
                        setTextVal(el.text); setTimeout(()=>taRef.current?.focus(),30);
                    }}/>;
        }
    };

    const btnCls=(id:ActiveTool)=>`flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg text-[9px] font-bold transition-all w-full ${activeTool===id?'bg-blue-600 text-white shadow-md':'text-gray-400 hover:bg-white/10 hover:text-white'}`;
    const activeDef=TOOL_DEFS.find(t=>t.id===activeTool);
    const lastGrp=useRef('');

    return (
        <div className={`flex h-full select-none ${className}`} style={style}>

            {/* ═══ LEFT TOOLBAR ═══ */}
            <div className="flex flex-col gap-1 p-1.5 bg-[#1e1e1e] border-r border-white/10 shrink-0 overflow-y-auto no-scrollbar w-[66px]">
                {TOOL_DEFS.map(t=>{
                    const showH=t.group!==lastGrp.current;
                    if(showH) lastGrp.current=t.group;
                    return (
                        <React.Fragment key={t.id}>
                            {showH&&<span className="text-[8px] text-gray-600 uppercase tracking-widest text-center font-bold mt-1">{t.group}</span>}
                            <button onClick={()=>setActiveTool(t.id)} title={t.label} className={btnCls(t.id)}>
                                {t.icon}<span className="leading-none">{t.label}</span>
                            </button>
                        </React.Fragment>
                    );
                })}

                <div className="w-full h-px bg-white/10 my-1"/>
                <span className="text-[8px] text-gray-600 uppercase tracking-widest text-center font-bold">Size</span>
                {SIZES.map((s,i)=>(
                    <button key={s.label} onClick={()=>setSizeIdx(i)} className={`flex items-center justify-center h-8 rounded-lg transition-all ${sizeIdx===i?'bg-white/15 ring-1 ring-white/30':'hover:bg-white/5'}`}>
                        <div className="rounded-full" style={{width:Math.max(2,Math.min(14,s.v*1.5)),height:Math.max(2,Math.min(14,s.v*1.5)),background:color}}/>
                    </button>
                ))}

                <div className="w-full h-px bg-white/10 my-1"/>
                <button onClick={handleUndo} disabled={past.length<=1} className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[9px] font-bold text-gray-400 hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                    <Undo2 size={14}/><span>Undo</span>
                </button>
                <button onClick={handleRedo} disabled={future.length===0} className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[9px] font-bold text-gray-400 hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                    <Redo2 size={14}/><span>Redo</span>
                </button>
                {selectedId&&<button onClick={deleteSelected} className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[9px] font-bold text-red-400 hover:bg-red-900/20 transition-all"><Trash2 size={14}/><span>Del</span></button>}
                {elements.length>0&&!selectedId&&<button onClick={clearAll} className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[9px] font-bold text-red-400 hover:bg-red-900/20 transition-all"><Trash2 size={14}/><span>Clear</span></button>}
            </div>

            {/* ═══ MAIN ═══ */}
            <div className="flex flex-col flex-1 min-w-0 min-h-0">

                {/* Color + toolbar bar */}
                <div className="flex items-center gap-1 px-2 py-1.5 bg-[#1a1a1a] border-b border-white/10 shrink-0 flex-wrap">
                    {COLORS.map(c=>(
                        <button key={c} onClick={()=>setColor(c)}
                            className={`rounded-full border-2 transition-all shrink-0 ${color===c?'scale-125 border-blue-400 ring-2 ring-blue-400/40':'border-transparent hover:scale-110 hover:border-white/30'}`}
                            style={{width:18,height:18,background:c,boxShadow:c==='#ffffff'?'inset 0 0 0 1px rgba(255,255,255,0.3)':undefined}}/>
                    ))}
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                        <button onClick={()=>setShowHints(v=>!v)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-all border ${showHints?'bg-amber-500/20 text-amber-300 border-amber-400/30':'text-gray-500 border-white/10 hover:border-white/20 hover:text-gray-300'}`}>
                            <HelpCircle size={11}/> Help
                        </button>
                        <button onClick={()=>setShowLayers(v=>!v)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-all border ${showLayers?'bg-blue-600 text-white border-blue-500':'text-gray-500 border-white/10 hover:border-white/20 hover:text-gray-300'}`}>
                            <Layers size={11}/> Layers
                        </button>
                    </div>
                </div>

                {/* Hints bar */}
                {showHints&&(
                    <div className="shrink-0 bg-amber-950/30 border-b border-amber-500/20 px-3 py-2 flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-0.5">
                            {TOOL_DEFS.map(t=>(
                                <div key={t.id} className={`flex items-center gap-1.5 text-[10px] py-0.5 ${activeTool===t.id?'text-amber-300 font-bold':'text-gray-500'}`}>
                                    <span className="shrink-0 opacity-70">{t.icon}</span>
                                    <span className="font-bold shrink-0">{t.label}:</span>
                                    <span className="truncate">{t.hint}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-1.5 text-[10px] py-0.5 text-gray-500 col-span-2">
                                <span className="font-bold text-amber-400/60">Tip:</span>
                                <span>Select tool → click shape → drag handles to resize, drag top circle to rotate. Double-click Text to edit.</span>
                            </div>
                        </div>
                        <button onClick={()=>setShowHints(false)} className="text-gray-600 hover:text-gray-400 transition-colors shrink-0"><X size={14}/></button>
                    </div>
                )}

                {/* Status hint below color bar */}
                <div className="shrink-0 px-3 py-1 bg-[#161616] border-b border-white/5 flex items-center gap-2">
                    <span className="text-[10px] text-gray-600 truncate">
                        <span className="text-blue-400 font-bold">{activeDef?.label}</span>
                        {' — '}{activeDef?.hint}
                    </span>
                    {selectedId&&<span className="text-[10px] text-blue-400 ml-auto font-bold shrink-0">1 selected</span>}
                </div>

                <div className="flex flex-1 min-h-0 overflow-hidden">

                    {/* Canvas */}
                    <div ref={containerRef} className="flex-1 min-h-0 min-w-0 relative overflow-hidden"
                        style={{cursor:activeTool==='select'?'default':activeTool==='text'?'text':'crosshair',background:'white'}}>

                        <Stage ref={stageRef} width={size.w} height={size.h} style={{background:'white'}}
                            onMouseDown={onMDown} onMouseMove={onMMove} onMouseUp={onMUp} onClick={onStageClick}>
                            <Layer>
                                <Rect name="bg" x={0} y={0} width={size.w} height={size.h} fill="white" listening={false}/>
                                {/* Background raster from previous save — read-only */}
                                {bgImage&&elements.length===0&&(
                                    <KonvaImage name="bg" image={bgImage} x={0} y={0} width={size.w} height={size.h} listening={false}/>
                                )}
                                {elements.map(renderEl)}
                                <Transformer ref={trRef} rotateEnabled
                                    enabledAnchors={['top-left','top-center','top-right','middle-left','middle-right','bottom-left','bottom-center','bottom-right']}
                                    boundBoxFunc={(o,n)=>n.width<5||n.height<5?o:n}
                                    borderStroke="#3b82f6" anchorFill="#fff"
                                    anchorStroke="#3b82f6" anchorSize={9} rotateAnchorOffset={28}/>
                            </Layer>
                        </Stage>

                        {/* Textarea for text tool */}
                        {textInput&&(
                            <textarea ref={taRef} value={textVal} rows={3}
                                onChange={e=>setTextVal(e.target.value)}
                                onKeyDown={e=>{
                                    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();commitText(textInput.editId);}
                                    if(e.key==='Escape'){setTextInput(null);setTextVal('');}
                                }}
                                onBlur={()=>commitText(textInput.editId)}
                                placeholder="Type here… Enter to commit, Shift+Enter for new line"
                                style={{
                                    position:'fixed',left:textInput.x,top:textInput.y,
                                    background:'rgba(255,255,255,0.97)',border:`2px dashed ${color==='#ffffff'?'#000':color}`,
                                    color:color==='#ffffff'?'#000':color,fontSize:`${14+sw*1.5}px`,fontFamily:'Inter,sans-serif',
                                    padding:'6px 10px',outline:'none',borderRadius:'6px',
                                    minWidth:'180px',maxWidth:'400px',zIndex:9999,resize:'both',lineHeight:'1.5',
                                    boxShadow:'0 4px 24px rgba(0,0,0,0.3)',
                                }}/>
                        )}
                    </div>

                    {/* Layers panel */}
                    {showLayers&&(
                        <div className="w-52 shrink-0 bg-[#161616] border-l border-white/10 flex flex-col overflow-hidden">
                            <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-white/10 flex justify-between">
                                <span>Layers</span><span className="text-gray-600">{elements.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {[...elements].reverse().map((el,ri)=>{
                                    const realIdx=elements.length-1-ri;
                                    const isSel=selectedId===el.id;
                                    return(
                                        <div key={el.id} onClick={()=>{setSelectedId(el.id);setActiveTool('select');}}
                                            className={`flex items-center gap-1.5 px-3 py-2 cursor-pointer border-b border-white/5 transition-colors ${isSel?'bg-blue-600/20':'hover:bg-white/5'}`}>
                                            <span className={`text-xs truncate flex-1 ${isSel?'text-blue-300 font-bold':'text-gray-300'}`}>{el.label}</span>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <button onClick={e=>{e.stopPropagation();toggleHide(el.id);}} className="p-0.5 text-gray-500 hover:text-white">
                                                    {el.hidden?<EyeOff size={11}/>:<Eye size={11}/>}
                                                </button>
                                                <button onClick={e=>{e.stopPropagation();moveLayer(el.id,1);}} disabled={realIdx===elements.length-1} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20"><ChevronUp size={11}/></button>
                                                <button onClick={e=>{e.stopPropagation();moveLayer(el.id,-1);}} disabled={realIdx===0} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20"><ChevronDown size={11}/></button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {elements.length===0&&<div className="px-3 py-8 text-xs text-gray-600 text-center">Nothing drawn yet</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};