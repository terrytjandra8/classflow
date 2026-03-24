
/**
 * DrawingCanvas (Konva-based)
 * – Pen / Marker / Pencil / Highlighter / Eraser  (freehand)
 * – Line / Arrow / Rect / Ellipse              (shape draw)
 * – Text                                       (click-to-place, dbl-click to edit)
 * – Select tool                                (click = select, drag = move, handles = resize)
 * – Layers panel                               (reorder / hide / delete per element)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Ellipse, Arrow, Text, Transformer, Circle as KonvaCircle } from 'react-konva';
import type Konva from 'konva';
import {
    Undo2, Redo2, Trash2, Pen, PenLine, Highlighter, Brush, Minus,
    Square, Circle, ArrowRight, Type, MousePointer, Eye, EyeOff, ChevronUp, ChevronDown, Layers
} from 'lucide-react';

// ────────────────────────── Types ──────────────────────────
export type ActiveTool = 'select' | 'pen' | 'marker' | 'pencil' | 'highlighter' | 'eraser'
    | 'rect' | 'ellipse' | 'line' | 'arrow' | 'text';

interface BaseEl { id: string; x: number; y: number; opacity: number; hidden: boolean; label: string; }
interface FreeEl  extends BaseEl { kind: 'free';    points: number[]; stroke: string; strokeWidth: number; lineCap: 'round'|'square'|'butt'; tension: number; }
interface RectEl  extends BaseEl { kind: 'rect';    width: number; height: number; stroke: string; strokeWidth: number; fill: string; }
interface EllEl   extends BaseEl { kind: 'ell';     rx: number; ry: number; stroke: string; strokeWidth: number; fill: string; }
interface LineEl  extends BaseEl { kind: 'line';    points: number[]; stroke: string; strokeWidth: number; }
interface ArrEl   extends BaseEl { kind: 'arr';     points: number[]; stroke: string; strokeWidth: number; }
interface TextEl  extends BaseEl { kind: 'text';    text: string; fontSize: number; fill: string; width: number; fontFamily: string; }

type CanvasEl = FreeEl | RectEl | EllEl | LineEl | ArrEl | TextEl;

// ────────────────────────── Constants ──────────────────────────
const COLORS = [
    '#000000','#1e293b','#374151','#64748b','#94a3b8','#ffffff',
    '#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6',
    '#8b5cf6','#ec4899','#0d9488','#84cc16','#f59e0b','#6366f1',
];
const SIZES = [{label:'Fine',v:1},{label:'Med',v:2},{label:'Thick',v:5},{label:'Bold',v:10}];
const uid = () => Math.random().toString(36).slice(2,10);

const TOOL_DEFS: {id: ActiveTool; label: string; icon: React.ReactNode; group: string}[] = [
    {id:'select',  label:'Select',  icon:<MousePointer size={15}/>, group:'Select'},
    {id:'pen',     label:'Pen',     icon:<Pen size={15}/>,          group:'Pen'},
    {id:'marker',  label:'Marker',  icon:<PenLine size={15}/>,      group:'Pen'},
    {id:'pencil',  label:'Pencil',  icon:<Minus size={15}/>,        group:'Pen'},
    {id:'highlighter',label:'Hi-lite',icon:<Highlighter size={15}/>,group:'Pen'},
    {id:'eraser',  label:'Eraser',  icon:<Trash2 size={13}/>,       group:'Pen'},
    {id:'line',    label:'Line',    icon:<svg width="15" height="15" viewBox="0 0 15 15"><line x1="2" y1="13" x2="13" y2="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>, group:'Shape'},
    {id:'arrow',   label:'Arrow',   icon:<ArrowRight size={15}/>,   group:'Shape'},
    {id:'rect',    label:'Rect',    icon:<Square size={15}/>,       group:'Shape'},
    {id:'ellipse', label:'Ellipse', icon:<Circle size={15}/>,       group:'Shape'},
    {id:'text',    label:'Text',    icon:<Type size={15}/>,         group:'Shape'},
];

interface DrawingCanvasProps {
    onDrawEnd?: (blob: Blob) => void;
    onClear?: () => void;
    className?: string;
    style?: React.CSSProperties;
    initialData?: string;
}

// ────────────────────────── Component ──────────────────────────
export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onDrawEnd, onClear, className='', style, initialData }) => {
    const stageRef = useRef<Konva.Stage>(null);
    const trRef    = useRef<Konva.Transformer>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({w:800, h:600});

    // ── State ──
    const [elements, setElements] = useState<CanvasEl[]>([]);
    const [past,  setPast]  = useState<CanvasEl[][]>([[]]); // undo stack
    const [future, setFuture] = useState<CanvasEl[][]>([]);
    const [selectedId, setSelectedId] = useState<string|null>(null);
    const [activeTool, setActiveTool] = useState<ActiveTool>('pen');
    const [color, setColor]   = useState('#000000');
    const [sizeIdx, setSizeIdx] = useState(1);
    const [showLayers, setShowLayers] = useState(false);

    // Drawing refs (avoid re-render during draw)
    const drawing   = useRef(false);
    const startPos  = useRef({x:0,y:0});
    const dragId    = useRef<string|null>(null);

    // Text editing
    const [textInput, setTextInput] = useState<{x:number;y:number;stX:number;stY:number;editId?:string}|null>(null);
    const [textVal, setTextVal] = useState('');
    const taRef = useRef<HTMLTextAreaElement>(null);

    // ── Container resize ──
    useEffect(()=>{
        const el = containerRef.current; if(!el) return;
        const ro = new ResizeObserver(entries=>{
            const {width,height}=entries[0].contentRect;
            if(width>0&&height>0) setSize({w:width,h:height});
        });
        ro.observe(el); return ()=>ro.disconnect();
    },[]);

    // ── Transformer sync ──
    useEffect(()=>{
        if(!trRef.current||!stageRef.current) return;
        if(selectedId){
            const node = stageRef.current.findOne(`#${selectedId}`);
            if(node){ trRef.current.nodes([node]); trRef.current.getLayer()?.batchDraw(); }
            else { trRef.current.nodes([]); }
        } else { trRef.current.nodes([]); trRef.current.getLayer()?.batchDraw(); }
    },[selectedId, elements]);

    // ── History helpers ──
    const commit = useCallback((next: CanvasEl[]) => {
        setPast(p=>[...p, [...next]]);
        setFuture([]);
        setElements(next);
    },[]);

    const handleUndo = () => {
        setPast(p=>{
            if(p.length<=1) return p;
            const prev = p[p.length-2];
            setFuture(f=>[elements, ...f]);
            setElements([...prev]);
            setSelectedId(null);
            return p.slice(0,-1);
        });
    };
    const handleRedo = () => {
        setFuture(f=>{
            if(!f.length) return f;
            const next = f[0];
            setPast(p=>[...p, [...elements]]);
            setElements([...next]);
            setSelectedId(null);
            return f.slice(1);
        });
    };

    // ── Notify draw ──
    const notify = useCallback(()=>{
        const stage = stageRef.current;
        if(stage && onDrawEnd){
            const uri = stage.toDataURL({pixelRatio:2});
            fetch(uri).then(r=>r.blob()).then(b=>onDrawEnd(b));
        }
    },[onDrawEnd]);

    useEffect(()=>{ notify(); },[elements]);

    // ── Get stage-relative pointer position ──
    const ptr = useCallback(()=>{
        const s = stageRef.current;
        if(!s) return {x:0,y:0};
        const p = s.getPointerPosition();
        return {x:p?.x??0, y:p?.y??0};
    },[]);

    const sw = SIZES[sizeIdx].v;

    // ── Mouse events ──
    const onMDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>)=>{
        if(activeTool==='select'||activeTool==='text') return;
        const pos = ptr();
        drawing.current = true;
        startPos.current = pos;

        const base = {id:uid(), x:0, y:0, opacity:1, hidden:false};

        if(['pen','marker','pencil','highlighter','eraser'].includes(activeTool)){
            const id=uid();
            dragId.current=id;
            const el: FreeEl = {
                ...base, id, kind:'free',
                points:[pos.x,pos.y],
                stroke: activeTool==='eraser'?'#ffffff': color,
                strokeWidth: activeTool==='eraser'?30: activeTool==='highlighter'?sw*8: activeTool==='marker'?sw*3: sw,
                opacity: activeTool==='highlighter'?0.45:1,
                lineCap: activeTool==='highlighter'?'square':'round',
                tension: activeTool==='pencil'?0.5:0,
                label:`${activeTool} stroke`,
            };
            setElements(prev=>[...prev, el]);
        } else {
            const id=uid();
            dragId.current=id;
            if(activeTool==='rect'){
                const el:RectEl={...base,id,kind:'rect',width:1,height:1,stroke:color,strokeWidth:sw,fill:'transparent',label:'Rectangle'};
                setElements(prev=>[...prev,el]);
            } else if(activeTool==='ellipse'){
                const el:EllEl={...base,id,kind:'ell',rx:1,ry:1,stroke:color,strokeWidth:sw,fill:'transparent',label:'Ellipse'};
                setElements(prev=>[...prev,el]);
            } else if(activeTool==='line'){
                const el:LineEl={...base,id,kind:'line',points:[pos.x,pos.y,pos.x,pos.y],stroke:color,strokeWidth:sw,label:'Line'};
                setElements(prev=>[...prev,el]);
            } else if(activeTool==='arrow'){
                const el:ArrEl={...base,id,kind:'arr',points:[pos.x,pos.y,pos.x,pos.y],stroke:color,strokeWidth:sw,label:'Arrow'};
                setElements(prev=>[...prev,el]);
            }
        }
    },[activeTool, color, sw, ptr]);

    const onMMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>)=>{
        if(!drawing.current||!dragId.current) return;
        const pos=ptr();
        const sx=startPos.current.x, sy=startPos.current.y;
        setElements(prev=>prev.map(el=>{
            if(el.id!==dragId.current) return el;
            if(el.kind==='free') return {...el, points:[...(el as FreeEl).points, pos.x, pos.y]};
            if(el.kind==='rect'){
                const x=Math.min(sx,pos.x), y=Math.min(sy,pos.y);
                return {...el, x, y, width:Math.abs(pos.x-sx), height:Math.abs(pos.y-sy)};
            }
            if(el.kind==='ell') return {...el, x:(sx+pos.x)/2, y:(sy+pos.y)/2, rx:Math.abs(pos.x-sx)/2, ry:Math.abs(pos.y-sy)/2};
            if(el.kind==='line'||el.kind==='arr') return {...el, points:[sx,sy,pos.x,pos.y]};
            return el;
        }));
    },[ptr]);

    const onMUp = useCallback(()=>{
        if(!drawing.current) return;
        drawing.current=false;
        const id=dragId.current;
        dragId.current=null;
        setElements(prev=>{ commit(prev); return prev; });
    },[commit]);

    // Stage click: deselect or text placement
    const onStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>)=>{
        const target = e.target;
        const isBackground = target===stageRef.current || target.name()==='background';
        if(activeTool==='select'){
            if(isBackground) setSelectedId(null);
            return;
        }
        if(activeTool==='text' && isBackground){
            const pos=ptr();
            const stageBox=stageRef.current!.container().getBoundingClientRect();
            setTextInput({x:stageBox.left+pos.x, y:stageBox.top+pos.y, stX:pos.x, stY:pos.y});
            setTextVal('');
            setTimeout(()=>taRef.current?.focus(),30);
        }
    },[activeTool, ptr]);

    const commitText=(editId?:string)=>{
        if(!textVal.trim()||!textInput){setTextInput(null);return;}
        if(editId){
            setElements(prev=>{ const next=prev.map(el=>el.id===editId?{...el,text:textVal}:el); commit(next); return next; });
        } else {
            const el:TextEl={
                id:uid(), kind:'text', x:textInput.stX, y:textInput.stY,
                text:textVal, fontSize:14+sw*1.5, fill:color, width:220,
                fontFamily:'Inter, sans-serif', opacity:1, hidden:false, label:'Text',
            };
            setElements(prev=>{ const next=[...prev,el]; commit(next); return next; });
        }
        setTextInput(null);
        setTextVal('');
    };

    const deleteSelected=()=>{
        if(!selectedId) return;
        const next=elements.filter(e=>e.id!==selectedId);
        commit(next); setSelectedId(null);
    };

    const clearAll=()=>{ commit([]); setSelectedId(null); if(onClear)onClear(); };

    // Drag end – update position
    const onEDragEnd=(id:string, e:Konva.KonvaEventObject<DragEvent>)=>{
        setElements(prev=>{ const next=prev.map(el=>el.id===id?{...el,x:e.target.x(),y:e.target.y()}:el); commit(next); return next; });
    };

    // Transform end – update size
    const onTransformEnd=(id:string, e:Konva.KonvaEventObject<Event>)=>{
        const node=e.target;
        const sx=node.scaleX(), sy=node.scaleY();
        node.scaleX(1); node.scaleY(1);
        setElements(prev=>{
            const next=prev.map(el=>{
                if(el.id!==id) return el;
                if(el.kind==='rect') return {...el,x:node.x(),y:node.y(),width:Math.max(4,el.width*sx),height:Math.max(4,el.height*sy)};
                if(el.kind==='ell')  return {...el,x:node.x(),y:node.y(),rx:Math.max(4,el.rx*sx),ry:Math.max(4,el.ry*sy)};
                if(el.kind==='text') return {...el,x:node.x(),y:node.y(),width:Math.max(20,el.width*sx),fontSize:Math.max(8,el.fontSize*sy)};
                return {...el,x:node.x(),y:node.y()};
            });
            commit(next); return next;
        });
    };

    // Layer panel controls
    const moveLayer=(id:string, dir:-1|1)=>{
        setElements(prev=>{
            const idx=prev.findIndex(e=>e.id===id);
            if(idx<0) return prev;
            const next=[...prev];
            const target=idx+dir;
            if(target<0||target>=next.length) return prev;
            [next[idx],next[target]]=[next[target],next[idx]];
            commit(next); return next;
        });
    };
    const toggleHide=(id:string)=>{
        setElements(prev=>prev.map(el=>el.id===id?{...el,hidden:!el.hidden}:el));
    };

    // ── Render element ──
    const renderEl=(el:CanvasEl)=>{
        if(el.hidden) return null;
        const drag=activeTool==='select';
        const baseProps={
            id:el.id, key:el.id, x:el.x, y:el.y, opacity:el.opacity, draggable:drag,
            onClick:(e:any)=>{ e.cancelBubble=true; if(activeTool==='select') setSelectedId(el.id); },
            onTap:(e:any)=>{ e.cancelBubble=true; if(activeTool==='select') setSelectedId(el.id); },
            onDragEnd:(e:any)=>onEDragEnd(el.id,e),
            onTransformEnd:(e:any)=>onTransformEnd(el.id,e),
        };
        switch(el.kind){
            case 'free': return <Line {...baseProps} points={el.points} stroke={el.stroke} strokeWidth={el.strokeWidth} lineCap={el.lineCap} lineJoin="round" tension={el.tension} globalCompositeOperation="source-over" />;
            case 'rect': return <Rect {...baseProps} width={el.width} height={el.height} stroke={el.stroke} strokeWidth={el.strokeWidth} fill={el.fill} />;
            case 'ell':  return <Ellipse {...baseProps} radiusX={el.rx} radiusY={el.ry} stroke={el.stroke} strokeWidth={el.strokeWidth} fill={el.fill} />;
            case 'line': return <Line {...baseProps} points={el.points} stroke={el.stroke} strokeWidth={el.strokeWidth} lineCap="round" />;
            case 'arr':  return <Arrow {...baseProps} points={el.points} stroke={el.stroke} strokeWidth={el.strokeWidth} fill={el.stroke} />;
            case 'text': return (
                <Text {...baseProps}
                    text={el.text} fontSize={el.fontSize} fill={el.fill} width={el.width}
                    fontFamily={el.fontFamily} wrap="word"
                    onDblClick={()=>{
                        const stageBox=stageRef.current!.container().getBoundingClientRect();
                        setTextInput({x:stageBox.left+el.x, y:stageBox.top+el.y, stX:el.x, stY:el.y, editId:el.id});
                        setTextVal(el.text);
                        setTimeout(()=>taRef.current?.focus(),30);
                    }}
                />
            );
        }
    };

    const btnCls=(id:ActiveTool)=>`flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg text-[9px] font-bold transition-all w-full ${
        activeTool===id?'bg-blue-600 text-white shadow-md':'text-gray-400 hover:bg-white/10 hover:text-white'
    }`;

    const lastGroup = useRef('');

    return (
        <div className={`flex h-full select-none ${className}`} style={style}>

            {/* ══ LEFT TOOLBAR ══ */}
            <div className="flex flex-col gap-1 p-1.5 bg-[#1e1e1e] border-r border-white/10 shrink-0 overflow-y-auto no-scrollbar w-[66px]">
                {TOOL_DEFS.map(t=>{
                    const showHeader = t.group !== lastGroup.current;
                    lastGroup.current = t.group;
                    return (
                        <React.Fragment key={t.id}>
                            {showHeader && <span className="text-[8px] text-gray-600 uppercase tracking-widest text-center font-bold mt-1">{t.group}</span>}
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
                <button onClick={handleUndo} disabled={past.length<=1} title="Undo" className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[9px] font-bold text-gray-400 hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                    <Undo2 size={14}/><span>Undo</span>
                </button>
                <button onClick={handleRedo} disabled={future.length===0} title="Redo" className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[9px] font-bold text-gray-400 hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                    <Redo2 size={14}/><span>Redo</span>
                </button>
                {selectedId && <button onClick={deleteSelected} className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[9px] font-bold text-red-400 hover:bg-red-900/20 transition-all"><Trash2 size={14}/><span>Delete</span></button>}
                {elements.length>0 && !selectedId && <button onClick={clearAll} className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[9px] font-bold text-red-400 hover:bg-red-900/20 transition-all"><Trash2 size={14}/><span>Clear</span></button>}
            </div>

            {/* ══ MAIN COLUMN ══ */}
            <div className="flex flex-col flex-1 min-w-0 min-h-0">

                {/* Color bar */}
                <div className="flex items-center gap-1 px-2 py-1.5 bg-[#1a1a1a] border-b border-white/10 shrink-0 flex-wrap">
                    {COLORS.map(c=>(
                        <button key={c} onClick={()=>setColor(c)}
                            className={`rounded-full border-2 transition-all shrink-0 ${color===c?'scale-125 border-blue-400 ring-2 ring-blue-400/40':'border-transparent hover:scale-110 hover:border-white/30'}`}
                            style={{width:18,height:18,background:c,boxShadow:c==='#ffffff'?'inset 0 0 0 1px rgba(255,255,255,0.3)':undefined}}/>
                    ))}
                    <button
                        onClick={()=>setShowLayers(v=>!v)}
                        className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${showLayers?'bg-blue-600 text-white border-blue-500':'text-gray-400 border-white/10 hover:border-white/30 hover:text-white'}`}
                    >
                        <Layers size={12}/> Layers
                    </button>
                </div>

                {/* Canvas + optional layers panel */}
                <div className="flex flex-1 min-h-0 overflow-hidden">

                    {/* Canvas */}
                    <div
                        ref={containerRef}
                        className="flex-1 min-h-0 min-w-0 bg-white relative"
                        style={{cursor: activeTool==='select'?'default': activeTool==='text'?'text':'crosshair'}}
                    >
                        <Stage
                            ref={stageRef}
                            width={size.w} height={size.h}
                            style={{backgroundColor:'white'}}
                            onMouseDown={onMDown}
                            onMouseMove={onMMove}
                            onMouseUp={onMUp}
                            onClick={onStageClick}
                        >
                            <Layer>
                                {/* White background rect so toDataURL exports correctly */}
                                <Rect name="background" x={0} y={0} width={size.w} height={size.h} fill="white" listening={false}/>
                                {elements.map(renderEl)}
                                <Transformer
                                    ref={trRef}
                                    rotateEnabled
                                    enabledAnchors={['top-left','top-center','top-right','middle-left','middle-right','bottom-left','bottom-center','bottom-right']}
                                    boundBoxFunc={(o,n)=>n.width<5||n.height<5?o:n}
                                    borderStroke="#3b82f6"
                                    anchorFill="#fff"
                                    anchorStroke="#3b82f6"
                                    anchorSize={8}
                                />
                            </Layer>
                        </Stage>

                        {/* Floating textarea for text placement / edit */}
                        {textInput && (
                            <textarea
                                ref={taRef}
                                value={textVal}
                                rows={3}
                                onChange={e=>setTextVal(e.target.value)}
                                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault(); commitText(textInput.editId);} if(e.key==='Escape'){setTextInput(null);} }}
                                onBlur={()=>commitText(textInput.editId)}
                                placeholder="Type here… Enter to commit"
                                style={{
                                    position:'fixed', left:textInput.x, top:textInput.y,
                                    background:'rgba(255,255,255,0.97)', border:`2px dashed ${color}`,
                                    color:color, fontSize:`${14+sw*1.5}px`, fontFamily:'Inter,sans-serif',
                                    padding:'6px 10px', outline:'none', borderRadius:'6px',
                                    minWidth:'180px', maxWidth:'400px', zIndex:9999, resize:'both', lineHeight:'1.4',
                                    boxShadow:'0 4px 20px rgba(0,0,0,0.25)',
                                }}
                            />
                        )}
                    </div>

                    {/* ══ LAYERS PANEL ══ */}
                    {showLayers && (
                        <div className="w-52 shrink-0 bg-[#161616] border-l border-white/10 flex flex-col overflow-hidden">
                            <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10 flex items-center justify-between">
                                <span>Layers</span>
                                <span className="text-gray-600">{elements.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {[...elements].reverse().map((el,ri)=>{
                                    const realIdx=elements.length-1-ri;
                                    const isSelected=selectedId===el.id;
                                    return (
                                        <div key={el.id}
                                            onClick={()=>{setSelectedId(el.id); setActiveTool('select');}}
                                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-b border-white/5 ${isSelected?'bg-blue-600/20 border-blue-500/20':'hover:bg-white/5'}`}
                                        >
                                            <span className={`text-xs truncate flex-1 ${isSelected?'text-blue-300 font-bold':'text-gray-300'}`}>{el.label}</span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={e=>{e.stopPropagation();toggleHide(el.id);}} className="p-0.5 text-gray-500 hover:text-white transition-colors" title={el.hidden?'Show':'Hide'}>
                                                    {el.hidden?<EyeOff size={12}/>:<Eye size={12}/>}
                                                </button>
                                                <button onClick={e=>{e.stopPropagation();moveLayer(el.id,1);}} disabled={realIdx===elements.length-1} className="p-0.5 text-gray-500 hover:text-white transition-colors disabled:opacity-25" title="Move Up">
                                                    <ChevronUp size={12}/>
                                                </button>
                                                <button onClick={e=>{e.stopPropagation();moveLayer(el.id,-1);}} disabled={realIdx===0} className="p-0.5 text-gray-500 hover:text-white transition-colors disabled:opacity-25" title="Move Down">
                                                    <ChevronDown size={12}/>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {elements.length===0 && <div className="px-3 py-6 text-xs text-gray-600 text-center">Nothing drawn yet</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};